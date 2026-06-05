---
phase: 14-antd-layout-redesign
plan: 01
subsystem: "UI infrastructure, provider tree, breadcrumb config"
tags:
  - type:setup
  - antd
  - provider
  - breadcrumb
  - theme
requires: []
provides:
  - "Ant Design theme tokens (teal accent, 14px, F8FAFC bg)"
  - "Breadcrumb route-to-Vietnamese label mapping"
  - "SSR-compatible antd provider tree (StyleProvider + ConfigProvider + App)"
affects:
  - src/app/layout.tsx
  - src/app/globals.css
tech-stack:
  added:
    - "antd@^6.4.3"
    - "@ant-design/icons@^6.2.5"
    - "@ant-design/cssinjs@^2.1.2"
  patterns:
    - "Client component wrapping children with antd provider tree"
    - "Centralized breadcrumb label config in src/lib/navigation/"
key-files:
  created:
    - src/app/providers/antd-provider.tsx
    - src/lib/navigation/breadcrumb-labels.ts
  modified:
    - package.json
    - src/app/layout.tsx
    - src/app/globals.css
decisions:
  - "Used @ant-design/cssinjs StyleProvider instead of AntdRegistry (AntdRegistry removed in cssinjs v2.x)"
  - "Breadcrumb labels use ?? fallback to retain raw segment when no mapping exists"
  - "CSS custom properties and radial-gradient removed; color now set by antd ConfigProvider tokens"
metrics:
  duration: "15 minutes"
  completed_date: "2026-06-05"
---

# Phase 14 Plan 01: Ant Design Provider Setup Summary

Installed Ant Design v6.4.3 with @ant-design/icons and @ant-design/cssinjs. Created the foundational antd provider tree (StyleProvider + ConfigProvider + App) wrapping the root layout with pre-approved theme tokens (teal accent #0F766E, F8FAFC background, 14px font, 16px border radius). Created centralized breadcrumb label config mapping 13 route segments to Vietnamese labels. Simplified globals.css by removing CSS custom properties and radial gradient background.

## Tasks

### Task 1: Install Ant Design dependencies (62ac7a6)

- Added `antd@^6.4.3`, `@ant-design/icons@^6.2.5`, `@ant-design/cssinjs@^2.1.2` to dependencies
- All packages resolve correctly
- Typecheck passes with only pre-existing errors (none from antd)

### Task 2: Create theme provider, breadcrumb config, update root layout, simplify globals.css (4293bd9)

Created 2 new files, modified 2 existing files:

- **src/app/providers/antd-provider.tsx** (84 lines) -- Client component wrapping children with:
  - `StyleProvider` (replaces AntdRegistry from cssinjs v1; v2.x renamed it)
  - `ConfigProvider` with full theme tokens from UI-SPEC.md (copy-pasted exact values)
  - `App` from antd (provides message/modal/notification hooks)

- **src/lib/navigation/breadcrumb-labels.ts** (40 lines) -- Exports:
  - `breadcrumbLabels: Record<string, string>` with 13 Vietnamese route labels
  - `getBreadcrumbItems(pathname)` that splits pathname, filters `(...)` route groups, maps segments, builds cumulative hrefs, sets last item without href

- **src/app/layout.tsx** -- Imports and wraps children with `AntdProvider`. Kept metadata and `html lang="vi"`. Title and description now use no-diacritics Vietnamese ("Nen tang phap ly SME").

- **src/app/globals.css** -- Simplified from 53 to 37 lines. Removed all CSS custom properties (`--background`, `--surface`, `--accent`, `--destructive`, etc.) and radial gradient from body. Kept Tailwind directives, box-sizing, body reset (no background gradient), selection, a, font-inherit, table tabular-nums.

## Verification

- [x] npm run typecheck passes (no new errors from antd or our files)
- [x] antd packages load correctly via require()
- [x] breadcrumbLabels record exports 13 route segment mappings
- [x] getBreadcrumbItems correctly filters route group segments, maps known segments, sets last item disabled
- [x] globals.css has no :root variables or radial-gradient

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced AntdRegistry with StyleProvider**

- **Found during:** Task 2
- **Issue:** `@ant-design/cssinjs` v2.1.2 removed the `AntdRegistry` export (renamed to `StyleProvider`). The plan referenced `AntdRegistry` which was the v1 API.
- **Fix:** Changed import from `{ AntdRegistry }` to `{ StyleProvider }` and updated JSX wrapper accordingly.
- **Files modified:** `src/app/providers/antd-provider.tsx`
- **Commit:** 4293bd9

(The plan's verification grep for `AntdRegistry` in the provider was updated to check `StyleProvider` instead.)

## Known Stubs

None.

## Threat Flags

None. All surface is within expected boundaries (client provider, public theme tokens).

## Self-Check: PASSED

- [x] `package.json` contains antd, @ant-design/icons, @ant-design/cssinjs
- [x] `src/app/providers/antd-provider.tsx` exists (84 lines, >= 60 min)
- [x] `src/lib/navigation/breadcrumb-labels.ts` exists (40 lines, >= 30 min)
- [x] `src/app/layout.tsx` imports AntdProvider
- [x] `src/app/globals.css` no longer contains :root or radial-gradient (37 lines, >= 20 min)
- [x] Commits: 62ac7a6 (task 1), 4293bd9 (task 2)
