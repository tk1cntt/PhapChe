# Phase 14: antd-layout-redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 14-antd-layout-redesign
**Areas discussed:** Ant Design scope, Layout architecture, Theme & styling, Migration strategy, Responsive layout, Breadcrumb

---

## Ant Design Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Layout + Menu + Nav (Recommended) | Hybrid: antd for layout, Tailwind for small components | |
| Chỉ Layout | Only Layout/Sider/Menu from antd | |
| Toàn bộ Ant Design | Replace ALL components: Table, Form, Button, Badge, Card... | ✓ |

**User's choice:** Toàn bộ Ant Design
**Notes:** Full adoption — replace all existing UI components with antd equivalents.

---

## Layout Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Layout riêng từng role (Recommended) | Each route group has own Ant Design layout | ✓ |
| Giữ AdminShell hiện tại | Keep AdminShell, only swap inner components | |
| Layout route group phân cấp | Hierarchical: RootLayout → AdminLayout → pages | |

**User's choice:** Layout riêng từng role (Recommended)
**Notes:** Admin, specialist, customer, reviewer each get their own layout with appropriate Sider + Menu.

---

## Theme & Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Ant Design ConfigProvider làm theme chính (Recommended) | Migrate CSS variables to Ant Design tokens, Tailwind for layout only | ✓ |
| Giữ Tailwind làm chính | Ant Design minimal config, override via Tailwind classes | |
| Custom theme từ đầu | Build Ant Design theme from scratch matching brand | |

**User's choice:** Ant Design ConfigProvider làm theme chính (Recommended)
**Notes:** Ant Design design tokens drive the visual system. Tailwind retained for layout utility.

---

## Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Từng page một (Recommended) | Page-by-page migration, admin first | ✓ |
| Theo module dọc | End-to-end by role: admin → specialist → customer → reviewer | |
| Đại trà 1 lần | Bulk swap all at once | |

**User's choice:** Từng page một (Recommended)
**Notes:** Admin layout first, then admin pages one at a time, then other roles.

---

## Responsive Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Ant Design Sider responsive (Recommended) | Layout.Sider with breakpoint, auto-collapse on mobile | ✓ |
| Bottom tab nav mobile | Keep existing mobile nav pattern | |
| Drawer nav mobile | Use Ant Design Drawer for mobile navigation | |

**User's choice:** Ant Design Sider responsive (Recommended)

---

## Breadcrumb

| Option | Description | Selected |
|--------|-------------|----------|
| Auto breadcrumb từ route (Recommended) | Auto-generate from route path with Vietnamese labels | ✓ |
| Không breadcrumb | Keep layout minimal, no breadcrumbs | |

**User's choice:** Auto breadcrumb từ route (Recommended)

---

## Deferred Ideas

- Ant Design Charts (@ant-design/charts) — future enhancement
- Dark mode support — beyond current scope
- Ant Design i18n Vietnamese locale — non-blocking
