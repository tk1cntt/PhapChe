# Review: `src/app/api/admin/audit/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟠 High (1)

**🐛 Bug** · line 23

Using `new URL(request.url)` can throw a `TypeError` if `request.url` is a relative URL (e.g., `/api/admin/audit?page=1`), which can happen in certain Next.js deployment environments or behind proxies. Next.js `NextRequest` provides a pre-parsed `nextUrl` property that should be used instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { searchParams } = request.nextUrl;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { searchParams } = new URL(request.url);
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · line 5

Admin role strings `'super_admin'` and `'coordinator_admin'` are hardcoded. If these roles are used across multiple files (e.g., middleware, other API routes, UI), they should be extracted to a shared constants module to avoid desynchronization and typos.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider moving to a shared constants file, e.g. @/lib/security/roles.ts:
// export const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
// Then import: import { ADMIN_ROLES } from '@/lib/security/roles';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 25-26

`parseInt` returns `NaN` for invalid inputs (e.g., `?page=abc`). While the downstream `page || 1` fallback masks this (since `NaN` is falsy), the intermediate `NaN` value propagates through expressions like `Math.max(1, NaN)` and `Math.min(100, NaN)`, relying on `||` to rescue it. This is fragile and makes the code harder to reason about. Consider explicitly handling `NaN` with `isNaN()` or `Number.isNaN()`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
    const rawPageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
    const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    const pageSize = Number.isNaN(rawPageSize) ? 10 : Math.min(100, Math.max(1, rawPageSize));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '10', 10));
```
</details>


