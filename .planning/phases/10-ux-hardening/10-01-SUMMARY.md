---
phase: 10
plan: 01
status: complete
completed_at: 2026-06-03
---

# Phase 10 Plan 01 — Summary

## What was built

### Task 1: Fix `listDocumentVersions` Prisma duplicate key [BLOCKER]
- Removed duplicate `document: { select: { id, title } }` block in `src/lib/documents/draft-service.ts` lines 209-211.
- Kept the richer nested `document: { include: { documentVersions: [...] } }` block.
- File: `src/lib/documents/draft-service.ts`

### Task 2: Regression test for `listDocumentVersions`
- New test in `src/lib/documents/draft-service.test.ts`: "listDocumentVersions returns version list with nested document.documentVersions (no Prisma throw)"
- Generates 2 drafts, then calls listDocumentVersions, asserts:
  - Returns array of 2 versions
  - Each version has `document` property
  - `document.documentVersions` is an array of 2 entries
- Test passes after Task 1 fix.

### Task 3: Customer download inline signed URL
- `src/app/customer/requests/[requestId]/page.tsx`:
  - Imports `requestVaultFileAccess` from `@/lib/documents/vault-service`
  - Pre-computes signed URLs in parallel via `Promise.all` before rendering
  - Falls back to bare `/api/vault/{id}/download` path on error (e.g. RBAC denial)
  - Each download link now uses the full signed URL returned by the service (single browser request, no redirect)
- TTL remains 15 minutes per Phase 06 CONTEXT D-08

### Task 4: Specialist deliver/close feedback via Badge
- `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx`:
  - `FeedbackMessage` now renders `<Badge tone="accent">` on success, `<Badge tone="destructive">` on failure
  - Replaces the previous `<p>` styled text with the existing admin Badge primitive
  - Vietnamese copy unchanged (delivered: "Đã đánh dấu hồ sơ là đã giao.", closed: "Đã đóng hồ sơ.", etc.)
- The `useActionState` wiring was already in place; only the rendering primitive changed.

## Commits
- `867b058` fix(10): remove duplicate document key in listDocumentVersions Prisma select
- `eaea43b` test(10): add regression test for listDocumentVersions nested select
- `54508ef` feat(10): inline signed URL in customer download link
- `860eb9a` feat(10): surface deliver/close feedback via Badge component

## Test Result
- 6/6 phase 08 review-service tests pass
- 6/6 phase 09 classification-service tests pass
- 7/9 phase 10 draft-service tests pass
  - 2 pre-existing failures in `submitForReview` tests due to `WorkflowTransition` foreign key constraint in cleanup (unrelated to this phase)

## Gaps Closed
- ✓ G-2 BLOCKER: `listDocumentVersions` Prisma duplicate `document` key bug fixed
- ✓ G-4 MEDIUM: customer download UX (inline signed URL, no redirect round-trip)
- ✓ G-5 MEDIUM: deliver/close feedback surfaced via Badge component

## Deviations from plan
- The specialist deliver/close feedback was already partially implemented (FeedbackMessage component existed). Changed the rendering primitive from styled `<p>` to `<Badge>` per UI-SPEC.
- The customer download uses pre-computed `Promise.all` of `requestVaultFileAccess` calls instead of inline `await` inside `.map()` (avoids `await` in non-async `.map()` callback TypeScript error).

## Out-of-scope (deferred to v2)
- Email provider real integration
- Delivery notification queue/worker
- Customer in-app notification center
- Pre-existing TypeScript errors in `src/app/admin/templates/` (out of scope per Simplicity First)
- Pre-existing cleanup issue in `submitForReview` tests (out of scope, related to Phase 04 docs)
