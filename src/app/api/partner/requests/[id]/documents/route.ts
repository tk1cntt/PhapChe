/**
 * Partner Request Documents API
 * GET/POST /api/partner/requests/[id]/documents
 *
 * Partner can upload and view documents for requests assigned to them
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
    include: { engagement: { select: { partnerId: true } } },
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
  if (access.error) {
    return NextResponse.json(
      { error: access.error, detail: access.detail },
      { status: access.status }
    );
  }

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

  // Generate unique storage key
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storageKey = `partners/${access.member.partnerId}/requests/${id}/${timestamp}-${safeName}`;

  // Read file buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // TODO: Implement actual file upload to StorageService
  // Currently only metadata is stored. File content is not persisted.
  // This is a known limitation - StorageService integration needed.
  console.warn(`[Partner Documents] File upload requested but StorageService not implemented. StorageKey: ${storageKey}`);

  // Create document record and audit log in transaction
  const [document] = await prisma.$transaction([
    prisma.requestDocument.create({
      data: {
        requestId: id,
        filename: file.name,
        storageKey,
        mimeType: file.type,
        size: file.size,
        uploadedBy: session.user.id,
        uploadedByType: 'partner',
        description: description?.trim() || null,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'request.document_uploaded',
        entityType: 'request_document',
        entityId: id, // Will be updated after document creation
        actorId: session.user.id,
        actorType: 'partner',
        actorName: session.user.name || 'Partner',
        metadata: {
          requestId: id,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          storageKey,
        },
      },
    }),
  ]);

  // Update audit log with actual document ID
  await prisma.auditLog.update({
    where: { id: document.id },
    data: { entityId: document.id },
  }).catch(() => {
    // Ignore if update fails - the audit log is still created
  });

  return NextResponse.json({
    data: document,
    warning: 'File content storage not yet implemented. Use StorageService to persist actual file.'
  }, { status: 201 });
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

  const documents = await prisma.requestDocument.findMany({
    where: { requestId: id },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      description: true,
      createdAt: true,
      uploadedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: documents });
}
