---
phase: 03-routing
reviewed: 2026-05-28T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - package.json
  - prisma/schema.prisma
  - prisma/seed.ts
  - src/app/admin/routing/actions.ts
  - src/app/admin/routing/page.tsx
  - src/app/specialist/requests/[requestId]/page.tsx
  - src/app/specialist/requests/page.tsx
  - src/lib/routing/routing-service.test.ts
  - src/lib/routing/routing-service.ts
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-28T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Đã review 9 file source trong scope routing. Luồng backend `assignRequest` có kiểm tra phân quyền, capability, membership, transaction và audit. Vấn đề chính nằm ở UI điều phối chưa nối server actions, chưa hỗ trợ phân công reviewer, và màn chi tiết chuyên viên đang hiển thị storage key nội bộ của file khách hàng.

## Critical Issues

### CR-01: Internal vault storage key exposed in specialist UI

**File:** `src/app/specialist/requests/[requestId]/page.tsx:113`
**Issue:** UI hiển thị trực tiếp `file.storageKey` cho chuyên viên. Storage key là định danh nội bộ của file nhạy cảm trong Legal Vault. Project constraint yêu cầu file private, phân quyền theo tenant/request, signed URL ngắn hạn; không nên lộ storage key ra giao diện người dùng vì có thể tiết lộ cấu trúc storage hoặc hỗ trợ truy cập trái phép nếu storage/bucket cấu hình sai.
**Fix:** Không render `storageKey` trong UI. Nếu cần tải/xem file, gọi backend endpoint kiểm tra `canAccessRequest` rồi cấp signed URL ngắn hạn.
```tsx
{request.vaultFiles.map((file) => (
  <li key={file.id} className="rounded-xl border border-[#E2E8F0] p-4">
    <p className="text-[16px] font-normal leading-[1.5] text-[#0F172A]">{file.filename}</p>
    <p className="mt-1 text-[14px] font-normal leading-[1.4] text-[#475569]">Ngày gửi: {formatDate(file.createdAt)}</p>
  </li>
))}
```

## Warnings

### WR-01: Routing forms are not wired to server actions

**File:** `src/app/admin/routing/page.tsx:68,151,167`
**Issue:** Các form điều phối, loại vụ việc, và năng lực xử lý không truyền `action={...}` tới server actions trong `src/app/admin/routing/actions.ts`. Nút submit sẽ không gọi `assignRequestAction`, `saveMatterTypeAction`, hoặc `saveCapabilityAction`, nên tính năng lưu/phân công không hoạt động.
**Fix:** Import server actions và gắn đúng action cho từng form.
```tsx
import { assignRequestAction, saveCapabilityAction, saveMatterTypeAction } from './actions';

<form action={assignRequestAction} className="min-w-64 space-y-4">
  ...
</form>

<form action={saveMatterTypeAction} className="grid gap-4 md:grid-cols-2">
  ...
</form>

<form action={saveCapabilityAction} className="grid gap-4 md:grid-cols-2">
  ...
</form>
```

### WR-02: Reviewer assignment suggestions are displayed but cannot be assigned

**File:** `src/app/admin/routing/page.tsx:66-84,141`
**Issue:** Bảng hiển thị cột “Gợi ý reviewer” nhưng `AssignmentForm` luôn gửi `kind="specialist"` và dòng 141 chỉ truyền `suggestions.specialists`. Không có form nào để chọn reviewer, nên reviewer không thể được phân công từ UI dù backend `assignRequest` hỗ trợ `kind: 'reviewer'`.
**Fix:** Cho `AssignmentForm` nhận `kind`, `buttonLabel`, và truyền form riêng cho reviewer, hoặc thêm select chọn loại phân công.
```tsx
function AssignmentForm({ requestId, kind, suggestions, assigned }: {
  requestId: string;
  kind: AssignmentKind;
  suggestions: Suggestion[];
  assigned: boolean;
}) {
  return (
    <form action={assignRequestAction} className="min-w-64 space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="kind" value={kind} />
      ...
    </form>
  );
}
```

---

_Reviewed: 2026-05-28T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
