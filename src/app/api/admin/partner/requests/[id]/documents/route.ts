/**
 * Admin Partner Request Documents API
 * GET/POST /api/admin/partner/requests/[id]/documents
 *
 * Admin can view and upload documents for partner requests.
 * All actions are logged to audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

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
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

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
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

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
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
