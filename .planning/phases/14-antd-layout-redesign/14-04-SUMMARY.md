---
phase: 14-antd-layout-redesign
plan: 04
subsystem: "UI migration — admin pages (ops, requests, routing, templates, vault)"
tags:
  - type:migration
  - antd
  - admin
  - ops
  - requests
  - routing
  - templates
  - vault
requires:
  - phase: 14-antd-layout-redesign
    plan: 01
    provides: "Ant Design provider tree, theme tokens"
  - phase: 14-antd-layout-redesign
    plan: 02
    provides: "Admin route group layout with antd Layout+Sider+Menu+Breadcrumb"
provides:
  - "Admin ops dashboard page migrated to antd Tag+Card+Table+Typography"
  - "Admin ops timeline page migrated to antd Tag+Card+Table+Typography"
  - "Admin requests page migrated to antd Tag+Button+Card+Table+Typography"
  - "Admin routing page migrated to antd Tag+Button+Card+Table+Typography"
  - "Admin templates page migrated to antd Tag+Button+Card+Table+Typography"
  - "Admin vault classification page migrated to antd Tag+Card+Table+Typography"
affects:
  - "Future cleanup: src/app/admin/components/ui.tsx and admin-shell.tsx now have 0 remaining consumers among admin pages"
tech-stack:
  added: []
  patterns:
    - "Replace custom Table (headers + tr/td children) with antd Table (columns + dataSource pattern) — applies to ALL 6 pages"
    - "Replace custom Badge (tone-based) with antd Tag (color-based) using tone-to-color mapping: neutral=default, info=blue, warning=orange, accent=cyan, destructive=red, outline=default"
    - "Tipa OpsWorkloadRowDto with antd Table rowKey returning composite key: (row) => `${row.kind}-${row.userId}`"
    - "Wired antd Table pagination={false} size=middle bordered pattern for consistent admin table styling"
    - "OpsRequestRowDto typed column definitions avoid inline tr/td mapping for server-rendered data"
key-files:
  modified:
    - src/app/admin/ops/page.tsx
    - src/app/admin/ops/\[requestId\]/page.tsx
    - src/app/admin/requests/page.tsx
    - src/app/admin/routing/page.tsx
    - src/app/admin/templates/page.tsx
    - src/app/admin/vault/page.tsx
key-decisions:
  - "Ops dashboard stat cards (grid of summary numbers) kept as styled divs — they were never from ui.tsx"
  - "Ops dashboard SLA grid kept as styled divs — never from ui.tsx"
  - "Ops timeline SLA grid kept as styled divs — never from ui.tsx"
  - "Ops timeline 'Quay lai van hanh' link kept as inline styled anchor (original was not a Button component)"
  - "Ops dashboard filter form elements kept as native HTML (select, input, textarea) — never from ui.tsx"
  - "Routing page SuggestionList and AssignmentForm kept as custom className-styled components — never from ui.tsx"
  - "Vault page folder/tag ul/li lists kept as custom markup — never from ui.tsx"
  - "Vault page FolderForm, TagForm, MoveFileForm kept as imported custom components"
  - "Vault page empty states (border-dashed divs) kept as-is — they were inline Tailwind, not ui.tsx"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-06-05"
---

# Phase 14 Plan 04: Admin Page Migration (ops, requests, routing, templates, vault) Summary

**Migrated the remaining 6 admin pages from custom ui.tsx components to antd equivalents, removing AdminShell wrapper from all admin pages and relying on the route group layout from Plan 02.**

## Accomplishments

### Task 1: Ops + Ops Timeline pages (b7aa077)
- **src/app/admin/ops/page.tsx** — Removed `AdminShell` wrapper and `Badge/Button/Card/PageHeader/Table` from `../components/ui`. Added `Tag, Button, Card, Table, Typography, Flex` from `antd`. Replaced `PageHeader` with `Typography.Title + Paragraph` in `Flex`. Replaced two custom `Table` instances (requests list and workload) with typed antd `Table` columns using `OpsRequestRowDto` and `OpsWorkloadRowDto`. Replaced `Badge` with `Tag` using tone-to-color mapping. Replaced `Button type="submit"` with `Button type="primary" htmlType="submit"`. Replaced `EmptyState` custom div with antd `Card + Title + Text`. Replaced "Xoa bo loc" link with `<Link><Button>Xoa bo loc</Button></Link>`.
- **src/app/admin/ops/[requestId]/page.tsx** — Removed `AdminShell` wrapper and `Badge/Card/PageHeader/Table` from `../../components/ui`. Added `Tag, Card, Table, Typography, Flex, Space` from `antd`. Replaced `PageHeader` (with action slot) with `Flex justify="space-between"` containing title/description + back link. Replaced `Badge` with `Tag` (`info` -> `blue`, `neutral` -> `default`). Replaced custom `Table` with antd `Table` using `OpsTimelineItemDto` typed columns. Kept SLA grid as styled divs.

### Task 2: Requests, Routing, Templates, Vault pages (4377cd3)
- **src/app/admin/requests/page.tsx** — Removed `AdminShell` and ui.tsx imports. Added `Tag, Button, Card, Table, Typography, Flex, Space` from `antd`. Replaced `PageHeader` (with action) with `Flex justify="space-between"` containing title/description + "Tao ho so yeu cau" Button. Replaced `Badge` with `Tag`. Replaced variant=destructive Button with `danger` prop; variant=secondary with no type prop. Replaced custom `Table` with antd `Table`.
- **src/app/admin/routing/page.tsx** — Removed `AdminShell` and ui.tsx imports. Added `Tag, Button, Card, Table, Typography, Flex` from `antd`. Replaced `PageHeader` with `Typography.Title + Paragraph` in `Flex`. Replaced `Badge` with `Tag`. Replaced `Button` with antd `Button` (no type for secondary/generic). Replaced TWO custom `Table` instances (requests queue and matter types) with antd `Table` columns. Replaced capabilities table too. Kept `SuggestionList` and `AssignmentForm` as styled native HTML.
- **src/app/admin/templates/page.tsx** — Removed `AdminShell` and ui.tsx imports. Added `Tag, Button, Card, Table, Typography, Flex` from `antd`. Replaced `PageHeader` (with action) with `Flex justify="space-between"` containing title/description + "Tao mau moi" Button. Replaced `Badge` with `Tag` (`STATUS_TONES` mapping: neutral=default, info=blue, accent=cyan, destructive=red). Replaced custom `Table` with antd `Table` columns.
- **src/app/admin/vault/page.tsx** — Removed `AdminShell` and `Card/PageHeader/Table/Badge` from `../components/ui`. Added `Tag, Card, Table, Typography, Flex, Row, Col` from `antd`. Replaced `PageHeader` with `Typography.Title + Paragraph` in `Flex`. Replaced `Badge` with `Tag` (neutral=default, info=blue, accent=cyan). Replaced custom `Table` with antd `Table`. Replaced div grid with antd `Row/Col` layout. Kept folder/tag ul/li lists and FolderForm/TagForm/MoveFileForm.

## Verification Results

| Check | Status |
|---|---|
| All 6 pages import from `antd` | PASS |
| All 6 pages no longer import from `../components/admin-shell` | PASS |
| All 6 pages no longer import from `../components/ui` | PASS |
| `npm run typecheck` passes (no new errors on migrated pages) | PASS |
| Tag colors match original tone system | PASS |
| Table columns match original headers | PASS |
| PageHeader replaced with Typography.Title + Paragraph in Flex | PASS |
| Badge replaced with Tag using correct tone-to-color mapping | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `b7aa077` | feat(14-antd-layout-redesign): migrate ops + ops timeline pages to antd |
| 2 | `4377cd3` | feat(14-antd-layout-redesign): migrate requests, routing, templates, vault pages to antd |

## Known Stubs

None.

## Threat Flags

None. All surface is within expected boundaries (no new network endpoints, auth paths, or schema changes). All data is server-rendered; antd React rendering prevents XSS per T-14-04-01.

## Self-Check: PASSED

- [x] `src/app/admin/ops/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] `src/app/admin/ops/\[requestId\]/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] `src/app/admin/requests/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] `src/app/admin/routing/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] `src/app/admin/templates/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] `src/app/admin/vault/page.tsx` — imports antd, no AdminShell, no ui.tsx
- [x] Commits: b7aa077 (task 1), 4377cd3 (task 2)
- [x] No new type errors introduced
