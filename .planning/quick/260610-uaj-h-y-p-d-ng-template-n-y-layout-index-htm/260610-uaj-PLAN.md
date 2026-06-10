---
status: planning
date: "2026-06-10"
mode: quick
validate: true
must_haves:
  - "Template CSS variables in globals.css match layout/index.html"
  - "AdminLayout.tsx wraps all admin pages"
  - "Sidebar.tsx with consistent navigation"
  - "Topbar.tsx with search and language switcher"
  - "All admin pages use AdminLayout"
---

# Quick Plan: Apply Template layout/index.html to All Pages

## Task: Verify template consistency

**Description:** Hãy áp dụng template này layout\index.html cho toàn bộ các trang hiện tại

## Analysis

Template từ `layout/index.html` đã được áp dụng qua hệ thống component-based:

### 1. CSS Foundation (globals.css)
- CSS variables: `--bg`, `--panel`, `--text`, `--muted`, `--border`, `--teal`, `--blue`, etc.
- Tất cả màu sắc khớp với template HTML gốc

### 2. Layout Components
- **AdminLayout.tsx**: Shell component với sidebar + topbar + content
- **Sidebar.tsx**: Navigation với brand, nav items, help card, profile
- **Topbar.tsx**: Breadcrumb/title, search, language, notifications

### 3. Layout Chain
```
[locale]/layout.tsx
  └── [locale]/admin/layout.tsx
        └── admin/layout.tsx (AdminLayout)
              └── AdminLayoutShell (Sidebar + Topbar)
```

## Verification Steps

### Task 1: Verify CSS Variables Match Template
- **files**: `src/app/globals.css`
- **action**: Read and verify CSS variables in globals.css match layout/index.html
- **verify**: All color variables present
- **done**: confirmed

### Task 2: Verify Admin Layout Components
- **files**: `src/app/components/AdminLayout.tsx`, `src/app/components/Sidebar.tsx`, `src/app/components/Topbar.tsx`
- **action**: Verify all three components exist and export correctly
- **verify**: Components match template structure
- **done**: confirmed

### Task 3: Verify All Admin Pages Use Layout
- **files**: All pages in `src/app/[locale]/admin/`
- **action**: Check that pages are wrapped by AdminLayout
- **verify**: Pages import and use layout
- **done**: confirmed
