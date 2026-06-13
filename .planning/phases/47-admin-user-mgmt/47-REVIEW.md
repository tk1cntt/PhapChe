# Phase 47: Code Review Report

**Reviewed:** 2026-06-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

---

## Summary

Đã review 9 files trong phase 47 (Admin User Management). Phát hiện **1 BLOCKER security vulnerability** (authorization bypass), **4 WARNING issues** về logic và UX, và **3 INFO issues** về code quality.

**Critical Issue:** API routes kiểm tra authentication nhưng **không kiểm tra authorization** - bất kỳ user nào đã authenticated đều có thể truy cập admin endpoints, đây là lỗ hổng bảo mật nghiêm trọng.

---

## Critical Issues

### CR-01: Missing Authorization Check on Admin Endpoints

**Severity:** Critical
**File:** `src/app/api/admin/users/route.ts`
**Line:** 15-17

**Description:**
`requireAppSession()` chỉ kiểm tra user đã login hay chưa, nhưng **không kiểm tra user có quyền admin hay không**. Bất kỳ authenticated user nào (kể cả customer role) đều có thể:
- Xem danh sách tất cả users
- Tạo user mới (POST)
- Truy cập endpoint `/api/admin/users/[id]` để update/delete

Tương tự, `src/app/api/admin/users/[id]/route.ts` cũng không có authorization check (line 12, 88).

**Affected Endpoints:**
- `GET /api/admin/users` - anyone authenticated can list ALL users
- `POST /api/admin/users` - anyone authenticated can create users
- `PUT /api/admin/users/[id]` - anyone authenticated can modify any user
- `DELETE /api/admin/users/[id]` - anyone authenticated can deactivate any user

**Fix:**
Thêm role-based authorization check sau `requireAppSession()`:

```typescript
// src/app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    
    // Add authorization check
    const adminRoles = ['super_admin', 'coordinator_admin', 'audit_admin'];
    if (!session.roles.some(role => adminRoles.includes(role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // ... rest of code
  }
}
```

---

### CR-02: Role Filter Always Defaults to 'specialist'

**Severity:** Critical
**File:** `src/components/admin/UserToolbar.tsx`
**Line:** 64

**Description:**
Role filter button luôn set role thành 'specialist' thay vì cho phép user chọn từ danh sách roles:

```typescript
onClick={() => onRoleFilter(selectedRole ? null : 'specialist')}
```

Điều này khiến filter role không thể sử dụng đúng cách - user không thể filter theo bất kỳ role nào khác ngoài specialist.

**Fix:**
Cần implement dropdown menu để chọn role:

```typescript
const ROLES = ['super_admin', 'audit_admin', 'coordinator_admin', 'reviewer', 'specialist', 'customer'];

// Replace the role filter button with a proper dropdown
<div className="relative">
  <button onClick={() => setShowRoleDropdown(!showRoleDropdown)}>
    {translations.filterRole}
  </button>
  {showRoleDropdown && (
    <div className="absolute mt-2 bg-white border rounded-lg shadow-lg">
      <button onClick={() => { onRoleFilter(null); setShowRoleDropdown(false); }}>
        All Roles
      </button>
      {ROLES.map(role => (
        <button key={role} onClick={() => { onRoleFilter(role); setShowRoleDropdown(false); }}>
          {role}
        </button>
      ))}
    </div>
  )}
</div>
```

---

### CR-03: Workspace Filter Does Nothing

**Severity:** Critical
**File:** `src/components/admin/UserToolbar.tsx`
**Line:** 79

**Description:**
Workspace filter luôn truyền `null`, không bao giờ filter theo workspace:

```typescript
onClick={() => onWorkspaceFilter(selectedWorkspace ? null : null)}
```

Biểu thức `selectedWorkspace ? null : null` luôn trả về `null`, khiến workspace filter vô dụng.

**Fix:**
```typescript
onClick={() => onWorkspaceFilter(selectedWorkspace ? null : 'your-workspace-id')}
```

Hoặc implement dropdown để chọn workspace từ danh sách.

---

## Warnings

### WR-01: Unbounded pageSize Parameter

**Severity:** Warning
**File:** `src/app/api/admin/users/route.ts`
**Line:** 21

**Description:**
`pageSize` được parse từ query params nhưng không có giới hạn trên. User có thể request `?pageSize=999999` gây:
- Performance issues (query quá nhiều records)
- Potential DoS vulnerability

**Fix:**
```typescript
const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '10', 10), 100);
```

---

### WR-02: Dynamic Translation Key Won't Work

**Severity:** Warning
**File:** `src/components/admin/UserTable.tsx`
**Line:** 143

**Description:**
Sử dụng template literal cho translation key là incorrect với next-intl:

```typescript
{t(`role_${row.role}`) || row.role}
```

next-intl không resolve dynamic keys từ template literals. Key sẽ không được tìm thấy và luôn fallback thành `row.role` (raw string như "super_admin").

**Fix:**
Truyền translations từ parent component thay vì dùng dynamic keys:

```typescript
// In UsersPageClient.tsx - pass translations as prop
const translations = {
  role_customer: t('role_customer'),
  role_specialist: t('role_specialist'),
  // ...
};

// Pass to UserTable
<UserTable translations={translations} ... />

// In UserTable.tsx
<span>{translations[`role_${row.role}`] || row.role}</span>
```

---

### WR-03: Duplicate Color Definitions

**Severity:** Warning
**File:** `src/components/admin/RolePills.tsx` (lines 17-24), `src/components/admin/UsersPageClient.tsx` (lines 55-62)

**Description:**
`roleColors` được định nghĩa 2 lần với cùng nội dung trong các files khác nhau:
1. `RolePills.tsx` - used by RolePills component
2. `UsersPageClient.tsx` - passed to UserTable and UserTable uses it

Nên define ở một shared location hoặc chỉ define một lần và pass qua props.

**Fix:**
Extract vào shared constants file:

```typescript
// src/components/admin/constants.ts
export const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  customer: { bg: '#dbeafe', color: '#2563eb' },
  specialist: { bg: '#dbeafe', color: '#2563eb' },
  reviewer: { bg: '#ffedd5', color: '#ea580c' },
  coordinator_admin: { bg: '#ccfbf1', color: '#0f766e' },
  super_admin: { bg: '#ffe4e6', color: '#ef4444' },
  audit_admin: { bg: '#ede9fe', color: '#7c3aed' },
};
```

---

### WR-04: No Membership Deduplication in Role Counts

**Severity:** Warning
**File:** `src/app/[locale]/admin/users/page.tsx`
**Line:** 49-52

**Description:**
`groupBy` role counts không deduplicate users có nhiều memberships. Nếu một user có 2 workspaces với cùng role, họ sẽ được count 2 lần:

```typescript
prisma.workspaceMembership.groupBy({
  by: ['role'],
  _count: { role: true },
}),
```

**Fix:**
Nếu cần count unique users per role:
```typescript
prisma.user.findMany({
  select: { id: true, memberships: { select: { role: true } } },
  where: { isActive: true }
}),
// Then deduplicate in JS
```

---

## Info

### IN-01: Debug console.log Statement

**Severity:** Info
**File:** `src/components/admin/UsersPageClient.tsx`
**Line:** 193

**Description:**
`console.log('Export clicked')` debug statement nên được remove hoặc thay bằng structured logging.

**Fix:**
```typescript
onExport={() => {
  // TODO: Implement export functionality
  // logger.info('Export triggered', { userId: session.userId });
}}
```

---

### IN-02: Non-ideal Key Prop in List Rendering

**Severity:** Info
**File:** `src/components/admin/UserTable.tsx`
**Line:** 120

**Description:**
Dùng `row.key` (được set = row.id) làm key nhưng `row.key` đã được định nghĩa là `row.id` trong API response (route.ts line 83). Không có lỗi nhưng có thể confuse.

**Fix:**
```typescript
<div key={row.id} ...>
```

---

### IN-03: Hardcoded Timezone Default

**Severity:** Info
**File:** `src/app/api/admin/users/route.ts`
**Line:** 168

**Description:**
Timezone mặc định 'Asia/Ho_Chi_Minh' nên được thay bằng giá trị từ workspace config hoặc environment variable.

**Fix:**
```typescript
timezone: timezone ?? process.env.DEFAULT_TIMEZONE ?? 'Asia/Ho_Chi_Minh',
```

---

## Findings Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| Warning | 4 |
| Info | 3 |
| **Total** | **10** |

### Files Reviewed:
1. `src/components/admin/AdminStatGrid.tsx`
2. `src/components/admin/RolePills.tsx`
3. `src/components/admin/UsersPageClient.tsx`
4. `src/components/admin/UserTable.tsx`
5. `src/components/admin/UserToolbar.tsx`
6. `src/components/admin/UserPagination.tsx`
7. `src/app/api/admin/users/route.ts`
8. `src/app/api/admin/users/[id]/route.ts`
9. `src/app/[locale]/admin/users/page.tsx`

---

_Reviewed: 2026-06-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
