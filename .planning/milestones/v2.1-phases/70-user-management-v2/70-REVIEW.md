---
phase: 70
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/users/[id]/route.ts
  - src/app/api/requests/route.ts
  - src/app/api/workspaces/route.ts
  - src/app/[locale]/admin/users/page.tsx
  - src/components/admin/RolePills.tsx
  - src/components/admin/UserTable.tsx
  - src/components/admin/UsersPageClient.tsx
  - src/components/admin/UserToolbar.tsx
findings:
  critical: 2
  warning: 4
  info: 4
  total: 10
status: needs-fix
---

# Phase 70: Code Review Report

**Reviewed:** 2026-06-15T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** needs-fix

## Summary

Reviewed 9 files for Phase 70 User Management v2. Found **2 critical blockers** that will cause runtime crashes, **4 warnings** related to i18n and API parameter mismatches, and **4 info items** for code quality.

### Critical Issues

#### CR-01: Prisma model name mismatch

**File:** `src/app/api/requests/route.ts:24`
**Issue:** Code uses `prisma.workspaceMember` but the Prisma schema defines `WorkspaceMembership`. This will cause a runtime error when querying user memberships.

**Current code:**
```typescript
const memberships = await prisma.workspaceMember.findMany({
  where: { userId: session.user.id },
  select: { workspaceId: true },
});
```

**Fix:**
```typescript
const memberships = await prisma.workspaceMembership.findMany({
  where: { userId: session.user.id },
  select: { workspaceId: true },
});
```

---

#### CR-02: Hardcoded "System Roles" string

**File:** `src/components/admin/RolePills.tsx:51`
**Issue:** Title "System Roles" is hardcoded in English instead of using i18n translation. According to project requirements, all UI strings must use translation keys.

**Current code:**
```tsx
<div style={{ /* ... */ }}>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#087f78" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
  System Roles
</div>
```

**Fix:** Add translation key and use it:
```tsx
// Add to translations interface and messages/en.json
// translations.systemRolesLabel

<span style={{ /* ... */ }}>
  {translations.systemRolesLabel}
</span>
```

---

### Warnings

#### WR-01: API pagination parameters mismatch

**File:** `src/components/admin/UsersPageClient.tsx:96-102`
**Issue:** Frontend sends parameters `page`, `pageSize`, `filter_role`, `filter_workspace` but API expects `skip`, `take`, `role`, `workspaceId`. Filters will not work.

**Current frontend params:**
```typescript
params.set('page', String(page));
params.set('pageSize', String(pageSize));
if (filters.role) params.set('filter_role', filters.role);
if (filters.workspace) params.set('filter_workspace', filters.workspace);
```

**Current API expectations (route.ts:49-55):**
```typescript
const skip = parseInt(searchParams.get('skip') || '0', 10);
const take = parseInt(searchParams.get('take') || '20', 10);
const workspaceId = searchParams.get('workspaceId');
const role = searchParams.get('role');
```

**Fix:** Align frontend to send API-compatible params:
```typescript
params.set('skip', String((page - 1) * pageSize));
params.set('take', String(pageSize));
if (filters.role) params.set('role', filters.role);
if (filters.workspace) params.set('workspaceId', filters.workspace);
```

---

#### WR-02: Missing error state on API failure

**File:** `src/components/admin/UsersPageClient.tsx:116-122`
**Issue:** When API call fails, no error message is shown to user. The component only handles loading state.

**Current code:**
```typescript
const { data, isLoading, refetch } = useQuery<PaginatedResponse>({
  // ... query
});

if (isLoading) {
  return (
    <Flex justify="center" style={{ padding: 48 }}>
      <Spin />
    </Flex>
  );
}
// No error handling!
```

**Fix:** Add error state handling:
```typescript
const { data, isLoading, isError, refetch } = useQuery<PaginatedResponse>({
  // ... query
});

if (isLoading) {
  return (/* loading state */);
}

if (isError) {
  return (
    <Flex justify="center" style={{ padding: 48 }}>
      <Alert message={t('errorLoadingUsers')} type="error" />
    </Flex>
  );
}
```

---

#### WR-03: Role dropdown shows raw role keys

**File:** `src/components/admin/UserToolbar.tsx:143`
**Issue:** Role dropdown displays raw role strings like "super_admin" instead of translated labels.

**Current code:**
```tsx
{ROLES.map((role) => (
  <button key={role} onClick={() => onRoleFilter(role)}>
    {role}  {/* Should be translated */}
  </button>
))}
```

**Fix:** Use translation key:
```tsx
{ROLES.map((role) => (
  <button key={role} onClick={() => onRoleFilter(role)}>
    {t(`role_${role}`)}
  </button>
))}
```

---

#### WR-04: Hardcoded "users total" in pagination label

**File:** `src/components/admin/UserTable.tsx:400`
**Issue:** `totalLabel` is hardcoded English instead of using i18n.

**Current code:**
```tsx
totalLabel={`${pagination.total} users total`}
```

**Fix:**
```tsx
totalLabel={t('usersTotal', { count: pagination.total })}
```

---

### Info

#### IN-01: Unused `session` variable in PATCH handler

**File:** `src/app/api/admin/users/[id]/route.ts:93`
**Issue:** `session` is destructured but not used. Only `userId: currentUserId` is used implicitly via the auth check.

```typescript
const { session, userId: currentUserId } = await requireAdminSession();
// session is unused
```

**Fix:** Either use `session` or remove from destructuring:
```typescript
const { userId: currentUserId } = await requireAdminSession();
```

---

#### IN-02: Role pill shows both translated label and raw key

**File:** `src/components/admin/RolePills.tsx:78`
**Issue:** Displays `{label} ({role})` which shows both translated and raw role names redundantly.

```tsx
{label} ({role})  // e.g., "Customer (customer)"
```

**Fix:** Remove raw role key from display:
```tsx
{label}
```

---

#### IN-03: Raw role display in UserTable role column

**File:** `src/components/admin/UserTable.tsx:272`
**Issue:** Role badge shows raw role key in lowercase.

```tsx
{row.role}  // Shows "coordinator_admin" not "Coordinator Admin"
```

**Fix:** Use translated role name:
```tsx
{t(`role_${row.role}`)}
```

---

#### IN-04: Inconsistent status labels

**File:** `src/components/admin/UserTable.tsx:366`
**Issue:** Hardcoded "ICT" for timezone appears when `lastActive` exists. Should be a translated concept.

```tsx
{row.lastActive ? 'ICT' : '—'}
```

**Fix:** Use translation or remove hardcoded string:
```tsx
{row.lastActive ? t('timezone') : '—'}
```

---

## Review Notes

1. **Model consistency**: Verify that `workspaceMembership` is the correct model name in the Prisma schema. The inconsistency between `workspaceMember` and `WorkspaceMembership` suggests a naming issue.

2. **API contract**: The frontend-backend API contract needs alignment. Consider documenting expected parameters in API route files.

3. **i18n coverage**: The UI strings in RolePills.tsx and UserTable.tsx need translation keys added to the messages files.

---

_Reviewed: 2026-06-15T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
