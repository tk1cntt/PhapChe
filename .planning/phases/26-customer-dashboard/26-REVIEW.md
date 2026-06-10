---
phase: 26-customer-dashboard
reviewed: 2026-06-10T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - src/app/[locale]/customer/components/dashboard.css
  - src/app/[locale]/customer/components/UserLayout.tsx
  - src/app/[locale]/customer/components/Badge.tsx
  - src/app/[locale]/customer/components/ProgressBar.tsx
  - src/app/[locale]/customer/components/StatCard.tsx
  - src/app/[locale]/customer/components/WelcomeCard.tsx
  - tests/customer-dashboard/01-components.spec.tsx
  - tests/setup.ts
  - vitest.config.ts
  - src/app/[locale]/customer/components/CaseListPanel.tsx
  - src/app/[locale]/customer/components/DeadlinePanel.tsx
  - src/app/[locale]/customer/components/DocumentPanel.tsx
  - src/app/[locale]/customer/components/ActivityTimeline.tsx
  - src/app/[locale]/customer/components/FloatingChatButton.tsx
  - src/app/[locale]/customer/page.tsx
  - tests/customer-dashboard/02-panels.spec.tsx
  - src/app/[locale]/customer/components/Toolbar.tsx
  - src/app/[locale]/customer/components/RequestsTable.tsx
  - prisma/seed-customer-dashboard.ts
  - tests/customer-dashboard/03-requests-table.spec.tsx
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 26: Code Review Report

**Reviewed:** 2026-06-10
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Reviewed all 20 source files in the customer dashboard phase including React components, CSS styles, test files, and seed script. The codebase follows good practices with server-side data fetching, proper workspace scoping, and comprehensive test coverage. However, several areas need attention:

- 3 warnings related to potential logic issues and type safety
- 5 info-level findings for code quality improvements
- No critical security vulnerabilities found (workspace scoping is correctly implemented)

## Warnings

### WR-01: Potential null/undefined workspace membership access

**File:** `src/app/[locale]/customer/page.tsx:31`
**Issue:** The code uses optional chaining `user?.memberships[0]?.workspace` but this pattern has a subtle issue. If `memberships` is an empty array `[]`, then `user?.memberships[0]` returns `undefined` (not null), but the optional chaining continues to check `?.workspace`, resulting in `undefined`. The subsequent `workspaceName ?? 'Workspace'` fallback is correct, but this pattern could mask legitimate data issues.

**Fix:**
```typescript
const workspace = user?.memberships?.[0]?.workspace;
```

### WR-02: Toolbar filter buttons are non-functional

**File:** `src/app/[locale]/customer/components/Toolbar.tsx:24-42`
**Issue:** The "Bo loc" (Filter), "Trang thai" (Status), "Lam moi" (Refresh), "Export", and "Cot hien thi" (Columns) buttons have no click handlers. The component accepts `onSearch` and `onFilterChange` callbacks, but only the search input uses `onSearch`. All other buttons are clickable but do nothing, which could confuse users.

**Fix:** Either implement the callbacks or add disabled state to non-functional buttons:
```typescript
<button className="tool-btn" disabled>
  <SlidersHorizontal size={18} />
  Bo loc
</button>
```

### WR-03: FloatingChatButton lacks onClick handler

**File:** `src/app/[locale]/customer/components/FloatingChatButton.tsx:10-27`
**Issue:** The floating chat button displays a notification count but has no `onClick` handler. Clicking the button does nothing - it should navigate to the messages page or open a chat interface.

**Fix:**
```typescript
export function FloatingChatButton({
  notificationCount,
  notificationText = 'Tin moi',
  onClick
}: FloatingChatButtonProps): JSX.Element {
  if (notificationCount <= 0) {
    return null;
  }

  return (
    <button
      className="floating-chat-btn"
      onClick={onClick}
      aria-label={`${notificationCount} ${notificationText}`}
    >
      ...
    </button>
  );
}
```

## Info

### IN-01: Duplicate CSS class definition

**File:** `src/app/[locale]/customer/components/dashboard.css:708 and 1083`
**Issue:** The `.action-link` class is defined twice in the CSS file (lines 708-722 and 1083-1092). The second definition overrides the first with slightly different properties (font-weight: 800 vs 700, color: var(--teal) vs var(--blue)).

**Fix:** Remove the duplicate and consolidate into a single definition:
```css
.action-link {
  font-size: 14px;
  font-weight: 700;
  color: var(--blue);
  text-decoration: none;
}

.action-link:hover {
  text-decoration: underline;
}
```

### IN-02: Duplicate local BadgeProps type

**File:** `src/app/[locale]/customer/components/CaseListPanel.tsx:46-49`, `src/app/[locale]/customer/components/DocumentPanel.tsx:54-57`, `src/app/[locale]/customer/components/RequestsTable.tsx:39-42`
**Issue:** The `BadgeProps` type is locally redefined in 3 components instead of being imported from the Badge component. This creates code duplication and potential inconsistency.

**Fix:** Export the BadgeProps type from Badge.tsx and import it:
```typescript
// Badge.tsx
export interface BadgeProps {
  variant: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  children: React.ReactNode;
}

// CaseListPanel.tsx
import { Badge, BadgeProps } from './Badge';
```

### IN-03: Hardcoded strings without i18n

**File:** `src/app/[locale]/customer/components/UserLayout.tsx:102, 115`, `src/app/[locale]/customer/components/Toolbar.tsx:26, 29`
**Issue:** Several UI strings are hardcoded in English ("Customer Portal", "EN", "Bo loc", "Trang thai", "Lam moi", "Export", "Cot hien thi") while other strings use Vietnamese. This creates inconsistency.

**Fix:** Extract strings to a translations file or use Next.js i18n pattern consistently.

### IN-04: Search input in UserLayout is uncontrolled

**File:** `src/app/[locale]/customer/components/UserLayout.tsx:110`
**Issue:** The search input at line 110 has no `value` or `onChange` handler. This means:
- The input cannot be controlled
- No search functionality is implemented
- Users can type but nothing happens

**Fix:** Either implement search functionality with proper state management or remove the input if not needed:
```typescript
const [searchQuery, setSearchQuery] = useState('');
<input
  type="text"
  placeholder="Search..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
```

### IN-05: Missing loading/error states

**File:** `src/app/[locale]/customer/page.tsx:15-223`
**Issue:** This is a Server Component that fetches data but has no loading.tsx or error.tsx sibling file for Next.js to show during data fetching. If the database is slow or fails, users see a blank page or error.

**Fix:** Add `loading.tsx` and `error.tsx` in the same directory:
```typescript
// loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
```

---

_Reviewed: 2026-06-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
