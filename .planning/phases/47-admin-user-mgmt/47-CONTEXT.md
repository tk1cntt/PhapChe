# Phase 47: User Management — Real Data Integration - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Clone admin User Management components từ `src/legacy/` sang `src/components/admin/`, kết nối User Management page với Prisma queries thực tế và API routes cho CRUD operations.

**Scope:**
- Layout và page structure của User Management (/vi/admin/users)
- 4 Stat cards (Total, Active, Workspaces, Pending)
- Role pills với counts (6 roles)
- User table với 8 columns (checkbox, name, email, role, workspace, status, lastActive, action)
- Search và filter toolbar (debounced search, role filter, workspace filter)
- API routes cho user CRUD (list, create, update, delete)
- Pagination support

**Out of scope (sẽ theo phase riêng):**
- User detail/edit modal → Phase 47 (this phase) hoặc Phase 48
- Invite user flow → Phase 48 (Admin Requests)
- Role change workflow → Phase 49
- User permissions → Phase 52

</domain>

<decisions>
## Implementation Decisions

### Source Structure
- **D-01:** Components lưu ở `src/components/admin/` — không phải `src/legacy/`
- **D-02:** Clone từng component riêng biệt (1 file/component) từ legacy - giống Phase 46

### Data Fetching
- **D-03:** Server component fetch data hoặc dùng API routes - tương tự Settings phase
- **D-04:** API routes ở `src/app/api/admin/users/` cho CRUD operations

### Styling
- **D-05:** Convert inline styles → Tailwind CSS - consistent với Phase 46

### Components to Create
- **D-06:** Clone components: UserStatCard (reused from AdminStatCard), RolePills, UserTable, UserToolbar, UserPagination

### API Endpoints Needed
- **D-07:** GET /api/admin/users — list users với pagination, search, filter
- **D-08:** POST /api/admin/users — create user
- **D-09:** PUT /api/admin/users/[id] — update user
- **D-10:** DELETE /api/admin/users/[id] — deactivate user

### i18n
- **D-11:** Sử dụng translations từ `src/messages/vi.json` và `src/messages/en.json` với namespace 'AdminUsers'

</decisions>

<canonical_refs>
## Canonical References

### Phase 46 (Reference Pattern)
- `src/components/admin/` — Admin components đã được tạo ở Phase 46
- `src/app/[locale]/admin/page.tsx` — Server component pattern với Prisma queries

### Legacy Source
- `src/legacy/[locale]/admin/users/page.tsx` — Page structure
- `src/legacy/[locale]/admin/users/UsersPageClient.tsx` — Client component với mock data
- `src/legacy/[locale]/admin/users/AdminUsersTable.tsx` — Table component
- `src/legacy/api/users/route.ts` — API route pattern

### Phase 45 (Settings — Reference for API Routes)
- `src/app/api/settings/profile/route.ts` — API route pattern
- `src/components/settings/` — Component structure pattern

### i18n
- `src/messages/vi.json` — AdminUsers translations
- `src/messages/en.json` — AdminUsers translations

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `AdminStatCard` từ Phase 46 — có thể reuse cho User stats
- `AdminToolbar` pattern từ Phase 46 — cho search/filter toolbar
- Pagination logic từ Settings phase hoặc existing hooks

### Established Patterns
- Server component → Prisma → Client component pattern
- API routes với session validation
- Tailwind CSS với variant colors

### Integration Points
- User Management page: `src/app/[locale]/admin/users/page.tsx`
- Admin components: `src/components/admin/`
- Admin API: `src/app/api/admin/users/`

</codebase_context>

<specifics>
## Specific Ideas

- Stat cards: 4 cards (Total: users count, Active: active count, Workspaces: unique workspace count, Pending: unverified/inactive count)
- Role pills: 6 roles (customer, specialist, reviewer, coordinator_admin, super_admin, audit_admin) với counts
- User table: 8 columns (checkbox, name+avatar, email, role badge, workspace, status badge, lastActive, action link)
- Search: debounced 300ms, queries name và email
- Filters: role dropdown, workspace dropdown
- Pagination: page + pageSize, total count

</specifics>

<deferred>
## Deferred Ideas

- User detail/edit modal — belong in Phase 48
- Invite user flow — belong in Phase 48
- Role change audit trail — belong in Phase 49
- Bulk actions (delete, deactivate) — Phase 48+

---
*Phase: 47-User Management*
*Context gathered: 2026-06-13*
