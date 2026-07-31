# Review: `src/lib/types/organization.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 5

---

## 🟠 High (1)

**🔒 Security** · line 72

**Loosely-typed `permissionsJson` risks authorization bypass.** `Record<string, boolean>` allows arbitrary keys from the database without validation. If authorization logic trusts any key present in this field, a malicious or stale entry in the DB could grant unintended permissions. Consider using a discriminated union or a known set of permission keys (e.g., `type Permissions = { canManageMembers: boolean; canEditOrg: boolean; … }`) and validating/sanitizing on read and write.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Use a strict permission set instead of Record<string, boolean>
  permissionsJson: OrganizationPermissions;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  permissionsJson: Record<string, boolean>;
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · line 39

**`isDefault` lacks a uniqueness constraint at the type level.** Multiple organizations per tenant can be marked `isDefault: true`, which could cause inconsistent UI routing, context resolution, or default workspace selection. The business logic should enforce at most one default per tenant, and the type alone offers no guard against this. Consider documenting this restriction or adding a domain-level invariant check.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  /** At most one organization per tenant may be the default. Enforced at the service layer. */
  isDefault: boolean;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  isDefault: boolean;
```
</details>

---

**🔒 Security** · lines 47-49

**`tenantId` in `CreateOrganizationInput` enables mass assignment.** A client could supply an arbitrary `tenantId` and create an organization under a different tenant. The `tenantId` should be derived server-side from the authenticated session, not accepted from the request body. Consider removing it from the input type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface CreateOrganizationInput {
  name: string;
  // tenantId is derived server-side from the authenticated session
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface CreateOrganizationInput {
  name: string;
  tenantId: string;
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 71

**Inconsistent status union pattern.** `Organization.status` uses a named `OrganizationStatus` type, but `OrganizationMembership.status` uses an inline union `'active' | 'invited' | 'suspended' | 'removed'`. If membership statuses evolve, the inline union is easy to miss during updates. Consider extracting a named `MembershipStatus` type for consistency and single-source-of-truth.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export type MembershipStatus = 'active' | 'invited' | 'suspended' | 'removed';
// ...
  status: MembershipStatus;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  status: 'active' | 'invited' | 'suspended' | 'removed';
```
</details>

---

**🔧 Maintainability** · lines 19-24

**`ORGANIZATION_ROLE` constant appears unused.** No other file in the codebase imports or references this constant (e.g., `ORGANIZATION_ROLE.OWNER`). If it is intended for runtime role checks or validation, it should be consumed; otherwise it is dead code that adds maintenance burden. Consider removing it or wiring it into the authorization layer.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const ORGANIZATION_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;
```
</details>


