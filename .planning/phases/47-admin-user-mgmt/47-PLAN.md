---
phase: 47
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/admin/AdminStatGrid.tsx
  - src/components/admin/RolePills.tsx
  - src/components/admin/UserTable.tsx
  - src/components/admin/UserToolbar.tsx
  - src/components/admin/UserPagination.tsx
  - src/components/admin/UsersPageClient.tsx
  - src/app/[locale]/admin/users/page.tsx
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/users/[id]/route.ts
autonomous: false
requirements_addressed:
  - ADMIN-USER-REAL-01
must_haves:
  truths:
    - "GET /api/admin/users returns paginated user list with role/workspace data from Prisma"
    - "POST /api/admin/users creates new user with workspace membership"
    - "PUT /api/admin/users/[id] updates user details"
    - "DELETE /api/admin/users/[id] deactivates user (soft delete via isActive=false)"
    - "Users page shows 4 stat cards with real Prisma counts"
    - "Role pills show 6 roles with counts from Prisma aggregation"
    - "User table shows 8 columns with real data"
    - "Search filters by name/email using debounced input"
    - "Pagination works with URL sync via usePaginationParams"
  artifacts:
    - path: src/app/api/admin/users/route.ts
      provides: GET list, POST create user
      min_lines: 80
    - path: src/app/api/admin/users/[id]/route.ts
      provides: PUT update, DELETE deactivate user
      min_lines: 60
    - path: src/app/[locale]/admin/users/page.tsx
      provides: Server component with parallel Prisma queries
      min_lines: 70
    - path: src/components/admin/UsersPageClient.tsx
      provides: Main client component, stat cards, role pills
      min_lines: 100
    - path: src/components/admin/UserTable.tsx
      provides: 8-column user table with real data
      min_lines: 120
    - path: src/components/admin/UserToolbar.tsx
      provides: Search input, role filter, workspace filter
      min_lines: 60
    - path: src/components/admin/UserPagination.tsx
      provides: Pagination controls with page size selector
      min_lines: 40
  key_links:
    - from: src/app/[locale]/admin/users/page.tsx
      to: src/components/admin/UsersPageClient.tsx
      via: props passing initialStats, initialRoleStats, locale
    - from: src/components/admin/UsersPageClient.tsx
      to: src/app/api/admin/users/route.ts
      via: useQuery with queryKey ['users', ...params]
    - from: src/app/api/admin/users/route.ts
      to: prisma.user
      via: Prisma queries with include memberships
    - from: src/components/admin/UserTable.tsx
      to: src/components/admin/UsersPageClient.tsx
      via: dataSource, pagination props
---

<objective>
Clone admin User Management components from `src/legacy/` to `src/components/admin/`, connect with Prisma queries, and create API routes for CRUD operations. Per D-01, D-02, D-04, D-05: components at `src/components/admin/`, each cloned separately, API at `src/app/api/admin/users/`, Tailwind CSS conversion.
</objective>

<context>
@.planning/phases/47-admin-user-mgmt/47-CONTEXT.md
@.planning/phases/47-admin-user-mgmt/47-RESEARCH.md
@src/legacy/[locale]/admin/users/UsersPageClient.tsx
@src/legacy/[locale]/admin/users/AdminUsersTable.tsx
@src/legacy/[locale]/admin/components/AdminStatGrid.tsx
@src/components/admin/AdminStatCard.tsx
@src/components/admin/AdminToolbar.tsx
@src/app/[locale]/admin/page.tsx
@src/lib/hooks/usePaginationParams.ts
@src/lib/hooks/useDebounce.ts
@src/app/api/workspace/invite/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create AdminStatGrid Component and Users API Routes</name>
  <files>src/components/admin/AdminStatGrid.tsx, src/app/api/admin/users/route.ts, src/app/api/admin/users/[id]/route.ts</files>
  <read_first>
    - src/legacy/[locale]/admin/components/AdminStatGrid.tsx (source for StatCard and AdminStatGrid components)
    - src/components/admin/AdminStatCard.tsx (existing pattern for Tailwind conversion)
    - src/app/api/workspace/invite/route.ts (pattern for API route structure)
  </read_first>
  <action>
Migrate AdminStatGrid from legacy and create API routes.

**src/components/admin/AdminStatGrid.tsx:**
- Migrate from `src/legacy/[locale]/admin/components/AdminStatGrid.tsx`
- Export `StatCard` component with props: `{ title, value, description, icon?, variant? }`
- Export `AdminStatGrid` component with props: `{ cards: StatCardProps[] }`
- Use Tailwind CSS classes (reference AdminStatCard pattern for conversion)
- Variants: blue, green, orange, red, purple with matching gradient backgrounds

**src/app/api/admin/users/route.ts:**
- Export named `GET` handler for listing users with pagination, search, filters
- Export named `POST` handler for creating user (per D-08: POST creates new user)
- Use `requireAppSession()` from `@/lib/security/session` for auth validation
- Prisma query for GET:
  - Parse `page`, `pageSize`, `search`, `filter_role`, `filter_workspace` from URL params
  - Build `where` object with search (OR on name, email) and role/workspace filters via memberships relation
  - Use `prisma.user.findMany` with `include: { memberships: { include: { workspace: { select: { id, name } } } } }`
  - Return `{ data: users, total, page, pageSize }` JSON
- Prisma query for POST:
  - Validate email format with regex
  - Check if email already exists
  - Create user via `prisma.user.create({ data: { email, name, ... } })`
  - Create WorkspaceMembership for default workspace with 'customer' role
  - Return created user with 201 status

**src/app/api/admin/users/[id]/route.ts:**
- Export named `PUT` handler for updating user
- Export named `DELETE` handler for deactivating user (per D-10: soft delete via isActive=false)
- Use `requireAppSession()` for auth
- PUT: Update user fields (name, email, phone, timezone) via `prisma.user.update`
- DELETE: Set `isActive: false` via `prisma.user.update`, return 200
- Return 404 if user not found
- Return 500 on error with `{ error: 'Internal server error' }`
</action>
  <verify>
  <automated>
    # Check files exist
    test -f src/components/admin/AdminStatGrid.tsx && \
    test -f src/app/api/admin/users/route.ts && \
    test -f src/app/api/admin/users/[id]/route.ts && \
    # Verify exports
    grep -c "export.*StatCard" src/components/admin/AdminStatGrid.tsx && \
    grep -c "export.*AdminStatGrid" src/components/admin/AdminStatGrid.tsx && \
    grep -c "export async function GET" src/app/api/admin/users/route.ts && \
    grep -c "export async function POST" src/app/api/admin/users/route.ts && \
    grep -c "export async function PUT" src/app/api/admin/users/[id]/route.ts && \
    grep -c "export async function DELETE" src/app/api/admin/users/[id]/route.ts
  </automated>
  </verify>
  <acceptance_criteria>
    - AdminStatGrid.tsx exports StatCard and AdminStatGrid components
    - GET /api/admin/users returns paginated list with { data, total, page, pageSize }
    - POST /api/admin/users creates user and returns 201
    - PUT /api/admin/users/[id] updates user and returns 200
    - DELETE /api/admin/users/[id] sets isActive=false and returns 200
    - All endpoints validate session with requireAppSession()
  </acceptance_criteria>
  <done>
  AdminStatGrid migrated to src/components/admin/ with Tailwind CSS.
  API routes handle GET, POST, PUT, DELETE operations on users.
  Session validation protects all endpoints.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create Server Component Page with Prisma Queries</name>
  <files>src/app/[locale]/admin/users/page.tsx</files>
  <read_first>
    - src/app/[locale]/admin/page.tsx (server component pattern with Prisma queries)
    - src/legacy/[locale]/admin/users/UsersPageClient.tsx (legacy page structure)
  </read_first>
  <action>
Create server component page for User Management.

**src/app/[locale]/admin/users/page.tsx:**
- Export default async function accepting `{ params: Promise<{ locale: string }> }`
- Call `await requireAppSession()` to validate auth
- Execute parallel Prisma queries using `Promise.all` (per pattern from admin/page.tsx):
  1. `prisma.user.count()` - total users
  2. `prisma.user.count({ where: { isActive: true } })` - active users
  3. `prisma.user.count({ where: { emailVerified: false, createdAt: { gte: 7daysAgo } } })` - pending users
  4. `prisma.workspace.count({ where: { isActive: true } })` - workspaces
  5. Group memberships by role: `prisma.workspaceMembership.groupBy({ by: ['role'], _count: { role: true } })`
- Transform role counts to Record<string, number> object
- Transform stats to { total, active, pending, workspaces } object
- Render `<UsersPageClient>` with props:
  - `initialStats: stats`
  - `initialRoleStats: roleStats`
  - `locale: locale`
- Wrap in `<AdminLayout>` from `@/components/layout/AdminLayout`

Role priority constant for display:
```typescript
const ROLE_PRIORITY = {
  'super_admin': 1,
  'audit_admin': 2,
  'coordinator_admin': 3,
  'reviewer': 4,
  'specialist': 5,
  'customer': 6,
};
```
</action>
  <verify>
  <automated>
    test -f src/app/[locale]/admin/users/page.tsx && \
    grep -c "Promise.all" src/app/[locale]/admin/users/page.tsx && \
    grep -c "prisma.user.count" src/app/[locale]/admin/users/page.tsx && \
    grep -c "AdminLayout" src/app/[locale]/admin/users/page.tsx
  </automated>
  </verify>
  <acceptance_criteria>
    - Page fetches 5 Prisma queries in parallel via Promise.all
    - Stats object has { total, active, pending, workspaces }
    - roleStats is Record<string, number> from groupBy
    - Props passed to UsersPageClient: initialStats, initialRoleStats, locale
    - Wrapped in AdminLayout component
    - Page accessible at /vi/admin/users and /en/admin/users
  </acceptance_criteria>
  <done>
  Server component fetches 5 Prisma queries in parallel.
  Passes initialStats and initialRoleStats to UsersPageClient.
  Uses AdminLayout wrapper.
  Page accessible at /vi/admin/users and /en/admin/users.
  </done>
</task>

<task type="auto">
  <name>Task 3: Create User Management Client Components (UsersPageClient, RolePills)</name>
  <files>src/components/admin/UsersPageClient.tsx, src/components/admin/RolePills.tsx</files>
  <read_first>
    - src/legacy/[locale]/admin/users/UsersPageClient.tsx (source for client component)
    - src/components/admin/AdminStatGrid.tsx (migrated in Task 1)
    - src/lib/hooks/usePaginationParams.ts (pagination hook)
    - src/lib/hooks/useDebounce.ts (debounce hook)
  </read_first>
  <action>
Create the main client component and RolePills sub-component.

**src/components/admin/RolePills.tsx:**
- Props: `{ roleStats: Record<string, number>, translations: { role_customer, role_specialist, ... } }`
- Define `roleColors` mapping (per legacy file pattern):
  ```typescript
  const roleColors: Record<string, { bg: string; color: string }> = {
    customer: { bg: '#dbeafe', color: '#2563eb' },
    specialist: { bg: '#dbeafe', color: '#2563eb' },
    reviewer: { bg: '#ffedd5', color: '#ea580c' },
    coordinator_admin: { bg: '#ccfbf1', color: '#0f766e' },
    super_admin: { bg: '#ffe4e6', color: '#ef4444' },
    audit_admin: { bg: '#ede9fe', color: '#7c3aed' },
  };
  ```
- Render 6 role pills + pending pill
- Each pill: rounded-full badge with count bubble

**src/components/admin/UsersPageClient.tsx:**
- Props: `{ initialStats, initialRoleStats, locale }`
- Use `useTranslations('AdminUsers')` for i18n
- Initialize `usePaginationParams(10)` for URL-synced pagination
- Initialize `useDebounce(search, 300)` for debounced search
- Use `useQuery` from @tanstack/react-query:
  - Query key: `['users', { page, pageSize, search: debouncedSearch, filters }]`
  - Fetch to `/${locale}/api/admin/users` with URL params (CORRECT PATH per WARNING 2 fix)
  - Response type: `{ data: User[], total: number, page: number, pageSize: number }`
- Compose stat cards using `AdminStatGrid` from `@/components/admin/AdminStatGrid`
- Render `<RolePills>` with roleStats and translations
- Render `<UserToolbar>` with callbacks
- Render `<UserTable>` with users data and pagination config
- Handle loading state with `<Spin>` from antd
- Return null if no data and not loading

Per D-05: Convert inline styles to Tailwind CSS classes.
</action>
  <verify>
  <automated>
    test -f src/components/admin/UsersPageClient.tsx && \
    test -f src/components/admin/RolePills.tsx && \
    grep -c "useQuery" src/components/admin/UsersPageClient.tsx && \
    grep -c "usePaginationParams" src/components/admin/UsersPageClient.tsx && \
    grep -c "/api/admin/users" src/components/admin/UsersPageClient.tsx
  </automated>
  </verify>
  <acceptance_criteria>
    - UsersPageClient renders 4 stat cards with initialStats from server
    - RolePills shows 6 roles + pending with counts
    - useQuery fetches from /{locale}/api/admin/users (not /api/users)
    - Debounced search triggers API call after 300ms
    - URL stays in sync via usePaginationParams
    - Loading state shows Spin component
  </acceptance_criteria>
  <done>
  UsersPageClient renders 4 stat cards with initialStats from server.
  RolePills shows 6 roles + pending with counts.
  useQuery fetches from /api/admin/users with pagination params.
  Debounced search triggers API call after 300ms.
  URL stays in sync via usePaginationParams.
  </done>
</task>

<task type="auto">
  <name>Task 4: Create UserTable and UserToolbar Components</name>
  <files>src/components/admin/UserTable.tsx, src/components/admin/UserToolbar.tsx, src/components/admin/UserPagination.tsx</files>
  <read_first>
    - src/legacy/[locale]/admin/users/AdminUsersTable.tsx (source for UserTable)
    - src/components/admin/AdminToolbar.tsx (pattern for toolbar components)
  </read_first>
  <action>
Create UserTable, UserToolbar, and UserPagination components.

**src/components/admin/UserTable.tsx:**
- Props: `{ dataSource: User[], pagination: PaginationConfig }`
- Define UserRow type with 8 columns: checkbox, name, email, role, workspace, status, lastActive, action
- Define `statusColors` mapping: active (green), invited (orange), inactive (red)
- Define `roleColors` same as RolePills
- Grid layout with 8 columns matching legacy file:
  `52px 1.1fr 1.3fr 0.9fr 1.05fr 0.85fr 1fr 0.8fr`
- Render table header row with column labels (from t())
- Render data rows mapping each user:
  - Name: avatar circle with initials + name + role subtitle
  - Email: email address + role type subtitle
  - Role: pill badge with dot indicator
  - Workspace: workspace name + scope subtitle
  - Status: colored pill (active/invited/inactive)
  - Last Active: formatted date or '—'
  - Action: Link to user detail
- Include pagination footer with page size selector and total count
- Per D-05: Convert all inline styles to Tailwind CSS

**src/components/admin/UserToolbar.tsx:**
- Props: `{ searchValue, selectedRole, selectedWorkspace, onSearch, onRoleFilter, onWorkspaceFilter, onRefresh, onExport, translations }`
- Search input with magnifying glass icon (width ~370px, h-11)
- Filter dropdowns for Role and Workspace
- Action buttons: Refresh, Export, Columns
- All buttons use Tailwind CSS, consistent with AdminToolbar pattern

**src/components/admin/UserPagination.tsx:**
- Props: `{ current, pageSize, total, onChange, translations }`
- Page size selector: 10, 25, 50 options
- Total users count display
- Tailwind styling consistent with other admin components
</action>
  <verify>
  <automated>
    test -f src/components/admin/UserTable.tsx && \
    test -f src/components/admin/UserToolbar.tsx && \
    test -f src/components/admin/UserPagination.tsx && \
    grep -c "grid-cols" src/components/admin/UserTable.tsx
  </automated>
  </verify>
  <acceptance_criteria>
    - UserTable renders 8-column grid with real user data
    - Role badges show correct colors per role type
    - Status badges show active/invited/inactive states
    - UserToolbar has search, role filter, workspace filter, refresh, export buttons
    - UserPagination controls page size and displays total count
  </acceptance_criteria>
  <done>
  UserTable renders 8-column grid with real user data.
  Role badges show correct colors per role type.
  Status badges show active/invited/inactive states.
  UserToolbar has search, role filter, workspace filter, refresh, export buttons.
  UserPagination controls page size and displays total count.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 5: Verify User Management Page End-to-End</name>
  <files>src/app/[locale]/admin/users/page.tsx</files>
  <read_first>
    - src/legacy/[locale]/admin/users/UsersPageClient.tsx (expected UI behavior)
    - src/components/admin/AdminStatGrid.tsx (migrated component)
  </read_first>
  <action>
Verify the User Management page works end-to-end with real data.

**What to test:**
1. Navigate to `/vi/admin/users`
2. Page should load without errors
3. Verify 4 stat cards show real counts from Prisma
4. Verify 6 role pills show with counts
5. Verify user table shows users with 8 columns
6. Test search: type in search box, wait 300ms, table should filter
7. Test pagination: change page size, navigate pages
8. Test filters: select role filter, workspace filter
9. Verify URL updates with search params (page, pageSize, search, filter_role, etc.)

**Expected behaviors:**
- Stat cards: Total = all users, Active = users with isActive=true, Pending = unverified within 7 days, Workspaces = active workspaces
- Role pills: Show count of users with each role (from WorkspaceMembership)
- Table: Name, email, role, workspace, status, last active, action columns
- Search: Debounced, filters by name OR email
- Pagination: URL-synced, persists across refresh
</action>
  <verify>
  <how-to-verify>
1. Open browser to http://localhost:3000/vi/admin/users
2. Confirm page loads without console errors
3. Check stat cards match actual database counts
4. Click on a user row action link
5. Type in search box and wait for debounce
6. Use pagination controls
7. Use filter dropdowns
8. Refresh page and confirm URL params persist
  </how-to-verify>
  <resume-signal>
Type "approved" or describe issues found
  </resume-signal>
  </verify>
  <acceptance_criteria>
    - Page loads without console errors at /vi/admin/users
    - 4 stat cards display with real Prisma counts
    - 6 role pills + pending pill display with counts
    - User table shows 8 columns with data
    - Search filters table after 300ms debounce
    - Pagination updates URL and table
    - URL params persist after page refresh
  </acceptance_criteria>
  <done>
  User Management page verified end-to-end with real data.
  All interactive features working: search, filters, pagination.
  URL sync working correctly.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client -> API | Untrusted input (search, filters, pagination) crosses here |
| API -> Database | Prisma queries execute with server credentials |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-47-01 | Information Disclosure | GET /api/admin/users | mitigate | Require super_admin role check via requireAppSession() |
| T-47-02 | Tampering | Search params injection | mitigate | Prisma parameterized queries prevent SQL injection |
| T-47-03 | Denial of Service | Pagination abuse (huge pageSize) | mitigate | MAX_PAGE_SIZE=100 enforced in usePaginationParams |
| T-47-04 | Information Disclosure | Cross-workspace user enumeration | mitigate | Query filters by user's accessible workspaces |
</threat_model>

<verification>
## Phase-Level Verification

1. **API Routes:**
   - `curl http://localhost:3000/vi/api/admin/users` returns 401 without session
   - `curl http://localhost:3000/vi/api/admin/users?page=1&pageSize=10` returns user list
   - `curl -X POST http://localhost:3000/vi/api/admin/users -d '{"email":"test@test.com","name":"Test"}'` creates user

2. **Page Render:**
   - Navigate to `/vi/admin/users`
   - Stat cards show non-zero counts (if data exists)
   - User table renders with columns

3. **Functionality:**
   - Search filters table after 300ms debounce
   - Pagination updates URL and table
   - Role filter shows only matching users
</verification>

<success_criteria>
- GET /api/admin/users returns paginated user list with Prisma data
- POST /api/admin/users creates user and returns 201
- PUT /api/admin/users/[id] updates user and returns 200
- DELETE /api/admin/users/[id] deactivates user and returns 200
- User Management page at /vi/admin/users renders with 4 stat cards
- Role pills show 6 roles with counts
- User table shows 8 columns with real data
- Search works with 300ms debounce
- Pagination syncs with URL via usePaginationParams
- All components use Tailwind CSS (no inline styles)
</success_criteria>

<output>
Create `.planning/phases/47-admin-user-mgmt/47-01-SUMMARY.md` when done
</output>
