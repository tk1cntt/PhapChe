/**
 * Reviewer Console API
 * GET /api/partner/requests/pending-review
 *
 * Returns legal requests at pending_review status assigned to the current reviewer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { formatDateTime } from '@/lib/i18n/date-format';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    const isReviewer = session.roles?.includes('reviewer');
    const isAdmin = session.roles?.some(r => ['super_admin', 'coordinator_admin'].includes(r));

    if (!isReviewer && !isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {
      ...(isReviewer && !isAdmin ? { assignedReviewerId: session.userId } : {}),
      status: 'pending_review',
    };

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
          assignedSpecialist: { select: { id: true, name: true } },
          intakeSubmission: { select: { id: true, matterTypeKey: true } },
        },
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
    ]);

    // Stats
    const [pendingCount, approvedCount, revisionCount] = await Promise.all([
      prisma.legalRequest.count({ where: { assignedReviewerId: session.userId, status: 'pending_review' } }),
      prisma.legalRequest.count({ where: { assignedReviewerId: session.userId, status: 'approved' } }),
      prisma.legalRequest.count({ where: { assignedReviewerId: session.userId, status: 'revision_required' } }),
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
      specialistName: r.assignedSpecialist?.name ?? null,
      createdAt: formatDateTime(r.createdAt, 'vi'),
      updatedAt: formatDateTime(r.updatedAt, 'vi'),
    }));

    return NextResponse.json({
      data,
      stats: { pending: pendingCount, approved: approvedCount, revisionRequired: revisionCount },
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Pending-review API error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
