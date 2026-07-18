import { getAllowedTransitions, REQUEST_TRANSITIONS } from './request-workflow';
import type { RequestStatus } from '@/lib/types';

/**
 * v2.3 Workflow Tests — intake_submitted removed
 *
 * Transition map:
 *   draft_intake → triage (customer submit thẳng triage)
 *   triage → assigned (coordinator assign)
 *   assigned → in_progress (specialist nhận việc)
 *   in_progress → pending_review (specialist nộp review)
 *   pending_review → revision_required | approved (reviewer quyết định)
 *   revision_required → in_progress (specialist sửa lại)
 *   approved → delivered (coordinator giao)
 *   delivered → closed (hoàn tất)
 */

const expectedTransitionsV2_3: Record<RequestStatus, readonly RequestStatus[]> = {
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
};

// ── Whitebox: transition map matches spec ──
for (const status of Object.keys(expectedTransitionsV2_3) as RequestStatus[]) {
  const allowed = getAllowedTransitions(status);
  const expected = expectedTransitionsV2_3[status].join(',');
  const actual = allowed.join(',');

  if (expected !== actual) {
    throw new Error(
      `Transition mismatch for ${status}\n  expected: [${expected}]\n  got:      [${actual}]`
    );
  }
}

// ── Whitebox: getAllowedTransitions returns a copy (no mutation leak) ──
for (const status of Object.keys(expectedTransitionsV2_3) as RequestStatus[]) {
  const allowed = getAllowedTransitions(status);
  if (Object.is(allowed, REQUEST_TRANSITIONS[status])) {
    throw new Error(`${status} returned mutable transition source`);
  }
}

// ── Blackbox: state-specific guard checks ──

// draft_intake must NOT transition directly to approved/delivered/closed
if (getAllowedTransitions('draft_intake').includes('approved' as RequestStatus)) {
  throw new Error('draft_intake must not transition directly to approved');
}
if (getAllowedTransitions('draft_intake').includes('delivered' as RequestStatus)) {
  throw new Error('draft_intake must not transition directly to delivered');
}
if (getAllowedTransitions('draft_intake').includes('closed' as RequestStatus)) {
  throw new Error('draft_intake must not transition directly to closed');
}

// draft_intake → triage (not intake_submitted anymore)
if (!getAllowedTransitions('draft_intake').includes('triage' as RequestStatus)) {
  throw new Error('draft_intake must allow transition to triage');
}

// terminal states must not have any transitions
if (getAllowedTransitions('closed').length !== 0) {
  throw new Error('closed must be terminal (no outgoing transitions)');
}
if (getAllowedTransitions('cancelled').length !== 0) {
  throw new Error('cancelled must be terminal (no outgoing transitions)');
}

// ── Abnormal: backwards transitions ──
// approved can only go to delivered (not back to pending_review)
if (getAllowedTransitions('approved').includes('pending_review' as RequestStatus)) {
  throw new Error('approved must not allow backward transition to pending_review');
}
if (getAllowedTransitions('approved').includes('in_progress' as RequestStatus)) {
  throw new Error('approved must not allow backward transition to in_progress');
}

// delivered can only go to closed
if (!getAllowedTransitions('delivered').includes('closed' as RequestStatus)) {
  throw new Error('delivered must allow transition to closed');
}
if (getAllowedTransitions('delivered').length !== 1) {
  throw new Error(`delivered must have exactly 1 transition (to closed), got ${getAllowedTransitions('delivered').length}`);
}

// ── Error case: non-existent status ──
try {
  // @ts-expect-error — testing runtime behavior for invalid status
  getAllowedTransitions('nonexistent_status');
  throw new Error('Should have thrown for nonexistent status');
} catch (e) {
  if (e instanceof TypeError || (e instanceof Error && e.message === 'Should have thrown for nonexistent status')) {
    // TypeError is expected (cannot read property of undefined), re-throw if our own
    if (e.message === 'Should have thrown for nonexistent status') throw e;
  }
}

// ── Revision path integrity ──
// revision_required → in_progress → pending_review forms a valid loop
const revisionTransitions = getAllowedTransitions('revision_required');
if (!revisionTransitions.includes('in_progress' as RequestStatus)) {
  throw new Error('revision_required must allow transition to in_progress for specialist rework');
}
if (!revisionTransitions.includes('cancelled' as RequestStatus)) {
  throw new Error('revision_required must allow cancellation');
}

// pending_review must allow both approve and reject paths
const pendingReviewTransitions = getAllowedTransitions('pending_review');
if (!pendingReviewTransitions.includes('approved' as RequestStatus)) {
  throw new Error('pending_review must allow transition to approved');
}
if (!pendingReviewTransitions.includes('revision_required' as RequestStatus)) {
  throw new Error('pending_review must allow transition to revision_required');
}

// ── Coverage gate: all 10 states covered ──
const allStates: RequestStatus[] = [
  'draft_intake', 'triage', 'assigned', 'in_progress',
  'pending_review', 'revision_required', 'approved',
  'delivered', 'closed', 'cancelled',
];

for (const state of allStates) {
  if (!(state in expectedTransitionsV2_3)) {
    throw new Error(`State ${state} missing from expected transitions map`);
  }
}

console.log(`✅ All workflow tests passed — ${allStates.length} states verified`);
