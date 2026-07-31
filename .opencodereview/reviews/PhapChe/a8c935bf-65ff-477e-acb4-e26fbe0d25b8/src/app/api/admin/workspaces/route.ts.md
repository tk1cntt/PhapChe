# Review: `src/app/api/admin/workspaces/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 34-85

GET handler's try/catch only wraps `requireAdminSession()`. The Prisma `findMany` and `count` queries (lines 62-72) are outside the catch block, so any database error will propagate unhandled, potentially leaking stack traces or crashing the route with a raw 500. Wrap the entire handler body in the try/catch.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const organizationId = searchParams.get('organizationId');
    const isActive = searchParams.get('isActive');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '20', 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { members: true, requests: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.workspace.count({ where }),
    ]);

    return NextResponse.json({
      data: workspaces,
      pagination: { total, skip, take, hasMore: skip + take < total },
    });
  } catch (e: unknown) {
    if (isStructuredError(e)) {
      return NextResponse.json({ error: e.error }, { status: e.status });
    }
    console.error('Error in GET workspaces:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
  } catch (e: unknown) {
    if (isStructuredError(e)) {
      return NextResponse.json({ error: e.error }, { status: e.status });
    }
    console.error('Error in GET workspaces:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const organizationId = searchParams.get('organizationId');
  const isActive = searchParams.get('isActive');
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '20', 10);

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
    ];
  }
  if (organizationId) {
    where.organizationId = organizationId;
  }
  if (isActive !== null) {
    where.isActive = isActive === 'true';
  }

  const [workspaces, total] = await Promise.all([
    prisma.workspace.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { members: true, requests: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.workspace.count({ where }),
  ]);

  return NextResponse.json({
    data: workspaces,
    pagination: { total, skip, take, hasMore: skip + take < total },
  });
}
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 49-50

`skip` and `take` are parsed from query params without validation. `parseInt('abc', 10)` returns `NaN`, and `parseInt('-5', 10)` returns `-5`. Passing `NaN` or negative values to Prisma's `skip`/`take` causes unexpected behavior. Validate that both are non-negative integers and clamp `take` to a reasonable maximum.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10) || 0);
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get('take') || '20', 10) || 20));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const skip = parseInt(searchParams.get('skip') || '0', 10);
  const take = parseInt(searchParams.get('take') || '20', 10);
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 13-32

The `requireAdminSession()` auth check and its try/catch error handling are duplicated verbatim in both `GET` and `POST`. Extract this into a shared wrapper or higher-order function to reduce duplication and ensure consistent error handling across all admin routes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider wrapping route handlers with a higher-order function:
// function withAdminAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
//   return async (req: NextRequest) => {
//     try {
//       await requireAdminSession();
//       return handler(req);
//     } catch (e: unknown) {
//       if (isStructuredError(e)) {
//         return NextResponse.json({ error: e.error }, { status: e.status });
//       }
//       console.error('Admin API error:', e);
//       return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//     }
//   };
// }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
async function requireAdminSession() {
  const session = await auth.api.getSession();
  if (!session?.user?.id) {
    throw { status: 401, error: 'Unauthorized' };
  }

  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { role: true },
  });

  const userRoles = memberships.map((m) => m.role).filter((r): r is string => r !== null);
  const hasAdminRole = ADMIN_ROLES.some((role) => userRoles.includes(role));

  if (!hasAdminRole) {
    throw { status: 403, error: 'Forbidden' };
  }

  return { session, userId: session.user.id };
}
```
</details>

---

**🔒 Security** · lines 102-104

No slug format validation is performed before creation. Arbitrary slugs (e.g., containing `/`, `..`, special characters, or reserved words like `admin`, `api`) could cause URL routing conflicts, path traversal issues, or unexpected behavior. Validate the slug against a safe pattern (e.g., `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`) and reject reserved slugs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Validate slug format: lowercase alphanumeric with hyphens only
    const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!SLUG_REGEX.test(slug) || slug.length > 64) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 63-65

`isActive` query param check uses `isActive !== null`, but `searchParams.get('isActive')` returns `string | null`, not `undefined`. While functionally correct, using `isActive != null` (which checks both) or explicitly checking for a non-empty string would be more idiomatic and prevent accidentally setting `where.isActive = false` when `isActive` is an empty string (e.g., `?isActive=`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (isActive === 'true' || isActive === 'false') {
    where.isActive = isActive === 'true';
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (isActive !== null) {
    where.isActive = isActive === 'true';
  }
```
</details>


