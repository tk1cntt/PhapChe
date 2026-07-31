# Review: `src/lib/security/middleware-guard.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 59-63

isPublicPath fails for locale-prefixed paths without trailing slash (e.g., /vi/sign-in, /vi/intake). The `includes` fallback requires the prefix to be surrounded by slashes: `/vi/sign-in/` would match, but `/vi/sign-in` does not. In Next.js middleware with i18n routing, `pathname` includes the locale prefix, so legitimate sign-in/intake pages will be denied access.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function isPublicPath(pathname: string): boolean {
  // Match prefix at segment boundaries to avoid substring bypass.
  // e.g. /sign-in → public, /admin/sign-in → NOT public
  return PUBLIC_PATH_PREFIXES.some(p => {
    if (pathname.startsWith(p)) return true;
    // Also match locale-prefixed paths like /vi/sign-in, /vi/sign-in/...
    const normalized = p.replace(/\/$/, '');
    return pathname.startsWith(`/${normalized}/`) || pathname === `/${normalized}` || pathname.startsWith(`/${normalized}?`);
  });
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function isPublicPath(pathname: string): boolean {
  // Chỉ match prefix ở đúng vị trí — tránh substring bypass.
  // VD: /sign-in → public, /admin/sign-in → NOT public
  return PUBLIC_PATH_PREFIXES.some(p => pathname.startsWith(p) || pathname.includes('/' + p.replace(/^\//, '') + '/'));
}
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 62

isPublicPath generates double slashes for prefixes ending with `/` (e.g., /api/, /auth/). For p='/api/', the result is `pathname.includes('/api//')` which will never match any valid path, silently breaking the locale-prefix fallback for these routes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  return PUBLIC_PATH_PREFIXES.some(p => {
    if (pathname.startsWith(p)) return true;
    const normalized = p.replace(/^\//, '').replace(/\/$/, '');
    return pathname.includes(`/${normalized}/`) || pathname === `/${normalized}`;
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return PUBLIC_PATH_PREFIXES.some(p => pathname.startsWith(p) || pathname.includes('/' + p.replace(/^\//, '') + '/'));
```
</details>

---

**🐛 Bug** · lines 45-54

checkLegacyRedirect only works when the URL has a locale prefix (e.g., /vi/partner). It accesses `segments[1]` assuming `segments[0]` is always the locale. For `/partner` (no locale), `segments = ['partner']` and `segments[1]` is `undefined`, so the redirect never triggers. This causes broken behavior for non-locale-prefixed legacy URLs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function checkLegacyRedirect(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  for (const [oldPath, redirectTo] of Object.entries(LEGACY_REDIRECTS)) {
    const oldSegments = oldPath.split('/').filter(Boolean);
    if (oldSegments.length === 1 && segments.length >= 1) {
      // Check both with and without locale prefix
      const lastSegment = segments[segments.length - 1];
      if (lastSegment === oldSegments[0] || (segments.length > 1 && segments[1] === oldSegments[0])) {
        return redirectTo;
      }
    }
  }
  return null;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function checkLegacyRedirect(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  for (const [oldPath, redirectTo] of Object.entries(LEGACY_REDIRECTS)) {
    const oldSegments = oldPath.split('/').filter(Boolean);
    if (oldSegments.length === 1 && segments.length >= 1 && segments[1] === oldSegments[0]) {
      return redirectTo;
    }
  }
  return null;
}
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 81-83

Type assertion `as Record<string, readonly AppRole[]>` on `_ADMIN_ROUTE_GUARDS` hides potential runtime type mismatches. If the imported constant is not actually a plain record (e.g., a Map or Proxy), the index access will silently return `undefined` and the `?? null` fallback will trigger, masking the real problem. Consider using a runtime type guard or validating the shape at import time.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function getRequiredRoles(adminRoute: string): readonly AppRole[] | null {
  if (typeof _ADMIN_ROUTE_GUARDS !== 'object' || _ADMIN_ROUTE_GUARDS === null) {
    console.error('[middleware-guard] ADMIN_ROUTE_GUARDS is not a valid object');
    return null;
  }
  return (_ADMIN_ROUTE_GUARDS as Record<string, readonly AppRole[]>)[adminRoute] ?? null;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function getRequiredRoles(adminRoute: string): readonly AppRole[] | null {
  return (_ADMIN_ROUTE_GUARDS as Record<string, readonly AppRole[]>)[adminRoute] ?? null;
}
```
</details>

---

**🐛 Bug** · line 96

No null/undefined guard on `userRoles` parameter in `checkRouteAccess`. If the middleware resolver returns `undefined` or `null` (e.g., due to a network error fetching session roles), the function will pass it to `_hasAnyRole` which likely iterates over the array, causing a runtime TypeError. Add a defensive check at the function entry.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function checkRouteAccess(pathname: string, userRoles: AppRole[]): { allowed: true } | { allowed: false; reason: string } {
  // Defensive: treat null/undefined roles as unauthenticated
  if (!userRoles || !Array.isArray(userRoles)) {
    return { allowed: false, reason: 'NO_ROLES' };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function checkRouteAccess(pathname: string, userRoles: AppRole[]): { allowed: true } | { allowed: false; reason: string } {
```
</details>


