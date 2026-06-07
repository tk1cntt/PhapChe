---
phase: 16-fix-14-failed-routes-discovered-by-validated-screenshot-capt
reviewed: 2026-06-07T06:06:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - src/app/admin/routing/page.tsx
  - src/app/admin/templates/page.tsx
  - src/app/admin/templates/[templateId]/page.tsx
  - src/app/admin/users/page.tsx
  - src/app/admin/vault/page.tsx
  - src/app/customer/requests/[requestId]/page.tsx
  - src/app/requests/[requestId]/page.tsx
  - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx
  - src/app/specialist/requests/[requestId]/page.tsx
  - src/app/specialist/requests/SpecialistRequestsTable.tsx
  - src/app/specialist/requests/page.tsx
  - src/app/reviewer/requests/ReviewerRequestsTable.tsx
  - src/app/reviewer/requests/page.tsx
  - src/app/admin/ops/page.tsx
  - src/app/admin/ops/OpsDashboardTables.tsx
  - src/app/admin/ops/[requestId]/page.tsx
  - src/app/admin/ops/[requestId]/OpsTimelineTable.tsx
  - src/lib/documents/template-service.ts
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-06-07T06:06:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Phase 16 successfully fixed 14 failed routes by addressing Next.js 15 async params breaking changes, correcting server/client component boundaries, and removing invalid Prisma includes. All files correctly await params/searchParams. Authorization checks are properly implemented using canAccessRequest() and role-based guards. Server/client boundaries are correctly separated with proper 'use client' directives on table components.

Two warnings were identified related to workspace isolation in admin user listing and template ownership verification gaps.

## Warnings

### WR-01: Missing workspace filter in admin users listing

**File:** `src/app/admin/users/page.tsx:28-40`
**Issue:** The prisma.user.findMany query does not filter by workspace, potentially exposing all users across all workspaces to admin users. The session.activeWorkspaceId is never used in the query.

**Fix:**
```typescript
const users = await prisma.user.findMany({
  where: {
    memberships: {
      some: {
        workspaceId: session.activeWorkspaceId ?? '',
        isActive: true,
      },
    },
  },
  select: {
    id: true,
    email: true,
    name: true,
    isActive: true,
    memberships: {
      where: { workspaceId: session.activeWorkspaceId ?? '', isActive: true },
      select: { role: true, workspace: { select: { name: true } } },
      take: 1,
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

### WR-02: Missing workspace ownership verification in template detail page

**File:** `src/app/admin/templates/[templateId]/page.tsx:39-53`
**Issue:** After fetching the template from the database, the page does not verify that the template belongs to the current workspace before rendering. Any admin in any workspace could potentially access templates from other workspaces if they know the template ID.

**Fix:**
```typescript
if (!template) notFound();
if (template.workspaceId !== session.activeWorkspaceId) notFound();
```

## Info

### IN-01: Fallback to empty string for activeWorkspaceId

**File:** `src/app/admin/routing/page.tsx:49`
**Issue:** `session.activeWorkspaceId || ''` silently converts undefined to empty string. This could mask configuration issues where activeWorkspaceId is legitimately undefined for super_admin users, but might cause unexpected behavior if workspaceId filtering is applied elsewhere with this empty string.

**Suggestion:** Consider explicitly handling super_admin case or documenting that empty string is valid for super_admin.

### IN-02: Reviewer queue does not filter by workspace

**File:** `src/app/reviewer/requests/page.tsx:14-42`
**Issue:** The reviewer queue query does not filter by workspace. Reviewers might see requests from other workspaces. This may be intentional design for super_admin reviewers, but could be a security gap if coordinator_admin reviewers should only see their workspace.

**Suggestion:** Add workspace filter if reviewers should be workspace-scoped:
```typescript
document: {
  request: {
    workspaceId: session.activeWorkspaceId ?? undefined,
    assignedReviewerId: session.userId,
  },
},
```

### IN-03: Code duplication - toneToTagColor function

**File:** Multiple files
**Issue:** The `toneToTagColor` helper function is duplicated across 6+ files:
- `src/app/admin/routing/page.tsx:23-30`
- `src/app/admin/users/page.tsx:16-22`
- `src/app/customer/requests/[requestId]/page.tsx:24-34`
- `src/app/requests/[requestId]/page.tsx:24-34`
- `src/app/specialist/requests/[requestId]/page.tsx:31-38`
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` (implied via import)

**Suggestion:** Extract to shared utility:
```typescript
// src/lib/ui/tone-utils.ts
export const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

export function toneToTagColor(tone: string): string {
  return toneToColor[tone] ?? 'default';
}
```

### IN-04: Potential null access in user membership

**File:** `src/app/admin/users/page.tsx:47-48`
**Issue:** If `user.memberships[0]` is undefined (no active membership), the code defaults to 'customer' role, which may not accurately represent the user's actual permissions.

**Suggestion:** Consider logging or tracking users without active memberships, as this could indicate data integrity issues.

---

_Reviewed: 2026-06-07T06:06:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
