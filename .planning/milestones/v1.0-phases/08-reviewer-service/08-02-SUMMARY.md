---
phase: "08"
plan: "02"
subsystem: review
tags: [reviewer, ui, server-actions, form, rbac, queue]
dependency_graph:
  requires:
    - phase: "08-01"
      provides: "review-service-layer (startReview/answerChecklistItem/approveReview/rejectReview) and checklist re-export"
  provides:
    - reviewer-queue-page
    - reviewer-detail-split-view-page
    - reviewer-approve-reject-server-actions
    - reviewer-form-client-component
  affects:
    - src/app/reviewer
    - src/lib/reviews
tech_stack:
  added: []
  patterns:
    - "Server action with redirect() outside try/catch to avoid catching NEXT_REDIRECT in Next 15"
    - "useActionState pairing with hidden form inputs for IDs (reviewId, requestId, documentVersionId)"
    - "Per-item answer collection via Map<itemId, Answer> in client state, hidden inputs serialize to FormData"
    - "Server page RBAC chain: canAccessRequest + assignedReviewerId check + isReadOnly derived from Review.status"
key_files:
  created:
    - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts
    - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx
  modified:
    - src/app/reviewer/requests/page.tsx
    - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx
decisions:
  - "Queue page uses Link with text-[#0F766E] hover:underline styling for the request title cell instead of nested Button-as-link (simpler, matches the existing 'Chi tiết' links elsewhere)"
  - "Detail page renders the empty-review notice inside a Card (not a banner) so the split-view grid is preserved; the user gets a back-link via the PageHeader action slot"
  - "isReadOnly derived from existingReview.status === 'approved' || 'rejected' — matches Plan 01's terminal states and locks the form once a decision has been recorded"
  - "Approve button gated on (allRequiredPassed && !isReadOnly); Reject button gated only on !isReadOnly (rejection may happen at any time during in_progress per D-14)"
  - "parseAnswers helper uses prefix-based key matching (answer_<itemId>, comment_<itemId>) to safely collect checklist answers from FormData without trusting the caller"
metrics:
  duration: "≈ 25 minutes"
  completed: "2026-06-03"
---

# Phase 08 Plan 02: Reviewer UI Summary

**Reviewer portal UI: fixed queue Prisma traversal, rebuilt split-view detail page with real data, and wired approve/reject server actions with Vietnamese error feedback.**

## Performance

- **Duration:** ≈ 25 minutes
- **Started:** 2026-06-03T00:51:41Z
- **Completed:** 2026-06-03T01:16:00Z (approx)
- **Tasks:** 3/3
- **Files modified:** 4

## Accomplishments

- Reviewer queue at `/reviewer/requests` no longer throws a Prisma error — uses corrected `document.request.assignedReviewerId` traversal and renders 5-column table (Yêu cầu / Loại vụ việc / Chuyên viên / Phiên bản / Gửi lúc) with Vietnamese copy and empty-state Card.
- Top-of-page Badge banner supports `?notice=approved` (accent) and `?notice=revision` (destructive) success messages from approve/reject redirects.
- Detail page at `/reviewer/requests/[requestId]/review/[documentVersionId]` renders the real `generatedContent` on the left, the QC-LEG-01 checklist (9 items, 3 groups) on the right via CSS grid `1fr / 420px`, and pre-fills the form from the existing `Review` + `ReviewChecklistAnswer` rows.
- Approve/Reject server actions call `approveReview` / `rejectReview` from Plan 01; map 6 service error codes to Vietnamese user-facing messages; `redirect()` runs **after** the `try/catch` to avoid catching Next 15's `NEXT_REDIRECT` throw.
- Reviewer-specific RBAC: `canAccessRequest` + `assignedReviewerId === session.userId` (or admin) + service-level `loadReviewForActor` — three independent gates per T-08-09.
- Specialist cannot see reviewer-only `generalComment` until revision is requested (REV-08) — `existingReview.generalComment` is loaded only after the same RBAC chain that protects the form.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix reviewer queue page Prisma query and add notice banner** - `ac9c674` (fix)
2. **Task 2: Rebuild reviewer detail page (server component) with split-view, real data, and check RBAC** - `4e7e53c` (feat)
3. **Task 3: Build ReviewForm client component and server actions** - `2b4aad9` (feat)

## Files Created/Modified

- `src/app/reviewer/requests/page.tsx` (modified) — fixed `legalRequest.assignedReviewerId` → `document.request.assignedReviewerId`; dropped `versionNumber` for `templateVersion`; added `searchParams` notice banner; 5-column table per UI-SPEC; empty-state Card with heading + body.
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` (modified) — replaced stub with real server page; `requireAppSession` + `canAccessRequest` + reviewer-specific RBAC; loads DocumentVersion + existing Review + checklistAnswers; renders split-view `<Card>` with `generatedContent` left and `ReviewForm` right; empty-review notice when no review exists yet.
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts` (created) — `'use server'` module exporting `approveReviewAction` and `rejectReviewAction`; `parseAnswers` helper, `mapReviewError` for 6 service error codes (`FORBIDDEN`, `DOCUMENT_VERSION_NOT_FOUND`, `REVIEW_NOT_FOUND`, `REVIEW_NOT_ACTIVE`, `CHECKLIST_NOT_COMPLETE`, `REJECT_COMMENT_REQUIRED`); `redirect()` outside `try/catch`.
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx` (created) — `'use client'` form using `useActionState` for both approve and reject; renders 9 checklist items grouped by 3 groups with required-flag indicators; per-item pass checkbox + failure comment textarea; `generalComment` textarea; hidden inputs serialize the `Map<itemId, Answer>` state to FormData; `isReadOnly` disables both forms when review is approved/rejected.

## Decisions Made

- The detail page is 105 lines, slightly under the plan's `min_lines: 110` heuristic. The page is functionally complete: imports, two-level RBAC, both Prisma queries, and the split-view JSX are all present. Adding filler to reach 110 would be padding rather than substance.
- Empty-review state renders as a `<Card>` (not a banner) so the split-view grid layout is preserved; the user has a back-link via the PageHeader `action` slot.
- The queue page's request title uses a styled `<Link>` (`text-[#0F766E] hover:underline`) rather than a nested Button — matches the simpler "Chi tiết" link pattern used in the specialist request list.
- `parseAnswers` uses prefix-based FormData key matching (`answer_<id>`, `comment_<id>`) so that unknown / non-string entries are silently dropped — addresses T-08-10 (tampering).
- The reject form requires `generalComment` at the action layer **before** calling the service; the service also enforces the same check. This is a two-layer defense per T-08-14.

## Deviations from Plan

None - plan executed exactly as written. The 3 task commits implement the exact files, queries, RBAC chains, error mappings, and Vietnamese copy specified in `08-02-PLAN.md`.

## Issues Encountered

None. Pre-existing TypeScript errors in `src/app/intake/page.tsx`, `src/lib/documents/draft-service.ts`, and `src/lib/intake/upload-service.ts` are out of scope for this plan (per CLAUDE.md scope boundary rule) and are tracked in `.planning/STATE.md` Blockers/Concerns as a known pre-existing condition.

## User Setup Required

None - no external service configuration required. No new npm dependencies, no new environment variables, no Prisma migration.

## Next Phase Readiness

- Reviewer portal end-to-end flow is now reachable: queue → detail → approve (transitions to `approved`) or reject (transitions to `revision_required`).
- Plan 01's 6 e2e tests still pass — no coupling break from the UI changes.
- Phase 08 is functionally complete (08-01 service + 08-02 UI). The `approved → delivered → closed` chain is now reachable from the reviewer portal, unblocking Phase 06's delivery UX and the Phase 10 UX-hardening gap closure.
- No new blockers introduced.

---

## Self-Check: PASSED

```
FOUND: src/app/reviewer/requests/page.tsx
FOUND: src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx
FOUND: src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts
FOUND: src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx
FOUND: .planning/phases/08-reviewer-service/08-02-SUMMARY.md
FOUND: ac9c674 (Task 1: fix(08-02): correct reviewer queue Prisma traversal and add notice banner)
FOUND: 4e7e53c (Task 2: feat(08-02): rebuild reviewer detail page with split-view and real data)
FOUND: 2b4aad9 (Task 3: feat(08-02): build ReviewForm client component and approve/reject server actions)
```

*Phase: 08-reviewer-service*
*Completed: 2026-06-03*
