# Review: `src/lib/middleware/tenant-middleware.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · lines 31-35

NextRequest headers are immutable. Calling `req.headers.set()` will throw a runtime error (`TypeError: headers.set is not a function` or similar), meaning the tenant ID is never attached downstream. The correct approach is to clone the request with modified headers and pass it via `NextResponse.next({ request: newRequest })`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (tenantId) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-tenant-id', tenantId);

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    return NextResponse.next();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (tenantId) {
      req.headers.set('x-tenant-id', tenantId);
    }

    return NextResponse.next();
```
</details>


## 🟡 Medium (1)

**🔒 Security** · lines 20-21

The `tenantId` is taken directly from request headers without any validation or sanitization. If this value is used in downstream database queries or authorization logic, it could lead to injection attacks or unauthorized tenant access. Consider validating against a known set of tenant identifiers (e.g., a whitelist or regex pattern) even in MVP.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const rawTenantId = req.headers.get('x-tenant-id') ||
                        req.headers.get('x-platform-id');

    // Validate tenant ID format (alphanumeric + underscores/hyphens only)
    const tenantId = rawTenantId && /^[a-zA-Z0-9_-]+$/.test(rawTenantId)
      ? rawTenantId
      : undefined;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const tenantId = req.headers.get('x-tenant-id') ||
                     req.headers.get('x-platform-id');
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 11

The `TenantContext` type is imported but never used in this file. This is dead code that should be removed to keep imports clean.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import type { TenantContext } from '@/lib/types/request-context';
```
</details>

---

**🔧 Maintainability** · line 18

The inner function is declared `async` but contains no `await` expressions. This is unnecessary and adds slight overhead from the async state machine. Remove the `async` keyword or add a comment explaining why it's needed for future use.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  return (req: NextRequest) => {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return async (req: NextRequest) => {
```
</details>


