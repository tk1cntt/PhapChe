# Review: `src/lib/types.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 2

---

## 🟠 High (1)

**🐛 Bug** · lines 40-47

AUDIT_ADMIN role is defined in the ROLE constant and included in the Role type, but it is NOT documented in the role comments (lines 38-45), and is NOT included in either PlatformRole or WorkspaceRole types. This means any role-checking logic that uses PlatformRole or WorkspaceRole will silently fail to match audit_admin users, potentially causing authorization bypasses or unexpected behavior.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// ── Platform-level role (global, stored conceptually, not per workspace) ──
// super_admin: full system access, bypass all workspace checks
// audit_admin: read-only audit access across all workspaces
//
// ── Workspace-level roles (per WorkspaceMembership) ──
// customer: external SME user, can only access own requests
// specialist: legal specialist, handles assigned requests
// reviewer: quality reviewer, approves/rejects assigned requests
// coordinator_admin: workspace manager, assigns work, delivers, closes
export const ROLE = {
  CUSTOMER: 'customer',
  SPECIALIST: 'specialist',
  REVIEWER: 'reviewer',
  COORDINATOR_ADMIN: 'coordinator_admin',
  SUPER_ADMIN: 'super_admin',
  AUDIT_ADMIN: 'audit_admin',
} as const;

// ...

/** Platform-level role — global, bypasses workspace checks */
export type PlatformRole = 'super_admin' | 'audit_admin';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const ROLE = {
  CUSTOMER: 'customer',
  SPECIALIST: 'specialist',
  REVIEWER: 'reviewer',
  COORDINATOR_ADMIN: 'coordinator_admin',
  SUPER_ADMIN: 'super_admin',
  AUDIT_ADMIN: 'audit_admin',
} as const;
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 23-27

The deprecated INTAKE_SUBMITTED_LEGACY constant and RequestStatusLegacy type are exported for backward compatibility. If the v2.3 migration to 'triage' is complete and no code references these, they should be removed to prevent accidental usage. Consider adding a code search comment or tracking issue reference to plan removal.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
/** @deprecated Replaced by 'triage'. Customer submit goes directly to triage. TODO: Remove in v3.0 after DB migration complete. */
export const INTAKE_SUBMITTED_LEGACY = 'intake_submitted' as const;

/** Legacy status including deprecated intake_submitted for DB compatibility. TODO: Remove in v3.0. */
export type RequestStatusLegacy = RequestStatus | typeof INTAKE_SUBMITTED_LEGACY;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
/** @deprecated Replaced by 'triage'. Customer submit goes directly to triage. */
export const INTAKE_SUBMITTED_LEGACY = 'intake_submitted' as const;

/** Legacy status including deprecated intake_submitted for DB compatibility */
export type RequestStatusLegacy = RequestStatus | typeof INTAKE_SUBMITTED_LEGACY;
```
</details>


