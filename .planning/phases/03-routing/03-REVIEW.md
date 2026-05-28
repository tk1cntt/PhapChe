---
phase: 03-routing
reviewed: 2026-05-29T00:00:00Z
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
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Đã review 9 file source ở depth standard. Guard đọc admin routing đã có. Vấn đề còn lại nằm ở mô hình `MatterType`: `key` đang unique toàn cục, nhưng service nhận `workspaceId` và dùng `upsert` theo `key`, khiến admin workspace này có thể ghi đè hoặc chiếm loại vụ việc của workspace khác/global catalog nếu trùng key.

## Critical Issues

### CR-01: MatterType tenant scope bị bỏ qua khi upsert theo key toàn cục

**File:** `prisma/schema.prisma:131-135`, `src/lib/routing/routing-service.ts:110-135`

**Issue:** `MatterType.key` được khai báo `@unique`, trong khi model có `workspaceId` optional. `upsertMatterType()` nhận `workspaceId`, nhưng `upsert` dùng `where: { key }`. Vì vậy, khi admin trong workspace A gửi key trùng với global matter type hoặc matter type do workspace B tạo, code sẽ update record hiện có và đổi `workspaceId`, `label`, `questionSchema`, `isActive`. Đây là lỗi phân quyền/tenant isolation: cấu hình routing và intake catalog có thể bị workspace khác ghi đè.

**Fix:** Scope uniqueness theo workspace, không theo key toàn cục. Ví dụ dùng composite unique và upsert theo `(workspaceId, key)`; với global record, dùng sentinel hoặc tách global catalog khỏi tenant override vì PostgreSQL cho phép nhiều `NULL` trong unique composite.

```prisma
model MatterType {
  id             String  @id @default(cuid())
  workspaceId    String
  key            String
  label          String
  description    String?
  schemaVersion  String
  questionSchema Json
  isActive       Boolean @default(true)

  workspace Workspace @relation(fields: [workspaceId], references: [id])

  @@unique([workspaceId, key])
  @@index([workspaceId])
  @@index([isActive])
}
```

```ts
return prisma.matterType.upsert({
  where: { workspaceId_key: { workspaceId, key } },
  update: {
    label,
    description: input.description?.trim() || null,
    schemaVersion,
    questionSchema: input.questionSchema,
    isActive: input.isActive ?? true,
  },
  create: {
    workspaceId,
    key,
    label,
    description: input.description?.trim() || null,
    schemaVersion,
    questionSchema: input.questionSchema,
    isActive: input.isActive ?? true,
  },
});
```

Nếu vẫn cần global matter types (`workspaceId: null`), không cho `upsertMatterType()` từ admin tenant update global records theo key. Tạo nhánh rõ: global catalog read-only với tenant admin, tenant override có unique key riêng trong workspace.

---

_Reviewed: 2026-05-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
