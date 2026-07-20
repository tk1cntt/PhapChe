/**
 * GET /api/admin/requests/[id]/files/review-status — Lấy trạng thái review của tất cả files
 * PUT /api/admin/requests/[id]/files/review-status — Cập nhật trạng thái review của một file
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

// ── GET ────────────────────────────────────────────────────

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

    const statuses = await prisma.documentReviewStatus.findMany({
      where: { requestId, reviewerId: session.userId },
      select: { fileKey: true, status: true },
    });

    const map: Record<string, string> = {};
    for (const s of statuses) {
      map[s.fileKey] = s.status;
    }

    return NextResponse.json({ statuses: map });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Review Status API Error]', msg);
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 });
  }
}

// ── PUT ────────────────────────────────────────────────────

export async function PUT(
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
    const body = await _request.json();
    const { fileKey, status } = body;

    if (!fileKey || !status) {
      return NextResponse.json({ error: 'VALIDATION: fileKey and status are required' }, { status: 400 });
    }
    if (!['pending', 'reviewed', 'has_issues'].includes(status)) {
      return NextResponse.json({ error: 'VALIDATION: status must be pending, reviewed, or has_issues' }, { status: 400 });
    }

    const reviewStatus = await prisma.documentReviewStatus.upsert({
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
        status,
        reviewedAt: status === 'reviewed' ? new Date() : null,
      },
      update: {
        status,
        reviewedAt: status === 'reviewed' ? new Date() : null,
      },
    });

    return NextResponse.json({
      reviewStatus: {
        id: reviewStatus.id,
        fileKey: reviewStatus.fileKey,
        status: reviewStatus.status,
        reviewedAt: reviewStatus.reviewedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Review Status API Error]', msg);
    return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 });
  }
}
