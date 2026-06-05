---
phase: 14-antd-layout-redesign
plan: 06
subsystem: "Customer route group layout, customer-facing pages"
tags:
  - type:frontend
  - antd
  - layout
  - customer
  - breadcrumb
requires:
  - "14-01-PLAN.md (antd provider, breadcrumb config)"
provides:
  - "Customer route group layout with Header + Breadcrumb (no sidebar)"
  - "Customer delivery page with antd Tag, Button, Card, Typography"
  - "Request status page with antd Tag, Card, Typography"
affects:
  - src/app/customer/layout.tsx
  - src/app/customer/requests/[requestId]/page.tsx
  - src/app/requests/[requestId]/page.tsx
tech-stack:
  added: []
  patterns:
    - "Customer layout: antd Layout + Header + Content (no Sider, minimal chrome per D-03)"
    - "Tone-to-color mapping for status tags (neutral -> default, info -> blue, etc.)"
    - "Replace custom PageHeader with antd Typography.Title + Paragraph inside Flex"
key-files:
  created:
    - src/app/customer/layout.tsx
  modified:
    - src/app/customer/requests/[requestId]/page.tsx
    - src/app/requests/[requestId]/page.tsx
decisions:
  - "Customer layout uses antd Layout.Header at 48px height with breadcrumb left, brand right"
  - "Tone-to-color mapping function kept as local utility (toneToTagColor) in each page"
  - "General request status page (src/app/requests/[requestId]/page.tsx) retains <main> wrapper since it has no route group layout"
  - "Customer delivery page removes <main> wrapper since customer layout provides Content shell"
metrics:
  duration: "10 minutes"
  completed_date: "2026-06-05"
---

# Phase 14 Plan 06: Customer Layout and Pages Migration Summary

Created customer route group layout with minimal chrome (Header + Breadcrumb only, no sidebar per D-03) and migrated both customer-facing pages (customer delivery page at `/customer/requests/[id]` and general request status at `/requests/[id]`) from hand-rolled `ui.tsx` components to antd.

## Tasks

### Task 1: Create customer route group layout (no sidebar, minimal chrome) (8364504)

Created `src/app/customer/layout.tsx` as a client component using antd `Layout` + `Header` + `Content`:

- **Header** at 48px height with `Breadcrumb` on the left (derived from centralized `getBreadcrumbItems` in `breadcrumb-labels.ts`) and "GitNexus Legal" brand text on the right
- **No Sider** — per D-03, customer layout is minimal chrome, no sidebar
- **Content area** at `#F8FAFC` background with 24px padding, same styling as other layouts
- Content is wrapped as `<main>` via `<Content>` (antd's semantic wrapper)

### Task 2: Migrate customer delivery page and request status page to antd (3f89d83)

**Customer delivery page** (`src/app/customer/requests/[requestId]/page.tsx`):
- Removed imports from `@/app/admin/components/ui` (Badge, Button, Card, PageHeader)
- Added imports from `antd` (Tag, Button, Card, Typography, Flex)
- Replaced `<PageHeader>` with `<Typography.Title>` + `<Paragraph>` in `<Flex>`
- Replaced `<Badge tone={...}>` with `<Tag color={toneToTagColor(...)}>`
- Replaced `<Button>` with `<Button type="primary">Tai xuong</Button>`
- Replaced `<Card>` with antd `<Card styles={{ body: { padding: 16 } }}>`
- Removed `<main>` wrapper (customer route group layout provides the shell)
- Added `toneToTagColor()` utility function inline

**Request status page** (`src/app/requests/[requestId]/page.tsx`):
- Removed imports from `@/app/admin/components/ui` (Badge, Card, PageHeader)
- Added imports from `antd` (Tag, Card, Typography, Flex)
- Replaced `<PageHeader>` with `<Typography.Title>` + `<Paragraph>` in `<Flex>`
- Replaced `<Badge>` with `<Tag color={toneToTagColor(...)}>`
- Replaced `<Card>` with antd `<Card styles={{ body: { padding: 16 } }}>`
- Retained `<main>` wrapper (no route group layout exists at `/requests/[id]` level)
- Added `toneToTagColor()` utility function inline

**Tone-to-color mapping** (both pages):
- neutral -> 'default', info -> 'blue', warning -> 'orange', accent -> 'cyan', destructive -> 'red', outline -> 'default'

## Verification

- [x] Customer layout created at `src/app/customer/layout.tsx` (42 lines, >= 30 min required)
- [x] Layout uses antd `Layout`, `Header`, `Content` — no `Sider`
- [x] Layout imports `getBreadcrumbItems` from `breadcrumb-labels.ts`
- [x] Customer delivery page imports from `antd` (Tag, Button, Card, Typography, Flex)
- [x] Request status page imports from `antd` (Tag, Card, Typography, Flex)
- [x] Neither page imports from `@/app/admin/components/ui`
- [x] `npm run typecheck`: 14 errors (all pre-existing, 0 new)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. All surface is within expected boundaries (UI components, no data mutation).

## Self-Check: PASSED

- [x] `src/app/customer/layout.tsx` exists (42 lines)
- [x] `src/app/customer/requests/[requestId]/page.tsx` imports from antd
- [x] `src/app/requests/[requestId]/page.tsx` imports from antd
- [x] Commits: 8364504 (task 1), 3f89d83 (task 2)
- [x] No accidental file deletions
