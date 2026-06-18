---
status: fixed
trigger: "admin-login-redirect: admin.demo@example.test truy cập /vi/admin/dashboard bị redirect về login"
created: 2026-06-18
updated: 2026-06-18
---

# Debug Session: admin-login-redirect-admin

## Symptoms

- expected_behavior: "Sau khi đăng nhập bằng admin.demo@example.test rồi mở http://localhost:3000/vi/admin/dashboard thì vào được admin dashboard."
- actual_behavior: "Bị redirect về login."
- error_messages: "Không thấy lỗi browser console, terminal dev server, hoặc Network response."
- timeline: "Chưa xác định."
- reproduction: "Mở /vi/admin/dashboard trực tiếp khi chưa đăng nhập; login xong vẫn không vào được."

## Current Focus

- hypothesis: "confirmed"
- test: "passed"
- expecting: "admin user with multiple memberships can access admin dashboard"
- next_action: "verify with e2e test"
- reasoning_checkpoint: "Root cause identified: requireAppSession() only returned 1 role from first membership"
- tdd_checkpoint: ""

## Evidence

### Investigation

1. **Middleware check** (`src/middleware.ts:51-64`): Chỉ kiểm tra session cookie, không check role
2. **Admin Layout** (`src/app/[locale]/admin/layout.tsx:19-24`): Gọi `requireAppSession()` và kiểm tra `session.roles?.some(role => ADMIN_ROLES.includes(role))`
3. **Session function** (`src/lib/security/session.ts`):
   - OLD: Dùng `take: 1` để lấy chỉ 1 membership đầu tiên
   - Trả về `roles: [membership.role]` - chỉ 1 role
4. **Database check**: User `admin.demo@example.test` có 2 memberships:
   - `owner` ở workspace "Cong ty An Phat" (tạo trước bởi seedAnPhatWorkspace)
   - `coordinator_admin` ở workspace "Demo Legal Workspace"
5. **Root cause**: Code cũ lấy membership đầu tiên (`owner`) → không match `ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin']` → redirect về `/vi/dashboard`

### Code Flow

```
User truy cập /vi/admin/dashboard
  ↓
Middleware: kiểm tra session cookie ✓
  ↓
Admin Layout: gọi requireAppSession()
  ↓
requireAppSession(): lấy memberships với take:1
  ↓
Kết quả: roles = ['owner'] (membership đầu tiên)
  ↓
Admin Layout: kiểm tra ADMIN_ROLES.includes('owner') → false
  ↓
Redirect về /vi/dashboard
```

## Eliminated

- Middleware auth check: Không phải vấn đề (chỉ check session, không check role)
- Admin layout logic: Logic đúng, vấn đề ở data trả về từ requireAppSession()
- Database data: Data đúng, user có coordinator_admin role

## Resolution

- root_cause: "requireAppSession() chỉ trả về 1 role từ membership đầu tiên (dùng take:1). User admin.demo có 2 memberships, membership đầu tiên là 'owner' không nằm trong ADMIN_ROLES."
- fix: "Sửa requireAppSession() để collect tất cả roles từ tất cả memberships, không chỉ lấy 1 membership đầu tiên."
- verification: "E2E test admin-login-redirect.spec.ts verify admin user có thể truy cập /vi/admin/dashboard"
- files_changed:
  - "src/lib/security/session.ts - Collect all roles from all memberships"
  - "e2e/admin-login-redirect.spec.ts - E2E test for the fix"

## Code Changes

### src/lib/security/session.ts

**Before:**
```typescript
const user = await prisma.user.findFirst({
  where: { id: userId, isActive: true },
  select: {
    id: true,
    memberships: {
      where: { isActive: true, workspace: { isActive: true } },
      select: { workspaceId: true, role: true },
      orderBy: { createdAt: 'asc' },
      take: 1,  // ❌ Chỉ lấy 1 membership
    },
  },
});

const membership = user?.memberships[0];
return {
  userId: user.id,
  activeWorkspaceId: membership.workspaceId,
  roles: [membership.role],  // ❌ Chỉ trả về 1 role
};
```

**After:**
```typescript
const user = await prisma.user.findFirst({
  where: { id: userId, isActive: true },
  select: {
    id: true,
    memberships: {
      where: { isActive: true, workspace: { isActive: true } },
      select: { workspaceId: true, role: true },
      // Không có take:1 - lấy tất cả memberships
    },
  },
});

// Collect all unique roles from all memberships
const allRoles = Array.from(new Set(user.memberships.map((m) => m.role)));

// Pick the membership with the highest privilege role for activeWorkspaceId
const bestMembership = user.memberships.reduce((best, m) => {
  const bestPriority = ROLE_PRIORITY[best.role] ?? 0;
  const mPriority = ROLE_PRIORITY[m.role] ?? 0;
  return mPriority > bestPriority ? m : best;
}, user.memberships[0]);

return {
  userId: user.id,
  activeWorkspaceId: bestMembership.workspaceId,
  roles: allRoles,  // ✅ Trả về tất cả roles
};
```
