---
phase: 01-foundation
plan: 03
subsystem: workflow
tags: [typescript, prisma, rbac, audit, workflow]
dependency_graph:
  requires:
    - phase: 01-01
      provides: Prisma schema and request status enum
    - phase: 01-02
      provides: RBAC and audit helper contracts
  provides:
    - Fixed backend request transition map
    - Request status transition executor
    - Workflow transition and audit persistence path
  affects:
    - intake
    - routing
    - review
    - delivery
tech_stack:
  added: []
  patterns:
    - Backend-owned fixed request state machine
    - Prisma transaction wraps status update, workflow row, and audit event
key_files:
  created:
    - src/lib/workflow/request-workflow.ts
    - src/lib/workflow/request-workflow.test.ts
    - src/lib/prisma.ts
    - src/lib/security/session.ts
    - src/lib/security/rbac.ts
    - src/lib/audit/audit.ts
  modified: []
decisions:
  - Created minimal RBAC, audit, and Prisma helper dependencies because parallel 01-02 outputs were not present in this worktree.
requirements-completed: [FND-05, FND-03]
metrics:
  duration: unknown
  completed_at: "2026-05-26T12:05:10Z"
  tasks_completed: 2
---

# Phase 01 Plan 03: Request Workflow Summary

## One-liner

Fixed backend request state machine with Prisma transaction status update, workflow history row, and audit event.

## Performance

- **Duration:** unknown
- **Started:** unknown
- **Completed:** 2026-05-26T12:05:10Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added `REQUEST_TRANSITIONS` covering every D-10 request status.
- Added `getAllowedTransitions(status)` returning a copied array.
- Added `transitionRequestStatus(input)` to validate access, role/assignment transition permission, allowed transition, then persist request status, workflow transition, and audit event in one Prisma transaction.

## Task Commits

1. **Task 1: Define request transition map and tests** - `1c5792b` (test), `d35f647` (feat)
2. **Task 2: Implement transition executor with workflow row and audit** - `7ce29e5` (feat), `2c15eeb` (fix), `52abe4a` (fix)

## Files Created/Modified

- `src/lib/workflow/request-workflow.ts` - Fixed request transition map, allowed transition helper, transition permission matrix, transactional status executor.
- `src/lib/workflow/request-workflow.test.ts` - Compile/runtime assertions for complete transition coverage and invalid draft-to-approved jump.
- `src/lib/prisma.ts` - Minimal Prisma singleton needed by workflow executor.
- `src/lib/security/session.ts` - Minimal app session role contract needed by workflow executor.
- `src/lib/security/rbac.ts` - Minimal `canAccessRequest` helper needed by workflow executor.
- `src/lib/audit/audit.ts` - Minimal append-only `recordAuditEvent` helper needed by workflow executor.

## Verification

- `npm run typecheck` passed.
- Acceptance grep checks passed for transition map, no workflow builder, transition executor, invalid transition error, workflow transition create, legal request update, audit action, RBAC checks, assignment fields, `recordAuditEvent(..., tx)`, and no `setStatus` function.

## Decisions Made

- Kept workflow map fixed, not configurable, matching D-02 deferred workflow-builder decision.
- Created only minimal 01-02 dependency surfaces needed by this plan because parallel worktree did not contain those files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added minimal missing RBAC, audit, Prisma, and session dependencies**
- **Found during:** Task 2
- **Issue:** This worktree lacked `src/lib/prisma.ts`, `src/lib/security/session.ts`, `src/lib/security/rbac.ts`, and `src/lib/audit/audit.ts`, but `transitionRequestStatus` depends on them.
- **Fix:** Added minimal versions of required helpers so workflow executor typechecks and enforces access/audit contract.
- **Files modified:** `src/lib/prisma.ts`, `src/lib/security/session.ts`, `src/lib/security/rbac.ts`, `src/lib/audit/audit.ts`
- **Verification:** `npm run typecheck` passed.
- **Commit:** `7ce29e5`

**2. [Rule 1 - Acceptance] Matched audit transaction grep contract**
- **Found during:** Final verification
- **Issue:** Implementation passed `tx` on next line, but acceptance check required `recordAuditEvent.*tx` on one line.
- **Fix:** Introduced `auditInput` and called `recordAuditEvent(auditInput, tx)`.
- **Files modified:** `src/lib/workflow/request-workflow.ts`
- **Verification:** Acceptance grep and `npm run typecheck` passed.
- **Commit:** `52abe4a`

**Total deviations:** 2 auto-fixed (1 blocking, 1 acceptance)
**Impact on plan:** Required for typecheck and plan acceptance. No workflow scope added.

## Auth Gates

None.

## Known Stubs

None found in files created or modified by this plan.

## Threat Flags

None beyond planned threat model surfaces. New workflow mutation path matches plan threat model.

## TDD Gate Compliance

- RED gate commit exists: `1c5792b`.
- GREEN gate commit exists after RED: `d35f647`.
- Task 2 used planned TDD context but required dependency creation due missing parallel 01-02 files.

## Self-Check: PASSED

Verified required files exist, task commits exist in git history, acceptance checks pass, and `npm run typecheck` passes.

---
*Phase: 01-foundation*
*Completed: 2026-05-26*
