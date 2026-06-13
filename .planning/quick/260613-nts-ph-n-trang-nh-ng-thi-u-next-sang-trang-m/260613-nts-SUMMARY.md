---
quick_id: 260613-nts
status: complete
date: 2026-06-13
commit: 3bb72db
---

# Summary: Fix Pagination on Admin Users Page

## Completed Tasks

### Task 1: Add Next/Previous Buttons and Page Numbers ✅
- **File:** `src/components/admin/UserTable.tsx`
- **Action:** Added `generatePageNumbers()` function for intelligent page number display
- Added Previous/Next navigation buttons with disabled state
- Added page number buttons with ellipsis for large page counts
- Buttons styled to match existing design system

### Task 2: Fix Page Size Selector Behavior ✅
- **File:** `src/components/admin/UserTable.tsx`
- **Action:** Changed page size selector to call `pagination.onChange(1, ...)` to reset to page 1
- Previous behavior kept current page which caused issues

## Changes Made
- 1 file changed: `src/components/admin/UserTable.tsx`
- +121 lines, -21 lines
- Commit: `3bb72db`

## Verification
- Refresh `/vi/admin/users` page
- Pagination footer should now show:
  - Previous/Next buttons
  - Page number buttons (1, 2, 3, ..., last page)
  - Working page size selector
