---
phase: 06-delivery
reviewed: 2026-06-01T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/app/api/vault/[vaultFileId]/download/route.ts
  - src/app/customer/requests/[requestId]/page.tsx
  - src/app/specialist/requests/[requestId]/actions.test.ts
  - src/app/specialist/requests/[requestId]/actions.ts
  - src/app/specialist/requests/[requestId]/page.tsx
  - src/app/specialist/requests/[requestId]/components/delivery-actions.tsx
  - src/lib/delivery/delivery-service.test.ts
  - src/lib/delivery/delivery-service.ts
  - src/lib/delivery/notification-service.ts
  - src/lib/documents/vault-service.test.ts
  - src/lib/documents/vault-service.ts
  - src/lib/workflow/request-workflow.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-06-01T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Đã re-review 12 file nguồn delivery, vault download, workflow transition, UI customer/specialist, và test. Còn 2 lỗi bảo mật nghiêm trọng: khách hàng có thể tải tài liệu final trước khi hồ sơ được giao, và chữ ký tải vault dùng secret mặc định nếu thiếu cấu hình production.

## Critical Issues

### CR-01: Customer can access final vault files before delivery

**File:** `src/lib/documents/vault-service.ts:87-98`
**Issue:** Nhánh customer chỉ kiểm tra cùng workspace, own request, và `documentVersion.status === 'final'`. Không kiểm tra `legalRequest.status` đã `delivered`/`closed`. Nếu tài liệu được reviewer duyệt thành final khi request vẫn ở `approved` hoặc trạng thái trước delivery, customer sở hữu request có thể gọi `/api/vault/{vaultFileId}/download`, nhận signed URL, rồi tải file trước bước specialist giao hồ sơ. Đây là authorization gap với hồ sơ pháp lý nhạy cảm và bypass workflow delivery.
**Fix:** Khi customer tải vault file gắn document version, kiểm tra request status chỉ cho phép `delivered` hoặc `closed`.

```ts
const vaultFile = await prisma.vaultFile.findUnique({
  where: { id: vaultFileId },
  select: {
    id: true,
    requestId: true,
    workspaceId: true,
    filename: true,
    storageKey: true,
    contentType: true,
    documentVersionId: true,
    request: { select: { createdById: true, status: true } },
  },
});

if (isCustomerSession(session)) {
  if (!session.activeWorkspaceId || vaultFile.workspaceId !== session.activeWorkspaceId) throw new Error('FORBIDDEN');
  if (vaultFile.request.createdById !== session.userId) throw new Error('FORBIDDEN');
  if (!['delivered', 'closed'].includes(vaultFile.request.status)) throw new Error('FORBIDDEN');
  if (!vaultFile.documentVersionId) throw new Error('FORBIDDEN');
  // keep final-version check
}
```

### CR-02: Vault download signatures fall back to hardcoded secret

**File:** `src/lib/documents/vault-service.ts:44-46`
**Issue:** `vaultDownloadSecret()` falls back to literal `'dev-vault-download-secret'` when `VAULT_DOWNLOAD_SECRET` and `NEXTAUTH_SECRET` are unset. If deployment misses both env vars, anyone knowing source can forge valid vault download signatures for guessed/known `vaultFileId` and `userId` until expiry. This is hardcoded secret in production security boundary.
**Fix:** Fail closed outside development/test when no real secret exists.

```ts
function vaultDownloadSecret() {
  const secret = process.env.VAULT_DOWNLOAD_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') return 'dev-vault-download-secret';
  throw new Error('VAULT_DOWNLOAD_SECRET_REQUIRED');
}
```

---

_Reviewed: 2026-06-01T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
