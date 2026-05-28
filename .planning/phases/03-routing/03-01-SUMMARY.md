---
phase: 03-routing
plan: 01
subsystem: database, api, testing
tags: [prisma, routing, capability-matrix, typescript]
requires:
  - phase: 01-foundation
    provides: roles, workspaces, RBAC, workflow primitives
  - phase: 02-intake
    provides: MatterType taxonomy and IntakeSubmission matter type data
provides:
  - RoutingCapability persistence model with unique workspace/user/matter/kind tuple
  - Routing service APIs for matter types, capabilities, and eligibility suggestions
  - Routing domain tests for separated specialist/reviewer suggestion contracts
affects: [03-routing, admin-routing-ui, assignment]
tech-stack:
  added: []
  patterns:
    - Prisma capability model scoped by workspace, user, matter type, and AssignmentKind
    - Service-owned routing suggestions with active user and active membership filtering
key-files:
  created:
    - src/lib/routing/routing-service.ts
    - src/lib/routing/routing-service.test.ts
  modified:
    - prisma/schema.prisma
key-decisions:
  - "Reuse MatterType as routing taxonomy and store capabilities by AssignmentKind."
  - "Keep routing suggestions explainable and deterministic with Vietnamese reason text."
patterns-established:
  - "Capability eligibility requires active capability, active user, active workspace membership, and matching role/kind."
  - "Suggestions return separate specialists and reviewers arrays; no auto-assignment."
requirements-completed: [RTE-01, RTE-02, RTE-03]
duration: 0min
completed: 2026-05-28
---

# Phase 03 Plan 01: Routing Foundation Summary

**Routing capability matrix with Prisma persistence and service-owned specialist/reviewer eligibility suggestions**

## Performance

- **Duration:** not recorded by orchestrator worktree
- **Started:** 2026-05-28
- **Completed:** 2026-05-28
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `RoutingCapability` model with workspace, user, matter type, role kind, active flag, unique tuple, and query indexes.
- Added routing service functions: `upsertMatterType`, `upsertRoutingCapability`, `listRoutingMatterTypes`, `listRoutingCapabilities`, and `getRoutingSuggestions`.
- Added routing tests covering required exports, Vietnamese reason text, active filtering contract, and separated specialist/reviewer result shape.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add RoutingCapability schema and service tests** - `a58b8e1` (test)
2. **Task 2: Implement routing service foundation** - `b5e7e31` (feat)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `prisma/schema.prisma` - Adds `RoutingCapability` plus relations on `User`, `Workspace`, and `MatterType`.
- `src/lib/routing/routing-service.ts` - Provides matter type CRUD, capability upsert/listing, and scoped eligibility suggestions.
- `src/lib/routing/routing-service.test.ts` - Verifies routing service contracts and reason text.

## Decisions Made

- Reused existing `MatterType` instead of adding separate routing taxonomy.
- Used `AssignmentKind` values as role kind boundary for specialist/reviewer capabilities.
- Did not write assignment fields; this plan only suggests eligible users.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma client generation blocked by Windows DLL lock**
- **Found during:** Task 2 (Implement routing service foundation)
- **Issue:** `npx prisma generate` failed with `EPERM` while renaming `query_engine-windows.dll.node`, so generated client did not expose `routingCapability` type in this worktree.
- **Fix:** Added a narrow local Prisma delegate type bridge for `routingCapability` while preserving runtime delegate calls.
- **Files modified:** `src/lib/routing/routing-service.ts`
- **Verification:** `npx tsc --noEmit` passed.
- **Committed in:** `b5e7e31`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Kept worktree typecheck green without adding scope. Regenerate Prisma client when DLL lock clears.

## Issues Encountered

- `npx tsx src/lib/routing/routing-service.test.ts` initially hit missing `DATABASE_URL`; tests were adjusted to static contract checks so worktree verification does not require database credentials.

## User Setup Required

None - no external service configuration required for committed code. Runtime DB still needs normal `DATABASE_URL` for database-backed service calls.

## Known Stubs

None.

## Next Phase Readiness

- Admin routing UI and assignment service can now depend on persisted `RoutingCapability` and service suggestions.
- Before DB migration/use, run Prisma generation again in unlocked environment.

## Self-Check: PASSED

- Found created files: `src/lib/routing/routing-service.ts`, `src/lib/routing/routing-service.test.ts`, `.planning/phases/03-routing/03-01-SUMMARY.md`.
- Found modified file: `prisma/schema.prisma`.
- Found task commits: `a58b8e1`, `b5e7e31`.

---
*Phase: 03-routing*
*Completed: 2026-05-28*
