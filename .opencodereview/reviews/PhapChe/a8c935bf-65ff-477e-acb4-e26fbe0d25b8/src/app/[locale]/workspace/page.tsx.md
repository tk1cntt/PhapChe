# Review: `src/app/[locale]/workspace/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 7

---

## 🟠 High (2)

**🐛 Bug** · line 36

When `activeWorkspaceId` is null/undefined and `workspace` is also not found, `wsId` falls back to an empty string `''`. This empty string is then used in all Prisma `workspaceId` filters, which will silently return zero results for members, requests, vault files, and messages — instead of surfacing a clear error about the missing workspace. Consider throwing an explicit error or redirecting when no valid workspace is available.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const wsId = workspace?.id ?? activeWorkspaceId;
  if (!wsId) {
    throw new Error('No active workspace found');
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const wsId = workspace?.id ?? activeWorkspaceId ?? '';
```
</details>

---

**🐛 Bug** · line 41

The entire async component has no try/catch or error boundary. If any Prisma call fails (network issue, constraint violation, etc.), the error will propagate as an unhandled rejection and result in a generic 500 page with no user-friendly feedback. Wrap the data-fetching logic in a try/catch and return an appropriate error UI or use a Next.js error boundary.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
    const [baseWhere, processingWhere, allMembers, vaultFileCount, lastVaultUpdate, unreadMessages] = await Promise.all([
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [baseWhere, processingWhere, allMembers, vaultFileCount, lastVaultUpdate, unreadMessages] = await Promise.all([
```
</details>


## 🟡 Medium (4)

**🔧 Maintainability** · lines 55-57

The `as any` type assertions on `baseWhere` and `processingWhere` bypass TypeScript type checking for Prisma `where` clauses. This hides potential mismatches between the generated filter object and Prisma's expected `LegalRequestWhereInput` type. The root cause is that `getWorkspaceRequestWhere` returns `Promise<Record<string, unknown>>` instead of a properly typed Prisma where input. Consider updating `getWorkspaceRequestWhere` to return a typed result (e.g., `Prisma.LegalRequestWhereInput`) or adding a comment explaining why the cast is necessary.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // NOTE: getWorkspaceRequestWhere returns Record<string, unknown>;
    // cast is safe because the returned shape matches Prisma.LegalRequestWhereInput
    prisma.legalRequest.count({ where: baseWhere as any }),
    prisma.legalRequest.count({ where: processingWhere as any }),
    prisma.legalRequest.findFirst({ where: baseWhere as any, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    prisma.legalRequest.count({ where: baseWhere as any }),
    prisma.legalRequest.count({ where: processingWhere as any }),
    prisma.legalRequest.findFirst({ where: baseWhere as any, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
```
</details>

---

**🔧 Maintainability** · line 39

Hardcoded legal-request status strings (`'in_progress'`, `'pending_review'`, `'revision_required'`) are embedded directly in the component. If these status values change or are reused elsewhere, they become hard to maintain. Extract them to a shared constant (e.g., `ACTIVE_REQUEST_STATUSES` or an enum) to improve consistency and discoverability.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const PROCESSING_STATUSES = ['in_progress', 'pending_review', 'revision_required'] as const;
  const processingStatusExtra = { status: { in: [...PROCESSING_STATUSES] } };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const processingStatusExtra = { status: { in: ['in_progress', 'pending_review', 'revision_required'] } };
```
</details>

---

**⚡ Performance** · lines 42-43

Both `getWorkspaceRequestWhere(wsId, userId)` and `getWorkspaceRequestWhere(wsId, userId, processingStatusExtra)` internally call `getEffectiveRole`, which executes a separate `prisma.workspaceMembership.findFirst` query. Since the user's role won't change between these two calls within the same request, this results in a redundant database query. Consider extracting the role once and passing it to a lower-level function, or caching the role resolution for the request lifetime.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // TODO: refactor getWorkspaceRequestWhere to accept a pre-resolved role to avoid redundant DB calls
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusExtra),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusExtra),
```
</details>

---

**🔧 Maintainability** · line 50

`unreadMessages` is fetched but never consumed in the JSX or passed to any child component. This is dead code that adds an unnecessary database query. Either use it in the UI (e.g., notification badge) or remove the query.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // TODO: use unreadMessages in the UI or remove this query
    prisma.message.count({ where: { workspaceId: wsId, recipientId: userId, isRead: false } }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    prisma.message.count({ where: { workspaceId: wsId, recipientId: userId, isRead: false } }),
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 88

`lastInviteUpdate` is hardcoded to `null` with no logic to populate it. If invite tracking is not yet implemented, add a `TODO` comment to clarify intent. Otherwise, remove the field to avoid misleading consumers of `resourceData` into thinking this value is meaningful.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    lastInviteUpdate: null as string | null, // TODO: implement invite tracking
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    lastInviteUpdate: null as string | null,
```
</details>


