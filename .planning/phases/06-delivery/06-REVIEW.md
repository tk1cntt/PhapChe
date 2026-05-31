---
phase: 06-delivery
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 9
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 06: Code Review Report

**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Review chuẩn trên 9 file delivery/vault/workflow. Có 1 lỗi security ở download URL: TTL không được ký/xác thực, client tự đặt `expires` tương lai vẫn qua. Có 1 bug UX làm nút tải của khách luôn hết hạn. Có 1 warning server action nuốt lỗi nên form không phản hồi thất bại.

## Critical Issues

### CR-01: Download URL hết hạn chỉ dựa trên query client tự sửa được

**File:** `src/app/api/vault/[vaultFileId]/download/route.ts`
**Related:** `src/lib/documents/vault-service.ts`

**Issue:** `expires` không có chữ ký/token server-side. Bất kỳ user đã pass RBAC cho vault file có thể gọi `/api/vault/<vaultFileId>/download?expires=9999999999999`. Route chỉ check `expires < Date.now()`, nên TTL 15 phút không được enforce thật. Vi phạm constraint signed URL ngắn hạn.

**Fix:** Ký URL bằng HMAC hoặc lưu access token TTL server-side. Route phải verify signature bằng `timingSafeEqual` trước khi cho download.

## Warnings

### WR-01: Nút tải khách hàng gọi URL thiếu `expires`, nên luôn nhận 410

**File:** `src/app/customer/requests/[requestId]/page.tsx`
**Related:** `src/app/api/vault/[vaultFileId]/download/route.ts`

**Issue:** Link tải render `/api/vault/${document.vaultFileId}/download`. Route đọc `expires`; khi thiếu, default `0`, nên trả 410. Trong route, `requestVaultFileAccess()` tạo URL mới nhưng không redirect vì URL cùng path, sau đó vẫn check query request cũ.

**Fix:** Route redirect khi thiếu `expires` tới signed access URL mới, kết hợp fix CR-01 để URL redirect có chữ ký.

### WR-02: Server actions nuốt lỗi, người dùng không biết giao/đóng thất bại

**File:** `src/app/specialist/requests/[requestId]/actions.ts`

**Issue:** `markDeliveredAction` và `closeDeliveredAction` catch lỗi rồi chỉ `void deliveryErrorMessage` / `void closeErrorMessage`. Form không nhận result, UI không hiện lỗi, failure bị im lặng. Specialist có thể tưởng đã giao/đóng hồ sơ nhưng state không đổi.

**Fix:** Trả action result và hiển thị ở UI, hoặc để lỗi bubble lên boundary.

## Files reviewed

- `src/app/api/vault/[vaultFileId]/download/route.ts`
- `src/app/customer/requests/[requestId]/page.tsx`
- `src/app/specialist/requests/[requestId]/actions.ts`
- `src/app/specialist/requests/[requestId]/page.tsx`
- `src/lib/delivery/delivery-service.test.ts`
- `src/lib/delivery/delivery-service.ts`
- `src/lib/delivery/notification-service.ts`
- `src/lib/documents/vault-service.ts`
- `src/lib/workflow/request-workflow.ts`
