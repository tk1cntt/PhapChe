/**
 * Reviewer Console API — unified under /api/admin/requests/pending-review
 * GET /api/admin/requests/pending-review
 *
 * Returns legal requests at pending_review status assigned to the current reviewer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

const STATUS = { PENDING_REVIEW: 'pending_review', APPROVED: 'approved', REVISION_REQUIRED: 'revision_required' } as const;
const ROLE = { REVIEWER: 'reviewer', SUPER_ADMIN: 'super_admin', COORDINATOR_ADMIN: 'coordinator_admin' } as const;
const ERROR_CODE = { UNAUTHENTICATED: 'UNAUTHENTICATED', FORBIDDEN: 'FORBIDDEN', INTERNAL_ERROR: 'INTERNAL_ERROR' } as const;
const PRIORITY = { MEDIUM: 'MEDIUM' } as const;

// ... inside GET:
    const isReviewer = session.roles?.includes(ROLE.REVIEWER);
    const isAdmin = session.roles?.some((r: string) => [ROLE.SUPER_ADMIN, ROLE.COORDINATOR_ADMIN].includes(r));
const ERROR_CODE = { UNAUTHENTICATED: 'UNAUTHENTICATED', FORBIDDEN: 'FORBIDDEN', INTERNAL_ERROR: 'INTERNAL_ERROR' } as const;
const PRIORITY = { MEDIUM: 'MEDIUM' } as const;

// ... inside GET:
    const isReviewer = session.roles?.includes(ROLE.REVIEWER);
    const isAdmin = session.roles?.some((r: string) => [ROLE.SUPER_ADMIN, ROLE.COORDINATOR_ADMIN].includes(r));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;
    const search = searchParams.get('search') || '';

    const isReviewerOnly = isReviewer && !isAdmin;

    const where: Record<string, unknown> = {
      ...(isReviewerOnly ? { assignedReviewerId: session.userId } : {}),
      status: 'pending_review',
    };
      status: 'pending_review',
    };
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { createdBy: { name: { contains: search } } },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.legalRequest.count({ where }),
      prisma.legalRequest.findMany({
        where,
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          assignedSpecialist: { select: { id: true, name: true } },
          intakeSubmission: { select: { id: true, matterTypeKey: true } },
        },
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
    ]);

    // Stats
    const reviewWhere = isReviewer && !isAdmin ? { assignedReviewerId: session.userId } : {};
    const [pendingCount, approvedCount, revisionCount] = await Promise.all([
      prisma.legalRequest.count({ where: { ...reviewWhere, status: 'pending_review' } }),
      prisma.legalRequest.count({ where: { ...reviewWhere, status: 'approved' } }),
      prisma.legalRequest.count({ where: { ...reviewWhere, status: 'revision_required' } }),
    ]);

    // ── Document + annotation stats ──
    const requestIds = requests.map((r) => r.id);
    const [fileCounts, annotationCounts, annotationResolvedCounts] = await Promise.all([
      prisma.file.groupBy({ by: ['requestId'], where: { requestId: { in: requestIds } }, _count: { id: true } }),
      prisma.documentAnnotation.groupBy({ by: ['requestId'], where: { requestId: { in: requestIds } }, _count: { id: true } }),
      prisma.documentAnnotation.groupBy({ by: ['requestId'], where: { requestId: { in: requestIds }, status: 'resolved' }, _count: { id: true } }),
    ]);
    const fileCountMap = Object.fromEntries(fileCounts.map((f) => [f.requestId, f._count.id]));
    const annCountMap = Object.fromEntries(annotationCounts.map((a) => [a.requestId, a._count.id]));
    const annResolvedMap = Object.fromEntries(annotationResolvedCounts.map((a) => [a.requestId, a._count.id]));

function mapRequestToResponseItem(
  r: typeof requests[number],
  fileCountMap: Record<string, number>,
  annCountMap: Record<string, number>,
  annResolvedMap: Record<string, number>,
) {
  return {
    id: r.id,
    code: r.code ?? `REQ-${r.id.slice(-6)}`,
    title: r.title,
    description: r.description ?? '',
    workspaceId: r.workspaceId,
    workspaceName: r.workspace?.name ?? '',
    workspaceSlug: r.workspace?.slug ?? '',
    customerName: r.createdBy?.name ?? '',
    customerEmail: r.createdBy?.email ?? '',
    matterTypeKey: r.intakeSubmission?.matterTypeKey ?? null,
    status: r.status,
    priority: r.priority ?? PRIORITY.MEDIUM,
    specialistName: r.assignedSpecialist?.name ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    fileCount: fileCountMap[r.id] ?? 0,
    annotationCount: annCountMap[r.id] ?? 0,
    annotationResolved: annResolvedMap[r.id] ?? 0,
  };
}

// Usage:
    const data = requests.map((r) => mapRequestToResponseItem(r, fileCountMap, annCountMap, annResolvedMap));
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    fileCount: fileCountMap[r.id] ?? 0,
    annotationCount: annCountMap[r.id] ?? 0,
    annotationResolved: annResolvedMap[r.id] ?? 0,
  };
}

// Usage:
    const data = requests.map((r) => mapRequestToResponseItem(r, fileCountMap, annCountMap, annResolvedMap));
  const message = error instanceof Error ? error.message : String(error);
  if (message === ERROR_CODE.UNAUTHENTICATED) {
    return NextResponse.json({ error: ERROR_CODE.UNAUTHENTICATED, detail: 'Please login to continue' }, { status: 401 });
  }
  if (message === ERROR_CODE.FORBIDDEN) {
    return NextResponse.json({ error: ERROR_CODE.FORBIDDEN }, { status: 403 });
  }
  return null;
}

// In catch block:
  } catch (error) {
    const authResponse = resolveAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Pending-review API error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: ERROR_CODE.INTERNAL_ERROR }, { status: 500 });
  }
}
