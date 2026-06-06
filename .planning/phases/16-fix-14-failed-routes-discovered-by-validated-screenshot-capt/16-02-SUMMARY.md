---
phase: "16"
plan: "02"
subsystem: fix
tags: [server-client-boundary, antd, nextjs]
requires: []
provides: []
affects: []
tech-stack:
  added: []
  patterns: [server-client-split, client-table-component]
key-files:
  created:
    - src/app/specialist/requests/SpecialistRequestsTable.tsx
    - src/app/reviewer/requests/ReviewerRequestsTable.tsx
    - src/app/admin/ops/OpsDashboardTables.tsx
    - src/app/admin/ops/[requestId]/OpsTimelineTable.tsx
  modified:
    - src/app/specialist/requests/page.tsx
    - src/app/reviewer/requests/page.tsx
    - src/app/admin/ops/page.tsx
    - src/app/admin/ops/[requestId]/page.tsx
key-decisions:
  - Used per-page client table components rather than a shared helper — each table has distinct columns
  - Date objects converted to ISO strings before crossing server/client boundary
  - Prisma imports and requireAppSession() remain in Server Components only
requirements-completed: []
duration: "<10 min"
completed: "2026-06-06"
---

# Phase 16 Plan 02: Fix Queue & Ops Page Errors Summary

## Result

Fixed 4 routes: `/specialist/requests`, `/reviewer/requests`, `/admin/ops`, `/admin/ops/[requestId]`. Removed all Server/Client component boundary errors and invalid HTML element errors.

## What Was Changed

### Specialist Queue (`/specialist/requests`)
- **Created** `SpecialistRequestsTable.tsx` — `'use client'` component with AntD `Table` columns (render functions isolated here)
- **Modified** `page.tsx` — Server Component now maps Prisma results to `SpecialistRequestRow[]` DTOs with ISO string dates; passes rows prop to client table

### Reviewer Queue (`/reviewer/requests`)
- **Created** `ReviewerRequestsTable.tsx` — `'use client'` component with AntD `Table` columns + review link rendering
- **Modified** `page.tsx` — Server Component maps `documentVersion.findMany` to flat `ReviewerRequestRow[]` DTOs; passes rows + notice props

### Ops Dashboard (`/admin/ops`)
- **Created** `OpsDashboardTables.tsx` — `'use client'` with two AntD `Table` components (requests + workload columns)
- **Modified** `page.tsx` — Removed broken HTML elements (`<h2>`, `<p>`, raw `<br>`) replaced with AntD Typography; `columns` moved to client; Date serialization added

### Ops Timeline (`/admin/ops/[requestId]`)
- **Created** `OpsTimelineTable.tsx` — `'use client'` with timeline column render functions
- **Modified** `page.tsx` — SLA display rewritten with AntD Typography components; `timelineColumns` moved to client; Date serialization added

## Tasks Executed

| Task | Description | Status |
|------|-------------|--------|
| 16-02-01 | Specialist queue table — create client component, keep Prisma server-side | ✅ Complete |
| 16-02-02 | Reviewer queue table — same pattern | ✅ Complete |
| 16-02-03 | Ops dashboard + timeline — client tables + HTML fix | ✅ Complete |

## Acceptance Criteria — All Passed

| Criterion | Result |
|-----------|--------|
| `/specialist/requests` client table exists with `'use client'` | ✅ |
| SpecialistRequestsTable imports Table from antd | ✅ |
| specialist page.tsx does NOT pass columns with render functions | ✅ |
| specialist page.tsx still imports requireAppSession | ✅ |
| `/reviewer/requests` client table exists with `'use client'` | ✅ |
| ReviewerRequestsTable imports Table from antd | ✅ |
| reviewer page.tsx does NOT pass columns with render functions | ✅ |
| reviewer page.tsx still imports requireAppSession | ✅ |
| `/admin/ops` client table exists with `'use client'` | ✅ |
| OpsDashboardTables has request + workload table columns | ✅ |
| ops page.tsx does NOT pass columns with render functions | ✅ |
| ops page.tsx still calls requireAppSession | ✅ |
| `/admin/ops/[requestId]` client table exists | ✅ |
| ops timeline page.tsx does NOT pass columns with render functions | ✅ |
| ops timeline page.tsx still calls requireAppSession | ✅ |

## Deviations from Plan

None — plan executed exactly as written.

## Next

Ready for **Plan 03**: Repair remaining admin/template/vault/customer/reviewer/specialist dynamic routes and run final full validation.
