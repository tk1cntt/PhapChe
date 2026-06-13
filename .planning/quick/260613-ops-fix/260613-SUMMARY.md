---
phase: "quick"
quick_id: "260613-ops-fix"
slug: "ops-fix"
status: "complete"
date: "2026-06-13"
commit: "b499c0d"
---

# Quick Task 260613-ops-fix: Fix Admin Operations Page Bugs

## Status: ✅ COMPLETE

## Tasks Completed

### Task 1: Update menu link ✅
- **File:** `src/components/layout/AdminLayout.tsx`
- **Change:** `href: '/vi/admin/ops'` → `href: '/vi/admin/operations'`
- **Also fixed:** `src/legacy/components/Sidebar.tsx`

### Task 2: Remove duplicate menu
- **Result:** No duplicate menu found - operations page uses only AdminLayout navigation
- **Status:** ✅ No action needed

### Task 3: Fix timeline scroll layout ✅
- **File:** `src/components/admin/AdminOperationsTimeline.tsx`
- **Change:** Added `maxHeight: 420` and `overflowY: 'auto'` to timeline container
- **Result:** Timeline shows fixed initial view, scrolls for more items

## Commits

| Hash | Message |
|------|---------|
| `b499c0d` | fix(ops): update menu links, fix timeline scroll layout |

