/**
 * Partner Request Status Update API
 * PATCH /api/partner/requests/[id]/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Allowed status transitions for partners
const PARTNER_ALLOWED_STATUSES = [
  'in_progress',
  'waiting_customer',
  'review_pending',
  'completed',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner membership
  const member = await prisma.partnerMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { partnerId: true },
  });

  if (!member) {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
  }

  // Verify request access
  const request = await prisma.legalRequest.findUnique({
    where: { id },
    include: { engagement: { select: { partnerId: true } } },
  });

  if (!request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const hasAccess = request.assignedPartnerId === member.partnerId ||
    request.engagement?.partnerId === member.partnerId;

  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const { status, note } = body;

  if (!status || !PARTNER_ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status. Allowed: ' + PARTNER_ALLOWED_STATUSES.join(', ') },
      { status: 400 }
    );
  }

  // Update status
  const updated = await prisma.legalRequest.update({
    where: { id },
    data: {
      status,
      statusNote: note,
      updatedAt: new Date(),
    },
    select: { id: true, status: true, statusNote: true, updatedAt: true },
  });

  // Log to audit
  await prisma.auditLog.create({
    data: {
      action: 'request.status_update',
      entityType: 'legal_request',
      entityId: id,
      actorId: session.user.id,
      actorType: 'partner',
      actorName: session.user.name || 'Partner',
      metadata: { newStatus: status, note },
    },
  });

  return NextResponse.json({ data: updated });
}
