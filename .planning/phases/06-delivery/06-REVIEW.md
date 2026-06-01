---
phase: 06-delivery
reviewed: 2026-06-01T12:22:38Z
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
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-06-01T12:22:38Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Đã review 12 file delivery/vault/workflow. Phát hiện 1 lỗi security ảnh hưởng audit trail và 1 lỗi test setup làm RBAC test không kiểm tra đúng cross-tenant case.

## Critical Issues

### CR-01: Metadata audit ghi sai workspaceId

**File:** `src/lib/documents/vault-service.ts:163-166`
**Issue:** `getVaultFileMetadata` ghi `workspaceId` bằng `vaultFile.fileKind ?? ''` thay vì workspace thật. Audit cho hồ sơ pháp lý nhạy cảm bị gắn nhầm workspace, phá traceability/tenant audit và có thể làm truy vấn audit theo workspace bỏ sót sự kiện.
**Fix:** Select `workspaceId` từ `vaultFile` rồi dùng field đó khi ghi audit.
```ts
const vaultFile = await prisma.vaultFile.findUnique({
  where: { id: vaultFileId },
  select: {
    id: true,
    workspaceId: true,
    filename: true,
    fileKind: true,
    source: true,
    documentVersionId: true,
    createdAt: true,
    size: true,
    contentType: true,
  },
});

await recordAuditEvent({
  actorId: session.userId,
  workspaceId: vaultFile.workspaceId,
  action: 'vault.metadata_accessed',
  targetType: 'VAULT_FILE',
  targetId: vaultFileId,
  correlationId: `vault-metadata-${vaultFileId}`,
  metadataSummary: `vaultFileId=${vaultFileId}; action=metadata`,
});
```

## Warnings

### WR-01: RBAC test dùng nhầm otherCustomerId

**File:** `src/lib/documents/vault-service.test.ts:119`
**Issue:** `otherCustomerId` đang được set bằng `customer.id`, không phải `otherCustomer.id`. Test `RBAC - user without request access gets FORBIDDEN` vì vậy tạo session “other customer” bằng đúng user thuộc workspace chính, làm phần cross-tenant setup sai và có thể che lỗi phân quyền thật.
**Fix:** Trả về đúng ID của user other customer, và thêm `otherCustomer.id` vào cleanup list.
```ts
return {
  // ...
  otherCustomerId: otherCustomer.id,
  userIds: [coordinator.id, specialist.id, customer.id, otherCustomer.id],
  // ...
};
```

---

_Reviewed: 2026-06-01T12:22:38Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
