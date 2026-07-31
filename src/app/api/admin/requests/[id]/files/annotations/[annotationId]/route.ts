/**
 * PATCH /api/admin/requests/[id]/files/annotations/[annotationId] — Cập nhật annotation
 * DELETE /api/admin/requests/[id]/files/annotations/[annotationId] — Xóa annotation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

function isRedirectErr(e: unknown): boolean {
  return e instanceof Error && 'digest' in e && (e as { digest: string }).digest === 'NEXT_REDIRECT';
}

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

// ── PATCH ──────────────────────────────────────────────────

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; annotationId: string }> },
) {
  try {
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId, annotationId } = await params;
    const body = await _request.json();

    const existing = await prisma.documentAnnotation.findFirst({
      where: { id: annotationId, requestId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'ANNOTATION_NOT_FOUND' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.content !== undefined) updateData.content = body.content?.trim();
    if (body.severity !== undefined) {
      if (!['info', 'warning', 'critical'].includes(body.severity)) {
        return NextResponse.json({ error: 'VALIDATION: invalid severity' }, { status: 400 });
      }
      updateData.severity = body.severity;
    }
    if (body.category !== undefined) {
      if (!['issue', 'suggestion', 'question', 'comment'].includes(body.category)) {
        return NextResponse.json({ error: 'VALIDATION: invalid category' }, { status: 400 });
      }
      updateData.category = body.category;
    }
    if (body.status !== undefined) {
      if (!['open', 'resolved', 'dismissed'].includes(body.status)) {
        return NextResponse.json({ error: 'VALIDATION: invalid status' }, { status: 400 });
      }
      updateData.status = body.status;
    }
    if (body.position !== undefined) updateData.position = body.position;

    // Update annotation and review status within a single transaction
    const annotation = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentAnnotation.update({
        where: { id: annotationId },
        data: updateData,
        include: {
          author: { select: { id: true, name: true } },
        },
      });

      const openCount = await tx.documentAnnotation.count({
        where: { requestId, fileKey: existing.fileKey, status: 'open' },
      });

      await tx.documentReviewStatus.upsert({
        where: {
          requestId_fileKey_reviewerId: {
            requestId,
            fileKey: existing.fileKey,
            reviewerId: session.userId,
          },
        },
        create: {
          requestId,
          fileKey: existing.fileKey,
          reviewerId: session.userId,
          status: openCount > 0 ? 'has_issues' : 'reviewed',
        },
        update: {
          status: openCount > 0 ? 'has_issues' : 'reviewed',
          ...(openCount === 0 ? { reviewedAt: new Date() } : {}),
        },
      });

      return updated;
    });

    return NextResponse.json({
      annotation: {
        id: annotation.id,
        fileKey: annotation.fileKey,
        authorId: annotation.authorId,
        authorName: annotation.author.name,
        content: annotation.content,
        severity: annotation.severity,
        category: annotation.category,
        position: annotation.position,
        status: annotation.status,
        aiGenerated: annotation.aiGenerated,
        aiConfidence: annotation.aiConfidence,
        createdAt: annotation.createdAt.toISOString(),
        updatedAt: annotation.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    console.error('[Annotation PATCH Error]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE ─────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; annotationId: string }> },
) {
  try {
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId, annotationId } = await params;

    const existing = await prisma.documentAnnotation.findFirst({
      where: { id: annotationId, requestId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'ANNOTATION_NOT_FOUND' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.documentAnnotation.delete({ where: { id: annotationId } });

      const openCount = await tx.documentAnnotation.count({
        where: { requestId, fileKey: existing.fileKey, status: 'open' },
      });

      if (openCount === 0) {
        await tx.documentReviewStatus.updateMany({
          where: {
            requestId,
            fileKey: existing.fileKey,
            reviewerId: session.userId,
            status: 'has_issues',
          },
          data: { status: 'reviewed', reviewedAt: new Date() },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    console.error('[Annotation DELETE Error]', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
  }
}
