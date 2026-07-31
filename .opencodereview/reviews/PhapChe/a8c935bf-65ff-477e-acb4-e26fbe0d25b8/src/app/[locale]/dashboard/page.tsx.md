# Review: `src/app/[locale]/dashboard/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🟠 High (2)

**🐛 Bug** · lines 54-64

Unhandled Promise rejection: The entire data fetching logic (Promise.all and subsequent count queries) has no try-catch. If any Prisma call fails (e.g., DB connection error, timeout), the page will throw an unhandled error and show a Next.js error boundary instead of a user-friendly message.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  let user, activeWorkspace, baseWhere, processingWhere, completedWhere, requests, recentDocuments, recentActivities;
  try {
    [user, activeWorkspace, baseWhere, processingWhere, completedWhere, requests, recentDocuments, recentActivities] = await Promise.all([
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [
    user,
    activeWorkspace,
    baseWhere,
    processingWhere,
    completedWhere,
    requestsWhere,
    requests,
    recentDocuments,
    recentActivities,
  ] = await Promise.all([
```
</details>

---

**⚡ Performance** · lines 57-61

Redundant and unused variable: `requestsWhere` is destructured from `Promise.all` but never referenced anywhere in the component. Moreover, it duplicates the same `getWorkspaceRequestWhere(wsId, userId)` call already fetched as `baseWhere`. The `requests` IIFE also calls the same function again, resulting in 3 identical DB-filter calls instead of 1.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    baseWhere,
    processingWhere,
    completedWhere,
    requests,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    baseWhere,
    processingWhere,
    completedWhere,
    requestsWhere,
    requests,
```
</details>


## 🟡 Medium (3)

**🔧 Maintainability** · lines 83-84

Type safety bypass: Casting Prisma where clauses to `as any` suppresses TypeScript type checking. If `getWorkspaceRequestWhere` returns a shape incompatible with Prisma's `where` type, the mismatch will only surface at runtime. Consider defining a proper shared type or using a type guard.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      return prisma.legalRequest.findMany({
        where: w as Prisma.LegalRequestWhereInput,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      return prisma.legalRequest.findMany({
        where: w as any,
```
</details>

---

**🐛 Bug** · lines 197-205

Potential undefined values in `parseStatus()`: If `metadataSummary` is not in the expected `'from -> to'` format (e.g., a single status like `'approved'`), `parts[0]` and `parts[1]` may be an empty string or undefined, causing `resolveStatusLabel` to receive an unexpected value and the description to display `'?'`. Add a guard: if `parts.length < 2`, return a safe fallback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const parseStatus = () => {
      const summary = activity.metadataSummary;
      if (!summary) return { from: '?', to: '?' };
      const parts = summary.split('->').map(s => s.trim());
      if (parts.length < 2) return { from: '?', to: '?' };
      return {
        from: resolveStatusLabel(parts[0], tReqStatus),
        to: resolveStatusLabel(parts[1], tReqStatus),
      };
    };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const parseStatus = () => {
      const summary = activity.metadataSummary;
      if (!summary) return { from: '?', to: '?' };
      const parts = summary.split('->').map(s => s.trim());
      return {
        from: resolveStatusLabel(parts[0], tReqStatus),
        to: resolveStatusLabel(parts[1], tReqStatus),
      };
    };
```
</details>

---

**🐛 Bug** · line 47

Empty string fallback for `activeWorkspaceId`: When `activeWorkspaceId` is null/undefined, `wsId` becomes `''`. This empty string is passed to `getWorkspaceRequestWhere` and Prisma `where` clauses (`workspaceId: wsId`), which may cause unexpected query results (e.g., matching records with an empty workspaceId) or Prisma errors.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (!activeWorkspaceId) {
    // Handle missing workspace — redirect to workspace selection or show empty state
    throw new Error('No active workspace selected');
  }
  const wsId = activeWorkspaceId;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const wsId = activeWorkspaceId ?? '';
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 386-387

Hardcoded placeholder values: `pendingDocs: 0` and `newReplies: 0` appear to be TODO placeholders. If these features are not yet implemented, add a comment indicating the intent; otherwise they will always show zero and may confuse users.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // TODO: Implement pending docs and new replies counters
    pendingDocs: 0,
    newReplies: 0,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    pendingDocs: 0,
    newReplies: 0,
```
</details>


