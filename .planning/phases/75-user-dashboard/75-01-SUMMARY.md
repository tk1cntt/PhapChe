---
phase: 75
plan: 01
subsystem: dashboard
tags:
  - user-dashboard
  - enhancement
  - navigation
  - real-time
  - loading-states
  - error-handling
dependency_graph:
  requires: []
  provides:
    - dashboard-clickable-stats
    - dashboard-floating-chat
    - dashboard-loading-states
    - dashboard-empty-states
    - dashboard-error-boundaries
  affects:
    - src/components/dashboard/StatCard.tsx
    - src/components/dashboard/DashboardClient.tsx
    - src/components/dashboard/RecentCases.tsx
    - src/components/dashboard/RecentDocuments.tsx
    - src/components/dashboard/ActivityTimeline.tsx
    - src/app/api/messages/unread-count/route.ts
tech_stack:
  added:
    - Next.js Link (href prop)
    - useEffect for client-side fetch
    - ErrorBoundaryWrapper for error handling
    - EmptyState for empty panels
  patterns:
    - Client-side fetch with loading state
    - Optional href prop with conditional Link rendering
    - Per-panel error boundaries
    - Skeleton loading patterns
key_files:
  created:
    - src/app/api/messages/unread-count/route.ts
  modified:
    - src/components/dashboard/StatCard.tsx
    - src/components/dashboard/DashboardClient.tsx
    - src/components/dashboard/dashboard.css
    - src/components/dashboard/RecentCases.tsx
    - src/components/dashboard/RecentDocuments.tsx
    - src/components/dashboard/ActivityTimeline.tsx
decisions:
  - id: D-01
    decision: StatCard nhận optional href prop để dùng Next.js Link navigation
  - id: D-02
    decision: "Click 'Tổng hồ sơ' → navigate /cases"
  - id: D-03
    decision: "Click 'Đang xử lý' → navigate /cases?status=in_progress"
  - id: D-04
    decision: "Click 'Hoàn tất' → navigate /cases?status=completed"
  - id: D-05
    decision: "Click 'Tài liệu' → navigate /vault"
  - id: D-06
    decision: Client-side fetch unread count on mount via GET /api/messages/unread-count
  - id: D-07
    decision: Badge hiển thị chỉ khi count > 0
  - id: D-08
    decision: Initial state là 0 (không hiển thị badge)
  - id: D-09
    decision: Sử dụng skeleton components từ phase 73
  - id: D-10
    decision: Mỗi panel có dedicated skeleton variant
  - id: D-11
    decision: Component EmptyState từ phase 73 với icon + message + optional action
  - id: D-12
    decision: "Recent cases empty: 'Chưa có hồ sơ nào'"
  - id: D-13
    decision: "Recent documents empty: 'Chưa có tài liệu nào'"
  - id: D-14
    decision: Mỗi panel có error boundary riêng
  - id: D-15
    decision: Retry button gọi lại data fetching
  - id: D-16
    decision: "Error message tiếng Việt: 'Không thể tải dữ liệu. Vui lòng thử lại.'"
  - id: D-17
    decision: Client-side pagination với state trong DashboardClient (ALREADY EXISTS)
  - id: D-18
    decision: Page size: 10 items per page (ALREADY EXISTS)
  - id: D-19
    decision: Pagination controls: Previous, page numbers, Next (ALREADY EXISTS)
  - id: D-20
    decision: Sử dụng custom CSS classes (không Tailwind)
  - id: D-21
    decision: Teal primary color: #087f78
  - id: D-22
    decision: CSS file: src/components/dashboard/dashboard.css
  - id: D-23
    decision: Namespace: DashboardClient
  - id: D-24
    decision: "Keys: greeting, subtitle, createRequest, stat labels, panel titles"
metrics:
  duration: 15m
  completed: "2026-06-21T07:52:00Z"
  tasks_completed: 8
  files_created: 1
  files_modified: 8
status: complete
---

# Phase 75 Plan 01: User Dashboard Enhancement Summary

**Objective:** Enhance existing User Dashboard với clickable stat cards, floating chat badge với dynamic unread count, loading/error/empty states, pagination verification, CSS matching, và i18n verification.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Make Stat Cards Clickable | COMPLETE | b7e20a9 |
| 2 | Floating Chat Badge with Dynamic Unread Count | COMPLETE | 0e45a2f |
| 3 | Loading States for Each Panel | COMPLETE | eee2dd0 |
| 4 | Empty States for Each Panel | COMPLETE | a54f77b |
| 5 | Error States with Retry Button | COMPLETE | 3412649 |
| 6 | Pagination Verification in Cases Table | VERIFIED | eed00f0 |
| 7 | CSS Verification and Enhancement | VERIFIED | 78a1775 |
| 8 | i18n Verification | VERIFIED | 7eba660 |

## Artifacts Produced

### New Files
- `src/app/api/messages/unread-count/route.ts` — API endpoint for unread message count

### Modified Files
- `src/components/dashboard/StatCard.tsx` — Added optional href prop with Next.js Link
- `src/components/dashboard/DashboardClient.tsx` — Added useState for unreadCount, useEffect for API fetch, skeleton components, ErrorBoundaryWrapper
- `src/components/dashboard/dashboard.css` — Added .stat-card-link with cursor-pointer
- `src/components/dashboard/RecentCases.tsx` — Added EmptyState for empty cases
- `src/components/dashboard/RecentDocuments.tsx` — Added EmptyState for empty documents
- `src/components/dashboard/ActivityTimeline.tsx` — Added EmptyState for empty activities

## Must-Haves Verification

| Must-Have | Status | Evidence |
|-----------|--------|----------|
| User can see 4 stat cards with real counts from Prisma | DONE | Server component fetches from Prisma, passes as props |
| User can click stat card and navigate to relevant page | DONE | href prop with Next.js Link, CSS cursor-pointer |
| Floating chat button shows unread count badge when count > 0 | DONE | useEffect fetches /api/messages/unread-count |
| Each dashboard panel has loading skeleton during initial load | DONE | StatCardsSkeleton, RecentCasesSkeleton, etc. |
| Each dashboard panel shows empty state when no data | DONE | EmptyState imported and used in RecentCases, RecentDocuments, ActivityTimeline |
| Each dashboard panel shows error state with retry button | DONE | ErrorBoundaryWrapper wraps each panel |
| Cases table pagination works (10 items per page) | VERIFIED | Already implemented with Paging component |

## Commits

| Hash | Message |
|------|---------|
| b7e20a9 | feat(75): make stat cards clickable with href prop |
| 0e45a2f | feat(75): floating chat badge with dynamic unread count |
| eee2dd0 | feat(75): add loading states for dashboard panels |
| a54f77b | feat(75): add empty states for dashboard panels |
| 3412649 | feat(75): add error boundaries with retry for dashboard panels |
| eed00f0 | feat(75): verify pagination in cases table |
| 78a1775 | feat(75): verify CSS and enhancement |
| 7eba660 | feat(75): verify i18n for dashboard |

## Deviations from Plan

**None - plan executed exactly as written.**

All 8 tasks completed as specified:
- StatCard receives href prop and renders as Next.js Link
- Floating chat fetches unread count from API on mount
- Loading skeletons created for each panel
- EmptyState used for RecentCases, RecentDocuments, ActivityTimeline
- ErrorBoundaryWrapper wraps each panel with Vietnamese error message
- Pagination verified (already implemented)
- CSS verified (#087f78 teal color used throughout)
- i18n verified for all 4 locales (vi/en/zh/ja)

## Security Notes

| Threat ID | Category | Disposition | Mitigation |
|-----------|----------|-------------|------------|
| T-75-01 | Information Disclosure | MITIGATED | requireAppSession() ensures user can only query own messages |
| T-75-02 | Tampering | ACCEPTED | Standard Next.js Link navigation; URL params filtered by server |

## Threat Flags

None - no new security surface introduced.

## Known Stubs

None - all components are wired with real data.

## Self-Check: PASSED

- [x] All 8 tasks committed
- [x] New API endpoint created (src/app/api/messages/unread-count/route.ts)
- [x] StatCard.tsx modified with href prop
- [x] DashboardClient.tsx modified with unreadCount, isLoading, skeletons
- [x] dashboard.css modified with .stat-card-link
- [x] EmptyState added to RecentCases, RecentDocuments, ActivityTimeline
- [x] ErrorBoundaryWrapper added to all panels
- [x] i18n verified for all 4 locales
