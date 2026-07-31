# Review: `src/lib/middleware/organization-context-middleware.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 3

---

## 🔴 Critical (1)

**🐛 Bug** · lines 31-44

The Prisma database query is not wrapped in a try/catch block. If the database connection fails, times out, or any other Prisma error occurs, the async function will throw an unhandled exception. This results in Next.js returning a raw 500 error without a proper JSON response, degrading the API contract and making client-side error handling unreliable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    let workspace;
    try {
      workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
        select: {
          id: true,
          organizationId: true,
        },
      });
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 46-51

Directly mutating NextRequest.headers via .set() is not the documented way to propagate custom headers to downstream route handlers in Next.js middleware. The correct approach is to create a new Headers instance and pass it via NextResponse.next() with the request.headers option. Without this, the custom headers may not be visible to route handlers, breaking the intended organization-context propagation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // organizationId is always present (NOT NULL since v2.3)
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-organization-id', workspace.organizationId);
    requestHeaders.set('x-workspace-id', workspace.id);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // organizationId is always present (NOT NULL since v2.3)
    req.headers.set('x-organization-id', workspace.organizationId);

    req.headers.set('x-workspace-id', workspace.id);

    return NextResponse.next();
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 46-47

Despite the schema-level NOT NULL constraint, this code has no runtime null guard on workspace.organizationId. If the constraint is ever relaxed, a migration goes wrong, or the data is in an inconsistent state, the header would be set to the literal string 'null', polluting downstream data integrity. A defensive null check or assertion is warranted.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // organizationId is always present (NOT NULL since v2.3)
    if (!workspace.organizationId) {
      console.error('Workspace missing organizationId:', workspace.id);
      return NextResponse.json(
        { error: 'Workspace configuration error' },
        { status: 500 }
      );
    }
    req.headers.set('x-organization-id', workspace.organizationId);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // organizationId is always present (NOT NULL since v2.3)
    req.headers.set('x-organization-id', workspace.organizationId);
```
</details>


