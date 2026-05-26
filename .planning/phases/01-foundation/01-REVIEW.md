---
phase: 01-foundation
reviewed: 2026-05-26T00:00:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - .env.example
  - .gitignore
  - next.config.ts
  - package.json
  - postcss.config.mjs
  - prisma/schema.prisma
  - src/app/admin/audit/page.tsx
  - src/app/admin/components/admin-shell.tsx
  - src/app/admin/components/ui.tsx
  - src/app/admin/requests/page.tsx
  - src/app/admin/users/page.tsx
  - src/app/admin/workspaces/page.tsx
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/lib/admin/users.test.ts
  - src/lib/admin/users.ts
  - src/lib/audit/audit.test.ts
  - src/lib/audit/audit.ts
  - src/lib/prisma.ts
  - src/lib/security/rbac.ts
  - src/lib/security/session.ts
  - src/lib/workflow/request-workflow.test.ts
  - src/lib/workflow/request-workflow.ts
  - tailwind.config.ts
  - tsconfig.json
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-26T00:00:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

Reviewed foundation source files for bugs, security, tenant/RBAC flaws, workflow integrity, audit safety, and test quality. Core audit metadata handling and RBAC read checks look reasonable, but admin mutation helpers have tenant-boundary gaps and role-update semantics that can keep stale privileges. Workflow transition update also needs optimistic current-status guard to preserve state-machine integrity under concurrent requests.

## Critical Issues

### CR-01: Admin mutations accept arbitrary workspaceId without target workspace authorization

**File:** `src/lib/admin/users.ts:53-180`
**Issue:** `createAdminUser`, `updateAdminUserRole`, `deactivateAdminUser`, and `assignUserToWorkspace` only check whether actor has `coordinator_admin` or `super_admin` in `actor.roles`. They never verify actor has active membership/admin permission in `input.workspaceId`. A coordinator from one tenant can pass another tenant's `workspaceId` and create users, assign roles, deactivate users, or write audit events under that other workspace. This breaks tenant isolation and RBAC.
**Fix:** Require `super_admin` or active coordinator membership in target workspace before mutation. Use server-loaded membership, not caller-supplied roles alone. Example:

```ts
async function assertAdminForWorkspace(actor: AppSession, workspaceId: string, tx: Prisma.TransactionClient) {
  if (actor.roles.includes('super_admin')) return;

  const membership = await tx.workspaceMembership.findFirst({
    where: {
      userId: actor.userId,
      workspaceId,
      role: 'coordinator_admin',
      isActive: true,
      workspace: { isActive: true },
    },
    select: { id: true },
  });

  if (!membership) throw new Error('FORBIDDEN');
}
```

Call this inside each transaction before writing user, membership, or audit data.

## Warnings

### WR-01: Role update adds new membership but leaves old active roles in same workspace

**File:** `src/lib/admin/users.ts:86-120`
**Issue:** `updateAdminUserRole` uses `upsert` on `(userId, workspaceId, role)` and sets only requested role active. Existing active roles for same user/workspace remain active. A user changed from `coordinator_admin` to `customer` can keep old admin membership, so downgrade does not revoke privileges.
**Fix:** In same transaction, deactivate other roles for that user/workspace before creating/reactivating target role.

```ts
await tx.workspaceMembership.updateMany({
  where: {
    userId: input.userId,
    workspaceId: input.workspaceId,
    role: { not: input.role },
    isActive: true,
  },
  data: { isActive: false },
});

const membership = await tx.workspaceMembership.upsert({
  where: {
    userId_workspaceId_role: {
      userId: input.userId,
      workspaceId: input.workspaceId,
      role: input.role,
    },
  },
  update: { isActive: true },
  create: {
    userId: input.userId,
    workspaceId: input.workspaceId,
    role: input.role,
  },
});
```

### WR-02: Workflow transition update lacks current-status guard

**File:** `src/lib/workflow/request-workflow.ts:65-132`
**Issue:** `transitionRequestStatus` reads current status, validates transition, then updates by `id` only. Concurrent requests can both validate against same old status and then write conflicting `toStatus` values, while workflow/audit rows record the same stale `fromStatus`. This can bypass intended one-step state-machine integrity under race conditions.
**Fix:** Update with current status condition inside transaction and fail if no row changed. Example:

```ts
const updated = await tx.legalRequest.updateMany({
  where: { id: input.requestId, status: request.status },
  data: { status: input.toStatus },
});

if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');

const updatedRequest = await tx.legalRequest.findUniqueOrThrow({
  where: { id: input.requestId },
  select: { id: true, status: true },
});
```

Then create `workflowTransition` and audit event after guarded update succeeds.

---

_Reviewed: 2026-05-26T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
