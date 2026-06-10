---
phase: 25-pagination-search
plan: "01"
subsystem: admin
tags: [pagination, search, filter, URL-persistence, TanStack-Query]
dependency_graph:
  requires: ["24-01"]
  provides: ["usePaginationParams", "useDebounce", "paginated-APIs", "paginated-tables"]
  affects: ["admin/requests", "admin/users", "admin/audit"]
tech_stack:
  added:
    - usePaginationParams (URL sync)
    - useDebounce (300ms search debounce)
  patterns:
    - Server-side pagination with skip/take
    - URL query params for page/pageSize/search/filters
    - Column filter dropdowns in AntD Table
key_files:
  created:
    - src/lib/hooks/usePaginationParams.ts
    - src/lib/hooks/useDebounce.ts
    - src/hooks/useUsers.ts
    - src/hooks/useAuditEvents.ts
  modified:
    - src/app/api/requests/route.ts
    - src/app/api/users/route.ts
    - src/app/api/audit/events/route.ts
    - src/app/admin/layout.tsx
    - src/app/[locale]/admin/requests/page.tsx
    - src/app/[locale]/admin/users/UsersPageClient.tsx
    - src/app/[locale]/admin/audit/page.tsx
    - src/app/[locale]/admin/users/AdminUsersTable.tsx
    - src/app/[locale]/admin/ops/AdminOpsTables.tsx
decisions:
  - "Server-side pagination: API returns { data, total, page, pageSize } for efficient large dataset handling"
  - "URL sync pattern: usePaginationParams reads/writes URL query params for bookmarkable URLs"
  - "300ms debounce: useDebounce delays search input to reduce API calls"
  - "Column filters: AntD Table filters prop syncs with URL via setFilter"
metrics:
  duration: ~8 minutes
  completed_date: "2026-06-10"
---

# Phase 25 Plan 01: Server-Side Pagination + Search/Filter with URL Persistence

## One-Liner

Implemented server-side pagination with page sizes 10/25/50, global search with 300ms debounce, column filters, and full URL state persistence across admin tables.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `8396a6b` | Add usePaginationParams hook for URL sync |
| Task 2 | `ac0c37d` | Add useDebounce hook for search input |
| Task 3 | `d37ccd4` | Add server-side pagination to API routes |
| Task 4 | `01b3942` | Enhance query hooks with pagination support |
| Task 5 | `0175284` | Add global search bar to admin header |
| Task 6 | `4e58b9b` | Add paginated admin table pages |
| Task 7 | `3238905` | Update table components with pagination and filters |

## Requirements Satisfied

| Requirement | Description | Status |
|-------------|-------------|--------|
| PAGE-01 | Server-side pagination with sizes 10/25/50 | Complete |
| PAGE-02 | Page state synced to URL | Complete |
| PAGE-03 | Server fetches only requested page | Complete |
| SCH-01 | Global search bar in admin header | Complete |
| SCH-02 | Column filters in table headers | Complete |
| SCH-03 | 300ms debounce on search | Complete |
| SCH-04 | Search state persisted in URL | Complete |

## Key Features Implemented

### 1. usePaginationParams Hook
- Reads/writes URL query params: `page`, `pageSize`, `search`, `filter_*`
- Provides: `setPage`, `setPageSize`, `setSearch`, `setFilter`, `clearFilters`
- Enforces max pageSize of 100 (T-25-01 mitigation)

### 2. useDebounce Hook
- `useDebounce(value, delay)` returns debounced value
- `useDebouncedCallback(fn, delay)` returns debounced function
- Used with 300ms delay for search input

### 3. API Routes with Pagination
All three API routes updated:
- `GET /api/requests` - pagination + search + status filter
- `GET /api/users` - pagination + search + role filter
- `GET /api/audit/events` - pagination + search + action filter

Response format: `{ data: [], total: number, page: number, pageSize: number }`

### 4. Query Hooks
- `useRequests(workspaceId, options)` - enhanced with pagination
- `useUsers(workspaceId, options)` - new hook
- `useAuditEvents(options)` - new hook

### 5. Global Search Bar
- Input.Search component in admin header
- 300ms debounce before navigation
- Navigates to `/admin/requests?search={value}&page=1`

### 6. Paginated Admin Pages
- **Requests**: Table with status filter, pagination controls
- **Users**: Table with role filter, pagination controls
- **Audit**: Table with action filter, pagination controls

All pages show: `Tong {total} ban ghi` in pagination footer.

### 7. Table Components Updated
- `AdminUsersTable`: Optional pagination prop added
- `AdminOpsTables`: Status filter dropdown in requests table

## Threat Mitigation

| Threat | Mitigation | Status |
|--------|------------|--------|
| T-25-01: DoS via large pageSize | max pageSize = 100 enforced server-side | Applied |
| T-25-02: Unauthorized data access | Workspace filter always applied | Applied |
| T-25-03: URL param tampering | Params validated before use in queries | Applied |

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| Tables display pagination with page sizes 10/25/50 | Verified |
| Page number persists in URL query params | Verified |
| Server fetches only requested page (server-side) | Verified |
| Global search bar visible in admin header | Verified |
| Column filters available in table headers | Verified |
| Search debounces by 300ms | Verified |
| Search/filter state persists in URL | Verified |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All commits verified:
- `8396a6b`: usePaginationParams hook created
- `ac0c37d`: useDebounce hook created
- `d37ccd4`: API routes updated with pagination
- `01b3942`: Query hooks enhanced/created
- `0175284`: Global search bar added to admin layout
- `4e58b9b`: Paginated admin pages created
- `3238905`: Table components updated
