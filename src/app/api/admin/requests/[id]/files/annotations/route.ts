/**
 * GET /api/admin/requests/[id]/files/annotations — Liệt kê annotations theo fileKey
 * POST /api/admin/requests/[id]/files/annotations — Tạo annotation mới
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

function isRedirectErr(e: unknown): boolean {
  return e instanceof Error && 'NEXT_REDIRECT' === e.message;
}

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

// ── GET ────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (Array.isArray(session.roles) ? session.roles : []).includes(r as never));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId } = await params;
    const { searchParams } = new URL(_request.url);
    const fileKey = searchParams.get('fileKey');

    if (!fileKey) {
      return NextResponse.json({ error: 'VALIDATION: fileKey is required' }, { status: 400 });
    }

    const annotations = await prisma.documentAnnotation.findMany({
      where: { requestId, fileKey },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    const mapped = annotations.map((a) => ({
      id: a.id,
      fileKey: a.fileKey,
      authorId: a.authorId,
      authorName: a.author?.name ?? 'Unknown',
      content: a.content,
      severity: a.severity,
      category: a.category,
      position: a.position,
      status: a.status,
      aiGenerated: a.aiGenerated,
      aiConfidence: a.aiConfidence,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json({ annotations: mapped });
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Annotations API Error]', msg);
    return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (Array.isArray(session.roles) ? session.roles : []).includes(r as never));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId } = await params;
    const body = await _request.json();

    const { fileKey, content, severity, category, position } = body;
    if (!fileKey || !content?.trim()) {
      return NextResponse.json({ error: 'VALIDATION: fileKey and content are required' }, { status: 400 });
    }
    if (severity && !['info', 'warning', 'critical'].includes(severity)) {
      return NextResponse.json({ error: 'VALIDATION: severity must be info, warning, or critical' }, { status: 400 });
    }
    if (category && !['issue', 'suggestion', 'question', 'comment'].includes(category)) {
      return NextResponse.json({ error: 'VALIDATION: category must be issue, suggestion, question, or comment' }, { status: 400 });
    }

    const annotation = await prisma.documentAnnotation.create({
      data: {
        requestId,
        fileKey,
        authorId: session.userId,
        content: content.trim(),
        severity: severity ?? 'info',
        category: category ?? 'issue',
        position: position ?? undefined,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Cập nhật review status nếu có annotation open
    await prisma.documentReviewStatus.upsert({
      where: {
        requestId_fileKey_reviewerId: {
          requestId,
          fileKey,
          reviewerId: session.userId,
        },
      },
      create: {
        requestId,
        fileKey,
        reviewerId: session.userId,
        status: 'has_issues',
      },
      update: {
        status: 'has_issues',
      },
    });

    return NextResponse.json({
      annotation: {
        id: annotation.id,
        fileKey: annotation.fileKey,
        authorId: annotation.authorId,
        authorName: annotation.author?.name ?? 'Unknown',
        content: annotation.content,
        severity: annotation.severity,
        category: annotation.category,
        position: annotation.position,
        status: annotation.status,
        createdAt: annotation.createdAt.toISOString(),
        updatedAt: annotation.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Annotations API Error]', msg);
    return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
  }
}
