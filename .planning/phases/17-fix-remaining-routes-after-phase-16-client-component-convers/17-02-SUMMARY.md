---
phase: "17"
plan: "02"
subsystem: validation-harness
tags:
  - prisma
  - validation
  - fixtures
  - testing
dependency_graph:
  requires:
    - "16-fix-14-failed-routes-discovered-by-validated-screenshot-capt"
  provides:
    - "Real ID resolution for dynamic route validation"
tech_stack:
  added:
    - Prisma fallback queries
  patterns:
    - Dual-pass query with workspace-scoped then global fallback
key_files:
  created:
    - ".planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/phase-17-validation-results.json"
  modified:
    - ".planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs"
decisions:
  - id: "17-02-d1"
    decision: "Use fallback queries instead of failing when workspace-scoped results are null"
    rationale: "Database workspace IDs from seed data may differ from demo-legal-workspace, but requests/templates still exist in other workspaces"
    outcome: "Validation harness now resolves real IDs from any workspace, enabling dynamic route testing"
metrics:
  duration: "2026-06-07"
  completed: "2026-06-07"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
  commits: 2
---

# Phase 17 Plan 02: Fix Validation Harness Prisma Queries

## One-liner

Validation harness now queries real seeded IDs from Prisma with workspace-scoped fallback, resolving placeholder IDs for dynamic route validation.

## What Was Done

### Task 1: Fix validation harness Prisma queries for real IDs

**Problem:** The `loadFixtures()` function in `validate-phase-16-routes.cjs` used workspace-scoped Prisma queries that returned null because seed data's workspace IDs differ from the demo-legal-workspace slug used in the harness.

**Solution:** Added dual-pass queries with fallback:
- `legalRequest`: Try workspace-scoped first, then query any request regardless of workspace
- `documentTemplate`: Try workspace-scoped first, then query any template
- `documentVersion`: Try `submitted_for_review` status first, then any document version

**Changes to `validate-phase-16-routes.cjs`:**
- Added console.log debug statements during fixture loading
- Added fallback queries with debug logging when primary queries return null
- Added validation failure if `requestId` or `templateId` remain placeholder (fail-fast)
- Renamed output to `phase-17-validation-results.json`

**Result:** Fixtures now resolve real IDs:
```json
{
  "requestId": "cmpzpib1600054w8nvb60s3h2",
  "templateId": "cmpxfugxq00314wf2m6w54rfz",
  "documentVersionId": "cmpzpib2c00094w8nyw37n7nf",
  "reviewRequestId": "cmpzpib1600054w8nvb60s3h2"
}
```

### Task 2: Verify fixture resolution works with seeded data

**Verification:** Confirmed database has adequate seed data:
- `legalRequest`: 19 records (statuses include `pending_review`, `in_progress`, etc.)
- `documentTemplate`: 16 records (includes "Hợp đồng lao động v2.0")
- `documentVersion`: 1 record (status: `submitted_for_review`)

No additional seed data needed - existing data is sufficient for validation.

## Validation Results

Running `validate-phase-16-routes.cjs --group dynamic`:
- **Pass:** 9 routes
- **Fail:** 5 routes
- Output: `phase-17-validation-results.json`

The harness now uses real IDs instead of placeholder values, enabling dynamic route validation to resolve to actual pages.

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Message |
|------|------|---------|
| `4594362` | fix | make validation harness Prisma queries more robust with fallbacks |
| `c0a9d64` | feat | capture phase 17 validation results with real IDs |

## Self-Check: PASSED

- [x] `phase-17-validation-results.json` exists with real IDs
- [x] Commits `4594362` and `c0a9d64` exist in git log
- [x] Fixtures show real Prisma IDs (starting with `cmp`, `cmpx`), not placeholders
- [x] Console logs show fallback queries working correctly
