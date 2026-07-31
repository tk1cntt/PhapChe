/**
 * GET /api/admin/requests/[id]/files — Liệt kê tất cả tài liệu của request
 *
 * Trả về danh sách merged của VaultFile (file upload) + Document (generated documents)
 * Mỗi item có id prefixed: "vf_" cho VaultFile, "doc_" cho Document
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

interface FileItem {
  id: string;
  type: 'vault_file' | 'document' | 'generated';
  title: string;
  filename: string | null;
  mimeType: string | null;
  size: number | null;
  status: string | null;
  createdAt: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ error: 'VALIDATION: missing request id' }, { status: 400 });
    }

    // Verify request exists and user is authorized (workspace + assignment)
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: { id: true, workspaceId: true, assignedSpecialistId: true, assignedReviewerId: true },
    });
    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Verify workspace membership
    if (!session.activeWorkspaceId || legalRequest.workspaceId !== session.activeWorkspaceId) {
      const membership = await prisma.workspaceMembership.findFirst({
        where: { userId: session.userId, workspaceId: legalRequest.workspaceId, isActive: true },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }

    // Verify assignment: specialist and reviewer should only access their assigned requests
    const userRoles = Array.isArray(session.roles) ? session.roles : [];
    if (userRoles.includes('specialist') && legalRequest.assignedSpecialistId !== session.userId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    if (userRoles.includes('reviewer') && legalRequest.assignedReviewerId !== session.userId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Fetch VaultFiles (uploaded files)
    const vaultFiles = await prisma.vaultFile.findMany({
      where: { requestId, deletedAt: null },
      include: {
        file: {
          select: {
            originalName: true,
            mimeType: true,
            size: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch Documents (generated documents)
    const documents = await prisma.document.findMany({
      where: { requestId, deletedAt: null },
      include: {
        documentVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items: FileItem[] = [
      // Uploaded files: prefixed "vf_"
      ...vaultFiles.map((vf) => ({
        id: `vf_${vf.id}`,
        type: 'vault_file' as const,
        title: vf.file?.originalName ?? vf.filename ?? 'Tài liệu không tên',
        filename: vf.filename ?? vf.file?.originalName ?? null,
        mimeType: vf.file?.mimeType ?? vf.contentType ?? null,
        size: vf.file?.size ?? vf.size ?? null,
        status: vf.fileKind ?? 'uploaded',
        createdAt: vf.createdAt.toISOString(),
      })),
      // Generated documents: prefixed "doc_"
      ...documents.map((doc) => ({
        id: `gen_${doc.id}`,
        type: 'generated' as const,
        title: doc.title,
        filename: null,
        mimeType: 'text/markdown',
        size: null,
        status: doc.documentVersions[0]?.status ?? 'draft',
        createdAt: doc.createdAt.toISOString(),
      })),
    ];

    return NextResponse.json({ files: items });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Files API Error]', msg);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
}
