# Review: `src/lib/security/request-filter.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 3

---

## 🟠 High (1)

**🔒 Security** · lines 116-126

The `extra` parameter is spread AFTER `workspaceId`, allowing a caller to override the workspace ID. A malicious or accidental caller could pass `extra = { workspaceId: 'other-workspace-id' }` and leak LegalRequest data across workspaces. The fix is to spread `extra` first, then force `workspaceId` from the parameter.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function getWorkspaceRequestWhere(
  activeWorkspaceId: string,
  userId: string,
  extra?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return buildRequestWhere(
    { ...(extra ?? {}), workspaceId: activeWorkspaceId },
    userId,
    activeWorkspaceId,
  );
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function getWorkspaceRequestWhere(
  activeWorkspaceId: string,
  userId: string,
  extra?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return buildRequestWhere(
    { workspaceId: activeWorkspaceId, ...(extra ?? {}) },
    userId,
    activeWorkspaceId,
  );
}
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 37-41

The Prisma query in `getEffectiveRole` (and all callers: `getRoleFilterClause`, `buildRequestWhere`, `getWorkspaceRequestWhere`) has no error handling. If the database is unreachable or the query fails, the error propagates as an unhandled promise rejection. Consider wrapping the query in try/catch with a meaningful error or allowing a centralized error boundary to handle it — but at minimum, ensure callers are aware these functions can throw.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
async function getEffectiveRole(
  userId: string,
  activeWorkspaceId: string,
): Promise<string | null> {
  try {
    const membership = await prisma.workspaceMembership.findFirst({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
async function getEffectiveRole(
  userId: string,
  activeWorkspaceId: string,
): Promise<string | null> {
  const membership = await prisma.workspaceMembership.findFirst({
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 24-31

`ROLE_PRIORITY` is defined but never used anywhere in this file. The file header comment mentions "role quyền lực nhất sẽ thắng" (highest role wins), but `getEffectiveRole` uses `findFirst` without ordering by priority, so this logic is never applied. If the DB schema guarantees a single membership per workspace, this constant is dead code and should be removed. If multiple memberships are possible, this is a bug — the function doesn't actually pick the highest-priority role.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 100,
  coordinator_admin: 90,
  audit_admin: 80,
  reviewer: 50,
  specialist: 40,
  customer: 10,
};
```
</details>


