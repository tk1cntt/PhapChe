import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles per schema: coordinator_admin, super_admin
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
const VALID_ROLES = ['specialist', 'reviewer'] as const;

// PATCH /api/admin/requests/[id]/assign - Reassign specialist/reviewer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number]));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { specialistId, reviewerId } = body;

    if (!specialistId && !reviewerId) {
      return NextResponse.json({ error: 'VALIDATION: specialistId or reviewerId is required' }, { status: 400 });
    }

    const existingRequest = await prisma.legalRequest.findFirst({
      where: { OR: [{ id: id }, { code: id }] },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // WR-02: Workspace membership validation
    const isSuperAdmin = session.roles?.includes('super_admin');
    const userWorkspaceId = session.activeWorkspaceId;

    // Non-super-admin must have activeWorkspaceId and must match request's workspace
    if (!isSuperAdmin) {
      if (!userWorkspaceId) {
        return NextResponse.json({ error: 'Forbidden: missing workspace context' }, { status: 403 });
      }
      if (existingRequest.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Forbidden: workspace mismatch' }, { status: 403 });
      }
    }

    // Validate users inline before transaction
    // Validate assigned users share same workspace and correct role
    if (specialistId) {
      const error = await validateRoleUser(specialistId, 'specialist', existingRequest.workspaceId, 'Specialist');
      if (error) return NextResponse.json({ error }, { status: 400 });
    }

    if (reviewerId) {
      const error = await validateRoleUser(reviewerId, 'reviewer', existingRequest.workspaceId, 'Reviewer');
      if (error) return NextResponse.json({ error }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, string | null> = {};
    if (specialistId !== undefined) updateData.assignedSpecialistId = specialistId ?? null;
    if (reviewerId !== undefined) updateData.assignedReviewerId = reviewerId ?? null;

    // ── All DB mutations in single transaction ──
    const [updatedRequest] = await prisma.$transaction(async (tx) => {
      const updated = await tx.legalRequest.update({
        where: { id: existingRequest.id },
        data: updateData,
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          assignedSpecialist: { select: { id: true, name: true } },
          assignedReviewer: { select: { id: true, name: true } },
        },
      });

      const auditEvents: Array<{ action: string; metadataSummary: string }> = [];

      // Atomic assignment: set current → false for existing assignments, then create new
      // Reassign a role (ends current assignment, creates new, logs audit)
      async function reassign(
        kind: 'specialist' | 'reviewer',
        userId: string,
        displayLabel: string
      ) {
        await tx.requestAssignment.updateMany({
          where: { requestId: existingRequest.id, kind, isCurrent: true },
          data: { isCurrent: false, endedAt: new Date() },
        });
        await tx.requestAssignment.create({
          data: { requestId: existingRequest.id, userId, kind, createdById: session.userId, isCurrent: true },
        });
        auditEvents.push({
          action: 'request.assigned',
          metadataSummary: `${displayLabel}: ${userId}`,
        });
      }

      if (specialistId) await reassign('specialist', specialistId, 'Phân công chuyên viên');
      if (reviewerId) await reassign('reviewer', reviewerId, 'Phân công người kiểm duyệt');

      // Write audit logs
      for (const evt of auditEvents) {
        await tx.auditEvent.create({
          data: {
            actorId: session.userId,
            workspaceId: existingRequest.workspaceId,
            action: evt.action,
            targetType: 'request',
            targetId: existingRequest.id,
            requestId: existingRequest.id,
            metadataSummary: evt.metadataSummary,
          },
        });
      }

      return [updated];
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Admin request assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
