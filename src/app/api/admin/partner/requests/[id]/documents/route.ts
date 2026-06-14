/**
 * Admin Partner Request Documents API
 * GET/POST /api/admin/partner/requests/[id]/documents
 *
 * Admin can view and upload documents for partner requests.
 * All actions are logged to audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Allowed MIME types for document uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Admin access required' },
      { status: 401 }
    );
  }

  // Verify request exists
  const requestExists = await prisma.legalRequest.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!requestExists) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: 'Request not found' },
      { status: 404 }
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
      uploadedByType: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: documents });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Admin access required' },
      { status: 401 }
    );
  }

  // Verify request exists
  const requestExists = await prisma.legalRequest.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!requestExists) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: 'Request not found' },
      { status: 404 }
    );
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const description = formData.get('description') as string | null;

  if (!file) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'File is required' },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'File size exceeds 10MB limit' },
      { status: 400 }
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG' },
      { status: 400 }
    );
  }

  // Generate storage key
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storageKey = `admin/requests/${id}/${timestamp}-${safeName}`;

  const document = await prisma.requestDocument.create({
    data: {
      requestId: id,
      filename: file.name,
      storageKey,
      mimeType: file.type,
      size: file.size,
      uploadedBy: session.user.id,
      uploadedByType: 'admin',
      description: description || null,
    },
  });

  // Admin audit log
  await prisma.auditLog.create({
    data: {
      action: 'admin.partner.document_upload',
      entityType: 'legal_request',
      entityId: id,
      actorId: session.user.id,
      actorType: 'admin',
      actorName: session.user.name || 'Admin',
      metadata: {
        documentId: document.id,
        filename: file.name,
        size: file.size,
      },
    },
  });

  return NextResponse.json({ data: document }, { status: 201 });
}
