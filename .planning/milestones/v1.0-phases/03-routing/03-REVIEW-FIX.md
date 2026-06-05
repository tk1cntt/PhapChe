---
phase: 03-routing
fixed_at: 2026-05-29T00:34:07+07:00
review_path: .planning/phases/03-routing/03-REVIEW.md
iteration: 1
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-05-29T00:34:07+07:00
**Source review:** .planning/phases/03-routing/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 1
- Fixed: 1
- Skipped: 0

## Fixed Issues

### CR-01: MatterType tenant scope bị bỏ qua khi upsert theo key toàn cục

**Files modified:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/intake/intake-service.ts`, `src/lib/routing/routing-service.ts`, `src/lib/routing/routing-service.test.ts`
**Commit:** 78b9d2d
**Applied fix:** Đổi MatterType sang unique composite `(workspaceId, key)`, scope upsert và lookup theo workspace, cập nhật relation phụ thuộc và test guard để chặn upsert theo key toàn cục.

---

_Fixed: 2026-05-29T00:34:07+07:00_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
