/**
 * Admin Partner Request Documents API
 * GET/POST /api/admin/partner/requests/[id]/documents
 *
 * Admin can view and upload documents for partner requests.
 * Uses VaultFile model for storing documents.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { isStructuredError } from '@/lib/errors';
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
    await requireAdminSession();

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

    // Get vault files for this request (exclude soft-deleted)
    const files = await prisma.vaultFile.findMany({
      where: { requestId: id, deletedAt: null },
      select: {
        id: true,
        filename: true,
        contentType: true,
        size: true,
        fileKind: true,
        source: true,
        reason: true,
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
      description: f.reason || f.fileKind || f.filename,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({ data: documents });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    if (isStructuredError(error)) {
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

    // Validate MIME type (client-provided, not trusted alone — magic bytes check below)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG' },
        { status: 400 }
      );
    }

    // Read file bytes for storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify magic bytes for additional security against MIME spoofing
    const magicBytes = buffer.slice(0, 4).toString('hex');
    const allowedMagics: Record<string, string[]> = {
      'application/pdf': ['25504446'],
      'image/jpeg': ['ffd8ff'],
      'image/png': ['89504e47'],
      'application/msword': ['d0cf11e0'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504b0304'],
    };
    if (allowedMagics[file.type] && !allowedMagics[file.type].includes(magicBytes)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File content does not match declared MIME type' },
        { status: 400 }
      );
    }

    // Upload to storage and save metadata in transaction
    const storageKey = `admin-partner/${id}/${randomUUID()}/${file.name}`;
    const storageRoot = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
    const fullPath = resolve(storageRoot, storageKey);
    // Validate storage key is within root
    if (!fullPath.startsWith(resolve(storageRoot))) {
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
    await mkdir(resolve(storageRoot, 'admin-partner', id), { recursive: true });
    await writeFile(fullPath, buffer);

    // Store file metadata and audit log in transaction
    const [vaultFile] = await prisma.$transaction([
      prisma.vaultFile.create({
        data: {
          workspaceId: requestExists.workspaceId,
          requestId: id,
          actorId: userId,
          filename: file.name,
          storageKey,
          contentType: file.type,
          size: file.size,
          fileKind: 'upload',
          source: 'admin_upload',
          reason: description || null,
        },
      }),
      prisma.auditEvent.create({
        data: {
          actorId: userId,
          workspaceId: requestExists.workspaceId,
          action: 'admin.partner.document_upload',
          targetType: 'request',
          targetId: id,
          requestId: id,
          metadataSummary: JSON.stringify({
            filename: file.name,
            size: file.size,
          }),
        },
      }),
    ]);

    const document = {
      id: vaultFile.id,
      filename: vaultFile.filename,
      mimeType: vaultFile.contentType || 'application/octet-stream',
      size: vaultFile.size,
      description: description || vaultFile.filename || 'Document',
      createdAt: vaultFile.createdAt,
    };

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
