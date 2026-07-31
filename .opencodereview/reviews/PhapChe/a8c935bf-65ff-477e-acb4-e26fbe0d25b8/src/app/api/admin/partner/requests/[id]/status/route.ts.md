# Review: `src/app/api/admin/partner/requests/[id]/status/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 8

---

## 🔴 Critical (1)

**🐛 Bug** · line 93

**`statusNote` field does not exist in the Prisma schema**: The `LegalRequest` model in `prisma/schema.prisma` (lines 288-340) has no `statusNote` column. The code writes to `statusNote` on lines 93 and selects it on line 99. This will cause a Prisma runtime error — Prisma will throw because the field doesn't exist in the generated client's type definitions. Either add `statusNote String?` to the `LegalRequest` model in the schema, or use a different field (e.g., `WorkflowTransition.reason`, or store the note in the existing `AuditEvent.metadataSummary` only).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // Note: statusNote field doesn't exist in LegalRequest schema.
        // Option 1: Add `statusNote String?` to LegalRequest model in schema.prisma
        // Option 2: Store note only in audit metadata and WorkflowTransition
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        statusNote: note || null,
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 65

**Missing `revision_required` in VALID_STATUSES array**: The Prisma schema documents `revision_required` as a valid RequestStatus (line 12 of schema.prisma: `draft_intake, triage, assigned, in_progress, pending_review, revision_required, approved, delivered, closed, cancelled`). This status is used throughout the codebase (workflow, reviews, partner routes). Omitting it means admins cannot set the request to `revision_required`, which is a critical workflow state when a reviewer rejects a submission.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const VALID_STATUSES = ['draft_intake', 'submitted', 'triage', 'assigned', 'in_progress', 'pending_review', 'review', 'revision_required', 'approved', 'delivered', 'closed', 'cancelled'];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const VALID_STATUSES = ['draft_intake', 'submitted', 'triage', 'assigned', 'in_progress', 'pending_review', 'review', 'approved', 'delivered', 'closed', 'cancelled'];
```
</details>

---

**🐛 Bug** · line 65

**`submitted` and `review` are not documented as valid RequestStatus values in the schema**: The Prisma schema comment (line 12) lists the canonical statuses as `draft_intake, triage, assigned, in_progress, pending_review, revision_required, approved, delivered, closed, cancelled`. The values `submitted` and `review` are not in this list. This means either (a) the schema comment is outdated, or (b) this code accepts invalid statuses. If the schema is the source of truth, these statuses should be removed; if they are valid, the schema comment should be updated.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Align with schema: draft_intake, triage, assigned, in_progress, pending_review, revision_required, approved, delivered, closed, cancelled
    // Verify 'submitted' and 'review' are valid statuses before including them
    const VALID_STATUSES = ['draft_intake', 'submitted', 'triage', 'assigned', 'in_progress', 'pending_review', 'review', 'revision_required', 'approved', 'delivered', 'closed', 'cancelled'];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const VALID_STATUSES = ['draft_intake', 'submitted', 'triage', 'assigned', 'in_progress', 'pending_review', 'review', 'approved', 'delivered', 'closed', 'cancelled'];
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 88-105

**Atomicity gap: status update and audit log are not in a transaction**: If the `auditEvent.create` call (line 104) fails (e.g., network error, constraint violation), the status change on line 92 has already been committed. This breaks the audit trail — the request status is changed without any record of who did it. Wrap both operations in a Prisma `$transaction` to ensure atomicity.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Use transaction for atomicity: status update + audit log must succeed or fail together
    const [updated] = await prisma.$transaction([
      prisma.legalRequest.update({
        where: { id },
        data: {
          status,
          statusNote: note || null,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          statusNote: true,
          updatedAt: true,
        },
      }),
      prisma.auditEvent.create({
        data: {
          actorId: userId,
          workspaceId: existingRequest.workspaceId || '',
          action: 'admin.partner.status_override',
          targetType: 'request',
          targetId: id,
          metadataSummary: JSON.stringify({
            previousStatus: existingRequest.status,
            newStatus: status,
            note: note || null,
          }),
        },
      }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Update status
    const updated = await prisma.legalRequest.update({
      where: { id },
      data: {
        status,
        statusNote: note || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        statusNote: true,
        updatedAt: true,
      },
    });

    // Admin audit log using AuditEvent
    await prisma.auditEvent.create({
```
</details>

---

**🐛 Bug** · line 17

**`coordinator_admin` role is not documented in the schema**: The Prisma schema (line 21) documents staff roles as `super_admin, coordinator, specialist, reviewer`. The `ADMIN_ROLES` array includes `coordinator_admin` which is not in this list. Either the schema comment is outdated, or this role check will never match real users. Verify that `coordinator_admin` is actually used in memberships and update the schema comment accordingly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Verify that coordinator_admin is a real role. Schema documents: super_admin, coordinator, specialist, reviewer
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
```
</details>

---

**🐛 Bug** · line 108

**`workspaceId: ''` may violate referential integrity**: The audit event is created with `workspaceId: ''` (empty string). The `AuditEvent.workspaceId` field has a `@relation` to `Workspace`, meaning it should reference a real workspace. An empty string will not match any workspace and could cause issues if foreign key enforcement is enabled. Consider using the request's `workspaceId` from `existingRequest` (which should be fetched in the select query).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        workspaceId: existingRequest.workspaceId, // Use the request's workspace
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        workspaceId: '', // Platform-level admin, no specific workspace
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 62

**No length validation on `note`**: The `note` field from the request body is passed directly to the database without any length check. If the database column has a character limit (even though SQLite is lenient), very long notes could cause unexpected behavior. Consider adding a maximum length validation (e.g., 1000 characters) and returning a 400 error if exceeded.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { status, note } = body;

    // Validate note length
    if (note && note.length > 2000) {
      return NextResponse.json(
        { error: 'INVALID_NOTE', detail: 'Note must be 2000 characters or less' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { status, note } = body;
```
</details>

---

**🔧 Maintainability** · line 58

**Unused `session` variable**: The `session` variable is destructured from `requireAdminSession()` but never used in the function body. This is dead code that can be cleaned up.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { userId } = await requireAdminSession();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { session, userId } = await requireAdminSession();
```
</details>


