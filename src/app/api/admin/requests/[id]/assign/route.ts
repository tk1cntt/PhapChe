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

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
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
    if (specialistId) {
      const specialist = await prisma.user.findUnique({
        where: { id: specialistId },
        include: { memberships: { where: { workspaceId: existingRequest.workspaceId, role: 'specialist', isActive: true } } },
      });
      if (!specialist || specialist.memberships.length === 0) {
        return NextResponse.json({ error: 'Specialist not found or not a specialist in this workspace' }, { status: 400 });
      }
    }

    if (reviewerId) {
      const reviewer = await prisma.user.findUnique({
        where: { id: reviewerId },
        include: { memberships: { where: { workspaceId: existingRequest.workspaceId, role: 'reviewer', isActive: true } } },
      });
      if (!reviewer || reviewer.memberships.length === 0) {
        return NextResponse.json({ error: 'Reviewer not found or not a reviewer in this workspace' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: Record<string, string | null> = {};
    if (specialistId !== undefined) updateData.assignedSpecialistId = specialistId || null;
    if (reviewerId !== undefined) updateData.assignedReviewerId = reviewerId || null;

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
      if (specialistId) {
        await tx.requestAssignment.updateMany({
          where: { requestId: existingRequest.id, kind: 'specialist', isCurrent: true },
          data: { isCurrent: false, endedAt: new Date() },
        });
        await tx.requestAssignment.create({
          data: { requestId: existingRequest.id, userId: specialistId, kind: 'specialist', createdById: session.userId, isCurrent: true },
        });
        auditEvents.push({
          action: 'request.assigned',
          metadataSummary: `Phân công chuyên viên: ${updated.assignedSpecialist?.name ?? specialistId}`,
        });
      }

      if (reviewerId) {
        await tx.requestAssignment.updateMany({
          where: { requestId: existingRequest.id, kind: 'reviewer', isCurrent: true },
          data: { isCurrent: false, endedAt: new Date() },
        });
        await tx.requestAssignment.create({
          data: { requestId: existingRequest.id, userId: reviewerId, kind: 'reviewer', createdById: session.userId, isCurrent: true },
        });
        auditEvents.push({
          action: 'request.assigned',
          metadataSummary: `Phân công người kiểm duyệt: ${updated.assignedReviewer?.name ?? reviewerId}`,
        });
      }

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
