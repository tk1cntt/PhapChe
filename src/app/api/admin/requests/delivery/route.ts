/**
 * Delivery Console API
 * GET /api/admin/requests/delivery
 *
 * Returns legal requests at approved/delivered status for coordinator delivery management.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { formatDateTime } from '@/lib/i18n/date-format';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    const isCoordinator = session.roles?.includes('coordinator_admin');
    const isAdmin = session.roles?.some(r => ['super_admin'].includes(r));

    if (!isCoordinator && !isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;
    const statusFilter = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {
      status: statusFilter || { in: ['approved', 'delivered', 'closed'] },
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
          assignedReviewer: { select: { id: true, name: true } },
          intakeSubmission: { select: { id: true, matterTypeKey: true } },
        },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
    ]);

    // Stats
    const [approvedCount, deliveredCount, closedCount] = await Promise.all([
      prisma.legalRequest.count({ where: { status: 'approved' } }),
      prisma.legalRequest.count({ where: { status: 'delivered' } }),
      prisma.legalRequest.count({ where: { status: 'closed' } }),
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
      reviewerName: r.assignedReviewer?.name ?? null,
      createdAt: formatDateTime(r.createdAt, 'vi'),
      updatedAt: formatDateTime(r.updatedAt, 'vi'),
    }));

    return NextResponse.json({
      data,
      stats: { approved: approvedCount, delivered: deliveredCount, closed: closedCount },
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Delivery API error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
