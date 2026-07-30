# Quick Task 260730-mol: Remove UserLayout Sidebar + Nav Dropdown in Header

**Date:** 2026-07-30
**Description:** Bỏ sidebar bên trái của UserLayout (user dashboard). Chuyển navigation items vào dropdown menu ở góc phải header. Logo GitNexus Legal đặt bên trái của header. Giữ nguyên các chức năng hiện có (search, language switcher, theme toggle, user avatar).
**Mode:** quick

## Tasks

### Task 1: Restructure UserLayout header with nav dropdown + logo left

- **files:** `src/components/layout/UserLayout.tsx`
- **action:**
  1. Remove `<aside className="sidebar">` block entirely
  2. Move logo/brand (brand-mark + brand-text) to header left side
  3. Add a hamburger/menu icon button that triggers a DropdownMenu containing all nav items
  4. Place the menu dropdown in `.top-actions` area (right side, before existing actions)
  5. Keep existing `.top-actions` items: search, LanguageSwitcher, ThemeToggle, user circle
  6. Adjust `.app` container: remove `display: flex` if sidebar was the only flex child, or make `.main` full width
  7. Update `.sidebar-nav-container` reference if any exists
- **verify:**
  - No `<aside>` or `.sidebar` element in UserLayout output
  - Logo (brand-mark + brand-text) renders in header left
  - Menu icon button renders in top-actions, clicking it shows dropdown with all nav links
  - Search, LanguageSwitcher, ThemeToggle, user avatar all render in header right
  - UserLayout renders without TypeScript/JSX errors
- **done:** UserLayout renders sidebar-free layout with nav dropdown in header

### Task 2: Update layout CSS for sidebar-less UserLayout

- **files:** `src/styles/layout.css`
- **action:**
  1. Add styles for header-left brand area (`.header-brand`)
  2. Add styles for menu dropdown toggle button (`.menu-toggle-btn`)
  3. Add styles for nav dropdown menu items with icons
  4. Ensure `.app` works without sidebar (full-width main)
  5. Keep existing sidebar styles intact (AdminLayout still uses them)
- **verify:**
  - Header brand is visible on left
  - Menu toggle button is styled properly
  - Dropdown nav items display icons + labels
  - `.main` takes full width when no sidebar present
- **done:** CSS supports sidebar-less UserLayout with header brand and nav dropdown
