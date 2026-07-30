/**
 * Partner Request Documents API
 * GET/POST /api/partner/requests/[id]/documents
 *
 * Partner can upload and view documents for requests assigned to them
 * Uses VaultFile model for document storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { storageServer } from '@/lib/storage/server';

// Allowed MIME types for document uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper to check partner access
async function checkPartnerAccess(requestId: string, userId: string) {
  const member = await prisma.partnerMember.findFirst({
    where: { userId, isActive: true },
    select: { partnerId: true },
  });

  if (!member) {
    return { error: 'FORBIDDEN', detail: 'User is not an active partner member', status: 403 };
  }

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { id: true, workspaceId: true, assignedPartnerId: true, engagement: { select: { partnerId: true } } },
  });

  if (!request) {
    return { error: 'NOT_FOUND', detail: 'Request not found', status: 404 };
  }

  const hasAccess = request.assignedPartnerId === member.partnerId ||
    request.engagement?.partnerId === member.partnerId;

  if (!hasAccess) {
    return { error: 'FORBIDDEN', detail: 'Partner does not have access to this request', status: 403 };
  }

  return { member, request, hasAccess: true };
}

// POST - Upload document
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  const access = await checkPartnerAccess(id, session.user.id);
  if (access.error || !access.request) {
    return NextResponse.json(
      { error: access.error || 'Access denied', detail: access.detail || 'Access denied' },
      { status: access.status || 403 }
    );
  }

  const { request: currentRequest } = access;

  // Handle multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'Invalid form data' },
      { status: 400 }
    );
  }

  const file = formData.get('file') as File | null;
  const description = formData.get('description') as string | null;

  // Validate file is provided
  if (!file) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'File is required', field: 'file' },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'File size exceeds 10MB limit', field: 'file' },
      { status: 400 }
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        detail: 'File type not allowed. Allowed types: PDF, images (JPEG, PNG, GIF, WebP), Word, Excel, text, ZIP',
        field: 'file'
      },
      { status: 400 }
    );
  }

  try {
    // Đọc nội dung file và chuyển thành Buffer để lưu vào storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Lưu file vào storage provider (local/S3), tạo File record trong DB
    const fileRecord = await storageServer.uploadFile({
      organizationId: currentRequest.workspaceId,
      requestId: id,
      file: fileBuffer,
      originalName: file.name,
      mimeType: file.type,
      category: 'request_attachment' as const,
      visibility: 'customer_visible' as const,
      createdBy: session.user.id,
    });

    // Tạo vaultFile và audit event trong transaction để đảm bảo toàn vẹn dữ liệu
    // Nếu audit fail, vaultFile sẽ được rollback, tránh orphan record
    const trimmedDescription = description?.trim() || null;

    const [vaultFile] = await prisma.$transaction(async (tx) => {
      const vf = await tx.vaultFile.create({
        data: {
          workspaceId: currentRequest.workspaceId,
          requestId: id,
          actorId: session.user.id,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          fileKind: 'upload',
          source: 'partner_upload',
          storageKey: fileRecord.objectKey,
          fileId: fileRecord.id,
          reason: trimmedDescription,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorId: session.user.id,
          workspaceId: currentRequest.workspaceId,
          action: 'request.document_uploaded',
          targetType: 'request',
          targetId: id,
          requestId: id,
          metadataSummary: JSON.stringify({
            documentId: vf.id,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          }),
        },
      });

      return [vf];
    });

    const document = {
      id: vaultFile.id,
      filename: vaultFile.filename,
      mimeType: vaultFile.contentType,
      size: vaultFile.size,
      description: trimmedDescription || vaultFile.filename,
      createdAt: vaultFile.createdAt,
    };

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'UPLOAD_FAILED', detail: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// GET - List documents
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  const access = await checkPartnerAccess(id, session.user.id);
  if (access.error) {
    return NextResponse.json(
      { error: access.error, detail: access.detail },
      { status: access.status }
    );
  }

  const files = await prisma.vaultFile.findMany({
    where: { requestId: id },
    select: {
      id: true,
      filename: true,
      contentType: true,
      size: true,
      createdAt: true,
      reason: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const documents = files.map((f) => ({
    id: f.id,
    filename: f.filename,
    mimeType: f.contentType,
    size: f.size,
    description: (f as { reason?: string }).reason || f.filename,
    createdAt: f.createdAt,
  }));

  return NextResponse.json({ data: documents });
}
