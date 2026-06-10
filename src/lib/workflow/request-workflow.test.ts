import { getAllowedTransitions, REQUEST_TRANSITIONS } from './request-workflow';
import type { RequestStatus } from '@/lib/types';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type TransitionStatus = keyof typeof REQUEST_TRANSITIONS;
type _AllStatusesCovered = Assert<Equal<TransitionStatus, RequestStatus>>;

const expectedTransitions: Record<RequestStatus, readonly RequestStatus[]> = {
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
};

for (const status of Object.keys(expectedTransitions) as RequestStatus[]) {
  const allowed = getAllowedTransitions(status);

  if (Object.is(allowed, REQUEST_TRANSITIONS[status])) {
    throw new Error(`${status} returned mutable transition source`);
  }

  if (allowed.join(',') !== expectedTransitions[status].join(',')) {
    throw new Error(`${status} transitions mismatch`);
  }
}

if (getAllowedTransitions('draft_intake').includes('approved')) {
  throw new Error('draft_intake must not transition directly to approved');
}
