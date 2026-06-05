---
phase: 14-antd-layout-redesign
plan: 03
subsystem: "UI migration — admin pages"
tags:
  - type:migration
  - antd
  - admin
  - audit
  - users
  - workspaces
requires:
  - phase: 14-antd-layout-redesign
    plan: 01
    provides: "Ant Design provider tree, theme tokens"
  - phase: 14-antd-layout-redesign
    plan: 02
    provides: "Admin route group layout with antd Layout+Sider+Menu+Breadcrumb"
provides:
  - "Admin audit page fully migrated to antd Tag+Card+Table+Typography"
  - "Admin users page fully migrated to antd Tag+Button+Card+Table+Typography"
  - "Admin workspaces page fully migrated to antd Tag+Button+Card+Table+Typography"
affects:
  - "Future cleanup: src/app/admin/components/ui.tsx and admin-shell.tsx now have 3 fewer consumers"
tech-stack:
  added: []
  patterns:
    - "Replace custom Badge (tone-based) with antd Tag (color-based) using tone-to-color mapping: neutral=default, info=blue, warning=orange, accent=cyan, destructive=red"
    - "Replace custom Table (headers + tr/td children) with antd Table (columns + dataSource pattern)"
    - "Replace custom PageHeader with antd Typography.Title level={3} + Paragraph in Flex container"
    - "Replace custom Card with antd Card (same component name, now imported from antd)"
    - "Remove AdminShell wrapper — page returns fragment children directly, relying on admin route group layout (14-02)"
key-files:
  modified:
    - src/app/admin/audit/page.tsx
    - src/app/admin/users/page.tsx
    - src/app/admin/workspaces/page.tsx
decisions:
  - "Typed audit event columns inline using (typeof auditEvents)[number] for type safety without importing separate type"
  - "Used unknown for _ parameters in column render functions to match antd v6 Table generic conventions"
  - "Preserved all original mock data and Vietnamese diacritics in users/workspaces pages unchanged"
  - "users page original: action Button at bottom below Table; new layout: Button moved into Flex below Table with same position"
  - "User status Badge (tone='accent') replaced with Tag color='cyan' per tone-to-color mapping"
  - "Workspace status Badge (tone='accent') replaced with Tag color='cyan' per tone-to-color mapping"
metrics:
  duration: "7 minutes"
  completed_date: "2026-06-05"
---

# Phase 14 Plan 03: Admin Page Migration (audit, users, workspaces) Summary

**Migrated 3 admin pages from custom ui.tsx components to antd equivalents, removing AdminShell wrapper and relying on the route group layout from Plan 02.**

## Accomplishments

### Task 1: Audit page (390c2c8)
- Removed `AdminShell` wrapper and `Badge/Card/PageHeader/Table` from `../components/ui`
- Added `Tag, Card, Table, Typography, Flex` from `antd`
- Replaced `PageHeader` with `Typography.Title level={3}` + `Typography.Paragraph` in `Flex`
- Replaced custom `Table` with antd `Table` with typed column definitions (`dataIndex`/`render`)
- Replaced `Badge tone="info"` with `Tag color="blue"`
- Empty state handled via `locale={{ emptyText: '...' }}` instead of manual `<tr><td colSpan={7}>`
- Kept existing Prisma query, `requireAppSession` call, and async server component pattern

### Task 2: Users page (7c94e16)
- Removed `AdminShell` wrapper and `Badge/Button/Card/PageHeader/Table` from `../components/ui`
- Added `Tag, Button, Card, Table, Typography, Flex, Space` from `antd`
- Replaced `PageHeader` with `Typography.Title level={3}` + `Typography.Paragraph` in `Flex`
- Replaced custom `Table` with antd `Table` with column definitions
- Replaced all `Badge` tags with `Tag` using tone-to-color mapping (neutral=default, info=blue, warning=orange, accent=cyan, destructive=red)
- Replaced `<Button>` with `<Button type="primary">`
- Preserved original mock data (user records, role definitions) with Vietnamese diacritics unchanged

### Task 3: Workspaces page (3c9c398)
- Removed `AdminShell` wrapper and `Badge/Button/Card/PageHeader/Table` from `../components/ui`
- Added `Tag, Button, Card, Table, Typography, Flex` from `antd`
- Replaced `PageHeader` with `Typography.Title level={3}` + `Typography.Paragraph` in `Flex`
- Replaced custom `Table` with antd `Table` with column definitions
- Replaced `Badge tone="accent"` with `Tag color="cyan"`
- Replaced `<Button>` with `<Button type="primary">`

## Verification Results

| Check | Status |
|---|---|
| All 3 pages import from `antd` | PASS |
| All 3 pages no longer import from `../components/admin-shell` | PASS |
| All 3 pages no longer import from `../components/ui` | PASS |
| `npm run typecheck` passes on all 3 files | PASS (no new errors) |
| Tag colors match original tone system | PASS |
| Table columns match original headers | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `390c2c8` | feat(14-antd-layout-redesign): migrate audit page to antd components |
| 2 | `7c94e16` | feat(14-antd-layout-redesign): migrate users page to antd components |
| 3 | `3c9c398` | feat(14-antd-layout-redesign): migrate workspaces page to antd components |

## Known Stubs

None.

## Threat Flags

None. All surface is within expected boundaries (no new network endpoints, auth paths, or schema changes).

## Self-Check: PASSED

- [x] `src/app/admin/audit/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] `src/app/admin/users/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] `src/app/admin/workspaces/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] Commits: 390c2c8 (task 1), 7c94e16 (task 2), 3c9c398 (task 3)
