/**
 * Partner Request Status Update API
 * PATCH /api/partner/requests/[id]/status
 *
 * Partner can update status for requests assigned to them via:
 * - Direct assignment (assignedPartnerId)
 * - Engagement (engagement.partnerId)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { REQUEST_STATUS } from '@/lib/types';
import { PARTNER_ALLOWED_STATUSES } from '@/lib/constants/partner-statuses';

// Allowed statuses as string array for validation
const ALLOWED_STATUS_VALUES = PARTNER_ALLOWED_STATUSES as unknown as string[];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify partner membership
  const member = await prisma.partnerMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { partnerId: true },
  });

  if (!member) {
    return NextResponse.json(
      { error: 'FORBIDDEN', detail: 'User is not an active partner member' },
      { status: 403 }
    );
  }

  // Verify request access
  const request = await prisma.legalRequest.findUnique({
    where: { id },
    include: { engagement: { select: { partnerId: true } } },
  });

  if (!request) {
    return NextResponse.json(
      { error: 'NOT_FOUND', detail: 'Request not found' },
      { status: 404 }
    );
  }

  const hasAccess = request.assignedPartnerId === member.partnerId ||
    request.engagement?.partnerId === member.partnerId;

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'FORBIDDEN', detail: 'Partner does not have access to this request' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { status, note } = body;

  // Validate status is provided
  if (!status) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'Status is required', field: 'status' },
      { status: 400 }
    );
  }

  // Validate against allowed statuses
  if (!ALLOWED_STATUS_VALUES.includes(status)) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        detail: `Invalid status. Allowed values: ${ALLOWED_STATUS_VALUES.join(', ')}`,
        field: 'status'
      },
      { status: 400 }
    );
  }

  // Validate workflow transition
  const validTransitions: Record<string, string[]> = {
    [REQUEST_STATUS.IN_PROGRESS]: [REQUEST_STATUS.PENDING_REVIEW, REQUEST_STATUS.CANCELLED],
    [REQUEST_STATUS.PENDING_REVIEW]: [REQUEST_STATUS.APPROVED, REQUEST_STATUS.REVISION_REQUIRED],
    [REQUEST_STATUS.APPROVED]: [REQUEST_STATUS.DELIVERED],
  };

  const allowedNextStatuses = validTransitions[request.status] || [];
  if (status !== request.status && !allowedNextStatuses.includes(status)) {
    return NextResponse.json(
      {
        error: 'INVALID_TRANSITION',
        detail: `Cannot transition from '${request.status}' to '${status}'`
      },
      { status: 400 }
    );
  }

  // Update status within transaction
  const [updated] = await prisma.$transaction([
    prisma.legalRequest.update({
      where: { id },
      data: {
        status,
        statusNote: note || null,
        updatedAt: new Date(),
      },
      select: { id: true, status: true, statusNote: true, updatedAt: true },
    }),
    prisma.workflowTransition.create({
      data: {
        requestId: id,
        actorId: session.user.id,
        fromStatus: request.status,
        toStatus: status,
        reason: note || null,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'request.status_update',
        entityType: 'legal_request',
        entityId: id,
        actorId: session.user.id,
        actorType: 'partner',
        actorName: session.user.name || 'Partner',
        metadata: {
          fromStatus: request.status,
          toStatus: status,
          note
        },
      },
    }),
  ]);

  return NextResponse.json({ data: updated });
}
