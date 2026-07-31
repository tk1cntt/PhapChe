# Review: `src/app/api/admin/organizations/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🟡 Medium (3)

**🐛 Bug** · line 74

`_count.workspaces` counts ALL workspaces (including inactive ones), but `workspaces` include only `isActive: true` workspaces. This causes inconsistent data in the response — the count doesn't match the actual number of workspaces returned. Use a filtered count: `_count: { select: { workspaces: { where: { isActive: true } } } }`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          _count: { select: { workspaces: { where: { isActive: true } } } },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          _count: { select: { workspaces: true } },
```
</details>

---

**⚡ Performance** · lines 26-37

`requireAdminSession` fetches ALL memberships for the user, then filters in-memory. Use `findFirst` with a role filter in the database query to short-circuit early and avoid fetching unnecessary rows.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Query only for admin role memberships — short-circuits at first match
  const adminMembership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      role: { in: ['super_admin', 'coordinator_admin'] },
    },
    select: { role: true, workspaceId: true },
  });

  const hasAdminRole = adminMembership !== null;
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

**🔧 Maintainability** · lines 53-54

`skip` and `take` from query parameters are parsed without validation. Negative values or excessively large `take` values (e.g., `take=999999`) are accepted, which can cause performance issues or unexpected Prisma behavior. Add bounds checking (e.g., `Math.max(0, skip)`, clamp `take` to a reasonable maximum like 100).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10));
    const take = Math.min(100, Math.max(1, parseInt(searchParams.get('take') || '20', 10)));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '20', 10);
```
</details>


## 🔵 Low (3)

**🔧 Maintainability** · lines 87-93

The error-handling `catch` block is duplicated in both `GET` and `POST`. Extract it into a shared helper (e.g., `handleApiError(error: unknown)`) to reduce duplication and ensure consistent error responses.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error: unknown) {
    return handleApiError(error, 'Error fetching organizations');
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error: unknown) {
    if (isStructuredError(error)) {
      return NextResponse.json({ error: error.error, detail: error.detail }, { status: error.status });
    }
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'Internal server error' }, { status: 500 });
  }
```
</details>

---

**🔧 Maintainability** · line 111

Hardcoded default tenant ID `'platform-tenant'` is a business-related magic string. Extract it to a named constant or environment variable to make it configurable and self-documenting.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        tenantId: tenantId || DEFAULT_TENANT_ID,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        tenantId: tenantId || 'platform-tenant',
```
</details>

---

**🔒 Security** · line 116

The `status` field from the request body is accepted without validation against allowed values. An attacker could set arbitrary status values. Add validation against a known set of allowed statuses (e.g., `['active', 'inactive', 'suspended']`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        status: ALLOWED_STATUSES.includes(status) ? status : 'active',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        status: status || 'active',
```
</details>


