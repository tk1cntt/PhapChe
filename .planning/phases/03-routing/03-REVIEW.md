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
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-28T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Đã re-review 9 file source trong scope routing sau code-review fixes. Các lỗi trước về form chưa nối server actions, reviewer assignment và lộ storage key đã được sửa. Còn 1 lỗi phân quyền nghiêm trọng: server actions cấu hình routing cho phép người dùng đã đăng nhập bất kỳ thay đổi matter type và routing capability mà không kiểm tra vai trò coordinator/super admin.

## Critical Issues

### CR-01: Routing configuration server actions lack authorization

**File:** `src/app/admin/routing/actions.ts:33-61`
**Issue:** `saveMatterType` và `saveCapability` chỉ gọi `requireAppSession()` rồi ghi dữ liệu qua `upsertMatterType` / `upsertRoutingCapability`. Không có kiểm tra membership role `coordinator_admin` hoặc `super_admin` như `assignRequest` đang làm trong `requireCoordinatorActor`. Vì server actions là endpoint phía server, user đã đăng nhập có thể gọi trực tiếp action để tạo/sửa loại vụ việc hoặc năng lực routing trong workspace active của họ. Nặng hơn, `saveMatterType` truyền `session.activeWorkspaceId` trực tiếp; nếu giá trị này rỗng/undefined, `upsertMatterType` chuyển thành `workspaceId: null`, có thể tạo/sửa matter type global. Đây là authorization gap cho cấu hình điều phối.
**Fix:** Áp cùng guard phân quyền cho mọi mutation routing config. Đưa guard dùng chung ra service hoặc thêm helper trong actions trước khi gọi upsert; đồng thời yêu cầu workspaceId có giá trị.
```ts
async function requireRoutingAdmin(workspaceId: string, actorId: string) {
  if (!workspaceId.trim()) throw new Error('WORKSPACE_REQUIRED');
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      workspaceId,
      userId: actorId,
      role: { in: ['coordinator_admin', 'super_admin'] },
      isActive: true,
      user: { isActive: true },
      workspace: { isActive: true },
    },
    select: { id: true },
  });
  if (!membership) throw new Error('FORBIDDEN');
}

async function saveCapability(formData: FormData): Promise<RoutingActionResult> {
  try {
    const session = await requireAppSession();
    const workspaceId = session.activeWorkspaceId || '';
    await requireRoutingAdmin(workspaceId, session.userId);
    await upsertRoutingCapability({
      workspaceId,
      userId: stringValue(formData, 'userId'),
      matterTypeKey: stringValue(formData, 'matterTypeKey'),
      kind: routingKind(stringValue(formData, 'kind')),
      isActive: booleanValue(formData, 'isActive'),
    });
    revalidatePath('/admin/routing');
    return { ok: true, message: successMessage };
  } catch {
    return { ok: false, message: errorMessage };
  }
}
```

---

_Reviewed: 2026-05-28T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
