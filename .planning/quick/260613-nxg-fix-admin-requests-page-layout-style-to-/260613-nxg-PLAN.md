---
quick_id: 260613-nxg
slug: fix-admin-requests-page-layout-style-to-match-template
description: Fix admin requests page layout/style to match template
date: 2026-06-13
status: complete
must_haves:
  - truth: AdminRequestsTable has 7 columns matching template
  - truth: Header with proper title and create button
  - truth: Floating SLA warning button present
  - artifact: src/components/admin/AdminRequestsTable.tsx
  - artifact: src/components/admin/AdminRequestsClient.tsx
---

# Quick Plan: Fix Admin Requests Page Layout/Style

## Task 1: Update Table Columns
- **Files:** `src/components/admin/AdminRequestsTable.tsx`
- **Action:** Replace SLA column with "Loại yêu cầu" column, update grid template
- **Verify:** Table has 7 columns: Mã hồ sơ, Workspace, Khách hàng, Trạng thái, Loại yêu cầu, Phụ trách, Thao tác
- **Done:** when table columns match template exactly

## Task 2: Update Page Header and Create Button
- **Files:** `src/components/admin/AdminRequestsClient.tsx`
- **Action:** Add proper page title/subtitle and blue gradient create button
- **Verify:** Header matches template style
- **Done:** when header matches template

## Task 3: Add Floating SLA Warning Button
- **Files:** `src/components/admin/AdminRequestsClient.tsx`
- **Action:** Add floating red button with yellow border when high priority issues exist
- **Verify:** Button appears when stats.highPriority > 0
- **Done:** when floating button matches template

---

**Commit:** c0d3aed
