import type { LegalRequest, RequestStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

export const REQUEST_TRANSITIONS = {
  draft_intake: ['intake_submitted', 'cancelled'],
  intake_submitted: ['triage', 'cancelled'],
  triage: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['pending_review', 'cancelled'],
  pending_review: ['revision_required', 'approved'],
  revision_required: ['in_progress', 'cancelled'],
  approved: ['delivered'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
} as const satisfies Record<RequestStatus, readonly RequestStatus[]>;

export function getAllowedTransitions(status: RequestStatus): RequestStatus[] {
  return [...REQUEST_TRANSITIONS[status]];
}

type RequestForTransition = Pick<LegalRequest, 'createdById' | 'assignedSpecialistId' | 'assignedReviewerId' | 'status'>;

type TransitionInput = {
  requestId: string;
  actorId: string;
  toStatus: RequestStatus;
  reason?: string | null;
  correlationId: string;
};

export function canTransitionRequestStatus(
  actor: AppSession,
  request: RequestForTransition,
  toStatus: RequestStatus,
): boolean {
  if (actor.roles.includes('super_admin')) return true;

  const hasRole = (role: Role) => actor.roles.includes(role);
  const isOwnRequest = request.createdById === actor.userId;
  const isAssignedSpecialist = request.assignedSpecialistId === actor.userId;
  const isAssignedReviewer = request.assignedReviewerId === actor.userId;

  if (hasRole('customer') && isOwnRequest) {
    return ['intake_submitted', 'cancelled'].includes(toStatus);
  }

  if (hasRole('coordinator_admin')) {
    return ['triage', 'assigned', 'cancelled', 'delivered', 'closed'].includes(toStatus);
  }

  if (hasRole('specialist') && isAssignedSpecialist) {
    return ['in_progress', 'pending_review', 'delivered', 'closed'].includes(toStatus);
  }

  if (hasRole('reviewer') && isAssignedReviewer) {
    return ['revision_required', 'approved'].includes(toStatus);
  }

  return false;
}

export async function transitionRequestStatus(input: TransitionInput): Promise<{ id: string; status: RequestStatus }> {
  const request = await prisma.legalRequest.findUnique({
    where: { id: input.requestId },
    select: {
      id: true,
      workspaceId: true,
      status: true,
      createdById: true,
      assignedSpecialistId: true,
      assignedReviewerId: true,
      workspace: {
        select: {
          memberships: {
            where: { userId: input.actorId, isActive: true },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');

  const actor: AppSession = {
    userId: input.actorId,
    activeWorkspaceId: request.workspaceId,
    roles: request.workspace.memberships.map((membership) => membership.role),
  };

  const allowedTransitions = getAllowedTransitions(request.status);

  if (!allowedTransitions.includes(input.toStatus)) throw new Error('INVALID_REQUEST_TRANSITION');
  if (!(await canAccessRequest(actor, input.requestId))) throw new Error('FORBIDDEN');
  if (!canTransitionRequestStatus(actor, request, input.toStatus)) throw new Error('FORBIDDEN');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.legalRequest.updateMany({
      where: { id: input.requestId, status: request.status },
      data: { status: input.toStatus },
    });

    if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');

    const updatedRequest = await tx.legalRequest.findUniqueOrThrow({
      where: { id: input.requestId },
      select: { id: true, status: true },
    });

    await tx.workflowTransition.create({
      data: {
        requestId: input.requestId,
        actorId: input.actorId,
        fromStatus: request.status,
        toStatus: input.toStatus,
        reason: input.reason ?? null,
      },
    });

    const auditInput = {
      actorId: input.actorId,
      workspaceId: request.workspaceId,
      action: 'request.status_changed',
      targetType: 'REQUEST' as const,
      targetId: input.requestId,
      requestId: input.requestId,
      correlationId: input.correlationId,
      metadataSummary: `${request.status} -> ${input.toStatus}`,
    };

    await recordAuditEvent(auditInput, tx);

    return updatedRequest;
  });
}
