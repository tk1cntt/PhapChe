# Phase 47: User Management - Research

**Researched:** 2026-06-13
**Domain:** Admin User Management with Prisma + Next.js 15
**Confidence:** HIGH

## Summary

Phase 47 cần clone User Management components từ `src/legacy/` sang `src/components/admin/`, kết nối với Prisma queries thực tế. Phân tích codebase cho thấy schema User đã có sẵn với các trường cần thiết (email, name, isActive, lastActiveAt), nhưng **role không phải trường trên User model** mà nằm trong `WorkspaceMembership` - mỗi user có thể có nhiều roles theo từng workspace.

**Primary recommendation:** Sử dụng Server Component pattern từ Phase 46 (`src/app/[locale]/admin/page.tsx`) để fetch data, clone UI components từ legacy và convert sang Tailwind CSS.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Components lưu ở `src/components/admin/` — không phải `src/legacy/`
- **D-02:** Clone từng component riêng biệt (1 file/component) từ legacy
- **D-03:** Server component fetch data hoặc dùng API routes
- **D-04:** API routes ở `src/app/api/admin/users/` cho CRUD operations
- **D-05:** Convert inline styles → Tailwind CSS
- **D-06:** Clone components: UserStatCard, RolePills, UserTable, UserToolbar, UserPagination
- **D-07 to D-10:** API endpoints: GET, POST, PUT, DELETE /api/admin/users
- **D-11:** Use translations với namespace 'AdminUsers'

### Claude's Discretion
- Cách implement pagination UI (dùng custom select hay Ant Design pagination)
- Chi tiết styling cho stat cards (reusable AdminStatCard hay tạo mới)

### Deferred Ideas (OUT OF SCOPE)
- User detail/edit modal → Phase 48
- Invite user flow → Phase 48
- Role change workflow → Phase 49
- User permissions → Phase 52
- Bulk actions (delete, deactivate) → Phase 48+

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-47-01 | User Management page layout và page structure (/vi/admin/users) | Server component pattern từ Phase 46 |
| REQ-47-02 | 4 Stat cards (Total, Active, Workspaces, Pending) | Prisma queries: count user, count by isActive, distinct workspace |
| REQ-47-03 | Role pills với counts (6 roles) | WorkspaceMembership queries với group by role |
| REQ-47-04 | User table với 8 columns | Prisma include WorkspaceMembership để lấy workspace info |
| REQ-47-05 | Search và filter toolbar | useDebounce hook + API route params |
| REQ-47-06 | API routes cho user CRUD | Pattern từ workspace/invite/route.ts |
| REQ-47-07 | Pagination support | usePaginationParams hook + API pagination |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User data fetching | API/Backend | — | Prisma queries từ Server Component hoặc API route |
| Pagination state | Browser/Client | — | usePaginationParams hook với URL sync |
| Search debouncing | Browser/Client | — | useDebounce hook |
| User table rendering | Browser/Client | — | Client component với React |
| CRUD API | API/Backend | — | Next.js route handlers |
| Role/workspace counts | API/Backend | — | Prisma aggregation queries |
| i18n translations | API/Backend | Browser/Client | Server-side translation loading |

## Prisma Schema Analysis for Users

### User Model (prisma/schema.prisma:20-48)
```prisma
model User {
  id                 String               @id @default(cuid())
  email              String               @unique
  name               String
  phone              String?
  title              String?
  timezone           String?              @default("Asia/Ho_Chi_Minh")
  locale             String?              @default("vi")
  avatarUrl          String?
  lastActiveAt       DateTime?
  isActive           Boolean              @default(true)
  emailVerified      Boolean              @default(false)
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  memberships        WorkspaceMembership[]
  // ... relations
}
```

**Key fields for User Management:**
- `id`, `email`, `name` — displayed in table
- `isActive` — determines "active" vs "inactive" status
- `emailVerified` — determines "pending" status (new unverified users)
- `lastActiveAt` — displayed in "Last Active" column
- `memberships` — relation to get user's roles and workspaces

### WorkspaceMembership Model (prisma/schema.prisma:83-97)
```prisma
model WorkspaceMembership {
  id          String    @id @default(cuid())
  userId      String
  workspaceId String
  role        String    @default("customer")  // customer, specialist, reviewer, coordinator_admin, super_admin, audit_admin
  isActive    Boolean   @default(true)
  user        User      @relation(fields: [userId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  @@unique([userId, workspaceId, role])
}
```

**Critical insight:** Role is per-workspace, not a single user field. A user can have multiple roles across different workspaces. For admin User Management, we should:
- Show the "highest" role (super_admin > audit_admin > coordinator_admin > reviewer > specialist > customer)
- Or show roles from all memberships

### Recommended Prisma Queries

**1. Count total users:**
```typescript
prisma.user.count()
```

**2. Count active users:**
```typescript
prisma.user.count({ where: { isActive: true } })
```

**3. Count by role (using WorkspaceMembership):**
```typescript
prisma.workspaceMembership.groupBy({
  by: ['role'],
  _count: { role: true },
})
```

**4. Count unique workspaces with users:**
```typescript
prisma.workspaceMembership.findMany({
  select: { workspaceId: true },
  distinct: ['workspaceId'],
})
// Result: workspaceCount
```

**5. Count pending users (unverified within 7 days):**
```typescript
prisma.user.count({
  where: {
    emailVerified: false,
    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }
})
```

**6. List users with pagination, search, filter:**
```typescript
prisma.user.findMany({
  where: {
    AND: [
      search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      } : {},
      filters.role ? {
        memberships: { some: { role: filters.role } }
      } : {},
      filters.workspace ? {
        memberships: { some: { workspaceId: filters.workspace } }
      } : {}
    ]
  },
  include: {
    memberships: {
      include: { workspace: { select: { id: true, name: true, slug: true } } }
    }
  },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
})
```

### Role Priority Order (for display)
```typescript
const ROLE_PRIORITY = {
  'super_admin': 1,
  'audit_admin': 2,
  'coordinator_admin': 3,
  'reviewer': 4,
  'specialist': 5,
  'customer': 6
};
```

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 15 | ^15 | App Router, Server Components | Latest stable, App Router pattern from Phase 46 |
| Prisma | ^6 | Database ORM | Already in use, prisma.ts singleton pattern established |
| next-intl | ^15 | Internationalization | Already in use for AdminUsers namespace |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5 | Client-side data fetching | For API route calls in client components |
| AdminStatCard | existing | Reusable stat card | Phase 46 component - reuse for user stats |
| AdminToolbar | existing | Search/filter toolbar | Phase 46 component - extend for user filters |

### Existing Hooks
| Hook | Location | Purpose |
|------|----------|---------|
| usePaginationParams | src/lib/hooks/usePaginationParams.ts | URL-synced pagination state |
| useDebounce | src/lib/hooks/useDebounce.ts | 300ms search debouncing |

## Package Legitimacy Audit

> **No external packages required** — Phase 47 only clones existing components and connects to Prisma. All dependencies (@tanstack/react-query, next-intl) are already in the project.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser / Client                             │
├─────────────────────────────────────────────────────────────────────┤
│  UserTable Component                                                │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────────┐          │
│  │ Search  │  │ Filters  │  │ Table   │  │ Pagination │          │
│  │ Input   │──│ (role,   │  │ (8 cols)│  │ (page,     │          │
│  │ (300ms) │  │  ws)     │  │         │  │  pageSize) │          │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └─────┬──────┘          │
│       │            │             │              │                   │
│       └────────────┴─────────────┴──────────────┘                   │
│                          │                                          │
│                    usePaginationParams                               │
│                    (URL sync)                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API / Backend                                   │
├─────────────────────────────────────────────────────────────────────┤
│  GET /api/admin/users?page=1&pageSize=10&search=...&filter_role=...  │
│  POST /api/admin/users                                               │
│  PUT /api/admin/users/[id]                                          │
│  DELETE /api/admin/users/[id]                                        │
│                               │                                      │
│                    requireAppSession()                               │
│                    (auth validation)                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Database / Storage                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────────────────┐    ┌──────────────────┐   │
│  │  User   │◄───│ WorkspaceMembership │───►│    Workspace     │   │
│  │         │    │ (role per workspace)│    │                  │   │
│  └─────────┘    └─────────────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── components/admin/
│   ├── AdminStatCard.tsx          # Already exists from Phase 46
│   ├── AdminToolbar.tsx           # Already exists from Phase 46
│   ├── UserStatCard.tsx           # NEW: 4 stat cards for user mgmt
│   ├── RolePills.tsx             # NEW: role badges with counts
│   ├── UserTable.tsx              # NEW: main user table (8 columns)
│   ├── UserToolbar.tsx           # NEW: search + filters
│   ├── UserPagination.tsx        # NEW: pagination controls
│   └── UserManagementClient.tsx  # NEW: main client component
├── app/
│   ├── [locale]/admin/users/
│   │   └── page.tsx              # NEW: Server Component with Prisma
│   └── api/admin/users/
│       ├── route.ts              # NEW: GET (list), POST (create)
│       └── [id]/route.ts         # NEW: PUT (update), DELETE (deactivate)
└── lib/
    └── hooks/
        ├── usePaginationParams.ts  # Already exists
        └── useDebounce.ts          # Already exists
```

### Pattern 1: Server Component with Parallel Prisma Queries
**Source:** Adapted from `src/app/[locale]/admin/page.tsx`

```typescript
// src/app/[locale]/admin/users/page.tsx
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import UserManagementClient from '@/components/admin/UserManagementClient';

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await requireAppSession();

  // Parallel Prisma queries
  const [totalUsers, activeUsers, pendingUsers, workspaces, roleCounts] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({
      where: {
        emailVerified: false,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.workspace.count({ where: { isActive: true } }),
    prisma.workspaceMembership.groupBy({
      by: ['role'],
      _count: { role: true },
    }),
  ]);

  // Transform data for client
  const stats = {
    total: totalUsers,
    active: activeUsers,
    workspaces: workspaces,
    pending: pendingUsers,
  };

  const roleStats = roleCounts.reduce((acc, rc) => {
    acc[rc.role] = rc._count.role;
    return acc;
  }, {} as Record<string, number>);

  return (
    <UserManagementClient
      initialStats={stats}
      initialRoleStats={roleStats}
      locale={locale}
    />
  );
}
```

### Pattern 2: API Route with Session Validation
**Source:** Adapted from `src/app/api/workspace/invite/route.ts`

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET(request: NextRequest) {
  try {
    await requireAppSession(); // Auth check

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
    const search = searchParams.get('search') ?? '';
    const roleFilter = searchParams.get('filter_role');
    const workspaceFilter = searchParams.get('filter_workspace');

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } }
          ]
        } : {},
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          memberships: {
            include: { workspace: { select: { id: true, name: true } } }
          }
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      data: users,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Pattern 3: Role Badge with Priority
**Source:** Adapted from legacy `UsersPageClient.tsx`

```typescript
// Role priority mapping
const ROLE_PRIORITY: Record<string, number> = {
  'super_admin': 1,
  'audit_admin': 2,
  'coordinator_admin': 3,
  'reviewer': 4,
  'specialist': 5,
  'customer': 6,
};

const roleColors: Record<string, { bg: string; color: string }> = {
  customer: { bg: '#dbeafe', color: '#2563eb' },
  specialist: { bg: '#dbeafe', color: '#2563eb' },
  reviewer: { bg: '#ffedd5', color: '#ea580c' },
  coordinator_admin: { bg: '#ccfbf1', color: '#0f766e' },
  super_admin: { bg: '#ffe4e6', color: '#ef4444' },
  audit_admin: { bg: '#ede9fe', color: '#7c3aed' },
};

// Get highest priority role from memberships
function getPrimaryRole(memberships: WorkspaceMembership[]): string {
  if (!memberships?.length) return 'customer';
  return memberships.reduce((best, m) =>
    (ROLE_PRIORITY[m.role] ?? 99) < (ROLE_PRIORITY[best.role] ?? 99) ? m : best
  ).role;
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pagination state | Custom state management | usePaginationParams hook | Already handles URL sync, edge cases like max pageSize |
| Search debouncing | Custom debounce with setTimeout | useDebounce hook | Already implemented with cleanup |
| Session validation | Manual auth check | requireAppSession() | Handles error cases, returns typed session |
| Prisma singleton | New PrismaClient each request | prisma from @/lib/prisma | Prevents connection pool exhaustion |
| Date formatting | Date.toLocaleString() | Intl.DateTimeFormat | Better i18n support |

**Key insight:** Phase 46 established all reusable patterns. Phase 47 should reuse AdminStatCard, AdminToolbar, and the hooks rather than recreating them.

## Common Pitfalls

### Pitfall 1: Incorrect Role Aggregation
**What goes wrong:** Query returns raw membership counts that don't match user counts (a user with 2 roles appears twice).

**Why it happens:** `groupBy` on WorkspaceMembership counts memberships, not users. A user with `customer` + `specialist` roles counts for both.

**How to avoid:** Use `distinct: ['userId']` when counting users per role, or aggregate in application code:

```typescript
// WRONG - counts memberships
prisma.workspaceMembership.groupBy({ by: ['role'], _count: true });

// CORRECT - count users with each role
prisma.user.findMany({
  where: { memberships: { some: { role: 'specialist' } } },
  select: { _count: { select: { memberships: true } } }
});
```

### Pitfall 2: N+1 Query Problem
**What goes wrong:** Fetching users then fetching each user's workspace separately.

**Why it happens:** Not using Prisma's `include` for nested relations.

**How to avoid:** Always use `include: { memberships: { include: { workspace: true } } }` in the initial query.

### Pitfall 3: Search Case Sensitivity
**What goes wrong:** Search for "john" doesn't find "John".

**Why it happens:** SQLite LIKE is case-insensitive by default, but PostgreSQL/MySQL may differ.

**How to avoid:** Store emails lowercase, use case-insensitive collation or lowercase in query:

```typescript
{ email: { contains: search.toLowerCase() } }
```

### Pitfall 4: Pagination Edge Cases
**What goes wrong:** Page 5 of 3 total pages, or negative page numbers.

**Why it happens:** Not validating input from URL params.

**How to avoid:** Use `usePaginationParams` hook which handles these cases (see line 45: `Math.min(parsed, MAX_PAGE_SIZE)`).

## Code Examples

### AdminStatCard Reuse (from Phase 46)
**Source:** `src/components/admin/AdminStatCard.tsx`

```typescript
// Use for user stat cards - variant determines colors
<AdminStatCard
  variant="blue"  // blue, green, orange, red
  title={t('statTotalUsers')}
  value={stats.total.toString()}
  description={t('statTotalUsersDesc')}
  icon={<UsersIcon />}
/>
```

### UserToolbar with Search
**Source:** Adapted from `src/components/admin/AdminToolbar.tsx`

```typescript
// src/components/admin/UserToolbar.tsx
interface UserToolbarProps {
  onSearch: (query: string) => void;
  onRoleFilter: (role: string | null) => void;
  onWorkspaceFilter: (workspaceId: string | null) => void;
  searchValue: string;
  selectedRole?: string;
  selectedWorkspace?: string;
  translations: {
    searchPlaceholder: string;
    filterRole: string;
    filterWorkspace: string;
  };
}

export default function UserToolbar({ /* ... */ }: UserToolbarProps) {
  return (
    <div className="bg-white border rounded-[15px] p-5 mb-5">
      {/* Search Input */}
      <div className="w-[330px] h-11 border rounded-lg flex items-center gap-3 px-4">
        <SearchIcon />
        <input
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={translations.searchPlaceholder}
        />
      </div>
      {/* Filter Buttons */}
      <button onClick={() => onRoleFilter(selectedRole ? null : 'specialist')}>
        {translations.filterRole}
      </button>
      {/* ... */}
    </div>
  );
}
```

### Pagination Controls
**Source:** Adapted from legacy `AdminUsersTable.tsx`

```typescript
// src/components/admin/UserPagination.tsx
interface UserPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  translations: { totalUsersCount: string };
}

export default function UserPagination({ current, pageSize, total, onChange, translations }: UserPaginationProps) {
  return (
    <div className="flex justify-end items-center gap-3 p-4 bg-gray-50">
      <select
        value={pageSize}
        onChange={(e) => onChange(1, parseInt(e.target.value))}
        className="h-8 border rounded px-2 text-sm"
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
      <span className="text-sm text-gray-600">
        {translations.totalUsersCount.replace('{total}', String(total))}
      </span>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mock data in client component | Server-side Prisma queries | Phase 47 | Real-time data, no hardcoded users |
| Inline styles | Tailwind CSS | Phase 46 (continuing) | Consistent styling, smaller bundle |
| Component per feature | Reusable AdminStatCard + AdminToolbar | Phase 46 | Less code duplication |

**Deprecated/outdated:**
- Inline style objects (`style={{ height: 45, padding: '0 18px' }}`) — Phase 46+ uses Tailwind classes
- Mock API responses in client — Phase 47 uses real Prisma queries

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Role display uses "highest priority" role per user | Prisma Schema Analysis | May need to show all roles instead |
| A2 | "Pending" = users unverified within 7 days | Common Pitfalls | May need different definition |
| A3 | No need for audit logging in Phase 47 CRUD | Out of Scope | May be required for compliance |
| A4 | Super admin can view all users across workspaces | Security | May need workspace-scoped filtering |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Should Super Admin see all users or only their workspace?**
   - What we know: `requireAppSession()` only validates auth, doesn't check role
   - What's unclear: Whether super_admin can see cross-workspace users
   - Recommendation: Add workspace filter dropdown for super_admin to scope results

2. **How to handle users with multiple roles?**
   - What we know: Users can have multiple WorkspaceMembership records with different roles
   - What's unclear: Should table show "highest role" or all roles?
   - Recommendation: Show primary role (highest priority) in table, show all in detail view (Phase 48)

3. **Deactivate vs Delete user?**
   - What we know: User model has `isActive` field
   - What's unclear: Should DELETE set `isActive = false` or remove workspace membership?
   - Recommendation: Use soft delete (`isActive = false`) to preserve audit trail

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified) — Phase 47 uses only existing codebase dependencies (Next.js 15, Prisma, next-intl, @tanstack/react-query) and Prisma database.

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- --run src/components/admin/__tests__` |
| Full suite command | `npm run test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-47-01 | User Management page renders | Unit | `vitest run UserManagement.test.tsx` | Pending |
| REQ-47-02 | Stat cards display correct counts | Unit | `vitest run UserStatCard.test.tsx` | Pending |
| REQ-47-03 | Role pills show correct counts | Unit | `vitest run RolePills.test.tsx` | Pending |
| REQ-47-04 | User table renders 8 columns | Unit | `vitest run UserTable.test.tsx` | Pending |
| REQ-47-05 | Search triggers API call after 300ms | Unit | `vitest run UserToolbar.test.tsx` | Pending |
| REQ-47-06 | API returns users with pagination | Unit | `vitest run admin/users/route.test.ts` | Pending |
| REQ-47-07 | Pagination controls update URL | Unit | `vitest run UserPagination.test.tsx` | Pending |

### Sampling Rate
- **Per task commit:** `npm run test -- --run --reporter=verbose`
- **Per wave merge:** `npm run test -- --run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/components/admin/__tests__/UserManagement.test.tsx` — covers REQ-47-01
- [ ] `src/components/admin/__tests__/UserStatCard.test.tsx` — covers REQ-47-02
- [ ] `src/components/admin/__tests__/RolePills.test.tsx` — covers REQ-47-03
- [ ] `src/components/admin/__tests__/UserTable.test.tsx` — covers REQ-47-04
- [ ] `src/components/admin/__tests__/UserToolbar.test.tsx` — covers REQ-47-05
- [ ] `src/app/api/admin/users/__tests__/route.test.ts` — covers REQ-47-06
- [ ] `src/components/admin/__tests__/UserPagination.test.tsx` — covers REQ-47-07
- [ ] `src/test/setup.ts` — shared test setup with MSW handlers

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireAppSession()` validates user session |
| V3 Session Management | yes | NextAuth.js handles session tokens |
| V4 Access Control | yes | Role-based: super_admin only for admin routes |
| V5 Input Validation | yes | Prisma queries + email regex validation |
| V6 Cryptography | no | No password handling in this phase |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL Injection | Tampering | Prisma parameterized queries |
| Unauthorized user enumeration | Information Disclosure | Require super_admin role for API |
| Pagination DoS | Denial of Service | MAX_PAGE_SIZE enforcement (100) |
| Cross-workspace data leak | Information Disclosure | WorkspaceMembership filtering in queries |

## Sources

### Primary (HIGH confidence)
- `src/app/[locale]/admin/page.tsx` - Phase 46 server component pattern
- `src/app/api/workspace/invite/route.ts` - API route pattern with session validation
- `prisma/schema.prisma` - User, WorkspaceMembership schema definitions
- `src/lib/security/session.ts` - requireAppSession() implementation
- `src/lib/hooks/usePaginationParams.ts` - Pagination hook implementation

### Secondary (MEDIUM confidence)
- `src/legacy/[locale]/admin/users/UsersPageClient.tsx` - UI component patterns (mock data)
- `src/legacy/[locale]/admin/users/AdminUsersTable.tsx` - Table column definitions
- `src/messages/vi.json` - AdminUsers i18n keys

### Tertiary (LOW confidence)
- [WebSearch] Role priority conventions - need verification with product team

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use (Next.js 15, Prisma, next-intl)
- Architecture: HIGH - Pattern established in Phase 46, adapts well
- Pitfalls: MEDIUM - Some assumptions about role display need verification

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (30 days for stable stack)
