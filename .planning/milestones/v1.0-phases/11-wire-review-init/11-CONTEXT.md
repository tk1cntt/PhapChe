# Phase 11: Wire Review Init — Context

**Gathered:** 2026-06-04
**Status:** Ready for planning
**Source:** Gap closure from v1.0-MILESTONE-AUDIT.md G-6

<domain>
## Phase Boundary

Wire the existing `startReview` service function to the reviewer UI so reviewers can initialize a review session. This unblocks the entire `approved → delivered → closed` flow chain.

This is a **surgical gap closure** — the service layer (`src/lib/reviews/review-service.ts`) already has `startReview` implemented and tested. What's missing is the UI entry point: no server action calls it, no button triggers it.

</domain>

<decisions>
### Locked Decisions

1. **Review initialization must happen through `startReview`** from `review-service.ts` — the function exists (line 71), tested (6/6 e2e tests pass), and enforces RBAC + audit.
2. **Reviewer detail page must show "Bắt đầu duyệt" button** when no review exists for the document version — replaces the current dead-end message.
3. **Server action must use the same `'use server'` pattern** as existing reviewer actions (`approveReviewAction`/`rejectReviewAction`).
4. **On successful startReview, page must re-render** the review form in split-view so reviewer can immediately use the checklist.
5. **Audit event must fire** with safe metadata (reviewId, documentVersionId, no content/PII).

### Claude's Discretion
- Exact button placement on the detail page (inline heading area vs separate section)
- Re-rendering strategy (full page redirect vs client state update)
- Error handling and edge cases (concurrent startReview attempts)
- State management after init (review form auto-loads or requires page refresh)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing implementation
- `src/lib/reviews/review-service.ts` — `startReview` function (line 71-141), its signature and RBAC enforcement
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` — the page that needs the start button
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts` — existing server actions (approveReviewAction, rejectReviewAction)
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx` — existing client component

### Audit findings
- `.planning/v1.0-MILESTONE-AUDIT.md` — G-6: startReview never wired to UI (Flow B broken at step 4)
- `.planning/phases/08-reviewer-service/08-VERIFICATION.md` — Phase 08 verification showing all REV reqs satisfied except UI wiring

### State machine
- `src/lib/workflow/request-workflow.ts` — transitions from pending_review to in_review via workflow? Actually, startReview does NOT change request status; it only creates a Review record. Workflow transition needs review.

### UI patterns
- `src/app/admin/components/admin-shell.tsx` — admin nav pattern
- Existing component patterns in reviewer directory

</canonical_refs>

<specifics>
## Specific Ideas

The fix is a single server action + UI button:

1. **Add `startReviewAction`** to `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts`:
   - Input: `documentVersionId` (from route params)
   - Calls `startReview` from `review-service.ts`
   - Returns `{ reviewId, status }` on success

2. **Modify the reviewer detail page** to check if a review exists:
   - If NO review exists: render "Bắt đầu duyệt" button + message
   - If review exists: render the current review form (unchanged)

3. **Client-side transition**: After startReview succeeds, the page should transition to show the review form. Options:
   - A. Redirect to same page (simplest — page re-fetches, now sees review)
   - B. Client state toggle

</specifics>

<deferred>
## Deferred Ideas

None — this phase is a single surgical fix.

</deferred>

---

*Phase: 11-wire-review-init*
*Context gathered: 2026-06-04 via audit gap analysis*
