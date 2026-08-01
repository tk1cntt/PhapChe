# Review: `src/lib/types/engagement.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 3

---

## 🟠 High (1)

**🐛 Bug** · lines 8-18

**Date serialization mismatch**: Using `Date` type in interfaces that are likely serialized/deserialized as JSON (e.g., API responses) is misleading. After `JSON.parse()`, these fields will be strings at runtime, not `Date` objects. Calling `date.getTime()` or other `Date` methods on them will throw a runtime error.

Consider using `string` (ISO 8601 format) for transport-layer types, and convert to `Date` only at the boundary where actual date operations are needed. Alternatively, if these interfaces are used purely in-memory, document this explicitly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface Engagement {
  id: string;
  partnerId: string;
  organizationId: string;
  status: EngagementStatus;
  startDate?: string; // ISO 8601 date string
  endDate?: string;   // ISO 8601 date string
  notes?: string;
  createdAt: string;  // ISO 8601 date string
  updatedAt: string;  // ISO 8601 date string
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface Engagement {
  id: string;
  partnerId: string;
  organizationId: string;
  status: EngagementStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 29-34

**UpdateEngagementInput missing entity identifier**: The `UpdateEngagementInput` interface lacks an `id` field, which is typically required to identify which engagement to update. If the `id` is passed separately (e.g., as a route parameter), this is fine but should be documented. Otherwise, the update operation has no way to target the correct entity.

Consider adding `id: string` to this input type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface UpdateEngagementInput {
  id: string; // Required to identify which engagement to update
  status?: EngagementStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface UpdateEngagementInput {
  status?: EngagementStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 13-14

**No domain constraint on date ordering**: `startDate` and `endDate` have no type-level or documented ordering constraint. If business logic requires `startDate <= endDate`, this invariant is not enforced anywhere in the type system. Downstream code that assumes ordering will silently produce incorrect results.

Consider adding a JSDoc comment documenting the expected ordering, or use a branded/opaque type to enforce the invariant at the type level.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  /** Must be on or before `endDate` when both are provided. */
  startDate?: Date;
  /** Must be on or after `startDate` when both are provided. */
  endDate?: Date;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  startDate?: Date;
  endDate?: Date;
```
</details>


