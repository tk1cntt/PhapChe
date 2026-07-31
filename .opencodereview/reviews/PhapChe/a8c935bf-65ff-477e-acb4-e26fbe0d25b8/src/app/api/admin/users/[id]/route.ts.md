# Review: `src/app/api/admin/users/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 9

---

## 🟠 High (1)

**🐛 Bug** · line 308

`activeWorkspacesToday` stat is calculated from `auditEventCount` (count of audit events in last 7 days) and clamped to 1–2, which bears no relationship to actual workspaces. The field name suggests it should count the number of distinct workspaces the user was active in today. This is a data integrity bug — the frontend will display incorrect/misleading workspace activity information.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // activeWorkspacesToday should be derived from distinct workspace activity, not audit event count
          // activeWorkspacesToday: Math.max(1, Math.min(2, auditEventCount)),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          activeWorkspacesToday: Math.max(1, Math.min(2, auditEventCount)),
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · line 458

In `getTimelineDescription`, `meta.timestamp` is cast to `string` and passed to `new Date()`. Since `meta` comes from `JSON.parse` of user-generated `metadataSummary`, the value could be a number, object, `undefined`, or malformed string. Passing an invalid value to `new Date()` produces an `Invalid Date` object, which will propagate to `formatDate()` and produce broken output. Consider type-checking `meta.timestamp` before constructing the Date.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const ts = typeof meta.timestamp === 'string' || typeof meta.timestamp === 'number' ? meta.timestamp : Date.now();
      return `${meta.documentName} · ${formatDate(new Date(ts), 'vi')}`;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      return `${meta.documentName} · ${formatDate(new Date(meta.timestamp as string || Date.now()), 'vi')}`;
```
</details>

---

**🔧 Maintainability** · line 306

The `organizations` stat is hardcoded to `1` for every user. This appears to be a placeholder that was never implemented. It will return misleading data to the frontend for users who belong to multiple organizations or none.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // organizations: 1, // TODO: calculate actual organization count
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          organizations: 1,
```
</details>

---

**🔧 Maintainability** · lines 359-362

In the PATCH handler, `session` and `currentUserId` are destructured from `requireAdminSession()` but never used. This is dead code that wastes the session lookup result and is misleading — it suggests the variables are needed for authorization or audit logging when they are not.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    await requireAdminSession();
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { session, userId: currentUserId } = await requireAdminSession();
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
```
</details>

---

**🔧 Maintainability** · lines 367-375

PATCH handler accepts `name` and `isActive` without any validation. `name` could be empty string, excessively long, or contain only whitespace. `isActive` could be any truthy/falsy value. This can lead to data integrity issues in the database.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const body = await req.json();
    const { name, isActive } = body;

    // Validate inputs
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0 || name.length > 255)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', detail: 'Invalid name' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await req.json();
    const { name, isActive } = body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
      },
```
</details>


## 🔵 Low (4)

**🔧 Maintainability** · line 359

In the DELETE handler, `currentUserId` is destructured from `requireAdminSession()` but never used. Only `session` (for `session.user.id`) is needed.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { session } = await requireAdminSession();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { session, userId: currentUserId } = await requireAdminSession();
```
</details>

---

**⚡ Performance** · lines 28-38

`requireAdminSession` fetches all workspace memberships without any limit. For a user who is a member of hundreds of workspaces, this query could become a performance bottleneck. The check only needs to know if the user has at least one admin role — consider using `findFirst` with a role filter instead of `findMany` and filtering in-memory.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Check if user has any admin role membership
  const adminMembership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      role: { in: ADMIN_ROLES },
    },
    select: { id: true },
  });

  const hasAdminRole = adminMembership !== null;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
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

**🔧 Maintainability** · line 286

The `healthScore` formula uses hardcoded business numbers (minimum 70, penalty of 5 per pending action, penalty of 2 per open case beyond 5). These magic numbers should be extracted as named constants with documentation so future maintainers can understand the scoring logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const HEALTH_SCORE_MIN = 70;
    const HEALTH_SCORE_MAX = 100;
    const PENDING_ACTION_PENALTY = 5;
    const OPEN_CASE_THRESHOLD = 5;
    const OPEN_CASE_PENALTY = 2;
    const healthScore = Math.max(HEALTH_SCORE_MIN, Math.min(HEALTH_SCORE_MAX, HEALTH_SCORE_MAX - (pendingActions * PENDING_ACTION_PENALTY) - Math.max(0, openCasesCount - OPEN_CASE_THRESHOLD) * OPEN_CASE_PENALTY));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const healthScore = Math.max(70, Math.min(100, 100 - (pendingActions * 5) - Math.max(0, openCasesCount - 5) * 2));
```
</details>

---

**🔧 Maintainability** · lines 108-115

`openCasesCount` counts request assignments, not distinct cases. If a user has multiple assignments to the same request, the count will be inflated. This may cause the `healthScore` and `openCases` stat to be inaccurate. Consider using `distinct` or counting by `requestId`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Count distinct open cases, not assignments (multiple assignments to same request)
      prisma.legalRequest.count({
        where: {
          assignments: {
            some: { userId: id },
          },
          status: { notIn: ['completed', 'cancelled', 'draft', 'draft_intake'] },
        },
      }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      prisma.requestAssignment.count({
        where: {
          userId: id,
          request: {
            status: { notIn: ['completed', 'cancelled', 'draft', 'draft_intake'] },
          },
        },
      }),
```
</details>


