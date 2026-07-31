import type { LegalRequest } from '@prisma/client';
import type { AppRole, RequestStatus, Role } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

/**
 * v2.3 Workflow — customer submit → triage → assigned → in_progress → pending_review
 * - 'intake_submitted' removed: customer submit goes straight to 'triage'
 * - 'approved' → 'delivered' → 'closed' with clear role boundaries
 * - Specialist cannot deliver/close; that's coordinator's job
 * - Customer can only cancel from draft_intake and triage
 *
 * ⚠ C2 MIGRATION PATH (deferred): Replace assignedSpecialistId/assignedReviewerId
 *    with RequestAssignment làm single source of truth.
 *    - Migration: Migrate existing data từ LegalRequest → RequestAssignment
 *    - Update: canTransitionRequestStatus(), ~30 files dùng old FK
 *    - Remove: LegalRequest.assignedSpecialistId/assignedReviewerId → drop columns
 *    - Impact: 16+ files trực tiếp, 14+ files gián tiếp
 *    See: docs/shared_customer_partner_collaboration.md §7.2
 */
export const REQUEST_TRANSITIONS = {
  draft_intake: ['triage', 'cancelled'],
  triage: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['pending_review', 'cancelled'],
  pending_review: ['revision_required', 'approved'],
  revision_required: ['in_progress', 'cancelled'],
  approved: ['delivered'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
  // Legacy compatibility: intake_submitted is mapped to triage behavior
  intake_submitted: ['triage', 'cancelled'],
} as const satisfies Record<string, readonly string[]>;

export type TransitionMap = typeof REQUEST_TRANSITIONS;

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

/**
 * Role-based transition permission matrix (v2.3):
 *
 * CUSTOMER — only on own requests:
 *   draft_intake → triage (submit), cancelled
 *
 * COORDINATOR — manages pipeline:
 *   triage → assigned (assign specialist+reviewer)
 *   approved → delivered (hand off to customer)
 *   delivered → closed
 *   + cancel from any non-terminal
 *
 * SPECIALIST — only on assigned requests:
 *   assigned → in_progress (accept work)
 *   in_progress → pending_review (submit for review)
 *   revision_required → in_progress (resubmit after fixes)
 *
 * REVIEWER — only on assigned reviews:
 *   pending_review → approved (accept)
 *   pending_review → revision_required (reject with comments)
 */
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

  // ── CUSTOMER ── merge intake_submitted→triage
  // Customer can only cancel from draft_intake and triage
  if (hasRole('customer') && isOwnRequest) {
    if (toStatus === 'cancelled' && !['draft_intake', 'triage'].includes(request.status)) {
      return false;
    }
    return ['triage', 'cancelled'].includes(toStatus);
  }

  // ── COORDINATOR ── pipeline manager
  if (hasRole('coordinator_admin')) {
    return ['triage', 'assigned', 'cancelled', 'delivered', 'closed'].includes(toStatus);
  }

  // ── SPECIALIST ── execution
  if (hasRole('specialist') && isAssignedSpecialist) {
    return ['in_progress', 'pending_review', 'cancelled'].includes(toStatus);
  }

  // ── REVIEWER ── quality gate
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

  const VALID_ROLES = new Set<string>(['super_admin', 'coordinator_admin', 'audit_admin', 'reviewer', 'specialist', 'customer']);

  const actor: AppSession = {
    userId: input.actorId,
    activeWorkspaceId: request.workspaceId,
    roles: request.workspace.memberships
      .map((membership) => membership.role as Role)
      .filter((role): role is Role => VALID_ROLES.has(role)),
  };

  const currentStatus = request.status as RequestStatus;
  const allowedTransitions = getAllowedTransitions(currentStatus);

  if (!allowedTransitions.includes(input.toStatus)) throw new Error('INVALID_REQUEST_TRANSITION');
  if (!(await canAccessRequest(actor, input.requestId))) throw new Error('FORBIDDEN');
  if (!canTransitionRequestStatus(actor, request, input.toStatus)) throw new Error('FORBIDDEN');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.legalRequest.updateMany({
      where: { id: input.requestId, status: currentStatus },
      data: { status: input.toStatus },
    });

    if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');

    const updatedRequest = await tx.legalRequest.findUniqueOrThrow({
      where: { id: input.requestId },
      select: { id: true, status: true },
    }) as { id: string; status: RequestStatus };

    await tx.workflowTransition.create({
      data: {
        requestId: input.requestId,
        actorId: input.actorId,
        fromStatus: currentStatus,
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
      metadataSummary: `${currentStatus} -> ${input.toStatus}`,
    };

    await recordAuditEvent(auditInput, tx);

    return updatedRequest;
  });
}
