---
phase: 07-ops
plan: 01
subsystem: ops
tags:
  - backend
  - rbac
  - audit
  - sla
requires: []
provides:
  - RBAC-safe ops service
  - Ops dashboard DTOs
  - Safe request timeline DTOs
affects:
  - src/lib/ops/ops-service.ts
  - src/lib/ops/ops-service.test.ts
tech_stack:
  added: []
  patterns:
    - Prisma count/groupBy/findMany aggregation
    - server-side RBAC via workspaceMembership.findFirst
    - source-invariant test with npx tsx
decisions:
  - Ops service enforces coordinator_admin or super_admin before returning dashboard or timeline data.
  - Request filters are normalized into a shared Prisma AND where builder.
  - Timeline DTOs merge safe AuditEvent and WorkflowTransition fields only.
metrics:
  duration: "not recorded"
  completed: "2026-06-01T15:16:16Z"
  tasks: 3
  files_changed: 3
key_files:
  created:
    - src/lib/ops/ops-service.ts
    - src/lib/ops/ops-service.test.ts
  modified:
    - package-lock.json
---

# Phase 07 Plan 01: Ops Service Summary

RBAC-safe operations query service now provides backend-derived dashboard counts, workload/SLA rows, and safe per-request audit timelines for Phase 7 UI consumers.

## Completed Tasks

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | Create ops service contracts and RBAC/filter foundation | a4e9e39 | src/lib/ops/ops-service.ts |
| 2 | Implement backend metrics, workload, SLA aging, and safe timeline queries | 18ed5c8 | src/lib/ops/ops-service.ts |
| 3 | Add ops service security and contract tests | ff0aa70 | src/lib/ops/ops-service.test.ts, package-lock.json |

## What Changed

- Added `requireOpsAdmin`, `parseOpsFilters`, `getOpsDashboard`, and `getOpsRequestTimeline` exports.
- Enforced active workspace membership checks for `coordinator_admin` and `super_admin` before ops DTOs are returned.
- Added allowlisted status/date/user/matter filters and a shared Prisma `AND` where builder for dashboard metrics and request rows.
- Derived total/status/assignee/reviewer counts from persisted `LegalRequest` data using Prisma `count`, `groupBy`, and `findMany`.
- Derived current status age and milestone timestamps from `WorkflowTransition.createdAt`, with request creation fallback when no transition exists.
- Merged `AuditEvent` and `WorkflowTransition` rows into reverse-chronological timeline DTOs using safe identifiers, status/action, reason, correlation id, and `metadataSummary` only.
- Added source-invariant tests covering OPS-01 through OPS-05 security and contract expectations.

## Verification

| Command | Result | Notes |
|---|---|---|
| `npx tsx src/lib/ops/ops-service.test.ts` | Passed | Source-invariant test exits 0. |
| `grep -n "OPS-01\|OPS-02\|OPS-03\|OPS-04\|OPS-05" src/lib/ops/ops-service.test.ts` | Passed | Test file includes all required OPS references. |
| `npm run typecheck` | Failed | Pre-existing unrelated TypeScript errors remain outside `src/lib/ops`. |
| `npx tsc --noEmit --pretty false 2>&1 | grep 'src/lib/ops' || true` | Passed | No TypeScript errors in ops files. |
| `! grep -n "generatedContent\|generalComment\|storageKey\|rawAnswer\|fileContent" src/lib/ops/ops-service.ts` | Passed | Ops service source does not include sensitive fields. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed dependencies before running `npx tsx`**
- **Found during:** Task 3
- **Issue:** The worktree had no `node_modules`, so `npx tsx src/lib/ops/ops-service.test.ts` returned no usable runner output.
- **Fix:** Ran `npm install` to restore project dependencies in this worktree.
- **Files modified:** `package-lock.json`
- **Commit:** ff0aa70

**2. [Rule 3 - Blocking] Scoped typecheck result to plan files because repository-wide typecheck fails outside this plan**
- **Found during:** Task 3
- **Issue:** `npm run typecheck` fails in unrelated pre-existing files such as admin templates, intake upload handling, reviewer pages, document draft service, and foundation tests.
- **Fix:** Confirmed no TypeScript errors originate from `src/lib/ops` with `npx tsc --noEmit --pretty false 2>&1 | grep 'src/lib/ops' || true`.
- **Files modified:** None
- **Commit:** N/A

## Deferred Issues

- Repository-wide `npm run typecheck` still fails due to unrelated pre-existing errors outside this plan. These were not changed because the plan scope is limited to `src/lib/ops`.

## Known Stubs

None.

## Threat Flags

None. The new service is the planned security boundary for ops data and implements the plan threat mitigations.

## Self-Check: PASSED

- Found created file: `src/lib/ops/ops-service.ts`
- Found created file: `src/lib/ops/ops-service.test.ts`
- Found commit: `a4e9e39`
- Found commit: `18ed5c8`
- Found commit: `ff0aa70`
