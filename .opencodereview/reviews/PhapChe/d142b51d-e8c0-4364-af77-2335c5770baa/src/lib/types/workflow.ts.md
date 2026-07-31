# Review: `src/lib/types/workflow.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · lines 87-90

Missing request/workflow instance identifier in ExecuteTransitionInput. The interface only contains `transitionId` and optional `note`, but lacks a field like `requestId` to specify which workflow instance the transition should be applied to. Without this, the API cannot determine which workflow instance is being transitioned.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface ExecuteTransitionInput {
  requestId: string;
  transitionId: string;
  note?: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface ExecuteTransitionInput {
  transitionId: string;
  note?: string;
}
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 21-22

Date types will cause runtime type mismatches with JSON API responses. `createdAt`, `updatedAt`, and `triggeredAt` are typed as `Date`, but JSON serialization produces ISO 8601 strings. If these interfaces are used to type API responses without a transformation layer, string methods will be unavailable and Date methods will fail silently or throw. Consider using `string` (ISO 8601) for API-facing types.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  createdAt: string;
  updatedAt: string;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  createdAt: Date;
  updatedAt: Date;
```
</details>

---

**🐛 Bug** · line 72

Same Date vs string issue as above. `triggeredAt` is typed as `Date` but will arrive as an ISO 8601 string from JSON APIs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  triggeredAt: string;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  triggeredAt: Date;
```
</details>

---

**🔧 Maintainability** · line 19

`version` is typed as `number`, which cannot represent semantic versions like `1.2.0` or `2.0.0-beta.1`. If the workflow system uses semver, this will cause version truncation or data loss. Consider using `string` to support arbitrary version formats.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  version: string;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  version: number;
```
</details>


