---
phase: 14-antd-layout-redesign
plan: 08
name: Migrate remaining ui.tsx consumers (templates, vault sub-components, intake)
status: completed
subsystem: "admin-ui, intake-ui"
tags: ["antd-migration", "ui-consolidation", "templates", "vault", "intake"]
dependency:
  requires: [14-04-PLAN.md, 14-05-PLAN.md, 14-06-PLAN.md, 14-07-PLAN.md]
  provides: []
  affects: []
tech-stack:
  added: []
  patterns: ["All ui.tsx consumers now use antd directly"]
key-files:
  modified:
    - src/app/admin/templates/[templateId]/page.tsx
    - src/app/admin/templates/new/page.tsx
    - src/app/admin/vault/components/folder-form.tsx
    - src/app/admin/vault/components/move-file-form.tsx
    - src/app/admin/vault/components/tag-form.tsx
    - src/app/intake/components.tsx
  created: []
decisions: []
metrics:
  duration: "~2h 45m"
  completed_date: "2026-06-05"
  tasks: 3
  commits: 3
---

# Phase 14 Plan 08: Migrate remaining ui.tsx consumers to antd

## One-liner

Migrate 6 files across template detail/new pages, vault sub-components (folder-form, move-file-form, tag-form), and intake components from `admin/components/ui.tsx` to direct antd imports, removing all remaining ui.tsx consumer references.

## Task Execution

| # | Task | Status | Commit | Key Changes |
|---|------|--------|--------|-------------|
| 1 | Migrate template detail page and new template page | Done | `e760e5d` | Removed AdminShell wrapper, replaced Badge with Tag, Button/Card with antd, mapped STATUS_TONES to antd Tag colors |
| 2 | Migrate vault sub-components (folder-form, move-file-form, tag-form) | Done | `54daaa3` | Replaced Badge with Tag (color=red/cyan), replaced Button with antd (type=primary, htmlType=submit, loading=pending) |
| 3 | Migrate intake components to antd | Done | `e833b85` | Replaced PageHeader with Flex+Typography, Badge with Tag, Button/Card with antd |

## Files Modified

Each file had import source changed from `../../components/ui` or `@/app/admin/components/ui` to `'antd'`, with corresponding component API adjustments.

### Template Detail Page (`src/app/admin/templates/[templateId]/page.tsx`)
- Removed `AdminShell` wrapper (3 return paths: edit, new_version, view)
- STATUS_TONES mapping: `neutral -> default`, `info -> blue`, `accent -> cyan`, `destructive -> red`
- `Badge` -> `Tag`, `Button variant="primary"` -> `Button type="primary"`, `Button variant="destructive"` -> `Button danger`

### New Template Page (`src/app/admin/templates/new/page.tsx`)
- Removed `AdminShell` wrapper
- `Button type="submit" variant="primary"` -> `Button type="primary" htmlType="submit"`

### Vault Sub-components (`src/app/admin/vault/components/`)
- `folder-form.tsx`: `Badge tone="destructive"` -> `Tag color="red"`, `Badge tone="accent"` -> `Tag color="cyan"`, `Button` -> antd Button with `loading={pending}`
- `move-file-form.tsx`: `Badge tone={feedback.tone}` -> `Tag color={feedback.tone === 'accent' ? 'cyan' : 'red'}`
- `tag-form.tsx`: Same pattern as folder-form.tsx

### Intake Components (`src/app/intake/components.tsx`)
- `PageHeader` -> `Flex vertical + Typography.Title + Typography.Paragraph`
- `Badge tone="warning"` -> `Tag color="orange"`
- `Button type="submit"` -> `Button type="primary" htmlType="submit"`

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- [x] All 6 modified files no longer import from admin/components/ui
- [x] All 6 modified files import from antd
- [x] Template pages no longer wrap in AdminShell
- [x] Vault sub-components replace Badge->Tag, Button->antd Button
- [x] Intake components replace PageHeader->Typography, Badge->Tag
- [x] Typecheck passes (14 pre-existing errors unchanged)
- [x] No remaining imports from admin/components/ui anywhere in src/

## Known Stubs

None.

## Threat Surface Scan

No new security-relevant surface introduced. The plan only changes component imports and wrapper structure -- no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

All 6 modified files verified as present, all 3 commits exist in git log.
