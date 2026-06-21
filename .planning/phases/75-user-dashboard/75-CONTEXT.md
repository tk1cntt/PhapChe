# Phase 75: User Dashboard - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

## Phase Boundary

User Dashboard hiển thị real data từ database với 6 panels (welcome, stats, cases, deadlines, documents, activity), stat cards clickable, và floating chat button với unread count.

## Requirements (locked via SPEC.md)

**8 requirements are locked.** See `75-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `75-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Server-side data fetching (Prisma queries) - đã done
- DashboardClient props interface - đã done
- 9 sub-components: WelcomeBanner, StatCard, RecentCases, DeadlineSLA, RecentDocuments, ActivityTimeline, CasesTable, ToolbarCard
- Clickable stat cards navigate to relevant pages
- Floating chat button với dynamic unread count
- Loading states cho từng panel
- Error states với retry logic
- Empty states khi no data

**Out of scope (from SPEC.md):**
- Real-time updates (SSE/WebSocket) - defer to v2.3
- Push notifications - separate feature
- Custom dashboard layout builder - overbuild cho MVP
- Analytics/reporting - separate admin feature
- Message sending from chat - MSG phase (77)

## Implementation Decisions

### Clickable Stat Cards

- **D-01:** StatCard nhận `onClick` prop hoặc `href` prop để navigate
- **D-02:** Click vào "Tổng hồ sơ" → navigate `/cases`
- **D-03:** Click vào "Đang xử lý" → navigate `/cases?status=in_progress`
- **D-04:** Click vào "Hoàn tất" → navigate `/cases?status=completed`
- **D-05:** Click vào "Tài liệu" → navigate `/vault` (hoặc `/admin/vault` tùy role)

### Floating Chat Badge

- **D-06:** Client-side fetch unread count on mount via `GET /api/messages/unread-count`
- **D-07:** Badge hiển thị chỉ khi count > 0
- **D-08:** Initial state là "0" (không hiển thị badge)

### Loading States

- **D-09:** Sử dụng skeleton components từ phase 73 foundation
- **D-10:** Mỗi panel có dedicated skeleton variant (StatSkeleton, RecentCasesSkeleton, etc.)

### Empty States

- **D-11:** Component `EmptyState` từ phase 73 với icon + message + optional action
- **D-12:** Recent cases empty: "Chưa có hồ sơ nào"
- **D-13:** Recent documents empty: "Chưa có tài liệu nào"

### Error States

- **D-14:** Mỗi panel có error boundary riêng
- **D-15:** Retry button gọi lại data fetching
- **D-16:** Error message tiếng Việt: "Không thể tải dữ liệu. Vui lòng thử lại."

### Cases Table Pagination

- **D-17:** Client-side pagination với state trong DashboardClient
- **D-18:** Page size: 10 items per page
- **D-19:** Pagination controls: Previous, page numbers, Next

### CSS Matching

- **D-20:** Sử dụng custom CSS classes (không Tailwind)
- **D-21:** Teal primary color: #087f78
- **D-22:** CSS file: `src/components/dashboard/dashboard.css`

### i18n

- **D-23:** Namespace: `DashboardClient`
- **D-24:** Keys: greeting, subtitle, createRequest, stat labels, panel titles

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 73 (Foundation)
- `.planning/phases/73-shared-foundation/73-SPEC.md` — Loading skeletons, EmptyState, ErrorBoundary components

### UI Standards
- `src/components/dashboard/dashboard.css` — Existing CSS patterns
- `src/components/dashboard/StatCard.tsx` — StatCard component with variants
- `src/components/dashboard/DashboardClient.tsx` — Props interface

### Backend
- `src/app/[locale]/dashboard/page.tsx` — Existing Prisma queries (server component)
- `src/lib/prisma.ts` — Prisma client

### i18n
- Need to verify existing translations in `messages/vi.json`, `messages/en.json`

## Existing Code Insights

### Reusable Assets
- `StatCard` component: Already exists with variant props (blue, green, orange, purple)
- `DashboardClient.tsx`: Props interface already defined (CaseItem, StatsData, WelcomeData, DocumentItem, ActivityItem)
- `dashboard.css`: Grid layouts and panel styles already defined

### Established Patterns
- Server component fetches data → passes to client component as props
- Prisma queries already optimized with `take: 10` for recent items
- Action text generation for audit events (Vietnamese)

### Integration Points
- Floating chat button at `DashboardClient.tsx` line 117-119
- Stat cards click handlers need to be added to `StatsCardGrid`
- Messages API: `/api/messages/unread-count` endpoint needed

## Specific Ideas

- StatCard nên có variant `href` prop để dùng Next.js `<Link>` thay vì `onClick`
- SLA calculation logic cần verify trong `DeadlineSLA` component

## Deferred Ideas

None — discussion stayed within phase scope

---

*Phase: 75-user-dashboard*
*Context gathered: 2026-06-21*
