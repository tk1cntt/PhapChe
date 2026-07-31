# Review: `src/lib/security/rbac.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 7

---

## 🟠 High (2)

**🐛 Bug** · lines 4-6

**Suspicious `as never` type assertion**: Casting `role` to `never` before passing to `includes` effectively disables TypeScript type checking. If `session.roles` is not typed as `string[]` (e.g., it could be `number[]` or some union), this will silently produce incorrect results — potentially causing authorization bypass or denial. The `never` cast is almost always a code smell; it should be removed so that the type system can catch mismatches.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function hasRole(session: AppSession | null | undefined, role: string) {
  return session?.roles.includes(role) ?? false;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function hasRole(session: AppSession | null | undefined, role: string) {
  return session?.roles.includes(role as never) ?? false;
}
```
</details>

---

**🐛 Bug** · lines 8-17

**Missing error handling across all async Prisma queries**: Every async function in this file (`hasActiveUser`, `hasActiveMembership`, `hasOrganizationAccess`, `hasEngagementAccess`, `canAccessWorkspace`, `canAccessRequest`, `canAccessDocument`, `canAccessReview`, `canAccessVaultFile`) calls Prisma without a `try/catch` block. If the database is unreachable, a query times out, or Prisma throws any error, the promise rejection will propagate uncaught up the call stack, likely resulting in a 500 error with no meaningful logging or user feedback. All async database operations should have error handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
async function hasActiveUser(session: AppSession | null | undefined) {
  if (!session?.userId) return false;

  try {
    const user = await prisma.user.findFirst({
      where: { id: session.userId, isActive: true },
      select: { id: true },
    });
    return Boolean(user);
  } catch (error) {
    console.error('hasActiveUser failed:', error);
    return false;
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
async function hasActiveUser(session: AppSession | null | undefined) {
  if (!session?.userId) return false;

  const user = await prisma.user.findFirst({
    where: { id: session.userId, isActive: true },
    select: { id: true },
  });

  return Boolean(user);
}
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 142-162

**TOCTOU race condition in `canAccessRequest`**: The function calls `hasActiveMembership` and `hasOrganizationAccess` (which internally calls `hasOrganizationAccess`) as separate, non-transactional database reads. Between these two reads, a user's membership could be revoked or the workspace could be deactivated, allowing access through the second check that should have been denied. All authorization checks for a single request should run within a single database transaction or a single composite query to ensure a consistent snapshot of state.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Check if user has active membership in the request's workspace
  const hasMembership = await hasActiveMembership(typedSession, request.workspaceId);

  // Coordinator admin can access requests in their workspace (if they have membership)
  if (hasMembership && hasRole(typedSession, 'coordinator_admin')) return true;

  // Customer can access their own requests (if they have membership)
  if (hasMembership && hasRole(typedSession, 'customer') && request.createdById === typedSession.userId) return true;

  // Specialist can access requests assigned to them (if they have membership)
  if (hasMembership && hasRole(typedSession, 'specialist') && request.assignedSpecialistId === typedSession.userId) return true;

  // Reviewer can access requests assigned to them (if they have membership)
  if (hasMembership && hasRole(typedSession, 'reviewer') && request.assignedReviewerId === typedSession.userId) return true;

  // B4: Organization-scope access
  const hasOrgAccess = await hasOrganizationAccess(typedSession, request.workspaceId);
  if (hasOrgAccess) return true;

  // C1: Engagement-scope access — partner member qua engagement hoặc direct assignment
  if (await hasEngagementAccess(typedSession, request)) return true;
```
</details>


## 🔵 Low (4)

**🔧 Maintainability** · lines 167-168

**Duplicate preamble pattern**: The guard clause `if (!resourceId || !(await hasActiveUser(session))) return false;` is repeated verbatim in `canAccessDocument`, `canAccessReview`, and `canAccessVaultFile`. Similarly, the `const typedSession = session as AppSession;` cast is repeated in `canAccessWorkspace` and `canAccessRequest`. Consider extracting these into a shared helper (e.g., `validateSession(session)`) to reduce duplication and centralize the type assertion logic.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function canAccessDocument(session: AppSession | null | undefined, documentId: string) {
  if (!documentId || !(await hasActiveUser(session))) return false;
```
</details>

---

**🔧 Maintainability** · line 192

**Inconsistent session type handling in `canAccessReview`**: Unlike `canAccessWorkspace` and `canAccessRequest` which use `const typedSession = session as AppSession;` after confirming the session is valid, `canAccessReview` uses `session?.userId` on line 181 without a type assertion. While functionally safe (the optional chaining handles null), this inconsistency makes the code harder to reason about and could lead to future mistakes if the pattern is copied incorrectly.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (hasRole(session, 'reviewer') && review.reviewerId === session?.userId) return true;
```
</details>

---

**⚡ Performance** · lines 88-93

**Redundant database query in `hasEngagementAccess`**: The function queries `prisma.workspace.findUnique` to get `organizationId`, but the caller `canAccessRequest` already fetched the workspace's `workspaceId` from the `legalRequest` table. If the `organizationId` were included in the `canAccessRequest` query's `select`, this extra round-trip could be avoided entirely. Each authorization check already involves multiple DB calls; eliminating redundant queries would improve latency.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (request.engagementId) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: request.workspaceId },
      select: { organizationId: true },
    });
    if (!workspace) return false;
```
</details>

---

**🔧 Maintainability** · line 113

**Hardcoded role strings scattered across the file**: Role identifiers like `'super_admin'`, `'coordinator_admin'`, `'customer'`, `'specialist'`, `'reviewer'` are repeated as raw string literals throughout the file. If a role name changes, it must be updated in every location, which is error-prone. Consider extracting these into a shared constants object or enum (e.g., `const ROLES = { SUPER_ADMIN: 'super_admin', ... } as const;`).

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (hasRole(session, 'super_admin')) return true;
```
</details>


