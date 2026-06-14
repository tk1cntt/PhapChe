/**
 * Admin Partner Request Status Override API
 * PATCH /api/admin/partner/requests/[id]/status
 *
 * Admin can set any status for partner requests (no restrictions).
 * All status changes are logged to audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { REQUEST_STATUS } from '@/lib/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id || session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Admin access required' },
      { status: 401 }
    );
  }

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
}
