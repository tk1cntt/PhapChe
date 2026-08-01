# Review: `src/lib/auth/partner-permissions.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 6

---

## 🔴 Critical (1)

**🔒 Security** · lines 50-52

The `x-user-id` header is trusted directly as the authenticated user identity without any validation, signature verification, or session lookup. If the middleware is placed before the authentication layer (or the auth middleware is misconfigured/missing), any client can forge this header to impersonate any user, gaining full partner access. This is a severe privilege escalation risk. The user identity should be derived from a verified session token (e.g., JWT, cookie session) rather than a plain header.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // User identity must be derived from a verified session, not a plain header.
    // Example: const session = await getServerSession(authOptions);
    // const userId = session?.user?.id;
    const userId = req.headers.get('x-user-id'); // TODO: replace with authenticated session

    if (!userId) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const userId = req.headers.get('x-user-id');

    if (!userId) {
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 8

`PARTNER_PERMISSIONS` is imported but never used anywhere in this file. This is dead code and should be removed to keep imports clean.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import { hasPermission as checkPermission } from '@/lib/services/partner-auth-service';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import { PARTNER_PERMISSIONS, hasPermission as checkPermission } from '@/lib/services/partner-auth-service';
```
</details>

---

**🐛 Bug** · lines 25-35

`getPartnerContext` has no try/catch around the Prisma query. If the database is unreachable, times out, or the Prisma client throws, the error propagates as an unhandled exception, crashing the middleware and returning a generic 500 (or worse, hanging the request). Wrap the query in try/catch and return `null` or a proper error response on failure.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function getPartnerContext(userId: string) {
  try {
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId,
        isActive: true,
        partner: { status: 'active' },
      },
      include: { partner: true },
    });

    if (!member) return null;

    return {
      memberId: member.id,
      partnerId: member.partnerId,
      role: member.role as PartnerRole,
      partner: member.partner,
    };
  } catch (error) {
    console.error('Failed to fetch partner context:', error);
    return null;
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function getPartnerContext(userId: string) {
  const member = await prisma.partnerMember.findFirst({
    where: {
      userId,
      isActive: true,
      partner: { status: 'active' },
    },
    include: { partner: true },
  });

  if (!member) return null;
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · line 29

Potential typo: `isActive` with a capital 'A' is unusual camelCase. The conventional Prisma field name is `isActive` (all lowercase after 'is'). If the Prisma schema field is `isActive`, this query will silently fail to match or throw a Prisma validation error at runtime.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      isActive: true,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      isActive: true,
```
</details>

---

**🐛 Bug** · lines 52-57

`requirePartner` returns `null` when `required` is `false` and no `userId` header is present (line 54). However, `null` is not a valid Next.js middleware return value — middleware should return `NextResponse.next()` to pass through or a `NextResponse` instance. Returning `null` may cause unexpected behavior or errors in the middleware chain.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!userId) {
      if (options.required) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      return NextResponse.next();
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!userId) {
      if (options.required) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      return null;
    }
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 74-76

In `requirePartnerRole` and `requirePartnerPermission`, `requirePartner` is always called with `{ required: true }`, which guarantees it will never return `null` (it returns either a `NextResponse` or a context object). Therefore, the `if (!context) return context;` null check on lines 73 and 89 is dead code for the `null` path. Consider removing it to avoid confusion, or keep it as a defensive guard if the call signature might change.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const context = await requirePartner({ required: true })(req);
    if (context instanceof NextResponse) return context;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const context = await requirePartner({ required: true })(req);
    if (!context) return context;
    if (context instanceof NextResponse) return context;
```
</details>


