# Review: `src/lib/middleware/partner-context-middleware.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · lines 27-33

Unhandled database error: the Prisma query can throw (e.g., connection failure, timeout). Without a try/catch, this results in an unhandled promise rejection and a 500 response with no context. Wrap this in try/catch and return a meaningful error response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    try {
      const member = await prisma.partnerMember.findFirst({
        where: { userId, isActive: true },
        select: {
          partnerId: true,
          role: true,
        },
      });

      if (member) {
        req.headers.set('x-partner-id', member.partnerId);
        req.headers.set('x-partner-role', member.role);
      } else if (options.required) {
        return NextResponse.json(
          { error: 'Partner context required' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Failed to fetch partner context:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const member = await prisma.partnerMember.findFirst({
      where: { userId, isActive: true },
      select: {
        partnerId: true,
        role: true,
      },
    });
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 35-40

Header propagation issue: mutating `req.headers.set()` does not reliably propagate headers to downstream handlers in all Next.js versions. The recommended pattern is to clone headers and pass them via `NextResponse.next({ request: { headers } })`. This ensures downstream route handlers and server components can read the injected headers.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (member) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-partner-id', member.partnerId);
      requestHeaders.set('x-partner-role', member.role);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    return NextResponse.next();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (member) {
      req.headers.set('x-partner-id', member.partnerId);
      req.headers.set('x-partner-role', member.role);
    }

    return NextResponse.next();
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 17-25

Semantic gap in `required` option: when `required: true`, the middleware only blocks if `userId` is missing, but does NOT block when `userId` exists and no active partner member is found. The name `required` implies that partner context should be mandatory, not just the user ID. Consider adding a check after the query to return an error when `member` is null and `required` is true.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!userId) {
      if (options.required) {
        return NextResponse.json(
          { error: 'User context required' },
          { status: 400 }
        );
      }
      return NextResponse.next();
    }

    const member = await prisma.partnerMember.findFirst({
      where: { userId, isActive: true },
      select: {
        partnerId: true,
        role: true,
      },
    });

    if (!member && options.required) {
      return NextResponse.json(
        { error: 'Partner context required' },
        { status: 403 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!userId) {
      if (options.required) {
        return NextResponse.json(
          { error: 'User context required' },
          { status: 400 }
        );
      }
      return NextResponse.next();
    }
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 15

Hardcoded header names: 'x-user-id', 'x-partner-id', and 'x-partner-role' are repeated string literals throughout the file. Centralize them in named constants to prevent typos and make refactoring easier.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const HEADER_USER_ID = 'x-user-id';
const HEADER_PARTNER_ID = 'x-partner-id';
const HEADER_PARTNER_ROLE = 'x-partner-role';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const userId = req.headers.get('x-user-id');
```
</details>


