---
phase: 14-antd-layout-redesign
plan: 02
subsystem: "UI layout, admin shell migration"
tags:
  - type:layout
  - antd
  - admin
  - sidebar
  - breadcrumb
requires:
  - phase: 14-antd-layout-redesign
    plan: 01
    provides: "Ant Design provider tree, breadcrumb label config, theme tokens"
provides:
  - "Admin route group layout with antd Layout+Sider+Menu+Breadcrumb"
affects:
  - "Plans 03-04 admin page migration (removes need for AdminShell wrapper)"
tech-stack:
  added: []
  patterns:
    - "Route group layout as client component with antd Layout+Sider pattern"
    - "selectedKeys derived from usePathname for Menu active state"
    - "Breadcrumb auto-generated from pathname via centralized getBreadcrumbItems"
key-files:
  created:
    - src/app/admin/layout.tsx
  modified: []
key-decisions:
  - "Using exact pathname match for Menu selectedKeys (not prefix matching) — keeps navigation simple for flat admin routes"
  - "existing admin-shell.tsx preserved untouched — page migration happens in Plans 03-04"
metrics:
  duration: "8 minutes"
  completed_date: "2026-06-05"
---

# Phase 14 Plan 02: Admin Route Group Layout Summary

**Admin route group layout with antd Layout, Sider (6 nav items with icons), Header (Breadcrumb from route), and Content area on F8FAFC background**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-06-05T<time>
- **Completed:** 2026-06-05T<time>
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `src/app/admin/layout.tsx` with antd Layout + Sider + Menu + Breadcrumb
- Six nav items from the previous AdminShell (users, workspaces, requests, ops, audit, vault) with antd icons
- Breadcrumb auto-generated from current route via centralized `getBreadcrumbItems` from Plan 01
- Sider responsive collapse via `breakpoint="lg"` (collapses at 992px)
- Compact 48px header with white background and border
- Content area renders children on `#F8FAFC` background with 24px padding
- Old `admin-shell.tsx` preserved untouched for migration in Plans 03-04

## Task Commits

Each task was committed atomically:

1. **Task 1: Create admin layout with antd Layout+Sider+Menu+Breadcrumb** — `4cf3d5b` (feat)

## Files Created/Modified

- `src/app/admin/layout.tsx` — New admin route group layout (70 lines) with antd Layout+Sider, brand text "GitNexus Legal", Menu with 6 nav items, Header with Breadcrumb, Content area at F8FAFC background

## Decisions Made

- Used exact pathname match for `Menu.selectedKeys` (not prefix matching). For flat admin routes like `/admin/users`, `/admin/ops`, exact match is correct and simple. Nested routes like `/admin/ops/REQ-001` won't highlight the parent, but this avoids complexity of prefix matching logic.
- Preserved `admin-shell.tsx` unchanged — it's still the active wrapper on pages until Plans 03-04 remove it. This layout runs alongside but doesn't remove the old shell.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Admin layout is ready to serve as the route group shell once pages remove their `AdminShell` wrapper in Plans 03-04
- Nav items and breadcrumbs match the existing admin navigation exactly

---
*Phase: 14-antd-layout-redesign*
*Completed: 2026-06-05*
