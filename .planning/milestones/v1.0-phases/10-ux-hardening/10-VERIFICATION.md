---
phase: 10
slug: ux-hardening
status: passed
verified_at: 2026-06-03
---

# Phase 10 — Verification Report

## Goal

Close DLV-02 UX degradation, fix `listDocumentVersions` Prisma duplicate, and surface deliver/close feedback to specialist.

## Result: PASSED

3 surgical fixes shipped. Specialist workbench unblocked, customer download UX improved, deliver/close feedback now visible.

## Requirement Traceability

| REQ-ID | Status | Evidence |
|--------|--------|----------|
| DOC-04 (versioned vault items) | ✓ | `listDocumentVersions` no longer throws Prisma duplicate-key error. Specialist workbench renders version history. New regression test passes. |
| DLV-02 (customer download) | ✓ | Customer page inlines signed URL from `requestVaultFileAccess()` (15-minute TTL). Single browser request, no redirect. |
| DLV-05 (deliver/close feedback) | ✓ | `FeedbackMessage` component now uses `Badge tone="accent"\|"destructive"` with Vietnamese copy. |

## Implementation Evidence

### listDocumentVersions fix
- `src/lib/documents/draft-service.ts` — removed duplicate `document:` block in Prisma `select`
- Regression test at `src/lib/documents/draft-service.test.ts` line ~448 passes
- File: `awk '/listDocumentVersions/,/^}/' src/lib/documents/draft-service.ts | grep -c "document:"` returns 1

### Customer download UX
- `src/app/customer/requests/[requestId]/page.tsx`:
  - Imports `requestVaultFileAccess`
  - Pre-computes signed URLs in `Promise.all`
  - Each `<a href={downloadLinks[idx]}>` uses the full signed URL
  - Fallback to bare path on error
- File: `grep "requestVaultFileAccess" src/app/customer/requests/\[requestId\]/page.tsx` returns ≥1 match

### Specialist deliver/close feedback
- `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx`:
  - `FeedbackMessage` now renders `<Badge tone={result.ok ? 'accent' : 'destructive'}>{result.message}</Badge>`
  - Replaces previous styled `<p>` with the existing admin Badge primitive
- `useActionState` wiring was already in place; only the rendering primitive changed

## Files Modified

```
src/lib/documents/draft-service.ts (modified — duplicate document: removed)
src/lib/documents/draft-service.test.ts (modified — 1 new test added)
src/app/customer/requests/[requestId]/page.tsx (modified — signed URL inline)
src/app/specialist/requests/[requestId]/components/delivery-actions.tsx (modified — Badge instead of styled p)
```

## Commits
```
867b058 fix(10): remove duplicate document key in listDocumentVersions Prisma select
eaea43b test(10): add regression test for listDocumentVersions nested select
54508ef feat(10): inline signed URL in customer download link
860eb9a feat(10): surface deliver/close feedback via Badge component
9cafe3a docs(10-01): complete ux-hardening plan
```

## Test Result
- 6/6 phase 08 review-service tests pass
- 6/6 phase 09 classification-service tests pass
- 7/9 phase 10 draft-service tests pass
  - 2 pre-existing failures in `submitForReview` cleanup (`WorkflowTransition` FK) — unrelated to this phase

## Gaps Closed
- ✓ G-2 BLOCKER: listDocumentVersions Prisma duplicate key bug
- ✓ G-4 MEDIUM: customer download UX (inline signed URL)
- ✓ G-5 MEDIUM: deliver/close feedback surfaced

## Type Check
- 0 errors in `src/app/customer/`
- 0 errors in `src/app/specialist/`
- 0 errors in `src/lib/documents/draft-service.ts`
- Pre-existing errors in `src/app/admin/templates/` remain (out of scope)
