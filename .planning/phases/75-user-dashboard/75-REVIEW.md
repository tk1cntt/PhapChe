---
phase: 75-user-dashboard
reviewed: 2026-06-21T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/app/api/messages/unread-count/route.ts
  - src/components/dashboard/StatCard.tsx
  - src/components/dashboard/DashboardClient.tsx
  - src/components/dashboard/dashboard.css
  - src/components/dashboard/RecentCases.tsx
  - src/components/dashboard/RecentDocuments.tsx
  - src/components/dashboard/ActivityTimeline.tsx
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 75: Code Review Report

**Reviewed:** 2026-06-21
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Đã review 7 files trong phase 75 - User Dashboard Enhancement. Security cho API endpoint `/api/messages/unread-count` được implement đúng (session validation + IDOR protection). Tuy nhiên, phát hiện 2 warnings về functional bugs và 4 info items về code quality/Next.js patterns.

---

## Warnings

### WR-01: DashboardClient - isLoading State Never Triggered

**File:** `src/components/dashboard/DashboardClient.tsx:163-170`
**Issue:** State `isLoading` được khởi tạo là `false` và không bao giờ được set thành `true`. Điều này khiến skeleton components (StatCardsSkeleton, RecentCasesSkeleton, etc.) không bao giờ hiển thị trong khi data đang được fetch từ `/api/messages/unread-count`.

**Impact:** Người dùng không thấy loading skeleton khi dashboard load, trải nghiệm có thể bị giật (layout shift).

**Fix:**
```tsx
// Option 1: Initial mount loading (recommended)
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  // Simulate initial data load check or remove if not needed
  setIsLoading(false);
}, []);

// Option 2: Remove unused state if skeleton is not needed
// Simply remove isLoading state and skeleton components
```

---

### WR-02: Create Request Button Has No Handler

**File:** `src/components/dashboard/DashboardClient.tsx:180-186`
**Issue:** Button "Tạo yêu cầu mới" không có `onClick` handler. Khi click, button không làm gì cả - đây là dead UI element.

**Impact:** User click button nhưng không có action xảy ra, gây confusion.

**Fix:**
```tsx
import { useRouter } from 'next/navigation';

export default function DashboardClient({...}) {
  const router = useRouter();
  // ...

  return (
    // ...
    <button
      className="create-btn"
      onClick={() => router.push('/requests/create')}
    >
      {/* ... */}
    </button>
  );
}
```

---

## Info

### IN-01: Inconsistent Link Usage - DashboardClient

**File:** `src/components/dashboard/DashboardClient.tsx:265`
**Issue:** Sử dụng `<a href="/messages">` thay vì `<Link>` từ Next.js. Gây full page reload không cần thiết, inconsistent với Next.js patterns.

**Fix:**
```tsx
import Link from 'next/link';

// Instead of:
<a href="/messages" className="floating-chat">

// Use:
<Link href="/messages" className="floating-chat">
```

---

### IN-02: Inconsistent Link Usage - RecentCases

**File:** `src/components/dashboard/RecentCases.tsx:34,72`
**Issue:** Sử dụng `<a>` tags thay vì `<Link>` từ Next.js tại lines 34 và 72.

**Fix:**
```tsx
import Link from 'next/link';

// Line 34: Change
<a className="small-link" href="/requests">

// To:
<Link href="/requests" className="small-link">

// Line 72: Change
<a className="action-link" href={`/requests/${c.id}`}>

// To:
<Link href={`/requests/${c.id}`} className="action-link">
```

---

### IN-03: Unvalidated Input in formatFileSize

**File:** `src/components/dashboard/RecentDocuments.tsx:11-16`
**Issue:** Function `formatFileSize` không validate input. Nếu `bytes` là `undefined`, `null`, hoặc negative, function sẽ return NaN hoặc crash.

**Fix:**
```tsx
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (!bytes || bytes < 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
```

---

### IN-04: API Error Response May Confuse Client

**File:** `src/app/api/messages/unread-count/route.ts:20`
**Issue:** Khi có error, API return `{ unreadCount: 0 }` với HTTP status 500. Frontend không thể phân biệt giữa "thật sự 0 unread" và "server error nhưng return 0 fallback". Nên return error body khác hoặc không return data.

**Fix:**
```tsx
// Option 1: Return different body
return NextResponse.json(
  { error: 'Failed to fetch unread count', unreadCount: 0 },
  { status: 500 }
);

// Option 2: Don't return count on error
return NextResponse.json(
  { error: 'Failed to fetch unread count' },
  { status: 500 }
);
```

---

## Structural Findings (fallow)

_Khong co structural findings duoc cung cap._

---

## Security Assessment

**Endpoint:** `/api/messages/unread-count`

| Check | Status |
|-------|--------|
| Session validation | PASS - `requireAppSession()` được gọi |
| IDOR protection | PASS - Query filter `recipientId: userId` |
| Data leakage | PASS - Không expose sensitive info |
| Input validation | PASS - Không có user input |

**Ket luan:** API endpoint secure, không có vulnerabilities.

---

## Code Quality Summary

| Aspect | Rating |
|--------|--------|
| TypeScript types | Good - Props interfaces rõ ràng |
| Error handling | OK - Có fallback, có console.error |
| React patterns | Needs work - Inconsistent use of Link vs a |
| CSS | Good - Well organized, responsive |
| Accessibility | OK - Semantic HTML, proper structure |

---

_Reviewed: 2026-06-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
