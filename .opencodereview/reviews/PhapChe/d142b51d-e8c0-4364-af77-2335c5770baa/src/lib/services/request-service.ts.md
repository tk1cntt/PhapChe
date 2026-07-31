# Review: `src/lib/services/request-service.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 7

---

## 🔴 Critical (1)

**🐛 Bug** · lines 291-299

The `getRequestsByMatterType` function's matterType filter is silently ignored because `listRequests` never reads `matterType` or `matterTypeRef` from the `filters` object. The filter is spread into `filters` via `{ ...filters, ...matterTypeFilter }`, but `listRequests` only checks `workspaceId`, `status`, `priority`, `assignedTo`, `search`, `createdAfter`, and `createdBefore`. The result is that this function returns all requests regardless of matterType, which is a silent data-integrity bug.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function getRequestsByMatterType(
  matterType: string,
  filters: RequestFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const matterTypeFilter = buildMatterTypeFilter(matterType);
  return listRequests({ ...filters, ...matterTypeFilter }, page, pageSize);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function getRequestsByMatterType(
  matterType: string,
  filters: RequestFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const matterTypeFilter = buildMatterTypeFilter(matterType);
  return listRequests({ ...filters, ...matterTypeFilter }, page, pageSize);
}
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 84-104

`buildMatterTypeData` always sets `matterType = null` in the PHASE4 branch and `matterTypeId = null` in the old branch, even when the corresponding new/old field is not provided. In `updateRequest`, this means a partial update (e.g., updating only `title`) will incorrectly null out the matterType/matterTypeId field that the caller did not intend to change. The function should only set these fields when the caller explicitly provides a value.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function buildMatterTypeData(input: CreateRequestInput | UpdateRequestInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    if ('matterTypeId' in input) {
      data.matterTypeId = input.matterTypeId;
    }
  } else {
    if ('matterType' in input) {
      data.matterType = input.matterType;
    }
  }

  return data;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function buildMatterTypeData(input: CreateRequestInput | UpdateRequestInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Use matterTypeId FK
    if ('matterTypeId' in input && input.matterTypeId) {
      data.matterTypeId = input.matterTypeId;
    }
    // Explicitly set matterType to null to avoid confusion
    data.matterType = null;
  } else {
    // Old: Use matterType text
    if ('matterType' in input && input.matterType) {
      data.matterType = input.matterType;
    }
    // Explicitly set matterTypeId to null
    data.matterTypeId = null;
  }

  return data;
}
```
</details>

---

**🐛 Bug** · lines 109-128

All exported async functions (`createRequest`, `getRequestById`, `listRequests`, `updateRequest`, `deleteRequest`, `getRequestsByMatterType`, `countRequestsByStatus`) lack any error handling (no try/catch). Any Prisma error (e.g., connection failure, constraint violation, record-not-found) will propagate unhandled, potentially exposing stack traces or crashing the caller. Each function should wrap its logic in try/catch and return a structured error result or throw a domain-specific error.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function createRequest(input: CreateRequestInput) {
  try {
    const data: Record<string, unknown> = {
      workspaceId: input.workspaceId,
      title: input.title,
      description: input.description,
      priority: input.priority || 'MEDIUM',
      status: 'draft_intake',
      createdById: input.createdById,
      ...buildMatterTypeData(input),
    };

    return await prisma.legalRequest.create({
      data: data as Parameters<typeof prisma.legalRequest.create>[0]['data'],
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        matterTypeRef: isEnabled('DB_MIGRATION_PHASE4'),
      },
    });
  } catch (error) {
    // Handle or rethrow with domain-specific error
    throw error;
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function createRequest(input: CreateRequestInput) {
  const data: Record<string, unknown> = {
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description,
    priority: input.priority || 'MEDIUM',
    status: 'draft_intake',
    createdById: input.createdById,
    ...buildMatterTypeData(input),
  };

  return prisma.legalRequest.create({
    data: data as Parameters<typeof prisma.legalRequest.create>[0]['data'],
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      matterTypeRef: isEnabled('DB_MIGRATION_PHASE4'),
    },
  });
}
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 281-286

`deleteRequest` unconditionally sets `deletedAt: new Date()` without checking if the record is already soft-deleted. This causes unnecessary writes on repeated calls and could conflict with concurrent operations. It also makes it impossible to distinguish between the first deletion and subsequent calls. Add a check for `deletedAt: null` to make it idempotent.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function deleteRequest(id: string) {
  return prisma.legalRequest.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function deleteRequest(id: string) {
  return prisma.legalRequest.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```
</details>

---

**🐛 Bug** · lines 34-42

`listRequests` does not handle the `matterType` or `matterTypeRef` filter fields from `RequestFilters`. The `getRequestsByMatterType` function relies on this, but the filter is silently dropped. Either add `matterType`/`matterTypeRef` to the `RequestFilters` interface and handle them in `listRequests`, or remove `getRequestsByMatterType` if it's not meant to work.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface RequestFilters {
  workspaceId?: string;
  status?: string;
  priority?: string;
  matterType?: string;
  matterTypeRef?: { key: string };
  search?: string;
  assignedTo?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface RequestFilters {
  workspaceId?: string;
  status?: string;
  priority?: string;
  search?: string;
  assignedTo?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}
```
</details>

---

**🔧 Maintainability** · lines 109-118

No input validation is performed on any function inputs. For example, `createRequest` accepts `workspaceId`, `title`, `createdById`, etc. without validating that they are non-empty strings, valid UUIDs, or within reasonable length limits. This can lead to cryptic database errors (e.g., foreign key constraint violations) that are hard to debug. Consider adding a validation layer (e.g., zod) or at minimum basic assertions.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function createRequest(input: CreateRequestInput) {
  if (!input.workspaceId || !input.title || !input.createdById) {
    throw new Error('workspaceId, title, and createdById are required');
  }
  const data: Record<string, unknown> = {
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description,
    priority: input.priority || 'MEDIUM',
    status: 'draft_intake',
    createdById: input.createdById,
    ...buildMatterTypeData(input),
  };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function createRequest(input: CreateRequestInput) {
  const data: Record<string, unknown> = {
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description,
    priority: input.priority || 'MEDIUM',
    status: 'draft_intake',
    createdById: input.createdById,
    ...buildMatterTypeData(input),
  };
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 291-299

The `getRequestsByMatterType` function is effectively dead code — it delegates to `listRequests` but the matterType filter is never applied by `listRequests`, so it behaves identically to calling `listRequests` directly. If this function is intended to be used, the filter must be applied inside `listRequests`. Otherwise, it should be removed or marked as deprecated.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// TODO: Apply matterTypeFilter inside listRequests or remove this function
// See: listRequests does not handle matterType/matterTypeRef in filters
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function getRequestsByMatterType(
  matterType: string,
  filters: RequestFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const matterTypeFilter = buildMatterTypeFilter(matterType);
  return listRequests({ ...filters, ...matterTypeFilter }, page, pageSize);
}
```
</details>


