# Review: `src/lib/security/middleware-resolver.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 4

---

## 🟠 High (2)

**🐛 Bug** · line 42

Unchecked type cast `as AppRole` on the database `role` field. If the database contains a role value that is not a valid member of the `AppRole` union type (e.g., due to a migration, manual DB edit, or legacy data), the cast silently coerces it, and the invalid role will propagate downstream. This can cause authorization bypasses (e.g., a role string that doesn't match any guard check) or runtime errors in consuming code that expects only valid AppRole values. Consider adding a runtime validation guard (e.g., a type predicate or a Set of allowed values) to filter or reject invalid roles.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const VALID_ROLES: Set<string> = new Set(['admin', 'member', 'viewer']); // align with AppRole
    const roles = Array.from(
      new Set(
        user.memberships
          .map(m => m.role)
          .filter((role): role is AppRole => VALID_ROLES.has(role))
      )
    );
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const roles = Array.from(new Set(user.memberships.map(m => m.role as AppRole)));
```
</details>

---

**⚡ Performance** · lines 22-23

Dynamic `await import()` for `@/auth` and `@/lib/prisma` on every invocation of `resolveGuardUser`. Since this function is called in middleware (which runs on every matched request), both modules are re-imported per request, adding unnecessary latency from module resolution and instantiation. If the runtime supports top-level imports (Node.js runtime), move these to static imports at the top of the file. If dynamic imports are required for Edge compatibility, consider caching the imported modules in a module-level variable to avoid repeated dynamic imports.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Module-level cache for dynamic imports (if Edge runtime requires them)
let _auth: Awaited<ReturnType<typeof import('@/auth')['auth']>>;
let _prisma: Awaited<ReturnType<typeof import('@/lib/prisma')['prisma']>>;

// ... inside function:
    if (!_auth) {
      const mod = await import('@/auth');
      _auth = mod.auth;
    }
    if (!_prisma) {
      const mod = await import('@/lib/prisma');
      _prisma = mod.prisma;
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { auth } = await import('@/auth');
    const { prisma } = await import('@/lib/prisma');
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 45-48

The catch block silently swallows all errors with no logging. When session resolution or database queries fail (network errors, connection pool exhaustion, auth misconfiguration), the failure is indistinguishable from a legitimate "no session" case. This makes debugging production issues extremely difficult. Add at least a `console.error` so failures are visible in logs, and consider differentiating between "no session" and "resolution error" return values if the caller needs to handle them differently.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    // Session resolve failed — không block, để page/API tự xử lý
    console.error('[resolveGuardUser] Failed to resolve user:', error);
    return null;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch {
    // Session resolve failed — không block, để page/API tự xử lý
    return null;
  }
```
</details>

---

**🐛 Bug** · line 40

The condition `user.memberships.length === 0` returns `null`, treating an active user with no active workspace memberships identically to an unauthenticated user. This means a newly registered user who hasn't been added to any workspace yet will be completely blocked (same as no session), even if the application has routes that should be accessible to authenticated users without workspace membership. Confirm whether this is intentional. If the application has "onboarding" or "no workspace" pages, this logic would prevent the user from ever reaching them.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // If the user exists but has no active memberships, still return the user
    // (with empty roles) so callers can differentiate "no session" from "no memberships"
    if (!user) return null;

    const roles = user.memberships.length === 0
      ? []
      : Array.from(new Set(user.memberships.map(m => m.role as AppRole)));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!user || user.memberships.length === 0) return null;
```
</details>


