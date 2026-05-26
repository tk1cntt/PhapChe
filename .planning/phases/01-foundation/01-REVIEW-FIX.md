---
phase: 01-foundation
fixed_at: 2026-05-26T00:00:00Z
review_path: .planning/phases/01-foundation/01-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-05-26T00:00:00Z
**Source review:** .planning/phases/01-foundation/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### CR-01: Admin mutations accept arbitrary workspaceId without target workspace authorization

**Files modified:** `src/lib/admin/users.ts`
**Commit:** 6ab68a8
**Applied fix:** Added transaction-scoped target workspace admin authorization using server-loaded active coordinator membership, with super_admin bypass, before admin mutations write user, membership, or audit data.

### WR-01: Role update adds new membership but leaves old active roles in same workspace

**Files modified:** `src/lib/admin/users.ts`
**Commit:** 0d4da46
**Applied fix:** Deactivated other active roles for the same user/workspace before creating or reactivating the requested role.

### WR-02: Workflow transition update lacks current-status guard

**Files modified:** `src/lib/workflow/request-workflow.ts`
**Commit:** 56bc24c
**Applied fix:** Replaced status update with current-status guarded updateMany and REQUEST_STATUS_CONFLICT failure before workflow transition and audit rows are created.

---

_Fixed: 2026-05-26T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
