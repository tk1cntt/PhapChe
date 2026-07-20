/**
 * Specialist Workbench API
 * GET /api/partner/requests/my-work
 *
 * Returns legal requests assigned to the current specialist.
 * Used by the Specialist Workbench UI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    // Only specialists (and super_admin/coordinator for debugging)
    const isSpecialist = session.roles?.includes('specialist');
    const isAdmin = session.roles?.some(r => ['super_admin', 'coordinator_admin'].includes(r));

    if (!isSpecialist && !isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;
    const statusFilter = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {
      // Specialist sees only their assigned requests
      ...(isSpecialist && !isAdmin ? { assignedSpecialistId: session.userId } : {}),
      status: { notIn: ['draft_intake', 'triage', 'cancelled', 'delivered', 'closed'] },
    };

    if (statusFilter) {
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
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
    ]);

    // Stats
    const [assignedCount, inProgressCount, pendingReviewCount, revisionCount] = await Promise.all([
      prisma.legalRequest.count({ where: { assignedSpecialistId: session.userId, status: 'assigned' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: session.userId, status: 'in_progress' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: session.userId, status: 'pending_review' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: session.userId, status: 'revision_required' } }),
    ]);

    const data = requests.map(r => ({
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
    }));

    return NextResponse.json({
      data,
      stats: { assigned: assignedCount, inProgress: inProgressCount, pendingReview: pendingReviewCount, revisionRequired: revisionCount },
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
