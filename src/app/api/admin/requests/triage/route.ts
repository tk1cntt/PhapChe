/**
 * Admin Requests Triage API
 * GET /api/admin/requests/triage
 *
 * Returns requests that need organization/workspace mapping.
 * These are requests without proper workspace or organization assignment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession(request.headers);

    // Authorization check
    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawPageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    const pageSize = Number.isNaN(rawPageSize) ? 10 : Math.min(50, Math.max(5, rawPageSize));
    const skip = (page - 1) * pageSize;

    // Find requests pending triage: only status = triage
    // draft_intake excluded — user is still drafting, not ready for admin
    const total = await prisma.legalRequest.count({
      where: {
        status: 'triage',
      },
    });

    // Find requests that need triage
    const triageRequests = await prisma.legalRequest.findMany({
      where: {
        status: 'triage',
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true, organizationId: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        intakeSubmission: {
          select: { id: true, matterTypeKey: true, answers: true, submittedAt: true },
        },
      },
      orderBy: { priority: 'asc' },
      skip,
      take: pageSize,
    });

    // ── Document + annotation stats for all returned requests ──
    const requestIds = triageRequests.map(r => r.id);
    const [fileCounts, annotationCounts, annotationResolvedCounts] = await Promise.all([
      prisma.file.groupBy({ by: ['requestId'], where: { requestId: { in: requestIds } }, _count: { id: true } }),
      prisma.documentAnnotation.groupBy({ by: ['requestId'], where: { requestId: { in: requestIds } }, _count: { id: true } }),
      prisma.documentAnnotation.groupBy({ by: ['requestId'], where: { requestId: { in: requestIds }, status: 'resolved' }, _count: { id: true } }),
    ]);
    const fileCountMap = Object.fromEntries(fileCounts.map(f => [f.requestId, f._count.id]));
    const annotationCountMap = Object.fromEntries(annotationCounts.map(a => [a.requestId, a._count.id]));
    const annotationResolvedMap = Object.fromEntries(annotationResolvedCounts.map(a => [a.requestId, a._count.id]));

    // Transform to triage format
    const triageCases = triageRequests.map((req, index) => {
      const email = req.createdBy?.email ?? '';
      const matterTypeKey = req.intakeSubmission?.matterTypeKey ?? null;

      return {
        id: req.id,
        index: index + 1,
        code: req.code || `REQ-${new Date().getFullYear()}-${String(skip + index + 1).padStart(5, '0')}`,
        title: req.title,
        description: req.description ?? '',
        workspaceId: req.workspaceId,
        workspaceName: req.workspace?.name ?? '',
        workspaceSlug: req.workspace?.slug ?? '',
        customerName: req.createdBy?.name ?? email,
        customerEmail: email,
        matterTypeKey,
        status: req.status,
        priority: req.priority ?? 'MEDIUM',
        date: req.createdAt.toISOString(),
        hasAnswers: req.intakeSubmission?.answers !== null && req.intakeSubmission?.answers !== undefined,
        assignedSpecialistId: null,
        assignedSpecialistName: null,
        assignedReviewerId: null,
        assignedReviewerName: null,
        fileCount: fileCountMap[req.id] ?? 0,
        annotationCount: annotationCountMap[req.id] ?? 0,
        annotationResolved: annotationResolvedMap[req.id] ?? 0,
      };
    });

    // Fetch available specialists & reviewers for the workspaces involved
    const workspaceIds = [...new Set(triageRequests.map(r => r.workspaceId).filter(Boolean))];
    const workspaceMembers = workspaceIds.length > 0 ? await prisma.workspaceMembership.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        isActive: true,
        role: { in: ['specialist', 'reviewer'] },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } },
      },
    }) : [];

    const specialists = workspaceMembers
      .filter(m => m.role === 'specialist')
      .map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email, workspaceId: m.workspaceId }));
    const reviewers = workspaceMembers
      .filter(m => m.role === 'reviewer')
      .map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email, workspaceId: m.workspaceId }));

    return NextResponse.json({
      data: triageCases,
      specialists,
      reviewers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    // Re-throw Next.js redirect errors so they are handled by the framework
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Admin triage error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
