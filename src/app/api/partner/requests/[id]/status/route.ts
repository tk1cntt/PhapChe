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

// Allowed statuses for partners
const PARTNER_ALLOWED_STATUSES = [
  'in_progress',
  'pending_review',
  'review',
  'revision_required',
  'approved',
  'delivered',
];

// Workflow transitions
const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  'in_progress': ['pending_review', 'cancelled'],
  'pending_review': ['approved', 'in_progress'],
  'review': ['revision_required', 'approved'],
  'revision_required': ['pending_review'],
  'approved': ['delivered'],
};

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
    select: { id: true, status: true, workspaceId: true, assignedPartnerId: true, engagement: { select: { partnerId: true } } },
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
  if (!PARTNER_ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        detail: `Invalid status. Allowed values: ${PARTNER_ALLOWED_STATUSES.join(', ')}`,
        field: 'status'
      },
      { status: 400 }
    );
  }

  // Validate workflow transition
  const allowedNextStatuses = WORKFLOW_TRANSITIONS[request.status] || [];
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
    prisma.auditEvent.create({
      data: {
        actorId: session.user.id,
        workspaceId: request.workspaceId,
        action: 'request.status_update',
        targetType: 'request',
        targetId: id,
        requestId: id,
        metadataSummary: JSON.stringify({
          fromStatus: request.status,
          toStatus: status,
          note,
        }),
      },
    }),
  ]);

  return NextResponse.json({ data: updated });
}
