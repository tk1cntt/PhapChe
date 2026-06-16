/**
 * Admin Partner Request Documents API
 * GET/POST /api/admin/partner/requests/[id]/documents
 *
 * Admin can view and upload documents for partner requests.
 * Uses VaultFile model for storing documents.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

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

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }

  // Query all workspace memberships to find admin roles
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });

  // Filter out null roles
  const userRoles = memberships
    .map((m) => m.role)
    .filter((r): r is string => r !== null);

  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));

  if (!hasAdminRole) {
    throw { status: 403, error: 'Forbidden' };
  }

  return {
    session,
    userId: session.user.id,
    roles: userRoles,
    activeWorkspaceId: memberships[0]?.workspaceId,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAdminSession();

    const { id } = await params;

    // Verify request exists
    const requestExists = await prisma.legalRequest.findUnique({
      where: { id },
      select: { id: true, workspaceId: true },
    });

    if (!requestExists) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 }
      );
    }

    // Get vault files for this request
    const files = await prisma.vaultFile.findMany({
      where: { requestId: id },
      select: {
        id: true,
        filename: true,
        contentType: true,
        size: true,
        category: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to document format
    const documents = files.map((f) => ({
      id: f.id,
      filename: f.filename,
      mimeType: f.contentType,
      size: f.size,
      description: f.category || f.filename,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({ data: documents });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
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
    const { session, userId } = await requireAdminSession();

    const { id } = await params;

    // Verify request exists
    const requestExists = await prisma.legalRequest.findUnique({
      where: { id },
      select: { id: true, workspaceId: true },
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

    // Store file metadata in vault file
    const vaultFile = await prisma.vaultFile.create({
      data: {
        workspaceId: requestExists.workspaceId,
        requestId: id,
        actorId: userId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        fileKind: 'upload',
        source: 'admin_upload',
      },
    });

    // Audit log using AuditEvent
    await prisma.auditEvent.create({
      data: {
        actorId: userId,
        workspaceId: requestExists.workspaceId,
        action: 'admin.partner.document_upload',
        targetType: 'request',
        targetId: id,
        requestId: id,
        metadataSummary: JSON.stringify({
          documentId: vaultFile.id,
          filename: file.name,
          size: file.size,
        }),
      },
    });

    const document = {
      id: vaultFile.id,
      filename: vaultFile.filename,
      mimeType: vaultFile.contentType || 'application/octet-stream',
      size: vaultFile.size,
      description: description || vaultFile.filename || 'Document',
      createdAt: vaultFile.createdAt,
    };

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
