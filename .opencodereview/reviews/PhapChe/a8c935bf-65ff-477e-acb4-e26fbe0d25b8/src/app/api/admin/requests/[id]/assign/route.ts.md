# Review: `src/app/api/admin/requests/[id]/assign/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🔴 Critical (1)

**🔒 Security** · lines 36-38

Authorization bypass: Non-super_admin users can bypass workspace membership check when `activeWorkspaceId` is null/undefined. The guard `userWorkspaceId &&` on line 35 short-circuits the entire condition to `false` when `userWorkspaceId` is falsy, allowing a non-super-admin without an active workspace to assign to any request in any workspace. Remove the `userWorkspaceId &&` guard or explicitly reject requests when `userWorkspaceId` is missing for non-super-admins.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!isSuperAdmin) {
      if (!userWorkspaceId) {
        return NextResponse.json({ error: 'Forbidden: no active workspace' }, { status: 403 });
      }
      if (existingRequest.workspaceId !== userWorkspaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!isSuperAdmin && userWorkspaceId && existingRequest.workspaceId !== userWorkspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 72-85

Data inconsistency: `prisma.legalRequest.update` (line 78) is executed outside the `$transaction` block (lines 83-102). If the assignment/audit transaction fails, the request has already been updated with new `assignedSpecialistId`/`assignedReviewerId` values, but no corresponding `requestAssignment` records or `auditEvent` entries exist. Move the `legalRequest.update` call inside the transaction so that the update, assignment creation, and audit logging are atomic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // ── Audit events for assignment actions ──
    const auditEvents: Array<{ action: string; metadataSummary: string }> = [];

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.legalRequest.update({
        where: { id: existingRequest.id },
        data: updateData,
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          assignedSpecialist: { select: { id: true, name: true } },
          assignedReviewer: { select: { id: true, name: true } },
        },
      });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const updatedRequest = await prisma.legalRequest.update({
      where: { id: existingRequest.id },
      data: updateData,
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
      },
    });

    // ── Audit events for assignment actions ──
    const auditEvents: Array<{ action: string; metadataSummary: string }> = [];

    await prisma.$transaction(async (tx) => {
```
</details>

---

**🐛 Bug** · lines 86-89

Race condition: The check `!existingRequest.assignedSpecialistId` (line 83) and `!existingRequest.assignedReviewerId` (line 93) use stale data fetched before the transaction. Two concurrent requests could both see no existing assignment, both enter the `if` block, and both create duplicate `requestAssignment` records. Use a unique constraint on `requestAssignment` (requestId + kind) with `create` wrapped in a try/catch, or use `upsert`/`findFirst` inside the transaction to check for existing assignments atomically.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      if (specialistId) {
        const existingAssignment = await tx.requestAssignment.findFirst({
          where: { requestId: existingRequest.id, kind: 'specialist' },
        });
        if (!existingAssignment) {
          await tx.requestAssignment.create({
            data: { requestId: existingRequest.id, userId: specialistId, kind: 'specialist', createdById: session.userId },
          });
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      if (specialistId && !existingRequest.assignedSpecialistId) {
        await tx.requestAssignment.create({
          data: { requestId: existingRequest.id, userId: specialistId, kind: 'specialist', createdById: session.userId },
        });
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 83-85

Transaction retry hazard: `auditEvents` array is declared outside the `$transaction` callback but populated inside it. If Prisma retries the transaction callback (e.g., due to serialization conflicts), the array will accumulate duplicate entries from previous attempts, resulting in duplicate `auditEvent` records. Move `auditEvents` declaration inside the transaction callback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    await prisma.$transaction(async (tx) => {
      const auditEvents: Array<{ action: string; metadataSummary: string }> = [];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const auditEvents: Array<{ action: string; metadataSummary: string }> = [];

    await prisma.$transaction(async (tx) => {
```
</details>


