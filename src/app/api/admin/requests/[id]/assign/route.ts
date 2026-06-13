import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

const ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin'] as string[];

// PATCH /api/admin/requests/[id]/assign - Reassign specialist/reviewer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    // Authorization check: require admin role
    const hasAdminRole = session.roles?.some((role) => ADMIN_ROLES.includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { specialistId, reviewerId } = body;

    // Check if request exists
    const existingRequest = await prisma.legalRequest.findFirst({
      where: {
        OR: [
          { id: id },
          { code: id },
        ],
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, string | null> = {};

    if (specialistId !== undefined) {
      // Validate specialist exists and has specialist role
      if (specialistId) {
        const specialist = await prisma.user.findUnique({
          where: { id: specialistId },
          include: {
            memberships: {
              where: { role: 'specialist', isActive: true },
            },
          },
        });
        if (!specialist) {
          return NextResponse.json(
            { error: 'Specialist not found' },
            { status: 400 }
          );
        }
        updateData.assignedSpecialistId = specialistId;
      } else {
        updateData.assignedSpecialistId = null;
      }
    }

    if (reviewerId !== undefined) {
      // Validate reviewer exists and has reviewer role
      if (reviewerId) {
        const reviewer = await prisma.user.findUnique({
          where: { id: reviewerId },
          include: {
            memberships: {
              where: { role: 'reviewer', isActive: true },
            },
          },
        });
        if (!reviewer) {
          return NextResponse.json(
            { error: 'Reviewer not found' },
            { status: 400 }
          );
        }
        updateData.assignedReviewerId = reviewerId;
      } else {
        updateData.assignedReviewerId = null;
      }
    }

    // Update the request
    const updatedRequest = await prisma.legalRequest.update({
      where: { id: existingRequest.id },
      data: updateData,
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        assignedSpecialist: {
          select: { id: true, name: true },
        },
        assignedReviewer: {
          select: { id: true, name: true },
        },
      },
    });

    // Create assignment records for audit trail
    if (specialistId && !existingRequest.assignedSpecialistId) {
      await prisma.requestAssignment.create({
        data: {
          requestId: existingRequest.id,
          userId: specialistId,
          kind: 'specialist',
          createdById: session.userId,
        },
      });
    }

    if (reviewerId && !existingRequest.assignedReviewerId) {
      await prisma.requestAssignment.create({
        data: {
          requestId: existingRequest.id,
          userId: reviewerId,
          kind: 'reviewer',
          createdById: session.userId,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Admin request assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
