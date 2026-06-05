---
phase: 14-antd-layout-redesign
plan: 05
subsystem: ui
tags:
  - type:layout
  - antd
  - specialist
  - migration
requires:
  - phase: 14-01
    provides: "Ant Design provider tree, theme tokens, breadcrumb config"
provides:
  - "Specialist route group layout with compact Sider (antd)"
  - "Specialist pages migrated from ui.tsx to antd components"
affects:
  - 14-06 (next layout migration)
tech-stack:
  added: []
  patterns:
    - "Specialist layout with prefix-matched Menu selectedKeys for detail pages"
    - "Tone-to-color mapping for antd Tag component"
key-files:
  created:
    - src/app/specialist/layout.tsx
  modified:
    - src/app/specialist/requests/page.tsx
    - src/app/specialist/requests/[requestId]/page.tsx
    - src/app/specialist/requests/[requestId]/components/document-versions.tsx
    - src/app/specialist/requests/[requestId]/components/delivery-actions.tsx
    - src/app/specialist/requests/[requestId]/components/generate-draft-form.tsx
    - src/app/specialist/requests/[requestId]/components/vault-files.tsx
    - src/lib/navigation/breadcrumb-labels.ts
key-decisions:
  - "BreadcrumbItem interface replaced with antd ItemType to fix type compatibility"
requirements-completed: []
duration: 13min
completed: 2026-06-05
---

# Phase 14 Plan 05: Specialist Route Group Layout and Page Migration Summary

**Created specialist route group layout with compact antd Sider (width 200) and migrated all 6 specialist-facing pages and sub-components from custom ui.tsx imports to antd components (Tag, Button, Card, Table, Typography, Flex).**

## Performance

- **Duration:** 13 minutes
- **Started:** 2026-06-05T01:24:32Z
- **Completed:** 2026-06-05T01:37:XXZ
- **Tasks:** 2
- **Files modified:** 8 (1 new, 7 modified)

## Accomplishments

- Created `src/app/specialist/layout.tsx` with antd Layout + Sider + Menu + Breadcrumb — compact sidebar focused on case queue navigation, with "Chuyen vien" subtitle under brand
- Migrated specialist queue page (`page.tsx`) to antd Table with columns for title, customer, matter type, status (Tag), date, and action (Button)
- Migrated specialist detail page to antd Card, Typography, Tag, Flex — removed main wrappers
- Migrated 4 sub-components (document-versions, delivery-actions, generate-draft-form, vault-files) from ui.tsx Badge/Button to antd Tag/Button with tone-to-color mapping
- Fixed BreadcrumbItem type compatibility by using antd's ItemType directly in breadcrumb-labels.ts (fixes both admin and specialist layout type errors)
- No remaining imports from `@/app/admin/components/ui` in any specialist file
- Typecheck passes clean for all specialist files

## Task Commits

Each task was committed atomically:

1. **Task 1: Create specialist route group layout with antd** - `c209008` (feat)
2. **Task 2: Migrate specialist pages and sub-components to antd** - `866f7e7` (feat)

## Files Created/Modified

- `src/app/specialist/layout.tsx` (NEW) — Specialist layout with antd Layout + Sider (width=200) + Menu (1 nav item: Hang cho) + Breadcrumb in Header
- `src/app/specialist/requests/page.tsx` — Replaced ui.tsx imports (Badge, Button, Card, PageHeader, Table) with antd (Tag, Button, Card, Table, Typography, Flex); uses antd Table columns pattern
- `src/app/specialist/requests/[requestId]/page.tsx` — Replaced ui.tsx imports (Badge, Card, PageHeader) with antd (Tag, Card, Typography, Flex)
- `src/app/specialist/requests/[requestId]/components/document-versions.tsx` — Replaced Badge import with Tag; tone-to-color mapping
- `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx` — Replaced Badge+Button with Tag+Button; htmlType="submit" for form buttons
- `src/app/specialist/requests/[requestId]/components/generate-draft-form.tsx` — Replaced Button import with antd Button; htmlType="submit" + loading prop
- `src/app/specialist/requests/[requestId]/components/vault-files.tsx` — Replaced Badge import with Tag; tone-to-color mapping
- `src/lib/navigation/breadcrumb-labels.ts` — Removed custom BreadcrumbItem interface, use antd ItemType directly for type compatibility

## Decisions Made

- Prefix-matched Menu selectedKeys: `/specialist/requests` selected key also highlights when on detail pages (`/specialist/requests/[id]`) — same pattern as admin layout
- Tone-to-color mapping for Tag follows the UI-SPEC contract: neutral=default, info=blue, warning=orange, accent=cyan, destructive=red, outline=default
- Removed `<main>` wrappers from all specialist pages — the route group layout now provides the page shell

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed BreadcrumbItem type compatibility with antd Breadcrumb**
- **Found during:** Task 1 (Typecheck after creating layout)
- **Issue:** The custom `BreadcrumbItem` interface in `breadcrumb-labels.ts` is missing the `[key: \`data-${string}\`]: string` index signature required by antd's `ItemType`. Both the new specialist layout and existing admin layout fail typecheck with this pre-existing issue.
- **Fix:** Removed custom `BreadcrumbItem` interface and changed return type of `getBreadcrumbItems` from `BreadcrumbItem[]` to `ItemType[]` (imported from antd). Changed internal `items` array type accordingly.
- **Files modified:** `src/lib/navigation/breadcrumb-labels.ts`
- **Verification:** `tsc --noEmit` shows zero breadcrumb-related type errors
- **Committed in:** `c209008` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required fix to pass typecheck. Also fixes the same pre-existing error in admin layout. No scope creep.

## Issues Encountered

- None — all changes applied cleanly. The type fix in breadcrumb-labels.ts was straightforward.

## Next Phase Readiness

- Specialist route group is fully migrated to antd
- All specialist files are clean of old ui.tsx imports
- The breadcrumb-labels.ts type fix benefits future layouts (admin, customer, reviewer) that use the same getBreadcrumbItems function

## Self-Check: PASSED

- [x] `src/app/specialist/layout.tsx` exists and contains Sider + getBreadcrumbItems
- [x] Commits: c209008 (Task 1), 866f7e7 (Task 2)
- [x] No remaining `@/app/admin/components/ui` imports in `src/app/specialist/`
- [x] All 6 specialist files import from antd
- [x] Typecheck passes for specialist files
- [x] SUMMARY.md created at `.planning/phases/14-antd-layout-redesign/14-05-SUMMARY.md`

---
*Phase: 14-antd-layout-redesign*
*Completed: 2026-06-05*
