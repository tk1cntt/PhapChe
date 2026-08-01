# Review: `src/lib/routing/routing-service.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 6

---

## 🟠 High (2)

**🐛 Bug** · lines 243-261

**TOCTOU race condition — capability and membership checks outside transaction**: The routing capability (line 206) and workspace membership (line 218) are validated before the Prisma transaction begins. Between validation and the transaction's write, the capability or membership could be deactivated by another request, leading to an assignment that violates routing rules. Consider moving these checks inside the transaction block.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const capability = await db.routingCapability.findFirst({
    where: {
      workspaceId,
      userId: assigneeId,
      kind,
      matterTypeKey,
      isActive: true,
      user: { isActive: true },
      matterType: { isActive: true },
    },
    select: { id: true },
  });
  if (!capability) throw new Error('ROUTING_CAPABILITY_REQUIRED');

  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId, userId: assigneeId, role: kind, isActive: true, user: { isActive: true }, workspace: { isActive: true } },
    select: { id: true },
  });
  if (!membership) throw new Error('ROUTING_MEMBERSHIP_REQUIRED');
```
</details>

---

**🐛 Bug** · lines 279-289

**Duplicate assignment vulnerability when request is already in 'assigned' status**: When `request.status` is `'assigned'`, `assignmentPath` returns `['assigned']` (length 1), so the transaction's status-update loop is skipped entirely. The code then directly creates a new `requestAssignment` record without checking whether `assignedSpecialistId` or `assignedReviewerId` is already set. Concurrent calls can produce multiple assignments for the same role, leading to data inconsistency. Add a guard to reject the assignment if the target field is already populated.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const assignmentField = kind === 'specialist' ? { assignedSpecialistId: assigneeId } : { assignedReviewerId: assigneeId };
    const updatedRequest = await tx.legalRequest.update({
      where: { id: requestId },
      data: assignmentField,
      select: { id: true, status: true, assignedSpecialistId: true, assignedReviewerId: true },
    });

    const assignment = await tx.requestAssignment.create({
      data: { requestId, userId: assigneeId, kind, createdById: actorId, reason },
      select: { id: true },
    });
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 80-84

**Restrictive `assignmentPath` only allows transitions from 'triage' or 'assigned'**: The `assignmentPath` function throws `INVALID_REQUEST_TRANSITION` for any status other than 'triage' or 'assigned'. If the business logic ever requires reassignment from later stages (e.g., `'in_progress'`, `'pending_review'`), this function will block all such operations. Consider whether the allowed set of source statuses should be expanded to support reassignment workflows.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function assignmentPath(status: RequestStatus): RequestStatus[] {
  if (status === 'triage') return ['triage', 'assigned'];
  if (status === 'assigned') return ['assigned'];
  throw new Error('INVALID_REQUEST_TRANSITION');
}
```
</details>

---

**🔧 Maintainability** · line 18

**Unsafe type assertion on Prisma client**: `prisma` is cast to a custom `RoutingPrisma` type that assumes the existence of `routingCapability` model and specific method signatures. If the actual Prisma schema does not include this model, or if the method signatures diverge, runtime errors will occur with no compile-time warning. Consider using Prisma's generated types (e.g., `PrismaClient`) or extending it properly instead of a raw type assertion.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const db = prisma as RoutingPrisma;
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 53-61

**Unused type `AssignmentRequest`**: This type is defined on lines 53-60 but never used in any type annotation, parameter, or return type within this file. It should be removed to avoid dead code.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
type AssignmentRequest = {
  id: string;
  workspaceId: string;
  status: RequestStatus;
  createdById: string;
  assignedSpecialistId: string | null;
  assignedReviewerId: string | null;
  intakeSubmission: { matterTypeKey: string } | null;
};
```
</details>

---

**🔧 Maintainability** · line 20

**Hardcoded Vietnamese suggestion reason**: The `suggestionReason` string is hardcoded in Vietnamese. This makes localization difficult and couples the routing logic to a single language. Consider externalizing this to a localization/i18n mechanism or at least moving it to a constants file.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const suggestionReason = 'Phù hợp vai trò và năng lực với loại vụ việc này.';
```
</details>


