---
phase: 46-admin-dashboard
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/components/admin/AdminStatCard.tsx
  - src/components/admin/AdminBanner.tsx
  - src/components/admin/WorkloadPanel.tsx
  - src/components/admin/AlertPanel.tsx
  - src/components/admin/WorkspacePanel.tsx
  - src/components/admin/ApprovalPanel.tsx
  - src/components/admin/AuditTimeline.tsx
  - src/components/admin/AdminToolbar.tsx
  - src/components/admin/AdminRequestsTable.tsx
  - src/components/admin/AdminDashboardClient.tsx
  - src/components/admin/admin.css
  - src/components/admin/index.ts
  - src/app/[locale]/admin/page.tsx
findings:
  critical: 1
  warning: 8
  info: 5
  total: 14
status: issues_found
---

# Phase 46: Code Review Report

**Reviewed:** 2026-06-13
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed Admin Dashboard implementation with 13 files. Found 1 critical issue (hardcoded mock data violates project constraint), 8 warnings (accessibility, logic errors, dead UI), and 5 info-level issues. The implementation demonstrates good TypeScript typing and component structure but contains data sourcing violations and UI functionality gaps that need addressing.

## Critical Issues

### CR-01: Hardcoded mock data violates project constraint

**File:** `src/app/[locale]/admin/page.tsx:294-327`
**Issue:** `alertData` is hardcoded mock data instead of being sourced from the database. The project constraint explicitly states: "Tat ca du lieu deu phai duoc lay tu insert vao db va lay ra hien thi tu db. Khong duoc phep hardcode bat ky data nao." (All data must be from database insert/display). This alert panel shows hardcoded "Quet kho tai lieu hoan tat" and "96% tep co workspace scope" which is fabricated data.

**Fix:**
```typescript
// Replace hardcoded alertData with real database queries
const realAlertsFromDb = await prisma.auditEvent.findMany({
  where: {
    severity: 'high',
    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  },
  orderBy: { createdAt: 'desc' },
  take: 4,
});

// Transform to alertData format
const alertData = realAlertsFromDb.map(alert => ({
  icon: alert.action[0]?.toUpperCase() || '!',
  iconColor: 'red' as const,
  title: alert.title || `${alert.action}`,
  description: alert.metadataSummary || alert.description,
  badge: alert.severity?.toUpperCase() || 'ALERT',
  badgeColor: 'red' as const,
}));
```

## Warnings

### WR-01: Incorrect logic for invited users count

**File:** `src/app/[locale]/admin/page.tsx:33`
**Issue:** The query `prisma.user.count({ where: { emailVerified: false } })` is used to count "invited" users. However, `emailVerified: false` means email NOT verified - which is the OPPOSITE of "invited". A user with `emailVerified: false` could be a user who signed up but never verified, not an invited pending user.

**Fix:**
```typescript
// Option 1: If invitation tracking exists
invitedUsers: prisma.user.count({ where: { invitationSentAt: { not: null }, emailVerified: false } }),

// Option 2: Or add a separate invitedAt field
invitedUsers: prisma.user.count({ where: { invitedAt: { not: null }, emailVerified: false } }),
```

### WR-02: Dead anchor links with `href="#"`

**File:** `src/components/admin/WorkloadPanel.tsx:57-61`
**File:** `src/components/admin/AdminRequestsTable.tsx:242-247`
**Issue:** Multiple `<a href="#">` links cause page jump to top on click. These are dead links with no actual navigation. This creates poor UX and accessibility issues for keyboard users.

**Fix:**
```typescript
// Option 1: Use button element if no navigation
<button
  className="text-sm font-semibold text-teal-600 hover:text-teal-700"
  onClick={onViewDetail}
>
  Xem chi tiet ->
</button>

// Option 2: Use Next.js Link for actual navigation
import Link from 'next/link';
<Link href="/admin/workload-details" className="text-sm font-semibold text-teal-600">
  Xem chi tiet ->
</Link>
```

### WR-03: Table lacks semantic HTML structure

**File:** `src/components/admin/AdminRequestsTable.tsx:130-251`
**Issue:** The table uses `<div>` elements with grid classes instead of proper `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` elements. This violates accessibility best practices - screen readers cannot properly announce table structure for div-based tables.

**Fix:**
```typescript
<table className="w-full bg-white border rounded-[15px] overflow-hidden" style={{...}}>
  <thead>
    <tr className="border-b" style={{ background: 'linear-gradient(180deg, #f8fafc, #f5f7fb)' }}>
      {headers.map((header, i) => (
        <th key={i} className="px-4 py-3 text-left text-[#59687e] text-sm font-bold border-r last:border-0">
          {header}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {rows.map((row, rowIndex) => (
      <tr key={rowIndex} className="border-b hover:bg-slate-50/50">
        {/* td elements */}
      </tr>
    ))}
  </tbody>
</table>
```

### WR-04: Dead UI buttons with no functionality

**File:** `src/components/admin/AdminToolbar.tsx:91-124`
**Issue:** Status and Workspace dropdown buttons have no `onClick` handlers. These are non-functional UI elements that provide no value to users.

**Fix:**
```typescript
// Add onClick handlers or remove buttons
<button
  onClick={onStatusFilter}
  className="h-11 border rounded-lg px-4 flex items-center gap-2.5 text-[#1e293b] text-sm font-bold bg-white cursor-pointer"
>
  {t.status}
  <svg>...</svg>
</button>
```

### WR-05: Icon prop type mismatch

**File:** `src/components/admin/AlertPanel.tsx:6`
**File:** `src/components/admin/ApprovalPanel.tsx:6`
**Issue:** `icon: string` prop type means users can pass any string. The component expects emoji or single character icons (rendered as text inside a circle), but TypeScript allows any string. Additionally, `WorkspacePanel` has `badgeColorStyles` that only maps `green` and `blue`, but the type allows `orange` which would result in undefined styling.

**Fix:**
```typescript
// Restrict to single character or emoji
icon: string;  // Add JSDoc: @description Single character or emoji icon

// Fix WorkspacePanel missing 'orange' mapping
const badgeColorStyles = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",  // Add this
};
```

### WR-06: SLA calculation can produce negative hours

**File:** `src/app/[locale]/admin/page.tsx:270-273`
**Issue:** When `hoursLeft` is negative (overdue request), the condition `hoursLeft < 0` is checked but the math could still produce unexpected results if `slaDeadline` is in the past by more than 1 day.

**Fix:**
```typescript
if (!req.slaDeadline) {
  slaText = 'Closed';
} else {
  const hoursLeft = Math.floor((req.slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60));
  if (hoursLeft < 0) {
    const daysOverdue = Math.abs(Math.floor(hoursLeft / 24));
    slaText = daysOverdue > 0 ? `Qua ${daysOverdue} ngay` : 'Qua han';
  } else if (hoursLeft === 0) {
    slaText = 'Sap het han';
  } else {
    slaText = `Con ${hoursLeft}h`;
  }
}
```

### WR-07: Non-functional button callbacks

**File:** `src/components/admin/AdminDashboardClient.tsx:203-206`
**Issue:** `onSearch`, `onFilter`, `onExport`, and `onRefresh` callbacks only `console.log` without actual implementation. These are placeholder handlers.

**Fix:** Either implement real functionality or remove from prop interface until implemented:
```typescript
// Temporary: Remove or document as unimplemented
// These will be implemented in future phase
```

### WR-08: stats.openRequests passed but never displayed

**File:** `src/components/admin/AdminDashboardClient.tsx:20`
**File:** `src/app/[locale]/admin/page.tsx:180`
**Issue:** `stats.openRequests` is computed from database and passed to client component, but the AdminStatCard only displays 4 stats (users, workspaces, nearSla, auditAlerts). The `openRequests` data is never rendered, making the query wasteful.

**Fix:** Either add a 5th stat card for openRequests, or remove the query if not needed:
```typescript
// In page.tsx, remove from Promise.all if not displayed:
openRequests,  // Remove this line

// Or add 5th stat card in AdminDashboardClient
<AdminStatCard
  variant="purple"
  title={t.statOpenRequests}
  value={String(stats.openRequests)}
  description={t.statOpenRequestsDesc}
  icon={<FileText className="h-10 w-10" />}
/>
```

## Info

### IN-01: Using array index as React key

**File:** `src/components/admin/WorkloadPanel.tsx:70`
**File:** `src/components/admin/AlertPanel.tsx:64`
**File:** `src/components/admin/WorkspacePanel.tsx:61`
**File:** `src/components/admin/ApprovalPanel.tsx:62`
**File:** `src/components/admin/AuditTimeline.tsx:64`
**File:** `src/components/admin/AdminRequestsTable.tsx:162`
**Issue:** Using `key={index}` is acceptable for static lists but not recommended for dynamic data. Consider using unique IDs when available.

**Fix:** Use unique identifiers when available:
```typescript
specialists.map((spec) => <WorkloadItem key={spec.id || spec.name} {...spec} />)
```

### IN-02: Default mock data in components

**File:** `src/components/admin/AuditTimeline.tsx:13-29`
**File:** `src/components/admin/AdminRequestsTable.tsx:23-99`
**Issue:** Components have `defaultEntries` and `defaultRows` with hardcoded mock data. While these are used as fallback defaults (acceptable pattern), ensure they are replaced with real data in production use.

### IN-03: CSS classes defined but not used

**File:** `src/components/admin/admin.css`
**Issue:** The CSS file defines many classes (`.admin-panel`, `.workload-item`, `.alert-item`, etc.) but the components use inline `className` and `style` attributes instead. This CSS file appears unused.

**Fix:** Either use the CSS classes or remove unused CSS to reduce bundle size.

### IN-04: Unused imports

**File:** `src/components/admin/AdminDashboardClient.tsx:12`
**Issue:** `AlertTriangle` is imported from lucide-react but `AlertPanel` icon prop expects a string, not a React component. The icon is not used in this component.

### IN-05: Type assertion in status color mapping

**File:** `src/app/[locale]/admin/page.tsx:205`
**Issue:** Type assertion `iconColor: 'green' | 'blue' | 'orange'` uses string checks that may not be maintainable. Consider making this more robust.

**Fix:**
```typescript
const iconColorMap: Record<string, 'green' | 'blue' | 'orange'> = {
  internal: 'orange',
  noi: 'orange',
  minh: 'blue',
};
const iconColor = iconColorMap[ws.slug] || 'green';
```

---

_Reviewed: 2026-06-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
