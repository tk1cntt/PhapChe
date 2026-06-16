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
        detail: `File type not allowed. Allowed types: PDF, images (JPEG, PNG, GIF, WebP), Word, Excel, text, ZIP`,
        field: 'file'
      },
      { status: 400 }
    );
  }

  // Create vault file record
  const vaultFile = await prisma.vaultFile.create({
    data: {
      workspaceId: currentRequest.workspaceId,
      requestId: id,
      actorId: session.user.id,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      fileKind: 'upload',
      source: 'partner_upload',
    },
  });

  // Create audit event
  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      workspaceId: currentRequest.workspaceId,
      action: 'request.document_uploaded',
      targetType: 'request',
      targetId: id,
      requestId: id,
      metadataSummary: JSON.stringify({
        documentId: vaultFile.id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    },
  });

  const document = {
    id: vaultFile.id,
    filename: vaultFile.filename,
    mimeType: vaultFile.contentType,
    size: vaultFile.size,
    description: description?.trim() || vaultFile.filename,
    createdAt: vaultFile.createdAt,
  };

  return NextResponse.json({ data: document }, { status: 201 });
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
    },
    orderBy: { createdAt: 'desc' },
  });

  const documents = files.map((f) => ({
    id: f.id,
    filename: f.filename,
    mimeType: f.contentType,
    size: f.size,
    description: f.filename,
    createdAt: f.createdAt,
  }));

  return NextResponse.json({ data: documents });
}
