---
status: resolved
trigger: "Đổi ngôn ngữ trong admin area → redirect về /admin/dashboard và màn hình trắng"
created: 2026-07-22
updated: 2026-07-23
---

# Debug Session: language-switch-blank-dashboard

## Symptoms

- expected_behavior: "Chuyển ngôn ngữ giữ nguyên trang hiện tại, chỉ đổi locale trong URL (VD: /vi/admin/requests → /zh/admin/requests)"
- actual_behavior: "Chuyển ngôn ngữ → redirect về /zh/admin/dashboard, dashboard render blank"
- error_messages: "Không có error console/network"
- timeline: "Sau các lần fix login redirect loop. Chỉ xảy ra với user specialist/reviewer khi đang ở admin sub-page."
- reproduction: "1. Login specialist.demo@example.test. 2. Vào /vi/admin/requests. 3. Click đổi ngôn ngữ sang zh. 4. Redirect về /zh/admin/dashboard."

## Root Cause Analysis

### Flow trace

```
LanguageSwitcher: set preferred-locale=zh cookie → router.push('/zh/admin/requests')
  ↓
Middleware: locale redirect (zh matches) → i18n routing → session gate (cookie OK) → PASS
  ↓
Admin layout: requireAppSession() → OK (role: specialist)
  Gate 1: ADMIN_ROLES includes 'specialist' → PASS
  Gate 2: extractRouteKey('/zh/admin/requests') = 'requests'
           canAccessRoute('requests', ['specialist'])
           ADMIN_ROUTE_GUARDS['requests'] = ['super_admin', 'coordinator_admin']
           'specialist' ∉ ['super_admin', 'coordinator_admin'] → FAIL
  ↓
redirect('/zh/admin/dashboard') → blank page
```

### Inconsistency giữa 3 nguồn permission (trước fix)

| Nguồn | requests roles |
|-------|---------------|
| Sidebar `requiredRoles` (AdminLayout.tsx:81) | admin + **specialist** + **reviewer** |
| `MENU_VISIBILITY` (role-config.ts:24) | **admin only** ❌ |
| `ADMIN_ROUTE_GUARDS` (role-config.ts:50) | **admin only** ❌ |

Sidebar hiển thị link Requests cho specialist/reviewer → họ click vào được (router push client-side → không re-trigger layout). Nhưng khi chuyển ngôn ngữ → `router.push()` gây full server navigation → admin layout re-render → Gate 2 reject → redirect dashboard.

TAB_VISIBILITY đã phân quyền tab-level: specialist thấy workbench, reviewer thấy review → không cần block ở route-level.

## Resolution

- root_cause: "ADMIN_ROUTE_GUARDS['requests'] và MENU_VISIBILITY['requests'] chỉ cho phép super_admin + coordinator_admin, trong khi sidebar AdminLayout hiển thị requests link cho cả specialist + reviewer. Khi chuyển ngôn ngữ → full server re-render → admin layout Gate 2 reject specialist/reviewer → redirect dashboard."
- fix: "Đồng bộ ADMIN_ROUTE_GUARDS['requests'] và MENU_VISIBILITY['requests'] về giống sidebar: thêm specialist + review vào cả hai."
- verification: "npx vitest run src/lib/security/__tests__/role-config.test.ts — 34/34 passed (6 tests mới cho canAccessRoute). Build production pass. Server start OK."
- files_changed:
  - "src/lib/security/role-config.ts — ADMIN_ROUTE_GUARDS['requests'] + specialist, reviewer; MENU_VISIBILITY['requests'] + specialist, reviewer"
  - "src/lib/security/__tests__/role-config.test.ts — 6 tests mới verify canAccessRoute cho specialist/reviewer"
