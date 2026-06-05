---
phase: 11-wire-review-init
plan: 01
completed_at: '2026-06-04T14:50:00Z'
total_tasks: 2
commits:
  - ba5b3e5 - feat(11-01): add startReviewAction server action with error mapping
  - 6391932 - feat(11-01): create StartReviewButton component and wire into review detail page
  - 76f630a - fix(11-01): wrap startReviewAction for useActionState compatibility
---

# Summary: Wire startReview to reviewer detail page UI

## Objective

Wire `startReview` from the existing review-service layer to the reviewer detail page UI, so reviewers can initialize a review session. This unblocks the `approved -> delivered -> closed` flow chain.

## Tasks Executed

1. **Add startReviewAction to actions.ts** — Added `startReview` import from `@/lib/reviews/review-service`, `INVALID_DOCUMENT_VERSION_STATUS` error case in `mapReviewError` returning Vietnamese message, and `startReviewAction` server action following the existing `approveReviewAction`/`rejectReviewAction` pattern.

2. **Create StartReviewButton component and wire into page.tsx** — Created `start-review-button.tsx` client component with `useActionState` binding to `startReviewAction`, "Bat dau duyet" button, and Vietnamese error display. Updated `page.tsx` to render `StartReviewButton` in the else branch (when no existing review) instead of the old dead-end Card. Fixed `useActionState` signature compatibility via async wrapper.

## Key Design Decisions (per CONTEXT.md)

- D-01: Uses `startReview` from `review-service.ts` — no reimplementation
- D-02: Button text is "Bat dau duyet" (Vietnamese)
- D-03: Uses `'use server'` pattern (file already had directive)
- D-04: On success, redirects to same page — server re-render picks up new Review and shows ReviewForm
- D-05: Audit event handled by `startReview` internally — no extra audit code needed

## Files Created/Modified

| File | Action |
|------|--------|
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts` | Modified — added import, error case, and `startReviewAction` |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/start-review-button.tsx` | Created — `StartReviewButton` client component |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` | Modified — import and render `StartReviewButton` |

## Self-Check: PASSED

- [x] `startReviewAction` exported from actions.ts, imports `startReview` from `@/lib/reviews/review-service`
- [x] `INVALID_DOCUMENT_VERSION_STATUS` error case added with Vietnamese message
- [x] `StartReviewButton` renders "Bat dau duyet" button with `useActionState` binding
- [x] `page.tsx` conditionally renders `StartReviewButton` when no review exists
- [x] Old dead-end "Phien duyet chua duoc khoi tao..." Card removed from page.tsx
- [x] `npm run typecheck` — no new errors (only pre-existing errors in `/admin/templates/` and other modules)
