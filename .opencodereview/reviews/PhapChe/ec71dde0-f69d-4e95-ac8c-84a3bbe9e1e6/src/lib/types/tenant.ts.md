# Review: `src/lib/types/tenant.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 3

---

## 🟡 Medium (2)

**🔧 Maintainability** · lines 18-19

The `TenantType` alias is deprecated but still exported. A codebase search shows no other files reference `TenantType`, so it is effectively dead code. If backward compatibility is no longer needed, remove it to avoid confusion. If it must remain, add a clear removal timeline in a JSDoc comment.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// TenantType removed — no external references found. Use TenantMode directly.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
/** @deprecated Use TenantMode instead */
export type TenantType = TenantMode;
```
</details>

---

**🐛 Bug** · line 67

`PLATFORM_TENANT_CODE` is assigned `'shared_platform'`, which is a `TenantMode` value, not a tenant `code`. The constant name suggests it should hold a tenant code (like `'platform-tenant'`), but the value is a mode. This naming mismatch can cause bugs when this constant is used in contexts expecting a tenant code vs. a tenant mode. Consider renaming to `PLATFORM_TENANT_MODE` or changing the value to match the naming intent.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export const PLATFORM_TENANT_MODE: TenantMode = 'shared_platform';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const PLATFORM_TENANT_CODE = 'shared_platform';
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 49-54

`CreateTenantInput.code` is typed as `string | undefined`, but `Tenant.code` is `string | null | undefined`. The input should also accept `null` for consistency, otherwise callers cannot explicitly set `code` to `null` when creating a tenant.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface CreateTenantInput {
  name: string;
  code?: string | null;
  mode?: TenantMode;
  settings?: TenantSettings;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface CreateTenantInput {
  name: string;
  code?: string;
  mode?: TenantMode;
  settings?: TenantSettings;
}
```
</details>


