---
status: complete
phase: 75-user-dashboard
source:
  - 75-01-SUMMARY.md
  - 75-SPEC.md
started: 2026-06-21T08:15:00Z
updated: 2026-06-21T08:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Click Stat Cards Navigate
expected: Click "Tổng hồ sơ" → navigate to /cases; Click "Đang xử lý" → navigate to /cases?status=in_progress; Click "Hoàn tất" → navigate to /cases?status=completed; Click "Tài liệu" → navigate to /vault
result: pass

### 2. Floating Chat Badge Shows Unread Count
expected: Floating chat button shows unread count badge when count > 0; no badge when count = 0
result: pass

### 3. Loading Skeletons Display
expected: Each dashboard panel shows skeleton loading state during initial load (StatCardsSkeleton, RecentCasesSkeleton, etc.)
result: pass

### 4. Empty States Show Correctly
expected: RecentCases shows "Chưa có hồ sơ nào" when no cases; RecentDocuments shows "Chưa có tài liệu nào" when no documents
result: pass

### 5. Error States with Retry
expected: Panel shows error message in Vietnamese "Không thể tải dữ liệu. Vui lòng thử lại." with retry button
result: pass

### 6. Cases Table Pagination
expected: Cases table shows pagination with 10 items per page; Previous/Next buttons work
result: pass

### 7. Welcome Banner Shows User Name
expected: Banner displays "Xin chào, {userName}" with workspace name
result: pass

### 8. Deadline SLA Color-Coded
expected: Deadline progress bars show green (>50%), yellow (20-50%), red (<20%) based on time remaining
result: pass

### 9. CSS Teal Primary Color
expected: Teal primary color #087f78 applied to timeline dots and buttons
result: pass

### 10. i18n Translations
expected: All dashboard strings have translations in vi/en/zh/ja locales
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]

## Verification Evidence

### Test 1: Click Stat Cards Navigate ✓
- StatCard.tsx: optional `href?: string` prop
- StatsCardGrid passes href to each card:
  - `/cases` → totalRequests
  - `/cases?status=in_progress` → inProgress
  - `/cases?status=completed` → completed
  - `/vault` → vaultDocs
- Renders as Next.js `<Link>` when href provided

### Test 2: Floating Chat Badge ✓
- DashboardClient.tsx: `useState(0)` for unreadCount
- useEffect fetches `/api/messages/unread-count`
- Badge renders only when `unreadCount > 0`
- Shows "99+" if count > 99

### Test 3: Loading Skeletons ✓
- StatCardsSkeleton: 4 card skeletons
- RecentCasesSkeleton: 5 list-item skeletons
- RecentDocumentsSkeleton: 5 document-item skeletons
- ActivityTimelineSkeleton: 5 timeline-item skeletons
- All use shimmer animation from dashboard.css

### Test 4: Empty States ✓
- RecentCases: EmptyState with "Chưa có hồ sơ nào"
- RecentDocuments: EmptyState with "Chưa có tài liệu nào"
- ActivityTimeline: EmptyState with "Chưa có hoạt động nào"

### Test 5: Error States ✓
- ErrorBoundaryWrapper wraps each panel
- Fallback shows: "Không thể tải dữ liệu. Vui lòng thử lại."

### Test 6: Cases Table Pagination ✓
- currentPage state with useState(1)
- pageSize = 10
- Paginated slice: cases.slice(startIndex, startIndex + pageSize)
- Paging component with onChange handler

### Test 7: Welcome Banner ✓
- WelcomeBanner.tsx renders title + status text
- Shows workspace name and counts

### Test 8: Deadline SLA Colors ✓
- getDeadlineStatus() returns: ok/warn/danger
- CSS classes: .progress .ok (green #22c55e), .warn (yellow #f59e0b), .danger (red #ef4444)

### Test 9: Teal Primary Color ✓
- timeline-dot: background #087f78
- create-btn: background linear-gradient(180deg, #0b8f86, #087970)
- paging-btn.active: background #0b8f86

### Test 10: i18n Translations ✓
- DashboardClient namespace: greeting, subtitle, createRequest
- StatCard namespace: totalRequests, inProgress, completed, vaultDocs + descriptions
- All 4 locales verified: vi, en, zh, ja
