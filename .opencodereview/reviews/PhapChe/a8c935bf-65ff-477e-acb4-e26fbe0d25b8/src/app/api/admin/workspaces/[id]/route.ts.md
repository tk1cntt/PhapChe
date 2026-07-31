# Review: `src/app/api/admin/workspaces/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🟠 High (2)

**🐛 Bug** · lines 87-93

PATCH and DELETE do not check whether the workspace is active (soft-deleted). A soft-deleted workspace (isActive=false) can still be updated or re-deleted, while GET correctly filters it out. This creates an inconsistency where admins may unknowingly modify inactive workspaces. Consider adding an `isActive: true` filter to the `findUnique` call in PATCH/DELETE, matching the GET behavior.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const workspace = await prisma.workspace.findUnique({ where: { id, isActive: true } });
  if (!workspace) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, description, isActive, organizationId } = body;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { name, description, isActive, organizationId } = body;
```
</details>

---

**🐛 Bug** · lines 98-101

Inconsistent null handling in PATCH data building: `name` uses `&&` (skips falsy values including empty strings), while `description`, `isActive`, and `organizationId` use `!== undefined` (allows null/empty). This means a PATCH with `{"description": null}` would set the description to null in the database, while `{"name": null}` would silently leave the name unchanged. The behavior should be consistent — either use `!== undefined` for all fields (if explicitly setting null is intentional), or use a more deliberate approach with explicit null handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(organizationId !== undefined && { organizationId }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(organizationId !== undefined && { organizationId }),
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 95-102

PATCH accepts an `organizationId` but never validates that the referenced organization exists. This could lead to a Prisma foreign key constraint violation at the database level, resulting in an unhandled 500 error. Consider adding a lookup to verify the organization exists before updating.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (organizationId !== undefined) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }
  }

  const updated = await prisma.workspace.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(organizationId !== undefined && { organizationId }),
    },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const updated = await prisma.workspace.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(organizationId !== undefined && { organizationId }),
    },
```
</details>

---

**🐛 Bug** · lines 53-68

Prisma database operations in GET, PATCH, and DELETE run outside the try-catch blocks. If Prisma throws (e.g., connection timeout, deadlock), the error will propagate as an unhandled rejection, resulting in a Next.js 500 error with no structured error response and no logging. Wrap the Prisma calls in try-catch or use a global error handler.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id, isActive: true },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { requests: true } },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: workspace });
  } catch (e: unknown) {
    console.error('Error fetching workspace:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const workspace = await prisma.workspace.findUnique({
    where: { id, isActive: true },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { requests: true } },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data: workspace });
```
</details>

---

**🔧 Maintainability** · lines 13-35

`requireAdminSession` throws plain objects (`{ status, error }`) instead of using the `appError` helper from `@/lib/errors`. While `isStructuredError` does handle plain objects, using `appError` would be more consistent with the project's error handling pattern and would produce proper Error instances with stack traces for debugging.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
async function requireAdminSession(workspaceId: string) {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    throw appError(401, 'Unauthorized');
  }

  // Verify admin membership in the SPECIFIC workspace, not just any workspace
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: session.user.id,
      workspaceId,
      isActive: true,
      role: { in: ADMIN_ROLES },
    },
    select: { role: true },
  });

  if (!membership) {
    throw appError(403, 'Forbidden');
  }

  return { session, userId: session.user.id };
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
async function requireAdminSession(workspaceId: string) {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }

  // Verify admin membership in the SPECIFIC workspace, not just any workspace
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: session.user.id,
      workspaceId,
      isActive: true,
      role: { in: ADMIN_ROLES },
    },
    select: { role: true },
  });

  if (!membership) {
    throw { status: 403, error: 'Forbidden' };
  }

  return { session, userId: session.user.id };
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 34-37

The return value of `requireAdminSession` (`{ session, userId }`) is never destructured at any call site — each handler calls `await requireAdminSession(id)` without capturing the result. If `session` and `userId` are not needed downstream, consider simplifying the return type to `void` or removing the return statement entirely to avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
}

export async function GET(
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return { session, userId: session.user.id };
}

export async function GET(
```
</details>


