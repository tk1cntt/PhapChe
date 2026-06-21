---
phase: 75
fixed_at: 2026-06-21T15:45:00.000Z
review_path: .planning/phases/75-user-dashboard/75-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 75: Code Review Fix Report

**Fixed at:** 2026-06-21T15:45:00.000Z
**Source review:** .planning/phases/75-user-dashboard/75-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### WR-01: isLoading state never triggered - skeleton never shows

**Files modified:** `src/components/dashboard/DashboardClient.tsx`
**Commit:** 58c901a
**Applied fix:** Changed `isLoading` state initialization from `useState(false)` to `useState(!welcomeData || !stats || allCases.length === 0)` so skeleton shows when data is not yet available.

### WR-02: Create Request button has no onClick handler

**Files modified:** `src/components/dashboard/DashboardClient.tsx`
**Commit:** 58c901a
**Applied fix:** Added `onClick={() => router.push('/create')}` to the Create Request button and imported `useRouter` from next/navigation.

### IN-01: Using `<a>` instead of `<Link>`

**Files modified:** `src/components/dashboard/DashboardClient.tsx`
**Commit:** 58c901a
**Applied fix:** Replaced `<a href="/messages">` with Next.js `<Link href="/messages">` for the floating chat button.

### IN-02: Using `<a>` instead of `<Link>`

**Files modified:** `src/components/dashboard/RecentCases.tsx`
**Commit:** 58c901a
**Applied fix:** Replaced all `<a href="...">` tags with Next.js `<Link href="...">`:
- Line 35: See All link to `/requests`
- Line 73: Open link to `/requests/${c.id}`

### IN-03: Unvalidated input in formatFileSize

**Files modified:** `src/components/dashboard/RecentDocuments.tsx`
**Commit:** 58c901a
**Applied fix:** Added validation `if (typeof bytes !== 'number' || bytes < 0) return '0 B';` at the start of `formatFileSize` function.

### IN-04: API error response ambiguous

**Files modified:** `src/app/api/messages/unread-count/route.ts`
**Commit:** 58c901a
**Applied fix:** Added descriptive error message `{ unreadCount: 0, error: 'Failed to fetch unread message count. Please try again.' }` in the catch block.

## Skipped Issues

None - all findings were fixed.

---

_Fixed: 2026-06-21T15:45:00.000Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
