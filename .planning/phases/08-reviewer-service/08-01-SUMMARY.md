---
phase: "08"
plan: "01"
subsystem: review
tags: [reviewer, service, transaction, audit, workflow]
dependency_graph:
  requires: []
  provides:
    - review-service-layer
    - checklist-re-export
  affects:
    - src/lib/reviews
tech_stack:
  added: []
  patterns:
    - "prisma.$transaction with recordAuditEvent(tx) — DocumentVersion update + Review update + audit atomic"
    - "transitionRequestStatus called outside $transaction (matches submitForReview pattern)"
    - "Inline hard-coded required-item mirror of QC-LEG-01 keeps service self-contained"
    - "node:test e2e against real Prisma dev DB with correlation-prefix seed/cleanup"
key_files:
  created:
    - src/lib/reviews/checklist.ts
    - src/lib/reviews/review-service.ts
    - src/lib/reviews/review-service.test.ts
  modified: []
decisions:
  - "checklist.ts re-exports CHECKLIST_ITEMS/CHECKLIST_GROUPS/GROUP_LABELS and derives ChecklistItemId type via `typeof ITEMS[number]['id']` (the source has no default export, so a named re-export + type derivation was used instead of `export type { default as ... }`)"
  - "Service hard-codes REQUIRED_ITEM_IDS inline (mirror of QC-LEG-01 required flags) rather than reading from CHECKLIST_ITEMS, to keep the approval gate explicit and decoupled from the constant list ordering"
  - "answerChecklistItem calls canAccessRequest as a secondary RBAC guard beyond loadReviewForActor — defense in depth per T-08-02"
  - "Added 6 tests instead of the 5 listed in <behavior>: split the FORBIDDEN case into separate approve and reject tests for clearer failure attribution"
metrics:
  duration: "≈ 55 minutes"
  completed: "2026-06-03"
---

# Phase 08 Plan 01: Reviewer Service Layer Summary

## One-liner

Server-side reviewer service exposing `startReview`, `answerChecklistItem`, `approveReview`, `rejectReview` with RBAC + `$transaction` + audit + workflow state-machine wiring; backed by 6 e2e tests against a real Prisma dev database.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Re-export QC-LEG-01 checklist constants + seed review-service test scaffold | b6f2707 | src/lib/reviews/checklist.ts, src/lib/reviews/review-service.test.ts |
| 2 | Implement review-service.ts (startReview, answerChecklistItem, approveReview, rejectReview) and wire tests | 84e2157 | src/lib/reviews/review-service.ts, src/lib/reviews/review-service.test.ts |

## Must-Haves Verification

| Truth | Status | Evidence |
|-------|--------|----------|
| Service exports startReview, answerChecklistItem, approveReview, rejectReview — all RBAC-gated and transactional | PASS | `grep -E "^export (async )?function" src/lib/reviews/review-service.ts` returns exactly the four names; each call wraps DocumentVersion/Review update + audit in `prisma.$transaction`; RBAC via `loadReviewForActor` re-checks `reviewerId === session.userId` AND `request.assignedReviewerId === session.userId` (with admin fallback). |
| approveReview sets DocumentVersion.status='final' and request.status='approved' in one $transaction; emits audit event with passedCount/failedCount metadata only | PASS | Test 1 asserts DocumentVersion.status='final', request.status='approved', audit metadata includes `passedCount=9; failedCount=0` and excludes `generatedContent` / checklist label substrings; WorkflowTransition row from 'pending_review' to 'approved' is created. |
| rejectReview sets DocumentVersion.status='draft' and request.status='revision_required' while preserving the Review row and checklist answers (REV-08) | PASS | Test 2 asserts DocumentVersion.status='draft', request.status='revision_required', Review.status='rejected', Review.decision='reject', completedAt set, generalComment persisted, and pre-seeded `ReviewChecklistAnswer` row still present. |
| approveReview rejects when any required checklist item is not passed (CHECKLIST_NOT_COMPLETE) | PASS | Test 3 calls `approveReview` with one required item marked `passed: false`; assert.rejects matches `/CHECKLIST_NOT_COMPLETE/`; post-state shows no DocumentVersion/Request/Review status changes and no `review.approved` audit event. |
| src/lib/reviews/checklist.ts re-exports CHECKLIST_ITEMS, GROUP_LABELS, CHECKLIST_GROUPS from src/constants/checklist-items.ts so service and form code import from one place | PASS | `grep -E "export (\*|\{)" src/lib/reviews/checklist.ts` shows the three named re-exports plus a derived `ChecklistItemId` type. |
| node:test coverage for approve happy-path and reject happy-path against a real (dev/test) Prisma database | PASS | All 6 e2e tests pass via `node --test --import tsx`; each test seeds a unique workspace/request/document/documentVersion/review scoped by `review_service_e2e_${suffix}` and cleans up in FK-safe order. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @esbuild/linux-x64 binary**
- **Found during:** Task 1 verification
- **Issue:** `node --test --import tsx` failed with `You installed esbuild for another platform than the one you're currently using` — `node_modules/@esbuild/win32-x64` was present but the WSL2 host needs `linux-x64`.
- **Fix:** Ran `npm install --no-save @esbuild/linux-x64`; this is a pre-existing environment issue, not specific to this plan (the same failure repros on `src/lib/documents/draft-service.test.ts`).
- **Files modified:** `node_modules/` (out-of-tree, not committed)
- **Commit:** n/a (no source change)

**2. [Rule 3 - Blocking] Regenerated Prisma client for linux runtime**
- **Found during:** Task 1 verification (after esbuild fix)
- **Issue:** `prisma.workspace.create()` failed with `Prisma Client could not locate the Query Engine for runtime "debian-openssl-3.0.x"` — client was generated for windows.
- **Fix:** Ran `npx prisma generate` to regenerate for the current platform.
- **Files modified:** `node_modules/@prisma/client/`
- **Commit:** n/a (no source change)

**3. [Rule 1 - Bug] Adjusted checklist.ts type re-export syntax**
- **Found during:** Task 1 implementation
- **Issue:** Plan suggested `export type { default as ChecklistItemId } from '@/constants/checklist-items'`, but `@/constants/checklist-items` has no default export.
- **Fix:** Replaced with `import { CHECKLIST_ITEMS as ITEMS } from '@/constants/checklist-items'; export type ChecklistItemId = typeof ITEMS[number]['id'];` — plan explicitly listed this as the fallback shape.
- **Files modified:** `src/lib/reviews/checklist.ts`
- **Commit:** b6f2707

### Plan Additions

**Added 6th test for reject FORBIDDEN (not in plan's 5-test list)**
- The plan's `<behavior>` block listed 5 tests covering FORBIDDEN only for the approve path. Symmetric coverage for the reject path was added so both code paths have explicit non-assigned-reviewer regression coverage. Total: 6 tests, all passing.

## Test Results

```
# tests 6
# pass 6
# fail 0
# suites 0
# duration_ms 10101
```

Test cases:
1. `approveReview sets DocumentVersion.final + request.approved + audit + workflow`
2. `rejectReview sets DocumentVersion.draft + request.revision_required + preserves answers`
3. `approveReview rejects when any required item is not passed`
4. `rejectReview rejects when generalComment is empty`
5. `approveReview rejects when caller is not the assigned reviewer`
6. `rejectReview rejects when caller is not the assigned reviewer`

## Verification Commands Run

```bash
# Plan-specified verification
node --test --import tsx src/lib/reviews/review-service.test.ts  # 6/6 pass

# Per-task done checks
grep -E "export (\*|\{)" src/lib/reviews/checklist.ts                   # 3 named re-exports + ChecklistItemId
grep -E "^export (async )?function" src/lib/reviews/review-service.ts   # exactly 4 functions
grep -nE "transitionRequestStatus" src/lib/reviews/review-service.ts    # 2 calls (approve + reject)
grep -nE "legalRequest.assignedReviewerId" src/lib/reviews/review-service.ts  # no matches
npx tsc --noEmit | grep "src/lib/reviews"                               # 0 errors
```

## Known Stubs

None. The service is fully implemented; no `TODO` / `FIXME` / placeholder values.

## Threat Flags

None. All four trust boundaries from `<threat_model>` are mitigated by the new code (T-08-01 through T-08-08 are addressed via `loadReviewForActor`, `canAccessRequest` secondary check, transactional audit, and hard-coded required-item validation).

## Self-Check: PASSED

```
FOUND: src/lib/reviews/checklist.ts
FOUND: src/lib/reviews/review-service.ts
FOUND: src/lib/reviews/review-service.test.ts
FOUND: b6f2707
FOUND: 84e2157
```
