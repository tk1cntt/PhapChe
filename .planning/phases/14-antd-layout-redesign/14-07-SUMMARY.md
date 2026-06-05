---
phase: 14-antd-layout-redesign
plan: 07
subsystem: ui
tags:
  - antd
  - reviewer
  - migration
  - layout

requires:
  - phase: 14-01
    provides: "Ant Design provider tree, theme tokens, breadcrumb label config"
  - phase: 14-06 (analogous)
    provides: "Specialist layout pattern (Sider + Menu + Breadcrumb for role route groups)"

provides:
  - "Reviewer route group layout with antd Layout + Sider + Menu + Breadcrumb"
  - "Reviewer queue page using antd Table, Tag, Card, Typography"
  - "Reviewer detail page using antd Card, Button, Typography"
  - "Start-review and review-form sub-components using antd Button, Card, Tag"

affects:
  - None (all reviewer files migrated in-place)

tech-stack:
  added: []
  patterns:
    - "Reviewer layout with compact Sider (width=200) and single nav item"
    - "Prefix matching on /reviewer/requests for detail page highlighting"
    - "Page content inside Flex vertical gap pattern (no <main> wrapper)"

key-files:
  created:
    - src/app/reviewer/layout.tsx
  modified:
    - src/app/reviewer/requests/page.tsx
    - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx
    - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/start-review-button.tsx
    - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx

key-decisions:
  - "Reviewer layout follows exactly the same pattern as specialist layout (compact Sider, subtitle under brand, single nav item)"
  - "Queue page uses antd Table with ColumnsType for type-safe column definitions"
  - "Empty state handled via Table locale.emptyText instead of custom <tr>"
  - "All Tone mapping: accent=cyan, destructive=red per UI-SPEC.md"

requirements-completed: []

duration: 8min
completed: 2026-06-05
---

# Phase 14 Plan 07: Reviewer Route Group Antd Migration Summary

**Created reviewer route group layout and migrated all 4 reviewer files from hand-rolled ui.tsx components to antd. The reviewer layout uses a compact Sider with a single queue nav item, matching the specialist layout pattern. All page-level Badge/PageHeader/Button/Card/Table imports replaced with antd Tag/Typography/Button/Card/Table equivalents.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-05T01:50:05Z
- **Completed:** 2026-06-05T01:58:xxZ
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- Created `src/app/reviewer/layout.tsx` with antd Layout + Sider (width=200) + Menu + Breadcrumb and subtitle "Nguoi duyet" under brand
- Migrated queue page (`page.tsx`) from ui.tsx Badge/PageHeader/Table to antd Tag/Typography/Table with type-safe ColumnsType
- Migrated detail page (`[documentVersionId]/page.tsx`) from ui.tsx PageHeader/Button/Card to antd Typography/Button/Card with Flex layout
- Migrated `start-review-button.tsx` from ui.tsx Button/Card to antd equivalents
- Migrated `review-form.tsx` from ui.tsx Badge/Button/Card to antd Tag/Button/Card
- Applied tone-to-color mapping: accent=cyan, destructive=red

## Task Commits

Each task was committed atomically:

1. **Task 1: Create reviewer route group layout** - `81ef42c` (feat)
2. **Task 2: Migrate reviewer pages and sub-components to antd** - `32e2c7a` (feat)

**Plan metadata:** Pending after state updates.

## Files Created/Modified

- `src/app/reviewer/layout.tsx` - **Created.** Reviewer route group layout using antd Layout + Sider + Menu + Breadcrumb, matching specialist layout pattern (compact Sider width=200, subtitle under brand, single nav item "Hang cho duyet")
- `src/app/reviewer/requests/page.tsx` - **Modified.** Queue page: replaced ui.tsx Badge/PageHeader/Table with antd Tag/Typography/Table; removed `<main>` wrapper; added antd Table with ColumnsType
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` - **Modified.** Detail page: replaced ui.tsx PageHeader/Button/Card with antd Typography/Button/Card; removed `<main>` wrapper
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/start-review-button.tsx` - **Modified.** Replaced ui.tsx Button/Card with antd equivalents; `variant="primary"` changed to `type="primary" htmlType="submit"`
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx` - **Modified.** Replaced ui.tsx Badge/Button/Card with antd Tag/Button/Card; `variant="primary"` and `variant="destructive"` changed to `type="primary"` and `danger` respectively

## Decisions Made

- Reviewer layout follows exactly the same pattern as specialist layout (compact Sider, subtitle under brand, single nav item with prefix matching for detail pages)
- Empty state handled via antd Table `locale.emptyText` instead of the custom `<tr><td colSpan={N}>` pattern
- Queue page columns defined with `ColumnsType<PendingReview>` for type safety, using `dataIndex` with nested path and custom `render` where needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - typecheck passes with zero new errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Reviewer route group is now fully migrated to antd
- No remaining ui.tsx imports in reviewer files
- Pattern established for any future route group migrations
- The next step in Phase 14 would be cleanup: removing `ui.tsx` after confirming no remaining consumers across all route groups

## Self-Check: PASSED

- [x] `src/app/reviewer/layout.tsx` exists (70 lines, >= 40 min)
- [x] `src/app/reviewer/requests/page.tsx` imports from antd (zero ui.tsx imports)
- [x] Detail page imports from antd (zero ui.tsx imports)
- [x] start-review-button imports from antd (zero ui.tsx imports)
- [x] review-form imports from antd (zero ui.tsx imports)
- [x] Layout contains Sider and getBreadcrumbItems
- [x] No `<main>` wrappers remain (layout provides shell)
- [x] Commits: 81ef42c (Task 1), 32e2c7a (Task 2)
- [x] No reviewer-related typecheck errors

---

*Phase: 14-antd-layout-redesign*
*Completed: 2026-06-05*
