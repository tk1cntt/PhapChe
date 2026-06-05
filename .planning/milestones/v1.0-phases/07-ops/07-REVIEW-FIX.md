---
phase: 07
phase_name: ops
status: all_fixed
fix_scope: critical_warning
findings_in_scope: 2
fixed: 2
skipped: 0
iteration: 1
fixed_at: 2026-06-01
---

# Phase 07-ops: Code Review Fix Report

## Summary

Đã fix 2 warning logic từ `07-REVIEW.md`:

- WR-01: Workload `byStatus` từng người dùng tổng toàn dashboard.
- WR-02: “Oldest active age” trong workload là global thay vì theo từng người.

## Fixes Applied

### WR-01 — Fixed

**Files:** `src/lib/ops/ops-service.ts`

- Thêm `oldestActiveAgeDays` vào `OpsWorkloadRowDto`.
- Tính workload theo từng assignee từ các request active đã query.
- `byStatus` của từng specialist/reviewer giờ đếm theo `assignedSpecialistId` hoặc `assignedReviewerId`, không còn dùng aggregate toàn dashboard.

### WR-02 — Fixed

**Files:** `src/app/admin/ops/page.tsx`

- Bỏ biến `oldestActiveAge` global.
- Render `row.oldestActiveAgeDays` cho từng dòng workload.

## Verification

- Fixer re-read code sau sửa và xác nhận các đoạn fix hiện diện.
- `npx tsc --noEmit --pretty false` vẫn fail do lỗi TypeScript tiền tồn tại ngoài file Phase 7 ops; không thấy lỗi mới ở:
  - `src/lib/ops/ops-service.ts`
  - `src/app/admin/ops/page.tsx`

## Remaining Items

- IN-01 là info-level và không thuộc scope fix mặc định (`critical_warning`). Có thể xử lý sau nếu muốn mở rộng test runtime/mock Prisma sâu hơn.
