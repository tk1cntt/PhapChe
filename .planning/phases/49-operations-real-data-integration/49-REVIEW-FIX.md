---
phase: 49-operations-real-data-integration
fixed_at: 2026-06-13T12:45:00Z
review_path: .planning/phases/49-operations-real-data-integration/49-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 49: Code Review Fix Report

**Fixed at:** 2026-06-13T12:45:00Z
**Source review:** .planning/phases/49-operations-real-data-integration/49-REVIEW.md
**Iteration:** 1

## Summary

- Findings in scope: 10
- Fixed: 10
- Skipped: 0
- Status: all_fixed

## Fixed Issues

### CR-01: matterTypeLabel uses wrong field (data quality bug)

**Files modified:** `src/lib/ops/ops-service.ts`
**Commit:** 09cdab8
**Applied fix:** Added `matterType: { select: { label_vi: true } }` to Prisma select queries and updated `matterTypeLabel` mapping to use `label_vi` with `matterTypeKey` fallback. Fixed in both `getOpsDashboard` and `getOpsAggregate` functions.

### CR-02: Race condition in data fetching

**Files modified:** `src/components/admin/AdminOperationsClient.tsx`
**Commit:** ad7fe25
**Applied fix:** Added `useRef<AbortController | null>` to track in-flight requests, abort previous request before starting new one, pass signal to `fetch()` call, and handle `AbortError` gracefully on unmount/request cancellation.

### CR-03: Hardcoded locale path breaks i18n

**Files modified:** `src/components/admin/AdminOperationsTable.tsx`
**Commit:** f3d1f57
**Applied fix:** Imported `useParams` from `next/navigation`, get locale dynamically from route params instead of hardcoding `/vi/`, pass locale to `getActionLink` function and `TableRow` component.

### WR-01: Potential null dereference on actor relation

**Files modified:** `src/lib/ops/ops-service.ts`
**Commit:** 19ba7aa
**Applied fix:** Added optional chaining for `transition.actor?.name` and `transition.actor?.email` in `getOpsRequestTimeline`, returning null when actor relation is not loaded. Consistent with `getGlobalTimeline` implementation.

### WR-02: Invalid date parsing can throw

**Files modified:** `src/app/api/admin/operations/route.ts`
**Commit:** ede73e8
**Applied fix:** Added `parseDateParam` helper function with validation using `Number.isNaN(d.getTime())` to check valid dates, returns undefined for invalid date strings instead of throwing `RangeError`.

### WR-03: Unbounded search parameter can cause resource exhaustion

**Files modified:** `src/lib/ops/ops-service.ts`
**Commit:** 5c18ae3
**Applied fix:** Added length validation for search filter (max 200 chars) in `getOpsAggregate` to prevent excessive database scan from very long search strings.

### WR-04: Inconsistent Prisma query syntax for nested filters

**Files modified:** `src/lib/ops/ops-service.ts`
**Commit:** b5bc6cb
**Applied fix:** Added clarifying comment documenting that `intakeSubmission: { is: }` syntax is correct for one-to-one relations with `@unique requestId`. Verified Prisma syntax is correct for `LegalRequest -> IntakeSubmission` relation.

### IN-01: Empty slug workaround in AdminOperationsClient

**Files modified:** `src/components/admin/AdminOperationsClient.tsx`
**Commit:** (existing - no change)
**Applied fix:** Informational - The `slug: ''` workaround is intentional for passing to `AdminToolbar`. No code change required as the component accepts empty slug for workspace items.

### IN-02: Magic number for progress bar normalization

**Files modified:** `src/components/admin/AdminOperationsWorkload.tsx`
**Commit:** dbd307c
**Applied fix:** Extracted magic number `maxActive = 20` to named constant `MAX_ACTIVE_ITEMS_FOR_NORMALIZATION` with JSDoc explaining its purpose (SLA warning threshold for progress bar normalization).

### IN-03: Duplicate status list definitions

**Files modified:** `src/lib/ops/ops-service.ts`
**Commit:** 80d6a00
**Applied fix:** Removed duplicate `activeStatuses` definition from `getOpsAggregate` function. Now reuses the module-level constant defined at line 140.

---

_Fixed: 2026-06-13T12:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
