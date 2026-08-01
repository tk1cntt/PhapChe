# Review: `src/lib/types/engagement-service-scope.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 2

---

## 🟡 Medium (1)

**🐛 Bug** · lines 8-14

Using `Date` for `createdAt` in an interface that likely represents JSON API data can cause serialization mismatches. JSON does not have a native Date type — dates are typically transmitted as ISO 8601 strings. If this interface is used to deserialize API responses without a custom reviver, `createdAt` will remain a `string` at runtime, contradicting the type declaration. Consider using `string` to match JSON wire format, or add a comment clarifying that a custom deserializer is expected.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface EngagementServiceScope {
  id: string;
  engagementId: string;
  serviceTypeId: string;
  permissionLevel: PermissionLevel;
  /** ISO 8601 date string (e.g. "2024-01-01T00:00:00.000Z") */
  createdAt: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface EngagementServiceScope {
  id: string;
  engagementId: string;
  serviceTypeId: string;
  permissionLevel: PermissionLevel;
  createdAt: Date;
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 16-20

The optional `permissionLevel` in `CreateEngagementServiceScopeInput` has no documented default value. When this field is omitted at creation time, the resulting record's `permissionLevel` is ambiguous. Consider adding a JSDoc comment specifying the default (e.g., `@default 'case_assigned'`), or make it required if a default is not applicable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface CreateEngagementServiceScopeInput {
  engagementId: string;
  serviceTypeId: string;
  /** @default 'case_assigned' */
  permissionLevel?: PermissionLevel;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface CreateEngagementServiceScopeInput {
  engagementId: string;
  serviceTypeId: string;
  permissionLevel?: PermissionLevel;
}
```
</details>


