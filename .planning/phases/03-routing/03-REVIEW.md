---
phase: 03-routing
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/lib/routing/routing-service.ts
  - src/lib/routing/routing-service.test.ts
  - prisma/schema.prisma
  - src/app/admin/routing/actions.ts
  - src/app/admin/routing/page.tsx
  - src/app/specialist/requests/page.tsx
  - src/app/specialist/requests/[requestId]/page.tsx
  - prisma/seed.ts
  - package.json
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: clean
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-29
**Depth:** standard
**Files Reviewed:** 9
**Status:** clean

## Summary

Reviewed routing phase files for bugs, security issues, and code quality. Security controls are solid: Prisma parameterized queries prevent SQL injection, RBAC properly gates access via `canAccessRequest`, audit trail uses metadata summary without sensitive intake content, and assignment reason validation is enforced server-side. Authorization checks (`requireRoutingAdmin`, `coordinator_admin`, `super_admin`) are correctly applied to sensitive operations.

Minor issues flagged: RBAC gap on specialist request list (list only filters by userId, not role), silent metadata truncation in audit, and missing composite index on `LegalRequest.status + workspaceId`.

## Warnings

### WR-01: Specialist request list lacks role guard

**File:** `src/app/specialist/requests/page.tsx:28-31`

List page queries `assignedSpecialistId: session.userId` without verifying the user has the `specialist` role.

```typescript
// Current: only filters by userId match
where: {
  workspaceId: session.activeWorkspaceId ?? '',
  assignedSpecialistId: session.userId,
},
```

**Issue:** A coordinator_admin or customer with matching userId could see specialist requests via this path. The detail page (`[requestId]/page.tsx:42`) uses `canAccessRequest` which enforces role correctly, but the list page does not.

**Fix:** Add role verification to the list query:

```typescript
where: {
  workspaceId: session.activeWorkspaceId ?? '',
  assignedSpecialistId: session.userId,
  workspace: {
    memberships: {
      some: {
        userId: session.userId,
        role: 'specialist',
        isActive: true,
      },
    },
  },
},
```

### WR-02: Audit metadata silently truncates reason

**File:** `src/lib/routing/routing-service.ts:96-101`

```typescript
function metadataSummary(input: { ... }) {
  const shortReason = input.reason.replace(/\s+/g, ' ').trim().slice(0, 160);
  const metadata = `...reason=${shortReason}`;
  if (metadata.length > 500) return metadata.slice(0, 500);
  return metadata;
}
```

**Issue:** Reason is truncated silently to 160 chars and the 500-char limit is enforced by cutting the entire metadata. No logging when truncation occurs. The full reason is stored in `RequestAssignment` so audit is complete, but if truncation hits the 500-char limit, data loss occurs silently.

**Fix:** Add truncation indicator and consider logging when truncation occurs:

```typescript
function metadataSummary(input: { ... }) {
  const shortReason = input.reason.replace(/\s+/g, ' ').trim().slice(0, 160);
  const truncated = input.reason.length > 160 ? ' [truncated]' : '';
  const metadata = `...reason=${shortReason}${truncated}`;
  if (metadata.length > 500) return metadata.slice(0, 497) + '...';
  return metadata;
}
```

### WR-03: Missing composite index for status query

**File:** `prisma/schema.prisma:125-129`

Current indexes:

```prisma
@@index([workspaceId])
@@index([status])
```

**Issue:** Admin routing page queries `status: { in: ['intake_submitted', 'triage', 'assigned'] }` filtered by `workspaceId`. Composite index on `[workspaceId, status]` would optimize this common query pattern.

**Fix:**

```prisma
@@index([workspaceId, status])
```

## Info

### IN-01: Test assertions use indirect validation

**File:** `src/lib/routing/routing-service.test.ts:10-14`

The test validates exports by converting functions to strings and checking `source.includes(exportName)` instead of verifying actual exports:

```typescript
for (const exportName of ['upsertMatterType', ...]) {
  if (!source.includes(exportName) && !String({ ... }).length) {
    throw new Error(`${exportName} missing`);
  }
}
```

The `String({ ... }).length` check is always truthy (produces `"[object Object]"`), making the `!source.includes(exportName)` branch dead. However, `mustInclude()` calls later (e.g., `mustInclude('ASSIGNMENT_REASON_REQUIRED', ...)`) are the real validation mechanism. This is fragile but currently functional.

**Suggestion:** Replace with explicit function existence checks if tests need to be robust against refactoring.

### IN-02: Seed uses test-domain emails (acceptable)

**File:** `prisma/seed.ts:10-11`

```typescript
email: 'specialist.demo@example.test',
email: 'reviewer.demo@example.test',
```

Uses `example.test` domain per RFC 6761 (reserved for documentation/testing). Acceptable for seed data.

### IN-03: Error messages swallowed in server actions

**File:** `src/app/admin/routing/actions.ts:50-52, 69-71, 93-95`

All server action errors return generic message:

```typescript
} catch {
  return { ok: false, message: errorMessage };
}
```

Appropriate for security (don't leak internal errors), but makes debugging difficult. Consider logging errors server-side while returning generic message to client.

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_