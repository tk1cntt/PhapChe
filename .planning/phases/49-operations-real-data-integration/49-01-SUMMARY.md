---
phase: "49"
plan: "01"
subsystem: "admin-operations"
tags:
  - "admin"
  - "operations"
  - "sla"
  - "real-data"
  - "prisma"
dependency_graph:
  requires:
    - "ADMIN-OPS-REAL-01"
    - "ADMIN-OPS-REAL-02"
    - "ADMIN-OPS-REAL-03"
    - "ADMIN-OPS-REAL-04"
  provides:
    - "ops-service:OpsAggregateDto"
    - "ops-service:calcOpsSla"
    - "ops-service:getOpsAggregate"
    - "api:/api/admin/operations"
  affects:
    - "src/app/[locale]/admin/operations/page.tsx"
    - "src/components/admin/AdminOperationsClient.tsx"
tech_stack:
  added:
    - "OpsSlaDto type"
    - "OpsAggregateDto type"
    - "calcOpsSla function"
    - "getOpsAggregate function"
    - "getGlobalTimeline helper"
  patterns:
    - "Single aggregate endpoint returns stats/workload/timeline/table"
    - "4-level SLA model: ok/warn/danger/info"
    - "Client container owns loading/error/filter/retry state"
    - "Debounced search (300ms)"
key_files:
  created:
    - "src/app/api/admin/operations/route.ts"
    - "src/components/admin/AdminOperationsClient.tsx"
    - "src/components/admin/AdminOperationsStats.tsx"
    - "src/components/admin/AdminOperationsWorkload.tsx"
    - "src/components/admin/AdminOperationsTimeline.tsx"
    - "src/components/admin/AdminOperationsTable.tsx"
  modified:
    - "src/lib/ops/ops-service.ts"
    - "src/app/[locale]/admin/operations/page.tsx"
decisions:
  - "OpsSlaDto uses 4-level model (ok/warn/danger/info) with deadline-first, then status-age, then info fallback"
  - "Single aggregate endpoint returns all screen data in one response"
  - "calcOpsSla accepts slaDeadline, latestTransitionCreatedAt, requestCreatedAt and returns typed OpsSlaDto"
  - "getOpsAggregate computes stats (open/nearSLA/completedToday/auditWarnings) from Prisma counts"
  - "Global timeline merges AuditEvent and WorkflowTransition, sorted by createdAt desc"
  - "Fuzzy search on title and code fields via Prisma OR query"
  - "Pagination enforced with max pageSize=100"
---

# Phase 49 Plan 01: Operations Real Data Integration — Summary

## Objective

Connect `/vi/admin/operations` to real Prisma/SQLite data. Single aggregate endpoint `/api/admin/operations` returns stats, workload, global timeline, and operations table with 4-level SLA bars (green/orange/red/blue).

## One-liner

Real data connected to admin operations page with deadline-first 4-level SLA bars.

---

## Tasks Completed

### Task 1: Extend ops-service.ts with aggregate DTOs and SLA calculation
**Commit:** `b07a3f3`

- Added `OpsSlaDto` type: `level: 'ok'|'warn'|'danger'|'info'`, `label`, `percent`, `source`
- Added `OpsAggregateDto` type combining stats, workload, timeline, requests, filters, pagination
- Added `calcOpsSla(slaDeadline, latestTransition, requestCreatedAt)` with deadline-first logic
- Added `getGlobalTimeline(workspaceId)` merging AuditEvent + WorkflowTransition
- Added `getOpsAggregate(session, filters, pagination)` with stats counts, workload reuse, global timeline, paginated requests
- Extended `OpsRequestRowDto` with `code`, `priority`, `workspaceName`, `slaDeadline`, `sla`
- **No hardcoded sample values** — all data from Prisma queries

### Task 2: Create /api/admin/operations route handler
**Commit:** `d72fb1d`

- Created `src/app/api/admin/operations/route.ts`
- GET handler with `requireAppSession()` auth check
- Admin role validation (super_admin, coordinator_admin)
- Status whitelist validation via VALID_STATUSES array
- Delegates to `getOpsAggregate()` with parsed filter params
- Error handling with 500 response

### Task 3: Build AdminOperationsClient and child components
**Commit:** `6d1beb6`

- `AdminOperationsClient.tsx`: client container with fetch/error/retry state, debounced search (300ms), filter state, paging state, error/retry/empty states
- `AdminOperationsStats.tsx`: 4 stat cards (blue/orange/green/red) mapping from data.stats
- `AdminOperationsWorkload.tsx`: specialist/reviewer workload with teal-to-green gradient progress bars
- `AdminOperationsTimeline.tsx`: global recent ops timeline with teal dots (#087f78), actor name, relative time
- `AdminOperationsTable.tsx`: 7-column table with SLA bars, status/priority badges, action links

### Task 4: Build AdminOperationsTable with SLA bars and page integration
**Commit:** `4e98d28`

- `AdminOperationsTable.tsx`: 7-column grid (0.9fr 1.15fr 1fr 1.05fr 0.9fr 0.95fr 1fr)
- SLA bars: 8px height, #eaf0f6 background, fill color per level (green/orange/red/blue)
- Missing deadlines render "Chưa có SLA" in blue with empty bar fill
- Action links: normal "Điều phối →", completed "Xem audit →", danger "Xử lý ngay →"
- Page at `src/app/[locale]/admin/operations/page.tsx` with AdminLayout wrapper

### Task 5: Add floating SLA warning button
**Embedded in:** `6d1beb6` (AdminOperationsClient)

- Red gradient background (#ef4444 to #dc2626), 3px yellow border (#facc15)
- Shows when `stats.nearSla > 0` with count and "Issue ×" label
- Positioned fixed right-[22px] bottom-[20px]

---

## Deviations from Plan

**None** — plan executed exactly as written. All tasks completed, committed individually, TypeScript compiles clean.

---

## Threat Surface

| Flag | File | Description |
|------|------|-------------|
| none | — | No new network endpoints beyond /api/admin/operations (already in scope); auth via requireAppSession + admin role check; filter params use Prisma parameterized queries; workspace scoping via requireSessionWorkspace |

---

## Self-Check

- [x] `src/lib/ops/ops-service.ts` — exports OpsSlaDto, OpsAggregateDto, calcOpsSla, getOpsAggregate
- [x] `src/app/api/admin/operations/route.ts` — exists, auth checked, delegates to service
- [x] `src/components/admin/AdminOperationsClient.tsx` — fetches from /api/admin/operations
- [x] `src/components/admin/AdminOperationsStats.tsx` — renders 4 stat cards
- [x] `src/components/admin/AdminOperationsWorkload.tsx` — renders workload items
- [x] `src/components/admin/AdminOperationsTimeline.tsx` — renders global timeline
- [x] `src/components/admin/AdminOperationsTable.tsx` — renders 7-column table with SLA bars
- [x] `src/app/[locale]/admin/operations/page.tsx` — integrated with AdminLayout
- [x] TypeScript compiles without errors (no new errors in affected files)
- [x] No hardcoded sample data — all from DB queries via Prisma
- [x] All commits present: b07a3f3, d72fb1d, 6d1beb6, 4e98d28

## Self-Check: PASSED

---

## Commits

| Hash | Message |
|------|---------|
| `b07a3f3` | feat(49): add OpsSlaDto, OpsAggregateDto, calcOpsSla, getOpsAggregate |
| `d72fb1d` | feat(49): create /api/admin/operations route handler |
| `6d1beb6` | feat(49): build AdminOperationsClient and child components |
| `4e98d28` | feat(49): integrate AdminOperationsClient in locale operations page |

## Duration

Plan execution started at 2026-06-13T13:07:31Z, completed at 2026-06-13T13:34:00Z (approximately 27 minutes).
