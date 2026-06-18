---
phase: 85-database-schema-improvement
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - prisma/schema.prisma
  - src/lib/services/request-service.ts
  - src/lib/services/assignment-service.ts
  - src/lib/services/vault-service.ts
  - src/lib/config/feature-flags.ts
  - .env.example
findings:
  critical: 1
  warning: 5
  info: 3
  total: 9
status: issues_found
---

# Phase 85: Code Review Report

**Reviewed:** 2026-06-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the database schema (Prisma) and service layer files for Phase 85 (Database Schema Improvement). The codebase implements a multi-tenant legal request management system with feature flag-driven migration paths. Found 1 critical issue (data consistency risk due to missing transaction), 5 warnings (schema design issues, validation gaps), and 3 info items (best practices).

## Critical Issues

### CR-01: VaultFile upload not atomic - data loss risk

**File:** `src/lib/services/vault-service.ts:66-112`
**Issue:** When `DB_MIGRATION_PHASE4` is enabled, `uploadVaultFile` creates two database records in separate operations without a transaction wrapper:

1. Line 71-86: `prisma.file.create()` - creates File record
2. Line 88-112: `prisma.vaultFile.create()` - creates VaultFile record

If the second `vaultFile.create()` fails, the `File` record exists without corresponding business context, causing orphaned storage records and potential data loss. The comment on line 62 states "Creates a File record (storage layer) first, then a VaultFile record (business layer)" but does not wrap these in a transaction.

Contrast with `assignment-service.ts` lines 93-124 which correctly uses `prisma.$transaction()` for atomic operations.

**Fix:**
```typescript
export async function uploadVaultFile(input: UploadVaultFileInput) {
  const { file, ...metadata } = input;

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // Wrap both operations in a transaction
    return prisma.$transaction(async (tx) => {
      const fileRecord = await tx.file.create({
        data: {
          workspaceId: metadata.workspaceId,
          requestId: metadata.requestId,
          // ... rest of fields
        },
      });

      return tx.vaultFile.create({
        data: {
          requestId: metadata.requestId,
          workspaceId: metadata.workspaceId,
          actorId: metadata.actorId,
          fileId: fileRecord.id,
          // ... rest of fields
        },
        include: {
          file: true,
          request: { select: { id: true, title: true } },
          workspace: { select: { id: true, name: true } },
          actor: { select: { id: true, name: true } },
        },
      });
    });
  }
  // ... old code path unchanged
}
```

## Warnings

### WR-01: MatterType/Tags unique constraint allows duplicates with NULL workspaceId

**File:** `prisma/schema.prisma:316, 576`
**Issue:** Both `MatterType` and `Tag` models define:
```prisma
workspaceId String?  // Optional!
@@unique([workspaceId, key])
```

SQLite/PostgreSQL treats NULL as distinct values, so multiple records with `workspaceId = NULL` and the same `key` would NOT violate the unique constraint. This allows duplicate global matter types or tags.

**Fix:** Either:
1. Make `workspaceId` required: `workspaceId String` (breaking change)
2. Add application-level validation to prevent duplicates when `workspaceId IS NULL`
3. Use a partial unique index (PostgreSQL): `CREATE UNIQUE INDEX ... WHERE workspaceId IS NULL`

### WR-02: Missing validation for required multilingual fields

**File:** `prisma/schema.prisma:296-299, 484-487, 546-549, 567-570`
**Issue:** MatterType, DocumentTemplate, Folder, and Tag models have optional primary labels (e.g., `label_vi`, `name_vi`). No validation ensures at least one label exists, potentially creating records with no user-visible name.

**Fix:** Add application-level validation or use a check constraint:
```typescript
// In MatterType creation validation
if (!input.label_vi && !input.label_en && !input.label_zh && !input.label_ja) {
  throw new Error('At least one label field is required');
}
```

### WR-03: validateAssignment does not check user.isActive

**File:** `src/lib/services/assignment-service.ts:278-308`
**Issue:** The validation only checks workspace membership role but does not verify the user is active:

```typescript
const membership = await prisma.workspaceMembership.findFirst({
  where: {
    userId,
    workspaceId: request.workspaceId,
    role: kind,
    isActive: true,  // checks membership, not user
  },
});
```

A deactivated user could still pass validation if their membership record is active.

**Fix:**
```typescript
const membership = await prisma.workspaceMembership.findFirst({
  where: {
    userId,
    workspaceId: request.workspaceId,
    role: kind,
    isActive: true,
  },
});

// Add user active check
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { isActive: true },
});

if (!user?.isActive) {
  return { valid: false, error: 'User account is deactivated' };
}
```

### WR-04: VaultFile creation missing organizationId population

**File:** `src/lib/services/vault-service.ts:88-105`
**Issue:** When creating a VaultFile (Phase 4 path), the `organizationId` field is not populated even though the request likely belongs to an organization. This field exists in the schema (line 511) but is never set during file creation.

**Fix:** Query the request to get organizationId:
```typescript
// Before creating VaultFile, get organizationId from request
const request = await prisma.legalRequest.findUnique({
  where: { id: metadata.requestId },
  select: { engagement: { select: { organizationId: true } } },
});

return prisma.vaultFile.create({
  data: {
    // ...
    organizationId: request?.engagement?.organizationId || null,
    // ...
  },
});
```

### WR-05: Missing retention policy for AuditEvent

**File:** `prisma/schema.prisma:602-626`
**Issue:** The `AuditEvent` model has no retention or cleanup mechanism. Over time, this table will grow unbounded, potentially causing performance issues and storage costs for old audit data.

**Fix:** Add a scheduled cleanup function or retention configuration:
```typescript
// In a maintenance script
export async function cleanupOldAuditEvents(retentionDays: number = 365) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  
  return prisma.auditEvent.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });
}
```

## Info

### IN-01: Reassignment reason uses raw userId instead of meaningful description

**File:** `src/lib/services/assignment-service.ts:184-185`
**Issue:** When reassigning, the reason is hardcoded:
```typescript
reason: reason || `Reassigned by ${createdById}`,
```
Using the user ID in the reason string provides poor audit readability.

**Fix:** Fetch the creator's name or use a standard message:
```typescript
reason: reason || `Reassigned by coordinator`,
```

### IN-02: MatterTypeFilter OR condition appends to existing AND conditions

**File:** `src/lib/services/request-service.ts:195-203`
**Issue:** The search filter creates OR conditions that append to existing filters:

```typescript
if (filters.search) {
  where.AND = where.AND || [];
  (where.AND as unknown[]).push({
    OR: [{ code: {...} }, { title: {...} }],
  });
}
```

This works correctly but could be clearer with helper functions.

### IN-03: Workspace slug format not validated

**File:** `prisma/schema.prisma:204`
**Issue:** The Workspace `slug` field has `@unique` but no format validation. Slugs could contain invalid characters.

**Fix:** Add validation in service layer or use a regex pattern:
```typescript
// Before creating workspace
if (!/^[a-z0-9-]+$/.test(slug)) {
  throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
}
```

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
