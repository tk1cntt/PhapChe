import type { RequestStatus } from '@prisma/client';

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
