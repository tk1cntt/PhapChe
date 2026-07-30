import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import type { AppRole } from '@/lib/types';

// Valid roles per schema: all admin, specialist, reviewer roles can access request details
const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

// GET /api/admin/requests/[id] - Get single request detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    // Authorization check: require one of the allowed roles
    const hasAccess = session.roles?.some((role) => (ALLOWED_ROLES as readonly string[]).includes(role));
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch user's workspace memberships for scope filtering
    const memberships = await prisma.workspaceMembership.findMany({
      where: { userId: session.userId, isActive: true },
      select: { workspaceId: true, role: true },
    });
    const workspaceIds = memberships.map(m => m.workspaceId);
    const isAdmin = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));

    // Build where clause with workspace isolation + object-level access
    const where: any = {
      OR: [{ id: id }, { code: id }],
    };

    // Workspace isolation: non-super_admin only sees their workspace's requests
    if (!session.roles?.includes('super_admin')) {
      where.workspaceId = { in: workspaceIds };

      // Object-level access: specialist/reviewer only sees assigned requests
      if (!isAdmin) {
        where.OR = [
          { assignedSpecialistId: session.userId },
          { assignedReviewerId: session.userId },
          { createdById: session.userId },
        ];
      }
    }

    const legalRequest = await prisma.legalRequest.findFirst({
      where,
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedSpecialist: {
          select: { id: true, name: true, email: true },
        },
        assignedReviewer: {
          select: { id: true, name: true, email: true },
        },
        documents: {
          include: {
            documentVersions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
            createdBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        workflowTransitions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        intakeSubmission: {
          select: { matterTypeKey: true },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(legalRequest);
  } catch (error) {
    console.error('Admin request detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
