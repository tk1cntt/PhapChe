# Phase 47 - User Management Validation Plan

## Overview

This document outlines test coverage for Phase 47 User Management feature: API routes, server components, and client components for admin user listing, creation, update, and deactivation.

## Test Files to Create

### API Route Tests

**`tests/api/admin/users.test.ts`** - API route tests for user CRUD operations

| Test | Type | Description |
|------|------|-------------|
| `GET /api/admin/users - returns 401 without session` | Whitebox | Verify session validation |
| `GET /api/admin/users - returns paginated user list` | Whitebox | Verify Prisma query returns correct shape |
| `GET /api/admin/users - filters by search param` | Whitebox | Verify search filters name/email |
| `GET /api/admin/users - filters by role` | Whitebox | Verify role filter via memberships |
| `POST /api/admin/users - creates user` | Whitebox | Verify user creation flow |
| `POST /api/admin/users - returns 400 for invalid email` | Blackbox | Verify email validation |
| `POST /api/admin/users - returns 409 for duplicate email` | Blackbox | Verify duplicate check |
| `PUT /api/admin/users/[id] - updates user` | Whitebox | Verify update operation |
| `PUT /api/admin/users/[id] - returns 404 for missing user` | Blackbox | Verify 404 handling |
| `DELETE /api/admin/users/[id] - soft deletes user` | Whitebox | Verify isActive=false |
| `DELETE /api/admin/users/[id] - returns 404 for missing user` | Blackbox | Verify 404 handling |

**`tests/api/admin/users/[id].test.ts`** - Individual user endpoint tests

### Component Tests

**`tests/components/admin/AdminStatGrid.test.tsx`**

| Test | Type | Description |
|------|------|-------------|
| `renders StatCard with all props` | Whitebox | Props passed correctly |
| `renders AdminStatGrid with cards array` | Whitebox | Multiple cards render |
| `applies correct variant styles` | Whitebox | Color variants match design |
| `renders title, value, description` | Whitebox | Content displays correctly |
| `renders icon when provided` | Whitebox | Icon slot works |

**`tests/components/admin/RolePills.test.tsx`**

| Test | Type | Description |
|------|------|-------------|
| `renders all 6 role pills + pending` | Whitebox | All roles display |
| `displays correct count per role` | Whitebox | Counts from roleStats |
| `applies correct colors per role` | Whitebox | Color mapping correct |
| `handles missing role gracefully` | Abnormal | Fallback color |
| `renders pill badges with rounded style` | Whitebox | UI matches design |

**`tests/components/admin/UserTable.test.tsx`**

| Test | Type | Description |
|------|------|-------------|
| `renders 8-column grid header` | Whitebox | All columns present |
| `renders user rows with data` | Whitebox | Data mapping correct |
| `shows role badges with colors` | Whitebox | Role colors correct |
| `shows status badges (active/invited/inactive)` | Whitebox | Status colors correct |
| `shows avatar with initials` | Whitebox | getInitials function |
| `renders action link` | Whitebox | Edit/Resend/Activate |
| `renders pagination footer` | Whitebox | Page size selector |
| `handles empty dataSource` | Abnormal | No crash, shows message |
| `truncates long names` | Abnormal | minWidth: 0 prevents overflow |

**`tests/components/admin/UserToolbar.test.tsx`**

| Test | Type | Description |
|------|------|-------------|
| `renders search input` | Whitebox | Input element present |
| `renders role filter dropdown` | Whitebox | Role filter present |
| `renders workspace filter dropdown` | Whitebox | Workspace filter present |
| `renders action buttons` | Whitebox | Refresh, Export, Columns |
| `calls onSearch when typing` | Whitebox | Search callback |
| `calls onRoleFilter when selecting` | Whitebox | Filter callback |
| `calls onRefresh when clicked` | Whitebox | Refresh callback |

**`tests/components/admin/UserPagination.test.tsx`**

| Test | Type | Description |
|------|------|-------------|
| `renders page size selector` | Whitebox | 10, 25, 50 options |
| `displays total count` | Whitebox | Total display |
| `calls onChange with new page` | Whitebox | Pagination callback |
| `calls onChange with new pageSize` | Whitebox | Page size callback |

**`tests/components/admin/UsersPageClient.test.tsx`**

| Test | Type | Description |
|------|------|-------------|
| `renders 4 stat cards` | Whitebox | Cards from initialStats |
| `renders RolePills component` | Whitebox | Role display |
| `renders UserToolbar component` | Whitebox | Toolbar present |
| `renders UserTable component` | Whitebox | Table present |
| `fetches data via useQuery` | Whitebox | API call on mount |
| `debounces search input` | Whitebox | 300ms delay |
| `updates URL on pagination` | Whitebox | usePaginationParams |
| `shows loading state` | Whitebox | Spin component |
| `handles API error gracefully` | Abnormal | Error state |
| `handles empty response` | Abnormal | No crash |

### Page Tests

**`tests/app/admin/users/page.test.tsx`**

| Test | Type | Description |
|------|------|-------------|
| `executes Prisma queries in parallel` | Whitebox | Promise.all verified |
| `passes initialStats to client` | Whitebox | Props correct |
| `passes initialRoleStats to client` | Whitebox | Role counts correct |
| `wraps in AdminLayout` | Whitebox | Layout present |
| `validates session` | Whitebox | requireAppSession |
| `handles Prisma error` | Abnormal | Error boundary |

### E2E Tests

**`tests/e2e/admin-user-management.spec.ts`**

| Test | Scenario |
|------|----------|
| `navigates to user management page` | User clicks Users in admin nav |
| `displays stat cards with counts` | Verify real Prisma data |
| `displays role pills with counts` | Verify role aggregation |
| `displays user table with 8 columns` | Verify data columns |
| `search filters users after debounce` | Type in search, wait 300ms |
| `pagination updates table` | Click next page |
| `pagination updates URL` | Verify URL params |
| `filters by role` | Select role filter |
| `URL params persist on refresh` | Reload page |

### Error Tests

| Test | Scenario |
|------|----------|
| `API returns 500 on database error` | Prisma connection failure |
| `API returns 401 on invalid session` | Expired/invalid JWT |
| `API returns 404 for non-existent user` | Invalid user ID |
| `API returns 400 for invalid email format` | Malformed email |
| `API returns 409 for duplicate email` | Existing email |
| `Page shows error boundary on crash` | Prisma query failure |

## Test Execution Commands

```bash
# Unit tests
npm test -- --testPathPattern="admin/users" --coverage

# API tests (requires test database)
npm test -- --testPathPattern="api/admin/users"

# Component tests with coverage
npm test -- --testPathPattern="components/admin/AdminStatGrid|components/admin/RolePills|components/admin/UserTable|components/admin/UserToolbar|components/admin/UserPagination|components/admin/UsersPageClient"

# E2E tests
npx playwright test tests/e2e/admin-user-management.spec.ts

# Full phase coverage
npm test -- --coverage --coverageThreshold='{"functions":90}'
```

## Coverage Requirements

| Metric | Minimum | Target |
|--------|---------|--------|
| Statement | 80% | 90% |
| Branch | 75% | 85% |
| Function | 85% | 90% |
| Line | 80% | 90% |

## Test Fixtures

**`tests/fixtures/users.json`** - Mock user data for tests

```typescript
export const mockUsers = [
  { id: '1', name: 'Nguyen Van A', email: 'a@example.com', role: 'customer', workspace: 'An Phat', status: 'active' },
  { id: '2', name: 'Tran Van B', email: 'b@example.com', role: 'specialist', workspace: 'Internal', status: 'active' },
  { id: '3', name: 'Le Thi C', email: 'c@example.com', role: 'reviewer', workspace: 'Internal', status: 'invited' },
];
```

## Mock Patterns

- **Prisma**: Mock `prisma.user.findMany`, `prisma.user.count`, `prisma.workspaceMembership.groupBy`
- **Session**: Mock `requireAppSession` to return test user
- **API fetch**: Mock `fetch` for component tests
- **usePaginationParams**: Mock hook for URL param tests
