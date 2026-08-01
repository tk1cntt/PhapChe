# Review: `src/lib/types/workspace.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 4

---

## 🟡 Medium (2)

**🐛 Bug** · lines 63-67

**Slug type mismatch**: `Workspace.slug` is required (`string`), but `CreateWorkspaceInput.slug` is optional. This inconsistency means a workspace could be created without a slug if the caller omits it, violating the `Workspace` contract. Ensure slug is either always generated server-side or make `CreateWorkspaceInput.slug` required.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  settings?: WorkspaceSettings;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
  settings?: WorkspaceSettings;
}
```
</details>

---

**🐛 Bug** · line 15

**organizationId may be null from legacy data**: The comment says NOT NULL since v2.3, but the type is `string`. If legacy rows predating v2.3 still exist with null `organizationId`, the type should be `string | null` to reflect reality, or a migration should be confirmed complete. Otherwise, code consuming this field may crash on null values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  organizationId: string | null;  // FK to Organization — NOT NULL since v2.3; nullable for legacy rows
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  organizationId: string;  // FK to Organization — NOT NULL since v2.3
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 31

**Ambiguous `logo` type**: `logo` is typed as `string | undefined` but doesn't clarify what the string represents (URL, base64 data URI, file path, or S3 key). This ambiguity can lead to misuse across different code paths. Consider adding a JSDoc comment to specify the expected format, or use a branded type / union of specific formats.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  /** URL or base64 data URI for the workspace logo */
  logo?: string;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  logo?: string;
```
</details>

---

**🔧 Maintainability** · lines 50-58

**Overlapping `isActive` fields**: `Membership` has `isActive: boolean` and the nested `user` object in `MembershipWithUser` also has `isActive: boolean`. These represent different concepts (membership status vs. user account status), but sharing the same name without documentation can lead to confusion. Consider adding JSDoc comments to clarify the distinction.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface MembershipWithUser extends Membership {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    /** Whether the user account itself is active (not deactivated) */
    isActive: boolean;
  };
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface MembershipWithUser extends Membership {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isActive: boolean;
  };
}
```
</details>


