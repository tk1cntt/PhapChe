---
quick_id: 260613-nts
slug: phân-trang-thiếu-next-sang-trang-mới
description: Fix pagination missing next/prev buttons on admin users page
date: 2026-06-13
status: complete
must_haves:
  - truth: UserTable component has proper pagination controls
  - artifact: src/components/admin/UserTable.tsx
---

# Quick Plan: Fix Pagination on Admin Users Page

## Task 1: Add Next/Previous Buttons and Page Numbers
- **Files:** `src/components/admin/UserTable.tsx`
- **Action:** Add Previous/Next navigation buttons and page number buttons with ellipsis
- **Verify:** Check component renders pagination footer with navigation controls
- **Done:** when pagination footer has working prev/next buttons and page numbers

## Task 2: Fix Page Size Selector Behavior
- **Files:** `src/components/admin/UserTable.tsx`
- **Action:** Update page size selector to reset to page 1 when changed
- **Verify:** Changing page size goes back to first page
- **Done:** when page size change triggers page 1

---

**Commit:** 3bb72db
