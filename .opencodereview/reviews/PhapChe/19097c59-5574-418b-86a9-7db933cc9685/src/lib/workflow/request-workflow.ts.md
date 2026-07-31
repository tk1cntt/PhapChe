# Review: `src/lib/workflow/request-workflow.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · lines 87-90

Customer cancellation scope is too broad. The comment says 'Customer can only cancel from draft_intake and triage', but the `canTransitionRequestStatus` function for customers only checks `toStatus` without checking `fromStatus`. The state machine allows 'cancelled' from `draft_intake`, `triage`, `assigned`, `in_progress`, and `revision_required`. Since the permission check doesn't filter by current status, a customer can cancel their request from any of these states — including `assigned`, `in_progress`, and `revision_required` — contradicting the documented behavior.

Fix: add a `fromStatus` check to the customer branch, e.g.:
```typescript
if (hasRole('customer') && isOwnRequest) {
  const allowed: RequestStatus[] = ['triage', 'cancelled'];
  if (toStatus === 'cancelled' && !['draft_intake', 'triage'].includes(request.status)) {
    return false;
  }
  return allowed.includes(toStatus);
}
```

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // ── CUSTOMER ── merge intake_submitted→triage
  // Customer can only cancel from draft_intake and triage
  if (hasRole('customer') && isOwnRequest) {
    if (toStatus === 'cancelled' && !['draft_intake', 'triage'].includes(request.status)) {
      return false;
    }
    return ['triage', 'cancelled'].includes(toStatus);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // ── CUSTOMER ── merge intake_submitted→triage
  if (hasRole('customer') && isOwnRequest) {
    return ['triage', 'cancelled'].includes(toStatus);
  }
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 131-136

Potential null reference on `request.workspace`. If the workspace was deleted after the request was created, `request.workspace` will be `null` (Prisma returns null for a deleted related record). Accessing `request.workspace.memberships` on line 121 would throw a runtime TypeError. Consider adding a null guard or using `findUniqueOrThrow` with a workspace existence check.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (!request) throw new Error('REQUEST_NOT_FOUND');
  if (!request.workspace) throw new Error('WORKSPACE_NOT_FOUND');

  const actor: AppSession = {
    userId: input.actorId,
    activeWorkspaceId: request.workspaceId,
    roles: request.workspace.memberships.map((membership) => membership.role as Role),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (!request) throw new Error('REQUEST_NOT_FOUND');

  const actor: AppSession = {
    userId: input.actorId,
    activeWorkspaceId: request.workspaceId,
    roles: request.workspace.memberships.map((membership) => membership.role as Role),
```
</details>

---

**🔧 Maintainability** · line 136

Unsafe type assertion: `membership.role as Role` casts the database string directly to the `Role` union type without validation. The Prisma schema defines `role` as `String @default("customer")`, so any string value can be stored. If a role value like `audit_admin` (which is defined in `ROLE` but not in `WorkspaceRole`) or a malformed value exists in the DB, the cast will silently produce an incorrect `AppRole` that could bypass permission checks. Consider using a validation guard or deriving roles from a known set.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    roles: request.workspace.memberships
      .map((membership) => membership.role as Role)
      .filter((role): role is Role => Object.values(ROLE).includes(role as typeof ROLE[keyof typeof ROLE])),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    roles: request.workspace.memberships.map((membership) => membership.role as Role),
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 75-79

The `canTransitionRequestStatus` function never checks the request's current status (`request.status`). For coordinator, specialist, and reviewer roles, the state machine check (`getAllowedTransitions`) in `transitionRequestStatus` provides the missing guard — but the two checks are decoupled. If this function is ever called in isolation (e.g., to render UI buttons), it could return `true` for transitions that the state machine would reject, leading to misleading UI states. Consider passing `fromStatus` as a parameter and incorporating it into the permission logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function canTransitionRequestStatus(
  actor: AppSession,
  request: RequestForTransition,
  toStatus: RequestStatus,
): boolean {
  // First, validate the transition is allowed by the state machine
  const allowedTransitions = getAllowedTransitions(request.status);
  if (!allowedTransitions.includes(toStatus)) return false;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function canTransitionRequestStatus(
  actor: AppSession,
  request: RequestForTransition,
  toStatus: RequestStatus,
): boolean {
```
</details>


