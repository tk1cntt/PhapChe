# Review: `src/lib/security/role-config.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 2

---

## 🔴 Critical (1)

**🔒 Security** · lines 94-98

**Security: Default-allow for unconfigured admin routes**

When `routeKey` is not found in `ADMIN_ROUTE_GUARDS`, `canAccessRoute` returns `true`, granting access to **all users** by default. This is a fail-open security pattern. If a developer adds a new sensitive admin route (e.g., `/admin/billing`) but forgets to update `ADMIN_ROUTE_GUARDS`, any authenticated user—even those with no admin roles—can access it.

This is also inconsistent with `canSeeMenu` and `canSeeTab`, which both default to `false` (fail-closed) for unknown keys.

**Recommendation:** Change to fail-closed: return `false` for unconfigured routes, or log a warning and deny access. At minimum, explicitly document this behavior and add a runtime warning.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function canAccessRoute(routeKey: string, userRoles: readonly string[]): boolean {
  const required = ADMIN_ROUTE_GUARDS[routeKey];
  if (!required) {
    console.warn(`[canAccessRoute] No guard configured for route: "${routeKey}" — denying access by default.`);
    return false;
  }
  return hasAnyRole(userRoles, required);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function canAccessRoute(routeKey: string, userRoles: readonly string[]): boolean {
  const required = ADMIN_ROUTE_GUARDS[routeKey];
  if (!required) return true; // Route chưa config → allow (sẽ được thêm sau)
  return hasAnyRole(userRoles, required);
}
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 64-67

**Type Safety: `readonly string[]` used instead of `readonly AppRole[]`**

`hasAnyRole`, `canSeeMenu`, `canSeeTab`, and `canAccessRoute` all accept `userRoles` as `readonly string[]`, but the visibility/guard maps use `readonly AppRole[]`. This means the type system cannot catch typos or invalid role strings passed to these functions. For example, `canAccessRoute('users', ['super_admn'])` (typo) would compile without error but silently fail at runtime.

**Recommendation:** Use `readonly AppRole[]` for the `userRoles` parameter in all four functions to enforce compile-time type checking.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function hasAnyRole(userRoles: readonly AppRole[], allowedRoles: readonly string[]): boolean {
  if (userRoles.length === 0) return false;
  return userRoles.some(r => allowedRoles.includes(r));
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function hasAnyRole(userRoles: readonly string[], allowedRoles: readonly string[]): boolean {
  if (userRoles.length === 0) return false;
  return userRoles.some(r => allowedRoles.includes(r));
}
```
</details>


