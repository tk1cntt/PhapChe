---
phase: 11-wire-review-init
verified: 2026-06-04T18:30:00Z
status: human_needed
score: 6/6 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Reviewer opens detail page for a document version with no review"
    expected: "Sees 'Bat dau duyet' button (not the old dead-end Card)"
    why_human: "Visual UI rendering — can't verify in static analysis"
  - test: "Clicking 'Bat dau duyet' creates a Review and the page re-renders ReviewForm"
    expected: "After clicking, the page shows split-view with document content left and QC checklist right"
    why_human: "Requires running app; dependent on auth session, Prisma, and redirect behavior"
  - test: "Error display renders correctly on failure (e.g., document version not in submitted_for_review status)"
    expected: "Vietnamese error message in red text below the button"
    why_human: "Visual formatting — can't verify exact rendering programmatically"
  - test: "Audit event appears after clicking 'Bat dau duyet'"
    expected: "review.started event visible in /admin/audit with docVersionId, reviewId, reviewerId metadata"
    why_human: "Requires running app and checking audit log"
  - test: "Approve/Reject actions work after starting a review"
    expected: "Flow: startReview -> approve/reject -> final-ready or revision_required"
    why_human: "End-to-end flow test requiring running app, seeded data, and session"
---

# Phase 11: wire-review-init Verification Report

**Phase Goal:** Wire `startReview` to reviewer UI so reviewer can initialize a review session, unblocking the `approved -> delivered -> closed` flow.
**Verified:** 2026-06-04T18:30:00Z
**Status:** human_needed
**Re-verification:** No (initial verification)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Reviewer detail page shows "Bat dau duyet" button when no review exists for the document version | VERIFIED | `page.tsx:97` renders `<StartReviewButton>` in the `else` branch (when `!existingReview`). Component renders `"Bat dau duyet"` button text. Old dead-end Card no longer present (no matches for old message in page.tsx). |
| 2 | Clicking the button calls `startReview` from `review-service.ts` via a server action | VERIFIED | `start-review-button.tsx:16-21` uses `useActionState()` calling `startReviewAction`. `actions.ts:6` imports `startReview` from `review-service`. `actions.ts:103` calls `await startReview({ session, documentVersionId })`. |
| 3 | On success, the page re-renders the ReviewForm in split-view | VERIFIED | `actions.ts:104-110` calls `revalidatePath` then `redirect` to the same page. On re-render, `page.tsx:55-63` finds `existingReview` from Prisma and `page.tsx:83-95` renders `<ReviewForm>`. |
| 4 | Invalid document version status shows a Vietnamese error message on the same page | VERIFIED | `actions.ts:39-40` returns `{ ok: false, message: 'Phien ban tai lieu khong o trang thai cho duyet.' }`. `start-review-button.tsx:33-35` renders error text in red when `state.ok === false`. |
| 5 | All review actions (approve/reject) now work end-to-end because `reviewId` is available | VERIFIED | `approveReviewAction` (line 57) and `rejectReviewAction` (line 74) are pre-existing from Phase 08. They require `reviewId` from FormData. `startReview` creates the Review record (review-service.ts:111-121), providing the `reviewId`. The flow chain is now unblocked at code level. |
| 6 | `startReview` audit event fires with safe metadata (docVersionId, reviewId, reviewerId) | VERIFIED | `review-service.ts:123-135` emits `recordAuditEvent` with `action='review.started'`, metadataSummary=`docVersionId=${documentVersionId}; reviewId=${review.id}; reviewerId=${session.userId}`. No PII or legal content. Executed inside `prisma.$transaction`. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts` | startReviewAction server action + INVALID_DOCUMENT_VERSION_STATUS error map entry | VERIFIED | `startReviewAction` exported at line 95, imports `startReview` from `review-service` at line 6, error case at line 39. All acceptance criteria met. |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/start-review-button.tsx` | Client component with "Bat dau duyet" button + useActionState error handling (min 30 lines) | VERIFIED | 38 lines, `'use client'` directive, `useActionState` binding via async wrapper, Button with "Bat dau duyet" text, error display in red. |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` | Conditional render: StartReviewButton or ReviewForm based on existingReview | VERIFIED | Imports `StartReviewButton` at line 8, renders it in else branch at line 97. Old dead-end Card removed. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `start-review-button.tsx` | `actions.ts::startReviewAction` | `useActionState(formAction)` | VERIFIED | `start-review-button.tsx:5` imports `startReviewAction`. `start-review-button.tsx:16-18` calls it via `useActionState(async wrapper -> startReviewAction(formData))`. |
| `actions.ts::startReviewAction` | `review-service.ts::startReview` | import + call | VERIFIED | `actions.ts:6` imports `startReview` from `@/lib/reviews/review-service`. `actions.ts:103` calls `await startReview({ session, documentVersionId })`. |
| `page.tsx` | `start-review-button.tsx` | import + conditional render | VERIFIED | `page.tsx:8` imports `StartReviewButton`. `page.tsx:97` renders `<StartReviewButton requestId={...} documentVersionId={...} />`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `start-review-button.tsx` | `state` (ReviewerActionResult) | `startReviewAction` -> `startReview` in review-service.ts | YES — real Prisma transaction with DB lookup, validation, create/update | FLOWING |
| `page.tsx` | `existingReview` | `prisma.review.findFirst` query at line 55-63 | YES — real Prisma query filtering by `documentVersionId` and `reviewerId` | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Typecheck passes with no new errors | `npm run typecheck` | No new errors in Phase 11 files. Pre-existing errors in other modules unchanged. | PASS |
| Git commits match SUMMARY claims | `git log --oneline` | 3 commits found: `ba5b3e5`, `6391932`, `76f630a` matching SUMMARY | PASS |
| Verify action import | grep startReview import in actions.ts | Line 6: `import { ... startReview } from '@/lib/reviews/review-service'` | PASS |
| Verify error mapping | grep INVALID_DOCUMENT_VERSION_STATUS | Line 39: `case 'INVALID_DOCUMENT_VERSION_STATUS':` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| REV-02 | 11-01-PLAN | Reviewer can review split view: draft left, QC checklist right | SATISFIED | `startReview` wiring unblocks split-view rendering. Service layer verified in Phase 08. Page renders document content left + ReviewForm right. |
| REV-06 | 11-01-PLAN | Reviewer can approve only after completing required checklist items | SATISFIED | `approveReviewAction` and `CHECKLIST_NOT_COMPLETE` error case exist (Phase 08). `reviewId` now available via `startReview` UI entry point. |
| REV-07 | 11-01-PLAN | Reviewer can request revision with failed checklist items and comments | SATISFIED | `rejectReviewAction` exists (Phase 08). `reviewId` now available via `startReview`. |
| REV-08 | 11-01-PLAN | System returns rejected documents to specialist and preserves comments | SATISFIED | `rejectReview` sets `DocumentVersion.status='draft'` and preserves review record (Phase 08). `reviewId` now available. |
| REV-09 | 11-01-PLAN | System marks approved version as final-ready and audits decision | SATISFIED | `approveReview` sets `DocumentVersion.status='final'` with audit event (Phase 08). `reviewId` now available. |

**Note:** Requirements REV-02 through REV-09 were primarily implemented in Phase 08 (reviewer-service). Phase 11 closes the gap by wiring `startReview` to the UI, making the `reviewId` accessible for approve/reject actions. The traceability table in REQUIREMENTS.md should be updated to reflect these as Complete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `actions.ts` | 40 | Vietnamese error message missing diacritics: `'Phien ban tai lieu khong o trang thai cho duyet.'` | Info | Professionalism/readability. Also lines 98-99: `'Thieu ma phien ban tai lieu.'`, `'Thieu ma yeu cau.'`. Identified in 11-REVIEW.md IN-03. |

**No stub patterns found.** No TODOs, FIXMEs, HACKs, `console.log`, `return null`, or empty implementations in Phase 11 files.

### Human Verification Required

The following items require manual testing with a running application:

#### 1. Visual: "Bat dau duyet" button appearance

**Test:** Open the reviewer detail page for a document version that has no existing review.
**Expected:** The page shows a "Bat dau duyet" button inside a Card with the text "Phien duyet chua duoc khoi tao. Nhan 'Bat dau duyet' de bat dau phien duyet tai lieu nay." The old dead-end message should not appear.
**Why human:** Visual rendering can't be confirmed via static analysis.

#### 2. Flow: StartReview -> ReviewForm transition

**Test:** Click "Bat dau duyet" button.
**Expected:** Page redirects/re-renders showing the split-view: document content on the left pane, ReviewForm with QC-LEG-01 checklist on the right pane.
**Why human:** Requires running app with valid auth session, database, and a document version in `submitted_for_review` status.

#### 3. Error handling display

**Test:** Open a document version that isn't in `submitted_for_review` status, click "Bat dau duyet".
**Expected:** A red error message appears below the button: "Phien ban tai lieu khong o trang thai cho duyet." (or "Phiên bản tài liệu không ở trạng thái chờ duyệt." if diacritics are fixed).
**Why human:** Error rendering and positioning need visual confirmation.

#### 4. Audit event verification

**Test:** After starting a review, check `/admin/audit` for the event.
**Expected:** A `review.started` audit event appears with metadata containing `docVersionId`, `reviewId`, and `reviewerId`.
**Why human:** Requires running app and checking the audit log page.

#### 5. End-to-end flow: startReview -> approve/reject

**Test:** After starting a review, fill the checklist and click "Duyệt" (approve).
**Expected:** Document version becomes `final`, request transitions to `approved`, audit events fire. Alternatively, reject returns document to `draft` status and request to `revision_required`.
**Why human:** Full workflow requires running app, seeded data, and authenticated session.

### Gaps Summary

No gaps found. All 6 must-have truths are verified programmatically. Network effect: Phase 11 also unblocks REV-02, REV-06, REV-07, REV-08, REV-09 which were pending in REQUIREMENTS.md due to the missing startReview UI wiring.

**Note on review findings (11-REVIEW.md):**
- WR-01 (missing requestId/documentVersionId validation in approve/reject actions): This affects pre-existing Phase 08 code, not Phase 11 deliverables. Not a gap for this phase.
- IN-01 (unused Prisma selections in page.tsx): Pre-existing, not introduced by Phase 11 changes. Not a gap.
- IN-02 (fragile error code matching): Pre-existing pattern. Not a gap.
- IN-03 (missing Vietnamese diacritics in 3 messages): This is Phase 11 code. Not a blocker — messages are functional Vietnamese, lack of diacritics is a quality concern. If desired, a follow-up fix can add diacritics.

---

_Verified: 2026-06-04T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
