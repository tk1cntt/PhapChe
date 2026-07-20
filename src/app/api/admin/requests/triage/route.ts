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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;

    // Find requests pending triage: status = draft_intake or triage
    // After v2.3: organizationId is NOT NULL, triage is about assignment, not org matching
    const total = await prisma.legalRequest.count({
      where: {
        status: { in: ['draft_intake', 'triage'] },
      },
    });

    // Find requests that need triage
    const triageRequests = await prisma.legalRequest.findMany({
      where: {
        status: { in: ['draft_intake', 'triage'] },
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

    // Transform to triage format
    const triageCases = triageRequests.map((req, index) => {
      const email = req.createdBy?.email ?? '';
      const matterTypeKey = req.intakeSubmission?.matterTypeKey ?? null;

      return {
        id: req.id,
        index: index + 1,
        code: req.code ?? `REQ-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
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
        hasAnswers: req.intakeSubmission?.answers != null,
        assignedSpecialistId: null,
        assignedSpecialistName: null,
        assignedReviewerId: null,
        assignedReviewerName: null,
      };
    });

    // Fetch available specialists & reviewers for the workspaces involved
    const workspaceIds = [...new Set(triageRequests.map(r => r.workspaceId))];
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
    console.error('Admin triage error:', error);
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 });
  }
}
