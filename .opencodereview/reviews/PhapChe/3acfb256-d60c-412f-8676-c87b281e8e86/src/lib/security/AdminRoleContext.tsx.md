# Review: `src/lib/security/AdminRoleContext.tsx`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 2

---

## 🟡 Medium (1)

**⚡ Performance** · lines 7-9

The `roles` array is passed directly as the context `value`. If the parent component creates a new array reference on each render (e.g., `['admin']` inline), every context consumer will re-render, even when the actual roles haven't changed. Consider wrapping the value with `useMemo` to stabilize the reference:

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import { createContext, useContext, useMemo } from 'react';

export function AdminRoleProvider({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const value = useMemo(() => roles, [roles]);
  return <AdminRoleContext.Provider value={value}>{children}</AdminRoleContext.Provider>;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function AdminRoleProvider({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  return <AdminRoleContext.Provider value={roles}>{children}</AdminRoleContext.Provider>;
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 5-13

The context default value is `[]` (empty array), so calling `useAdminRoles()` outside of `AdminRoleProvider` silently returns an empty array instead of surfacing a clear error. This can mask bugs where a component is accidentally rendered outside the provider. Consider using `undefined` as the default and adding a guard to throw a descriptive error when the hook is used outside the provider.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const AdminRoleContext = createContext<string[] | undefined>(undefined);

export function AdminRoleProvider({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  return <AdminRoleContext.Provider value={roles}>{children}</AdminRoleContext.Provider>;
}

export function useAdminRoles(): string[] {
  const context = useContext(AdminRoleContext);
  if (context === undefined) {
    throw new Error('useAdminRoles must be used within an AdminRoleProvider');
  }
  return context;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const AdminRoleContext = createContext<string[]>([]);

export function AdminRoleProvider({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  return <AdminRoleContext.Provider value={roles}>{children}</AdminRoleContext.Provider>;
}

export function useAdminRoles(): string[] {
  return useContext(AdminRoleContext);
}
```
</details>


