/**
 * Admin Partner Request Status Override API
 * PATCH /api/admin/partner/requests/[id]/status
 *
 * Admin can set any status for partner requests (no restrictions).
 * All status changes are logged to audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { REQUEST_STATUS } from '@/lib/types';

// Valid admin roles
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAppSession();

    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
        actorId: session.user.id,
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
  } catch (error) {
    console.error('Error updating partner request status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
