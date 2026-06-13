import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles per schema: coordinator_admin, super_admin (removed audit_admin - not in schema)
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

// PATCH /api/admin/requests/[id]/assign - Reassign specialist/reviewer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { specialistId, reviewerId } = body;

    const existingRequest = await prisma.legalRequest.findFirst({
      where: { OR: [{ id: id }, { code: id }] },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // WR-02: Workspace membership validation for non-super_admin
    const isSuperAdmin = session.roles?.includes('super_admin');
    const userWorkspaceId = session.activeWorkspaceId;
    if (!isSuperAdmin && userWorkspaceId && existingRequest.workspaceId !== userWorkspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, string | null> = {};

    if (specialistId !== undefined) {
      if (specialistId) {
        const specialist = await prisma.user.findUnique({
          where: { id: specialistId },
          include: { memberships: { where: { workspaceId: existingRequest.workspaceId, role: 'specialist', isActive: true } } },
        });
        if (!specialist || specialist.memberships.length === 0) {
          return NextResponse.json({ error: 'Specialist not found or not a specialist in this workspace' }, { status: 400 });
        }
        updateData.assignedSpecialistId = specialistId;
      } else {
        updateData.assignedSpecialistId = null;
      }
    }

    if (reviewerId !== undefined) {
      if (reviewerId) {
        const reviewer = await prisma.user.findUnique({
          where: { id: reviewerId },
          include: { memberships: { where: { workspaceId: existingRequest.workspaceId, role: 'reviewer', isActive: true } } },
        });
        if (!reviewer || reviewer.memberships.length === 0) {
          return NextResponse.json({ error: 'Reviewer not found or not a reviewer in this workspace' }, { status: 400 });
        }
        updateData.assignedReviewerId = reviewerId;
      } else {
        updateData.assignedReviewerId = null;
      }
    }

    const updatedRequest = await prisma.legalRequest.update({
      where: { id: existingRequest.id },
      data: updateData,
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
      },
    });

    if (specialistId && !existingRequest.assignedSpecialistId) {
      await prisma.requestAssignment.create({
        data: { requestId: existingRequest.id, userId: specialistId, kind: 'specialist', createdById: session.userId },
      });
    }

    if (reviewerId && !existingRequest.assignedReviewerId) {
      await prisma.requestAssignment.create({
        data: { requestId: existingRequest.id, userId: reviewerId, kind: 'reviewer', createdById: session.userId },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Admin request assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}