# Review: `src/lib/types/request.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · lines 85-88

`File[]` is a browser-only Web API type. In a shared types file used across full-stack Next.js (server components, API routes, SSR), `File` is undefined at runtime. Additionally, `File` objects cannot be serialized to JSON, so this type is misleading at any API boundary. Consider using a file reference type (e.g., `{ name: string; url: string; size?: number }`) or a string URL instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface IntakeAnswer {
  questionKey: string;
  /**
   * For file uploads, use FileReference[] instead of browser-native File[].
   * FileReference: { name: string; url: string; size?: number; type?: string }
   */
  value: string | string[] | FileReference[];
}

/** Reference to an uploaded file (safe for server-side and serialization) */
export interface FileReference {
  name: string;
  url: string;
  size?: number;
  type?: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface IntakeAnswer {
  questionKey: string;
  value: string | string[] | File[];
}
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 159-165

`Record<RequestStatus, number>` requires all 10 `RequestStatus` keys to be present. If the backend omits statuses with zero counts (common for sparse dashboards), the type will mismatch at runtime. Use `Partial<Record<RequestStatus, number>>` to allow missing keys, or add a comment confirming the backend always returns all keys.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface RequestStats {
  total: number;
  /** Backend guarantees all keys are present (zero-count statuses included) */
  byStatus: Record<RequestStatus, number>;
  /** Backend guarantees all keys are present (zero-count priorities included) */
  byPriority: Record<Priority, number>;
  overdue: number;
  slaAtRisk: number;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface RequestStats {
  total: number;
  byStatus: Record<RequestStatus, number>;
  byPriority: Record<Priority, number>;
  overdue: number;
  slaAtRisk: number;
}
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 15-36

`Date` types in DTO interfaces (e.g., `deadline?: Date`, `createdAt: Date`, `updatedAt: Date`) are misleading because JSON deserialization produces strings, not `Date` objects. This is a common TypeScript gotcha that can lead to runtime errors when calling Date methods on deserialized values. Consider using `string` types for transport-layer DTOs, or document that these are expected to be ISO date strings parsed by a transformation layer.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface LegalRequest {
  id: string;
  code: string;
  workspaceId: string;
  matterTypeId: string;
  matterType?: MatterType;
  priority: Priority;
  status: RequestStatus;
  customerId: string;
  customer?: RequestCustomer;
  assignedTo?: string;
  assignee?: RequestAssignee;
  title: string;
  description?: string;
  /** ISO 8601 date string */
  deadline?: string;
  /** ISO 8601 date string */
  slaDueAt?: string;
  /** ISO 8601 date string */
  currentStateEnteredAt?: string;
  engagementId?: string;
  assignedPartnerId?: string;
  /** ISO 8601 date string */
  createdAt: string;
  /** ISO 8601 date string */
  updatedAt: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface LegalRequest {
  id: string;
  code: string;
  workspaceId: string;
  matterTypeId: string;
  matterType?: MatterType;
  priority: Priority;
  status: RequestStatus;
  customerId: string;
  customer?: RequestCustomer;
  assignedTo?: string;
  assignee?: RequestAssignee;
  title: string;
  description?: string;
  deadline?: Date;
  slaDueAt?: Date;
  currentStateEnteredAt?: Date;
  engagementId?: string;
  assignedPartnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
</details>

---

**🔧 Maintainability** · line 5

Circular dependency: `request.ts` imports `RequestStatus` from `@/lib/types` (the barrel), but `@/lib/types/index.ts` re-exports everything from `./request`. While `import type` is stripped at compile time and generally safe, this circular reference can cause issues with certain bundlers, tree-shaking, or test runners. Consider importing `RequestStatus` directly from `@/lib/types.ts` (the constants file) instead of the barrel — `@/lib/types.ts` already defines `RequestStatus` without depending on `request.ts`.

`@/lib/types.ts` line 21: `export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];`

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import type { RequestStatus } from '@/lib/types'; // Note: circular via barrel; prefer importing from '@/lib/types.ts' if issues arise
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import type { RequestStatus } from '@/lib/types';
```
</details>


