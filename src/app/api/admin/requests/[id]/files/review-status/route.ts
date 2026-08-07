/**
 * GET /api/admin/requests/[id]/files/review-status — Lấy trạng thái review của tất cả files
 * PUT /api/admin/requests/[id]/files/review-status — Cập nhật trạng thái review của một file
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

function isRedirectErr(e: unknown): boolean {
  return e instanceof Error && 'digest' in e && (e as { digest: string }).digest === 'NEXT_REDIRECT';
}

const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

// ── GET ────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
async function requireAdminSession(): Promise<NextResponse | null> {
  const session = await requireAppSession();
  const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
  if (!hasRole) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  return null;
}

// ── In each handler ──
    const forbidden = await requireAdminSession();
    if (forbidden) return forbidden;
  }
  return null;
}

// ── In each handler ──
    const forbidden = await requireAdminSession();
    if (forbidden) return forbidden;

    const map: Record<string, string> = {};
    for (const s of statuses) {
      map[s.fileKey] = s.status;
    }

    return NextResponse.json({ statuses: map });
function handleApiError(error: unknown): NextResponse {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[Review Status API Error]', msg);
  return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
}

// ── In each handler's catch block ──
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    return handleApiError(error);
  }
// ── In each handler's catch block ──
  } catch (error) {
    if (isRedirectErr(error)) throw error;
    return handleApiError(error);
  }
  request: NextRequest,
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
const VALID_REVIEW_STATUSES = ['pending', 'reviewed', 'has_issues'] as const;
type ReviewStatus = (typeof VALID_REVIEW_STATUSES)[number];

// ── validation (replaces the inline array) ──
    if (!(VALID_REVIEW_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'VALIDATION: status must be pending, reviewed, or has_issues' }, { status: 400 });
    }
// ── validation (replaces the inline array) ──
    if (!(VALID_REVIEW_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'VALIDATION: status must be pending, reviewed, or has_issues' }, { status: 400 });
    }
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
    if (isRedirectErr(error)) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Review Status API Error]', msg);
    return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
  }
}
