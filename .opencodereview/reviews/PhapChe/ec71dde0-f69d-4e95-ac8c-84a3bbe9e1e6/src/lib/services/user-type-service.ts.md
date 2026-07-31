# Review: `src/lib/services/user-type-service.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · lines 49-56

`getUserTypeInfo` always returns `organizationId: null`, which means any caller using this function's output with `isCorporateCustomer` or `isIndividualCustomer` will always classify customers as individuals — even when they have a valid organization. This is a data integrity issue: corporate customers are silently treated as individual customers, which could affect access control, feature flags, and analytics. Consider either accepting workspace data with `organizationId` (like `getUserTypeInfoWithOrg` does) or explicitly documenting that this function cannot determine organization membership.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // NOTE: organizationId is always null here because workspace data
  // (containing organizationId) is not available in this overload.
  // Use getUserTypeInfoWithOrg for organization-aware classification.
  return {
    accountType,
    isStaff,
    isCustomer,
    organizationId: null,
    primaryRole: allRoles[0] || 'none',
    allRoles: [...new Set(allRoles)],
  };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return {
    accountType,
    isStaff,
    isCustomer,
    organizationId: null,
    primaryRole: allRoles[0] || 'none',
    allRoles: [...new Set(allRoles)],
  };
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 46-47

When `accountType` is `'customer'` but the user has a staff role in any active workspace, `isStaff` becomes `true` and `isCustomer` becomes `false`. This overrides the user's core identity based on a workspace-level role. If downstream access-control decisions depend on `isCustomer` vs `isStaff` at the application level (not workspace level), this could incorrectly grant staff-level privileges to customers. Confirm whether this is intentional — if workspace roles should only affect workspace-scoped authorization, consider separating workspace-level role checks from the global user type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // NOTE: A customer who holds a staff role in a workspace is treated as staff.
  // Ensure this is intentional for all access-control decisions.
  const isStaff = accountType === 'staff' || hasStaffRole;
  const isCustomer = !isStaff;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const isStaff = accountType === 'staff' || hasStaffRole;
  const isCustomer = !isStaff;
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · line 54

`primaryRole` is assigned from `allRoles[0]` — the first active membership's role — with no explicit priority ordering. Since membership order from the database is not guaranteed to be stable, different queries could return different "primary" roles for the same user. Consider defining a role priority (e.g. `super_admin` > `coordinator` > `specialist` > `reviewer` > others) and selecting the highest-priority role, or document the expected ordering contract.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Select the highest-priority role from active memberships.
    // Priority order: super_admin > coordinator > specialist > reviewer > others
    primaryRole: getPrimaryRole(allRoles),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    primaryRole: allRoles[0] || 'none',
```
</details>

---

**🔧 Maintainability** · lines 36-57

`getUserTypeInfo` and `getUserTypeInfoWithOrg` share ~80% identical logic (filtering active memberships, computing roles, determining isStaff/isCustomer). This duplication increases maintenance burden — any change to the core logic must be applied in two places. Consider extracting the common logic into a shared helper (e.g. `buildBaseUserTypeInfo`) that both functions compose.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function buildBaseUserTypeInfo(
  accountType: AccountType,
  activeMemberships: { role: string }[]
): Omit<UserTypeInfo, 'organizationId'> {
  const allRoles = activeMemberships.map(m => m.role);
  const hasStaffRole = allRoles.some(role => isStaffRole(role));
  const isStaff = accountType === 'staff' || hasStaffRole;

  return {
    accountType,
    isStaff,
    isCustomer: !isStaff,
    primaryRole: allRoles[0] || 'none',
    allRoles: [...new Set(allRoles)],
  };
}

export function getUserTypeInfo(
  accountType: AccountType,
  memberships: WorkspaceMembership[]
): UserTypeInfo {
  const active = memberships.filter(m => m.isActive);
  return {
    ...buildBaseUserTypeInfo(accountType, active),
    organizationId: null,
  };
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function getUserTypeInfo(
  accountType: AccountType,
  memberships: WorkspaceMembership[]
): UserTypeInfo {
  const activeMemberships = memberships.filter(m => m.isActive);
  const allRoles = activeMemberships.map(m => m.role);
  const hasStaffRole = allRoles.some(role => isStaffRole(role));

  // If accountType is 'staff', user is staff regardless of membership
  // If accountType is 'customer', check membership roles
  const isStaff = accountType === 'staff' || hasStaffRole;
  const isCustomer = !isStaff;

  return {
    accountType,
    isStaff,
    isCustomer,
    organizationId: null,
    primaryRole: allRoles[0] || 'none',
    allRoles: [...new Set(allRoles)],
  };
}
```
</details>


