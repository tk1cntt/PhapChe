# Review: `src/lib/middleware/auth-middleware.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 33-44

Role check is completely bypassed for unauthenticated users when `required: false` is set. If a route is configured with `{ required: false, roles: ['admin'] }`, unauthenticated requests will pass through without any role verification, defeating the purpose of role-based access control. The role check should still execute when roles are specified, regardless of whether authentication is required.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!session) {
      // If roles are specified, authentication is always required
      if (options.required !== false || (options.roles && options.roles.length > 0)) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', detail: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Enforce role check when roles are specified
    if (options.roles && options.roles.length > 0) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!session) {
      if (options.required !== false) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', detail: 'Authentication required' },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Enforce role check when roles are specified
    if (options.roles && options.roles.length > 0) {
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 44-59

The `prisma.workspaceMembership.findMany` call has no error handling. If the database is unreachable or the query fails, the resulting unhandled promise rejection will crash the middleware or leak a raw database error to the client as a 500 response. Wrap this query in a try/catch and return a controlled 500 error response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (options.roles && options.roles.length > 0) {
      try {
        const memberships = await prisma.workspaceMembership.findMany({
          where: { userId: session.user.id, isActive: true },
          select: { role: true },
        });

        const userRoles = new Set(memberships.map((m) => m.role));
        const hasRequiredRole = options.roles.some((role) => userRoles.has(role));

        if (!hasRequiredRole) {
          return NextResponse.json(
            { error: 'FORBIDDEN', detail: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      } catch (err) {
        console.error('Auth middleware role check error:', err instanceof Error ? err.message : String(err));
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
          { status: 500 }
        );
      }
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (options.roles && options.roles.length > 0) {
      const memberships = await prisma.workspaceMembership.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { role: true },
      });

      const userRoles = new Set(memberships.map((m) => m.role));
      const hasRequiredRole = options.roles.some((role) => userRoles.has(role));

      if (!hasRequiredRole) {
        return NextResponse.json(
          { error: 'FORBIDDEN', detail: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 22-31

When `auth.api.getSession` throws and `required` is `false`, the error is silently swallowed and the request proceeds without any user context (`x-user-id` header not set). This masks authentication service outages and misconfigurations, making them hard to detect in production. Consider logging a warning even when auth is optional, so operators can detect the degradation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    } catch (err) {
      console.error('Auth middleware session error:', err instanceof Error ? err.message : String(err));
      if (options.required !== false) {
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
          { status: 500 }
        );
      }
      // Proceed without user context, but the auth service is degraded
      return NextResponse.next();
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    } catch (err) {
      console.error('Auth middleware session error:', err instanceof Error ? err.message : String(err));
      if (options.required !== false) {
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', detail: 'Internal server error' },
          { status: 500 }
        );
      }
      return NextResponse.next();
    }
```
</details>

---

**🐛 Bug** · lines 43-48

Missing null check for `session.user`. The type system may indicate `session.user` is always present when `session` is truthy, but defensive coding is warranted — if `session.user` is unexpectedly `undefined` or `null`, accessing `session.user.id` on lines 47 and 63 will throw a TypeError that bypasses the existing error handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Enforce role check when roles are specified
    if (options.roles && options.roles.length > 0) {
      if (!session.user?.id) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', detail: 'Invalid session' },
          { status: 401 }
        );
      }
      const memberships = await prisma.workspaceMembership.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { role: true },
      });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Enforce role check when roles are specified
    if (options.roles && options.roles.length > 0) {
      const memberships = await prisma.workspaceMembership.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { role: true },
      });
```
</details>

---

**⚡ Performance** · lines 45-48

Every role-protected request triggers a database query to `prisma.workspaceMembership.findMany`. Under high load, this can become a bottleneck and a denial-of-service vector. Consider caching the user's role memberships (e.g., in a short-lived in-memory cache or via the session token itself) to reduce database pressure for repeated requests from the same user.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // TODO: Consider caching role memberships to reduce DB load per request
      const memberships = await prisma.workspaceMembership.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { role: true },
      });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const memberships = await prisma.workspaceMembership.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { role: true },
      });
```
</details>


