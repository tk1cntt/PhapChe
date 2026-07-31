# Review: `src/app/api/admin/users/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🔴 Critical (2)

**🔒 Security** · lines 76-101

Cross-workspace data leakage: GET lists all users without workspace scoping. A coordinator_admin who should only see users in their own workspace(s) can view all users across all workspaces. The `requireAdminSession` function returns the admin's roles but not the workspace IDs they have access to, and the GET handler never filters users by the admin's accessible workspaces.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // For non-super_admin roles, scope to their accessible workspaces
    const adminWorkspaceIds = memberships
      .filter((m) => ADMIN_ROLES.includes(m.role as any))
      .map((m) => m.workspaceId);

    // Only scope if not super_admin (super_admin sees all)
    if (!userRoles.includes('super_admin') && adminWorkspaceIds.length > 0) {
      where.memberships = {
        ...(where.memberships as any),
        some: {
          ...(where.memberships ? (where.memberships as any).some : {}),
          workspaceId: { in: adminWorkspaceIds },
        },
      };
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastActiveAt: true,
          memberships: {
            select: {
              id: true,
              workspaceId: true,
              role: true,
              workspace: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);
```
</details>

---

**🐛 Bug** · lines 146-147

Password is extracted from the request body but never passed to `prisma.user.create`. The created user will have no password, which likely breaks authentication entirely. This appears to be a critical missing feature.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const body = await req.json();
    const { email, name, password, workspaceId, role } = body;

    // TODO: Hash the password and pass it to user creation
    // e.g., using bcrypt or auth.api.createUser with password
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await req.json();
    const { email, name, password, workspaceId, role } = body;
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 53

The `role` query parameter is extracted from the URL (line 54) but never applied to the `where` clause. This means the role filter has no effect, and users may get unexpected results when filtering by role.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const role = searchParams.get('role');
    // Apply role filter to memberships
    if (role) {
      where.memberships = {
        ...(where.memberships as object),
        some: {
          ...(where.memberships ? (where.memberships as any).some : {}),
          role,
        },
      };
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const role = searchParams.get('role');
```
</details>

---

**🐛 Bug** · line 166

No validation on the `role` value from the request body. The `role` is passed directly to `prisma.user.create` (line 147) with a fallback to `'customer'`. An arbitrary string can be inserted into the database, potentially causing data integrity issues or breaking role-based authorization logic elsewhere.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
            role: role && [...ADMIN_ROLES, 'customer', 'member'].includes(role) ? role : 'customer',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
            role: role || 'customer',
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 27-30

`requireAdminSession` only checks `membership.isActive` but not the user's own `isActive` flag. A deactivated user with a still-active membership record could still access admin endpoints if their session remains valid.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Also verify the user account is active
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });
  if (!user?.isActive) {
    throw { status: 403, error: 'FORBIDDEN', detail: 'User account is deactivated' };
  }

  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true, workspaceId: true },
  });
```
</details>

---

**🔧 Maintainability** · line 43

The `requireAdminSession` function returns `{ session, userId, roles }` but the workspace IDs are not returned, even though they are queried from the database. Returning workspace IDs would enable the GET handler to scope results by workspace for coordinator_admin roles.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const workspaceIds = memberships
    .filter((m) => m.role && ADMIN_ROLES.includes(m.role as any))
    .map((m) => m.workspaceId);

  return { session, userId: session.user.id, roles: userRoles, workspaceIds };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return { session, userId: session.user.id, roles: userRoles };
```
</details>


