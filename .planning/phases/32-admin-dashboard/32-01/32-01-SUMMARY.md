---
phase: 32
plan: 01
slug: admin-dashboard-stat-cards
status: completed
completed: 2026-06-11
requirements: [ADMIN-DASH-01, ADMIN-DASH-02, ADMIN-DASH-03, ADMIN-DASH-04]
commits:
  - 2ef5069: feat(32-01): create AdminStatCard component with variant props
  - 9b38bf2: feat(32-01): create AdminBanner component with system status
  - 9077499: feat(32-01): create Admin Dashboard page with stat cards and banner
duration_minutes: 5
---

# Phase 32 Plan 01 Summary: Admin Dashboard Stat Cards & Banner

## One-liner

Admin Dashboard page with 4 stat cards (variant-styled) and system status banner matching template design.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create Admin Dashboard page | 9077499 | src/app/admin/page.tsx |
| 2 | Create AdminStatCard component | 2ef5069 | src/app/components/admin/AdminStatCard.tsx |
| 3 | Create AdminBanner component | 9b38bf2 | src/app/components/admin/AdminBanner.tsx |

## Key Decisions

- Used inline styles with CSS variables from UI-SPEC for template matching
- AdminStatCard accepts `variant` prop for blue/green/orange/red styling
- AdminBanner accepts optional `title` and `description` props with defaults

## Acceptance Criteria Verification

All criteria passed:
- `grep "Admin Dashboard" src/app/admin/page.tsx` - FOUND
- `grep "Tổng người dùng" src/app/admin/page.tsx` - FOUND
- `grep "Workspaces" src/app/admin/page.tsx` - FOUND
- `grep "Sắp quá SLA" src/app/admin/page.tsx` - FOUND
- `grep "Cảnh báo audit" src/app/admin/page.tsx` - FOUND
- `grep "AdminBanner" src/app/admin/page.tsx` - FOUND
- `grep "AdminStatCard" src/app/admin/page.tsx` - FOUND

## Files Created/Modified

### src/app/admin/page.tsx
- Page route for `/vi/admin`
- Page header with h1 "Admin Dashboard" and subtitle
- Two action buttons: "Xuất báo cáo" (ghost) and "Tạo hồ sơ mới" (primary gradient)
- Renders AdminBanner component
- Renders 4 AdminStatCard components with correct values:
  - Card 1 (blue): Tổng người dùng - 128
  - Card 2 (green): Workspaces - 12
  - Card 3 (orange): Sắp quá SLA - 6
  - Card 4 (red): Cảnh báo audit - 3

### src/app/components/admin/AdminStatCard.tsx
- Props: `variant`, `title`, `value`, `description`, `icon`
- Height: 126px, border-radius: 15px
- Icon container: 62x62px with gradient backgrounds per variant
- Title: 14px/600, Value: 30px/800, Description: 13px/500

### src/app/components/admin/AdminBanner.tsx
- Background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)
- Icon: 64x64px shield with checkmark, teal gradient
- Two action buttons: "Xem audit" and "Điều phối workload"
- Default title: "Hệ thống đang hoạt động ổn định"

## Tech Stack

- **Framework:** Next.js 15 App Router
- **Styling:** Inline styles with CSS variables
- **Icons:** Inline SVG (Lucide-style)
- **Fonts:** Inter (Google Fonts)

## Deviations from Plan

None - plan executed exactly as written.

## Notes

- Build errors in other files (unrelated to this plan) were not addressed per scope boundary rules
- Components use inline styles to match template CSS exactly as specified in UI-SPEC
