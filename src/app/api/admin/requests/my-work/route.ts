/**
 * Specialist Workbench API — unified under /api/admin/requests/my-work
 * GET /api/admin/requests/my-work
 *
 * Returns legal requests assigned to the current specialist (active work only).
 * Excludes: draft_intake, triage, approved, delivered, closed, cancelled
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    // Specialists + admins
    const isSpecialist = session.roles?.includes('specialist');
    const isAdmin = session.roles?.some((r: string) => ['super_admin', 'coordinator_admin'].includes(r));

    if (!isSpecialist && !isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;
    const statusFilter = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    // Active work only: exclude intake, triage, pending_review, finished, and cancelled
    const EXCLUDED_STATUSES = ['draft_intake', 'triage', 'pending_review', 'approved', 'delivered', 'closed', 'cancelled'];

    const where: Record<string, unknown> = {
      ...(isSpecialist && !isAdmin ? { assignedSpecialistId: session.userId } : {}),
      status: { notIn: EXCLUDED_STATUSES },
    };

    if (statusFilter && !EXCLUDED_STATUSES.includes(statusFilter)) {
      where.status = statusFilter;
    }

    if (search) {
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
          assignedReviewer: { select: { id: true, name: true } },
          intakeSubmission: { select: { id: true, matterTypeKey: true } },
        },
        // WARNING: Alphabetical sort on priority enum gives 'HIGH','LOW','MEDIUM' — not severity order.
        // Fix: store priority as numeric rank in schema, or use raw SQL CASE expression.
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
    ]);

    // Stats: count per active status
    const activeStatuses = ['assigned', 'in_progress', 'revision_required'] as const;
    const statsQueries = activeStatuses.map((s) =>
      prisma.legalRequest.count({
        where: {
          ...(isSpecialist && !isAdmin ? { assignedSpecialistId: session.userId } : {}),
          status: s,
        },
      }),
    );
    const [assignedCount, inProgressCount, revisionCount] = await Promise.all(statsQueries);

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

    const data = requests.map((r) => ({
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
      priority: r.priority ?? 'MEDIUM',
      reviewerName: r.assignedReviewer?.name ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      fileCount: fileCountMap[r.id] ?? 0,
      annotationCount: annCountMap[r.id] ?? 0,
      annotationResolved: annResolvedMap[r.id] ?? 0,
    }));

    return NextResponse.json({
      data,
      stats: {
        assigned: assignedCount,
        inProgress: inProgressCount,
        revisionRequired: revisionCount,
      },
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Specialist my-work error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
