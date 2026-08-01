# Review: `src/lib/types/request-context.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 3

---

## 🟡 Medium (3)

**🐛 Bug** · line 46

The `mode` field is typed as `string` but the comment documents exactly three allowed values. Using an unconstrained string type risks runtime errors when invalid modes are passed through the system, defeating TypeScript's compile-time safety. Replace with a string literal union type to enforce valid values at compile time.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  mode: 'shared_platform' | 'dedicated_partner' | 'dedicated_customer';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  mode: string; // 'shared_platform' | 'dedicated_partner' | 'dedicated_customer'
```
</details>

---

**🔧 Maintainability** · line 35

The `status` field is typed as a plain `string` with no documented constraints. This can lead to data inconsistency (e.g., case-sensitivity bugs like 'Active' vs 'active') and makes it difficult for consumers to know which status values are valid. Consider defining a string literal union type (e.g., `'active' | 'inactive' | 'suspended'`) or at minimum document the expected values in a comment.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  status: 'active' | 'inactive' | 'suspended'; // Document actual valid statuses
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  status: string;
```
</details>

---

**🔧 Maintainability** · lines 77-83

Both `workspaceSlug` and `workspaceId` are optional, but it is unclear whether at least one is required to build a valid workspace context. If neither is provided, the request builder may silently skip workspace resolution, leading to missing permission checks. Consider using a discriminated union or adding a JSDoc comment to clarify the contract (e.g., 'At least one of workspaceSlug or workspaceId must be provided when workspace context is needed').

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface RequestContextOptions {
  userId: string;
  /**
   * Workspace identifier — at least one of slug or id is required
   * when workspace-scoped context is needed.
   */
  workspaceSlug?: string;
  workspaceId?: string;
  includeOrganization?: boolean;
  includePartner?: boolean;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface RequestContextOptions {
  userId: string;
  workspaceSlug?: string;
  workspaceId?: string;
  includeOrganization?: boolean;
  includePartner?: boolean;
}
```
</details>


