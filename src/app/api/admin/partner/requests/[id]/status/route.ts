/**
 * Admin Partner Request Status Override API
 * PATCH /api/admin/partner/requests/[id]/status
 *
 * Admin can set any status for partner requests (no restrictions).
 * All status changes are logged to audit.
 * Platform-level admin - queries all memberships to find admin roles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isStructuredError } from '@/lib/errors';
import { auth } from '@/auth';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

// Aligned with prisma/schema.prisma: draft_intake, triage, assigned, in_progress,
// pending_review, revision_required, approved, delivered, closed, cancelled
const VALID_STATUSES = [
  'draft_intake', 'triage', 'assigned', 'in_progress',
  'pending_review', 'revision_required', 'approved', 'delivered', 'closed', 'cancelled',
];

/**
 * Get session with admin role check from database memberships
 */
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }

  // Query all workspace memberships to find admin roles
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });

  // Filter out null roles
  const userRoles = memberships
    .map((m) => m.role)
    .filter((r): r is string => r !== null);

  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));

  if (!hasAdminRole) {
    throw { status: 403, error: 'Forbidden' };
  }

  return {
    userId: session.user.id,
    roles: userRoles,
    activeWorkspaceId: memberships[0]?.workspaceId,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAdminSession();

    const { id } = await params;
    const body = await req.json();
    const { status, note } = body;

    // Validate note length
    if (note && note.length > 2000) {
      return NextResponse.json(
        { error: 'INVALID_NOTE', detail: 'Note must be 2000 characters or less' },
        { status: 400 },
      );
    }

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', detail: `Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    // Check if request exists and get workspaceId for audit
    const existingRequest = await prisma.legalRequest.findUnique({
      where: { id },
      select: { id: true, status: true, assignedPartnerId: true, workspaceId: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 },
      );
    }

    // Update status and create audit log atomically
    const [updated] = await prisma.$transaction([
      prisma.legalRequest.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      }),
      prisma.auditEvent.create({
        data: {
          actorId: userId,
          workspaceId: existingRequest.workspaceId || '',
          action: 'admin.partner.status_override',
          targetType: 'request',
          targetId: id,
          metadataSummary: JSON.stringify({
            previousStatus: existingRequest.status,
            newStatus: status,
            note: note || null,
          }),
        },
      }),
    ]);

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error updating partner request status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
