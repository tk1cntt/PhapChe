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
import { auth } from '@/auth';
import { REQUEST_STATUS } from '@/lib/types';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

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
    session,
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
    const { session, userId } = await requireAdminSession();

    const { id } = await params;
    const body = await req.json();
    const { status, note } = body;

    // Validate status
    if (!status || !Object.values(REQUEST_STATUS).includes(status)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', detail: 'Status must be a valid request status' },
        { status: 400 }
      );
    }

    // Check if request exists
    const existingRequest = await prisma.legalRequest.findUnique({
      where: { id },
      select: { id: true, status: true, assignedPartnerId: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Request not found' },
        { status: 404 }
      );
    }

    // Update status
    const updated = await prisma.legalRequest.update({
      where: { id },
      data: {
        status,
        statusNote: note || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        statusNote: true,
        updatedAt: true,
      },
    });

    // Admin audit log
    await prisma.auditLog.create({
      data: {
        action: 'admin.partner.status_override',
        entityType: 'legal_request',
        entityId: id,
        actorId: userId,
        actorType: 'admin',
        actorName: session.user.name || 'Admin',
        metadata: {
          previousStatus: existingRequest.status,
          newStatus: status,
          note: note || null,
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error('Error updating partner request status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
