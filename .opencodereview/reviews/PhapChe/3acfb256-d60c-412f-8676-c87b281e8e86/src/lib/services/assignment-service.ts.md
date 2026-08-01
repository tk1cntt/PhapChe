# Review: `src/lib/services/assignment-service.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 7

---

## 🔴 Critical (1)

**🐛 Bug** · lines 161-167

When DB_MIGRATION_PHASE4 is false, endAssignment only performs a findUnique (read) instead of updating the assignment. This means the old code path can never actually end an assignment — no isCurrent=false or endedAt is set, leaving stale active assignments permanently.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Old: Set endedAt to mark the assignment as ended
  return prisma.requestAssignment.update({
    where: { id: assignmentId },
    data: { endedAt: new Date() },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Old: Just return the assignment (no isCurrent to manage)
  return prisma.requestAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 90-91

createAssignment does not call validateAssignment, allowing assignment of users who may not be workspace members, have the wrong role, or are deactivated. This violates the business rules encoded in validateAssignment.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function createAssignment(input: CreateAssignmentInput) {
  const validation = await validateAssignment(input.requestId, input.userId, input.kind);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (isEnabled('DB_MIGRATION_PHASE4')) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function createAssignment(input: CreateAssignmentInput) {
  if (isEnabled('DB_MIGRATION_PHASE4')) {
```
</details>


## 🟡 Medium (4)

**🔧 Maintainability** · lines 278-282

validateAssignment is defined but never called by any function in this module. It is dead code. Either integrate it into createAssignment (see above) or remove it if the validation is done elsewhere.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// This function should be called from createAssignment before creating a new assignment.
export async function validateAssignment(
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function validateAssignment(
  requestId: string,
  userId: string,
  kind: AssignmentKind
): Promise<{ valid: boolean; error?: string }> {
```
</details>

---

**🐛 Bug** · lines 94-107

During the createAssignment transaction, there is a window between updateMany (setting isCurrent=false) and the subsequent create (setting isCurrent=true) where a concurrent getCurrentAssignment call may return null. This temporarily breaks the invariant that exactly one assignment is current. Consider using SELECT ... FOR UPDATE or a higher isolation level (SERIALIZABLE) to prevent this gap.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // 1. First create the new assignment with isCurrent=true
      const newAssignment = await tx.requestAssignment.create({
        data: {
          requestId: input.requestId,
          userId: input.userId,
          kind: input.kind,
          partnerId: input.partnerId,
          engagementId: input.engagementId,
          reason: input.reason,
          isCurrent: true,
          createdById: input.createdById,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          request: { select: { id: true, title: true } },
        },
      });

      // 2. Then end all other current assignments for this request and kind
      await tx.requestAssignment.updateMany({
        where: {
          requestId: input.requestId,
          kind: input.kind,
          isCurrent: true,
          id: { not: newAssignment.id },
        },
        data: {
          isCurrent: false,
          endedAt: new Date(),
        },
      });

      return newAssignment;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // 1. End current assignment for this request and kind
      await tx.requestAssignment.updateMany({
        where: {
          requestId: input.requestId,
          kind: input.kind,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
          endedAt: new Date(),
        },
      });

      // 2. Create new assignment with isCurrent=true
```
</details>

---

**🐛 Bug** · lines 221-223

getUserAssignments clamps pageSize to [1,100] for take/skip but returns the original, unclamped pageSize in the response. This causes a mismatch: the actual returned items count may differ from the claimed pageSize in pagination metadata.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      skip: (Math.max(1, page) - 1) * Math.min(Math.max(1, pageSize), 100),
      take: Math.min(Math.max(1, pageSize), 100),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.requestAssignment.count({ where }),
  ]);

  const effectivePageSize = Math.min(Math.max(1, pageSize), 100);

  return {
    data: assignments,
    pagination: {
      page,
      pageSize: effectivePageSize,
      total,
      totalPages: Math.ceil(total / effectivePageSize),
    },
  };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      skip: (Math.max(1, page) - 1) * Math.min(Math.max(1, pageSize), 100),
      take: Math.min(Math.max(1, pageSize), 100),
      orderBy: { createdAt: 'desc' },
```
</details>

---

**🔧 Maintainability** · lines 90-93

All async functions in this module lack try-catch error handling. Prisma errors (e.g., unique constraint violations, foreign key errors, connection failures) will propagate as raw database errors to callers, potentially exposing internal schema details and lacking user-friendly messages.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function createAssignment(input: CreateAssignmentInput) {
  try {
    if (isEnabled('DB_MIGRATION_PHASE4')) {
      return prisma.$transaction(async (tx) => {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function createAssignment(input: CreateAssignmentInput) {
  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Use transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 199-201

AssignmentFilters includes a requestId field, but getUserAssignments never applies it to the where clause. The filter is silently ignored, which is misleading to callers who may expect requestId filtering to work.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const where: Record<string, unknown> = { userId };
  if (filters.requestId) where.requestId = filters.requestId;
  if (filters.kind) where.kind = filters.kind;
  if (filters.isCurrent !== undefined && isEnabled('DB_MIGRATION_PHASE4')) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const where: Record<string, unknown> = { userId };
  if (filters.kind) where.kind = filters.kind;
  if (filters.isCurrent !== undefined && isEnabled('DB_MIGRATION_PHASE4')) {
```
</details>


