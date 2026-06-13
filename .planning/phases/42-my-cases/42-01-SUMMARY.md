---
phase: "42"
plan: "01"
subsystem: customer-cases
tags: [prisma, real-data, search, filter, url-state]
dependency_graph:
  requires: []
  provides:
    - My Cases page connected to real Prisma queries
    - URL state sync with debounced search
    - Integration tests for filter logic
  affects:
    - src/legacy/[locale]/[workspaceSlug]/cases/page.tsx
    - src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx
tech_stack:
  added:
    - next/navigation (useSearchParams, useRouter, usePathname)
  patterns:
    - Server Component data fetching
    - Client Component URL state management
    - Debounced URL updates
key_files:
  created:
    - tests/my-cases/my-cases-stats.test.tsx
    - tests/my-cases/my-cases-client.test.tsx
    - tests/my-cases/my-cases-integration.spec.tsx
  modified:
    - src/legacy/[locale]/[workspaceSlug]/cases/page.tsx
    - src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx
decisions:
  - id: D-42-01
    description: "Use client-side filtering with useMemo instead of server-side per keystroke"
    rationale: "Performance optimization - avoid DB query on every character typed"
  - id: D-42-02
    description: "Status badge mapping: isOverdue check comes FIRST before other status mappings"
    rationale: "Overdue is a calculated field based on SLA deadline, not a stored status"
  - id: D-42-03
    description: "Overdue stat uses raw SQL query with $queryRaw for deadline comparison"
    rationale: "Prisma's where clause doesn't support date comparisons easily"
---

# Phase 42 Plan 01: My Cases Real Data Connection

**Completed:** 2026-06-13

## One-liner

Connect My Cases page to real Prisma queries with correct status mappings, SLA calculation, and URL state sync.

## Summary

Successfully connected the My Cases page to real database queries. The page now displays real counts from Prisma, includes MatterType labels from intakeSubmission relationships, and features debounced URL state sync for search and filter functionality.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Fix Prisma queries in page.tsx | 9a4d11b | DONE |
| 2 | Add debounce and URL state sync | b50bc5f | DONE |
| 3 | Add integration tests | 036477f | DONE |

## Changes Made

### Task 1: Fix Prisma queries in page.tsx (9a4d11b)

**Stats aggregation fixed:**
- Processing = `in_progress` + `pending_review` + `triage` + `assigned`
- Completed = `approved` + `delivered` + `closed`
- Overdue = `slaDeadline < NOW() AND status NOT IN (approved, delivered, closed, cancelled)`

**SLA calculation fixed:**
- Now uses `slaDeadline` field instead of `createdAt + 7 days`

**MatterType labels added:**
- Query includes `intakeSubmission.matterType.label_vi/en`

**Status badge mapping fixed:**
- `isOverdue` check comes FIRST (before other status checks)
- `delivered` and `closed` map to `approved` badge

### Task 2: Add debounce and URL state sync (b50bc5f)

**URL state management:**
- `useSearchParams` initializes state from URL
- `useRouter` and `usePathname` update URL on filter changes
- 300ms debounce prevents excessive URL updates

**Fixed import paths:**
- Changed `@/app/[locale]/customer/components/*` to `@/legacy/[locale]/customer/components/*`

### Task 3: Add integration tests (036477f)

**Created test files:**
1. `tests/my-cases/my-cases-stats.test.tsx` - 14 tests for stats calculation logic
2. `tests/my-cases/my-cases-client.test.tsx` - 7 tests for URL state sync logic
3. `tests/my-cases/my-cases-integration.spec.tsx` - 18 tests for filter logic

## Test Results

```
Test Files  3 passed
Tests       39 passed
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed status badge mapping logic**
- **Found during:** Task 1 implementation
- **Issue:** Original code had `isOverdue` check AFTER status mappings, which meant overdue requests with `in_progress` status showed "review" badge instead of "overdue"
- **Fix:** Moved `isOverdue` check to first position in statusBadge logic
- **Files modified:** `src/legacy/[locale]/[workspaceSlug]/cases/page.tsx`
- **Commit:** 9a4d11b

**2. [Rule 1 - Bug] Fixed MatterType relation query**
- **Found during:** Task 1 implementation
- **Issue:** MatterType relation was not properly included in Prisma query
- **Fix:** Added `intakeSubmission` include with nested `matterType` select
- **Files modified:** `src/legacy/[locale]/[workspaceSlug]/cases/page.tsx`
- **Commit:** 9a4d11b

**3. [Rule 1 - Bug] Fixed import paths in MyCasesClient**
- **Found during:** Task 2 implementation
- **Issue:** Import paths used `@/app/[locale]/customer/components/*` which didn't exist
- **Fix:** Changed to correct paths `@/legacy/[locale]/customer/components/*`
- **Files modified:** `src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx`
- **Commit:** b50bc5f

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| none | page.tsx | Prisma queries are workspace-scoped (workspaceId filter) |
| none | MyCasesClient.tsx | Search/filter is client-side only, no SQL injection risk |

## Requirements Met

| ID | Requirement | Status |
|----|-------------|--------|
| CUST-CASES-01 | Summary banner displays | DONE |
| CUST-CASES-02 | 4 stat cards with real counts | DONE |
| CUST-CASES-03 | Toolbar with search/filters | DONE |
| CUST-CASES-04 | Requests table with 7 columns | DONE |
| CUST-CASES-05 | Table displays real data | DONE |

## Commits Summary

| Hash | Message |
|------|---------|
| 537e1ba | test(42): add failing test for MyCases stats calculation |
| d333653 | fix(42): correct status badge mapping test logic |
| 9a4d11b | feat(42): fix Prisma queries in MyCases page |
| 25f6d10 | test(42): add failing test for MyCasesClient URL state sync |
| b50bc5f | feat(42): add URL state sync and debounce to MyCasesClient |
| 036477f | test(42): add integration tests for MyCases filter logic |

## Self-Check

- [x] Created files exist
- [x] Commits exist in git log
- [x] Tests pass
- [x] No breaking changes to existing functionality
