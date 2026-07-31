# Review: `src/app/api/admin/organizations/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 8

---

## 🟠 High (1)

**🐛 Bug** · lines 232-233

The `status` field in the PATCH handler is written directly from user input without any validation against allowed values. Per the Prisma schema, valid statuses are `active`, `inactive`, or `pending`. A malicious or buggy client could set `status` to an arbitrary string (e.g., `"hacked"`), corrupting the data. Add validation to reject unknown status values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const VALID_STATUSES = ['active', 'inactive', 'pending'] as const;

    const body = await req.json();
    const { name, businessType, registrationNumber, address, contactEmail, status } = body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: `Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await req.json();
    const { name, businessType, registrationNumber, address, contactEmail, status } = body;
```
</details>


## 🟡 Medium (4)

**🔧 Maintainability** · lines 20-44

The return value of `requireAdminSession()` is never used by any of the three handlers (GET, PATCH, DELETE). Each handler calls `await requireAdminSession();` without destructuring, so `session`, `userId`, and `roles` are computed and immediately discarded. Either remove the unused return values from the function, or use them in the handlers.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'UNAUTHORIZED', detail: 'Authentication required' };
  }

  // Query only admin role memberships (more efficient than fetching all)
  const adminMemberships = await prisma.workspaceMembership.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      role: { in: ADMIN_ROLES as readonly string[] },
    },
    select: { id: true },
  });

  if (adminMemberships.length === 0) {
    throw { status: 403, error: 'FORBIDDEN', detail: 'Admin access required' };
  }

  return session;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw { status: 401, error: 'UNAUTHORIZED', detail: 'Authentication required' };
  }

  // Query all workspace memberships to find admin roles
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });

  // Filter out null roles
  const userRoles = memberships
    .map((m) => m.role)
    .filter((r): r is string => r !== null);

  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));

  if (!hasAdminRole) {
    throw { status: 403, error: 'FORBIDDEN', detail: 'Admin access required' };
  }

  return { session, userId: session.user.id, roles: userRoles };
}
```
</details>

---

**🐛 Bug** · lines 235-245

Inconsistent falsy-checking in the PATCH handler's update data. `name` uses a truthy check (`...(name && { name })`), which means an empty string `""` is silently ignored. However, `businessType`, `registrationNumber`, `address`, and `contactEmail` use `!== undefined`, which would allow setting these fields to empty strings. This inconsistency means callers cannot clear `name` (which is required by the schema, so that's arguably correct), but the silent no-op for `name: ""` is confusing. Use `!== undefined` consistently for all optional fields, and for required fields like `name`, either validate explicitly or use the same pattern.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const updated = await prisma.organization.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(businessType !== undefined && { businessType }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(address !== undefined && { address }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(status !== undefined && { status }),
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const updated = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(businessType !== undefined && { businessType }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(address !== undefined && { address }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(status && { status }),
      },
    });
```
</details>

---

**🐛 Bug** · lines 87-93

The `memberCount` computation in `Promise.all` has a type mismatch: when `workspaceIds.length > 0`, it returns a `groupBy` result (array of `{ userId: string }`), but when `workspaceIds.length === 0`, it returns `Promise.resolve([])` (an empty array). This is checked with `Array.isArray()` at runtime, which works, but the TypeScript type is inferred as `number | { userId: string }[]` — the `number` branch is never actually reached. Consider using `prisma.workspaceMembership.count` with a `distinct` option for clarity and correctness, or use a consistent type guard.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Member count (unique users in workspaces)
      workspaceIds.length > 0
        ? prisma.workspaceMembership.groupBy({
            by: ['userId'],
            where: { workspaceId: { in: workspaceIds }, isActive: true },
          }).then((rows) => rows.length)
        : 0,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Member count (unique users in workspaces)
      workspaceIds.length > 0
        ? prisma.workspaceMembership.groupBy({
            by: ['userId'],
            where: { workspaceId: { in: workspaceIds }, isActive: true },
          })
        : Promise.resolve([]),
```
</details>

---

**🐛 Bug** · lines 275-279

The `DELETE` handler soft-deactivates the organization by setting `status: 'inactive'`, but does not cascade-deactivate the organization's workspaces. This leaves active workspaces belonging to an inactive organization, which can lead to data inconsistency — users may still interact with workspaces of a deactivated org. Consider also deactivating child workspaces, or at minimum validating that no active workspaces exist before allowing deactivation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Soft delete - cascade deactivate organization and all its workspaces
    await prisma.$transaction([
      prisma.organization.update({
        where: { id },
        data: { status: 'inactive' },
      }),
      prisma.workspace.updateMany({
        where: { organizationId: id },
        data: { isActive: false },
      }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Soft delete - set inactive
    await prisma.organization.update({
      where: { id },
      data: { status: 'inactive' },
    });
```
</details>


## 🔵 Low (3)

**⚡ Performance** · lines 26-37

`requireAdminSession()` queries all active workspace memberships for the user (including `workspaceId`) just to check if any role is an admin role. For a user with many memberships, this fetches unnecessary data. The query can be optimized by filtering on the `role` field directly at the database level, and selecting only `id` (or nothing) since we only need to know if at least one admin membership exists.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Query only admin role memberships directly
  const adminMemberships = await prisma.workspaceMembership.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      role: { in: ADMIN_ROLES as readonly string[] },
    },
    select: { id: true },
  });

  const hasAdminRole = adminMemberships.length > 0;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Query all workspace memberships to find admin roles
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });

  // Filter out null roles
  const userRoles = memberships
    .map((m) => m.role)
    .filter((r): r is string => r !== null);

  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));
```
</details>

---

**🐛 Bug** · lines 122-131

The `slaRiskCount` query includes requests with `slaDeadline` that is already in the past. A request with `slaDeadline` set to 3 days ago would still be counted as "at risk" because `lte: new Date(Date.now() + 24h)` includes all past dates. This means historical expired SLAs are indistinguishable from genuinely at-risk SLAs due within the next 24 hours. Consider adding a lower bound: `slaDeadline: { gte: new Date(), lte: new Date(Date.now() + 24 * 60 * 60 * 1000) }`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // SLA at risk (due within 24h, not yet expired)
      workspaceIds.length > 0
        ? prisma.legalRequest.count({
            where: {
              workspaceId: { in: workspaceIds },
              slaDeadline: { gte: new Date(), lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
              status: { notIn: ['closed', 'cancelled', 'delivered', 'approved'] },
            },
          })
        : 0,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // SLA at risk (within 24h)
      workspaceIds.length > 0
        ? prisma.legalRequest.count({
            where: {
              workspaceId: { in: workspaceIds },
              slaDeadline: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
              status: { notIn: ['closed', 'cancelled', 'delivered', 'approved'] },
            },
          })
        : 0,
```
</details>

---

**🔧 Maintainability** · lines 176-181

The field name `activeWorkspacesToday` is misleading — it simply counts workspaces where `isActive === true` from the already-fetched organization data, with no time-based filtering. The "Today" suffix suggests a daily metric, but this is just a static count. Rename to `activeWorkspaces` to avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      stats: {
        openRequests: openRequestsCount,
        inProgressRequests: inProgressRequestsCount,
        slaRisk: slaRiskCount,
        activeWorkspaces: organization.workspaces.filter((w) => w.isActive).length,
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      stats: {
        openRequests: openRequestsCount,
        inProgressRequests: inProgressRequestsCount,
        slaRisk: slaRiskCount,
        activeWorkspacesToday: organization.workspaces.filter((w) => w.isActive).length,
      },
```
</details>


