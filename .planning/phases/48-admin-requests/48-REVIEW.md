---
phase: 48-admin-requests
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/app/api/admin/requests/route.ts
  - src/app/api/admin/requests/[id]/route.ts
  - src/app/api/admin/requests/[id]/assign/route.ts
  - src/components/admin/AdminRequestsClient.tsx
  - src/app/[locale]/admin/requests/page.tsx
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Phase 48: Code Review Report

## Summary

Đã review 5 file trong phase 48 Admin Requests Management. Tìm thấy **1 critical issue** về tenant isolation và **3 warnings** về role validation, error handling. Code thể hiện tốt các yêu cầu về status mapping (D-01), assignee resolution (D-02), và SLA calculation (D-07). Tuy nhiên, cần fix security issue trước khi deploy.

## Critical Issues

### CR-01: No Workspace Filter - Admin Can Access All Tenants

**File:** `src/app/api/admin/requests/route.ts:39-63`
**Severity:** CRITICAL

**Issue:** Admin requests list API không kiểm tra workspace của admin. Endpoint `/api/admin/requests` trả về **tất cả requests từ tất cả workspaces** mà không có workspace filter.

Dù có `workspaceFilter` từ query params (dòng 45, 62), nhưng API không validate admin có quyền truy cập workspace đó hay không. Bất kỳ user có role `coordinator_admin`, `audit_admin`, hoặc `super_admin` đều có thể xem tất cả requests từ mọi tenant.

**Context cần thiết:** Prisma schema (dòng 87) chỉ lưu `role` trong `WorkspaceMembership`: `customer`, `specialist`, `reviewer`, `coordinator_admin`, `super_admin`. Role `audit_admin` không tồn tại trong database.

**Fix:**

```typescript
// Add workspace access validation
import { canAccessWorkspace } from '@/lib/security/rbac';

export async function GET(request: NextRequest) {
  // ... existing session and role check ...

  const { searchParams } = new URL(request.url);
  // ... existing params parsing ...

  // If workspace filter is provided, validate access
  if (workspaceFilter) {
    const canAccess = await canAccessWorkspace(session, workspaceFilter);
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    // If no filter, super_admin sees all, others see only their workspace
    if (!hasRole(session, 'super_admin')) {
      if (session.activeWorkspaceId) {
        // Override filter to only show their workspace
        where.AND.push({ workspaceId: session.activeWorkspaceId });
      } else {
        // No workspace access - return empty
        return NextResponse.json({ data: [], total: 0, page, pageSize, stats: { total: 0, pending: 0, approved: 0, highPriority: 0 } });
      }
    }
  }
}
```

## Warnings

### WR-01: Invalid Role `audit_admin` Not Defined in Prisma Schema

**File:** `src/app/api/admin/requests/route.ts:5`
**Severity:** WARNING

**Issue:** Constant `ADMIN_ROLES` bao gồm `audit_admin`, nhưng Prisma schema (dòng 11) chỉ định nghĩa các roles: `customer`, `specialist`, `reviewer`, `coordinator_admin`, `super_admin`. Role `audit_admin` không tồn tại trong database.

Code trong `rbac.ts:63` và `lib/types.ts:34` cũng không hỗ trợ `audit_admin`.

**Fix:**

```typescript
// Option 1: Remove audit_admin if not needed
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as string[];

// Option 2: Add audit_admin to Prisma schema if it's a valid role
// Update schema.prisma comment: customer, specialist, reviewer, coordinator_admin, audit_admin, super_admin
```

### WR-02: Inconsistent Role Validation in Assign Route

**File:** `src/app/api/admin/requests/[id]/assign/route.ts:52-54, 74-76`
**Severity:** WARNING

**Issue:** Khi validate specialist/reviewer assignment, code kiểm tra `role: 'specialist'` và `role: 'reviewer'` trong memberships (dòng 52, 75). Tuy nhiên, check này không đầy đủ:

1. User có thể có nhiều memberships với roles khác nhau trong các workspaces khác nhau
2. Không kiểm tra user có active membership trong workspace của request không
3. Không kiểm tra user `isActive: true` trực tiếp

**Fix:**

```typescript
// Validate specialist exists and has specialist role in the request's workspace
if (specialistId) {
  const specialist = await prisma.user.findUnique({
    where: { id: specialistId, isActive: true },
    include: {
      memberships: {
        where: { 
          role: 'specialist', 
          isActive: true,
          workspaceId: existingRequest.workspaceId,
          workspace: { isActive: true }
        },
      },
    },
  });
  if (!specialist || specialist.memberships.length === 0) {
    return NextResponse.json(
      { error: 'Specialist not found or not authorized in this workspace' },
      { status: 400 }
    );
  }
  updateData.assignedSpecialistId = specialistId;
}
```

### WR-03: Silent Error Handling in Frontend

**File:** `src/components/admin/AdminRequestsClient.tsx:84-88`
**Severity:** WARNING

**Issue:** Error trong `fetchData` chỉ được log ra console, không có user-facing error state. Khi API fails, user không biết có lỗi xảy ra.

```typescript
} catch (error) {
  console.error('Error fetching requests:', error);
  // Missing: setError(error) or toast notification
} finally {
```

**Fix:**

```typescript
const [error, setError] = useState<string | null>(null);

} catch (error) {
  console.error('Error fetching requests:', error);
  setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.');
} finally {
  setLoading(false);
}

// Add error display in JSX:
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
    {error}
    <button onClick={() => { setError(null); fetchData(); }} className="ml-2 underline">
      Thử lại
    </button>
  </div>
)}
```

## Info

### IN-01: Hardcoded Sample Data

**File:** `src/components/admin/AdminRequestsTable.tsx:23-99`
**Severity:** INFO

**Issue:** Component có `defaultRows` chứa hardcoded sample data. Data này nằm trong production bundle và có thể confuse developers/testing.

**Fix:** Remove `defaultRows` hoặc chỉ dùng khi `process.env.NODE_ENV === 'development'`.

### IN-02: TODO Console Logs

**File:** `src/components/admin/AdminRequestsClient.tsx:101-102, 117-118, 123-124`
**Severity:** INFO

**Issue:** Có 3 `console.log('TODO: ...')` cần implement:
- Line 101: "Open dispatch modal"
- Line 117: "Open filter modal" 
- Line 123: "Export to CSV"

**Fix:** Implement features hoặc throw `new Error('Not implemented')` để fail fast trong development.

### IN-03: Hardcoded Locale in Router Path

**File:** `src/components/admin/AdminRequestsClient.tsx:104, 106`
**Severity:** INFO

**Issue:** Router paths hardcode `/vi/` thay vì dùng dynamic locale:

```typescript
router.push(`/vi/admin/requests/${fullId}`);      // Line 104
router.push(`/vi/admin/audit?requestId=${fullId}`); // Line 106
```

**Fix:**

```typescript
import { useLocale } from 'next-intl/server';
// hoặc
router.push(`/${locale}/admin/requests/${fullId}`);
```

### IN-04: Missing Workspace Filter in AdminToolbar

**File:** `src/components/admin/AdminRequestsClient.tsx:65-67`
**Severity:** INFO

**Issue:** Frontend không truyền `workspace` filter lên API dù API hỗ trợ. AdminToolbar có prop `translations.workspace` nhưng không có `onWorkspaceChange` handler.

**Fix:** Thêm workspace filter dropdown trong toolbar và truyền `workspaceFilter` state lên API.

---

_Reviewed: 2026-06-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
