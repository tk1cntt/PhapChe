---
phase: 07
phase_name: ops
status: issues_found
depth: standard
files_reviewed: 5
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
reviewed: 2026-06-01
---

# Phase 07-ops: Code Review Report

## Files Reviewed

- `src/app/admin/components/admin-shell.tsx`
- `src/app/admin/ops/page.tsx`
- `src/app/admin/ops/[requestId]/page.tsx`
- `src/lib/ops/ops-service.ts`
- `src/lib/ops/ops-service.test.ts`

## Summary

Không thấy vấn đề Critical về injection, hardcoded secret, hoặc authorization bypass rõ ràng. Tuy nhiên có lỗi logic trong workload: số lượng theo trạng thái và “oldest active age” đang dùng dữ liệu toàn dashboard thay vì theo từng specialist/reviewer, khiến UI báo sai workload từng người.

## Findings

### WR-01: Workload `byStatus` của từng người đang dùng tổng toàn dashboard

**Severity:** warning  
**File:** `src/lib/ops/ops-service.ts`

`workload` được tạo từ `bySpecialist`/`byReviewer`, nhưng `byStatus` cho mỗi row lại dùng tổng số hồ sơ theo trạng thái của toàn dashboard. Vì vậy mọi specialist/reviewer sẽ hiển thị cùng số `pending_review`, `revision_required`, v.v. thay vì số của riêng người đó.

**Recommended fix:** Group workload theo cả assignee và status, hoặc tính từ requests đã query theo từng người.

### WR-02: “Oldest active age” trong bảng workload là giá trị global, không phải theo từng người

**Severity:** warning  
**File:** `src/app/admin/ops/page.tsx`

`oldestActiveAge` được tính một lần từ toàn bộ `dashboard.requests`, rồi render cho mọi dòng workload. Kết quả là tất cả specialist/reviewer đều có cùng “Oldest active age”.

**Recommended fix:** Trả `oldestActiveAgeDays` theo từng workload row từ service, rồi render `row.oldestActiveAgeDays`.

### IN-01: Test ops chủ yếu kiểm tra chuỗi source, dễ bỏ sót lỗi runtime/logic

**Severity:** info  
**File:** `src/lib/ops/ops-service.test.ts`

Test đang đọc source bằng `readFileSync` và kiểm tra `includes`/`excludes`. Cách này có giá trị như contract guard, nhưng không bắt được lỗi logic thực tế như `workload.byStatus` đang dùng aggregate toàn dashboard cho từng người.

**Recommended fix:** Giữ source-contract checks, nhưng thêm unit/integration test có fixture hoặc mocked Prisma để assert kết quả `getOpsDashboard`.
