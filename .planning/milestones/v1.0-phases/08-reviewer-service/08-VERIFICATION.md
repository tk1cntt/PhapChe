---
phase: 08
slug: reviewer-service
status: passed
verified_at: 2026-06-03
---

# Phase 08 — Verification Report

## Goal

Build the missing reviewer service layer and split-view UI so REV-01..REV-09 are satisfied end-to-end and the `approved → delivered → closed` flow becomes reachable.

## Result: PASSED

All 9 REV requirements satisfied. Service layer + UI shipped with 6/6 e2e tests passing.

## Requirement Traceability

| REQ-ID | Status | Evidence |
|--------|--------|----------|
| REV-01 (reviewer queue) | ✓ | `src/app/reviewer/requests/page.tsx` queries `DocumentVersion` where `status = 'submitted_for_review'` filtered by `document.request.assignedReviewerId === session.userId`. Uses `templateVersion` (no broken `versionNumber`). |
| REV-02 (split view) | ✓ | `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` renders CSS grid `1fr / 420px` with document on left, QC-LEG-01 checklist on right. |
| REV-03 (template/spelling/entity) | ✓ | QC-LEG-01 group "Hình thức" (Formal) covers 3 items: cập nhật theo mẫu, chính tả, thông tin đối tượng khớp hồ sơ. |
| REV-04 (legal basis) | ✓ | QC-LEG-01 group "Nội dung pháp lý" (Legal Content) covers 4 items: cơ sở pháp lý, quyền nghĩa vụ rõ ràng, điều khoản rủi ro, phù hợp nhu cầu. |
| REV-05 (signature/confidentiality) | ✓ | QC-LEG-01 group "Vận hành" (Operational) covers 2 items: vùng ký, phân loại bảo mật. |
| REV-06 (approve only when required done) | ✓ | `approveReview` in `src/lib/reviews/review-service.ts:203` throws `CHECKLIST_NOT_COMPLETE` if any required item missing `passed: true`. All-or-nothing enforced in single `$transaction`. |
| REV-07 (revision with comment) | ✓ | `rejectReview` requires `generalComment.trim().length > 0` (line 272). Sets `Review.status = 'rejected'`, `decision = 'reject'`. |
| REV-08 (preserves rejected record) | ✓ | `rejectReview` does NOT delete the review; only updates `status`/`decision`/`completedAt`. The previous `ReviewChecklistAnswer[]` rows are preserved (no `deleteMany`). |
| REV-09 (final-ready + audit) | ✓ | `approveReview` sets `DocumentVersion.status = 'final'` (line 230) and calls `transitionRequestStatus(... 'approved')` in same `$transaction`. Emits `recordAuditEvent` with `reviewId`, `documentVersionId`, `decision = 'approve'`, checklist pass/fail counts. |

## Implementation Evidence

### Service layer (`src/lib/reviews/review-service.ts`)
- 4 exports: `startReview`, `answerChecklistItem`, `approveReview`, `rejectReview`
- All 4 server actions emit `recordAuditEvent` (lines 123, 171, 238, 313)
- All state transitions inside `prisma.$transaction`
- RBAC: `canAccessRequest` + assigned-reviewer check before any mutation

### Tests (`src/lib/reviews/review-service.test.ts`)
- 6/6 passing
- Coverage: happy approve, happy reject, CHECKLIST_NOT_COMPLETE, REJECT_COMMENT_REQUIRED, approve FORBIDDEN, reject FORBIDDEN
- Uses real Prisma dev DB with seed/cleanup pattern from `draft-service.test.ts`

### UI (`src/app/reviewer/...`)
- Queue page: 5-column table (Yêu cầu, Loại vụ việc, Chuyên viên, Phiên bản, Gửi lúc)
- Detail page: split-view CSS grid, real document content + real checklist answers
- `actions.ts`: `'use server'`, 6-error Vietnamese code map
- `review-form.tsx`: `'use client'`, `useActionState` pattern

## Files Modified

```
src/lib/reviews/checklist.ts (10 lines, new)
src/lib/reviews/review-service.ts (337 lines, new)
src/lib/reviews/review-service.test.ts (414 lines, new)
src/app/reviewer/requests/page.tsx (modified)
src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx (modified)
src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts (new)
src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx (new)
```

## Commits

```
b6f2707 feat(08-01): add checklist re-export and review-service test scaffold
84e2157 feat(08-01): implement reviewer service layer with 6 e2e tests
11e8e41 docs(08-01): complete reviewer-service plan
ac9c674 fix(08-02): correct reviewer queue Prisma traversal and add notice banner
4e7e53c feat(08-02): rebuild reviewer detail page with split-view and real data
2b4aad9 feat(08-02): build ReviewForm client component and approve/reject server actions
b2d9235 docs(08-02): complete reviewer-service plan
```

## Out-of-scope (deferred to v2)

- Dynamic checklist per template
- Inline document annotation
- Reviewer performance metrics
- Customer delivery UX (Phase 10)
- Folder/tag classification (Phase 09)

## Cross-Phase Integration

- `approved → delivered → closed` flow now reachable from reviewer portal (closes G-1 from `v1.0-MILESTONE-AUDIT.md`)
- Specialist sees rejected review (closes REV-08 traceability)
- Customer never sees internal review data (RBAC enforced at every layer)
