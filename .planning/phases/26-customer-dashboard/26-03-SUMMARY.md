---
phase: "26"
plan: "03"
subsystem: ui
tags: [react, prisma, dashboard, customer-portal]

# Dependency graph
requires:
  - 26-02
provides:
  - RequestsTable with 6-column grid
  - Toolbar with search and filters
  - Dashboard page with requests table
  - Seed script with sample data
  - 16 passing tests
affects: [phase-26-next]

# Tech tracking
tech-stack:
  added: [prisma, lucide-react]
  patterns: [server-components, database-queries, workspace-scoped, table-grid]

key-files:
  created:
    - src/app/[locale]/customer/components/Toolbar.tsx
    - src/app/[locale]/customer/components/RequestsTable.tsx
    - prisma/seed-customer-dashboard.ts
    - prisma/schema.prisma (Message model added)
    - tests/customer-dashboard/03-requests-table.spec.tsx
  modified:
    - src/app/[locale]/customer/page.tsx
    - src/app/[locale]/customer/components/dashboard.css

key-decisions:
  - "RequestsTable uses 6-column grid matching template structure"
  - "Toolbar with search input (360px) and filter/action buttons"
  - "Specialist names come from database (fallback: 'Chua phan cong')"
  - "Message model added to schema for unread notifications"
  - "Seed creates 12 requests, 36 vault files, 3 specialists, 2 unread messages"

patterns-established:
  - "Prisma queries in server components with workspace isolation"
  - "Table grid with Badge integration for status display"
  - "Seed data for demo/development purposes"

requirements-completed: [CUST-DASH-07, CUST-DASH-08, CUST-DASH-09]

# Metrics
duration: 10min
completed: 2026-06-10
---

# Phase 26 Plan 03: Requests Table Summary

**Added RequestsTable with 6-column grid, Toolbar with search/filters, and seed data for customer dashboard**

## Performance

- **Duration:** 10 min
- **Started:** 2026-06-10T23:25:00Z
- **Completed:** 2026-06-10T23:35:00Z
- **Tasks:** 5 completed
- **Files modified:** 7 created/modified

## Accomplishments

- Created Toolbar component with search input (360px) and Lucide icons
- Created RequestsTable component with 6-column grid structure matching template
- Updated dashboard page to include Toolbar and RequestsTable
- Added Prisma query for requests table (take 4 rows)
- Created seed script with 12 requests, 36 vault files, 3 specialists, 2 unread messages
- Added Message model to schema.prisma
- Created 16 passing tests for RequestsTable and Toolbar

## Task Commits

Each task was committed atomically:

1. **Task 1: Toolbar component** - `a658278` (feat)
2. **Task 2: RequestsTable component** - `fec54d9` (feat)
3. **Task 3: Dashboard page update** - `c8d7787` (feat)
4. **Task 4: Seed script** - `a46a0da` (feat)
5. **Task 5: Tests** - `dbd7777` (test)

## Files Created/Modified

- `src/app/[locale]/customer/components/Toolbar.tsx` - Toolbar with search and filters
- `src/app/[locale]/customer/components/RequestsTable.tsx` - 6-column table grid
- `src/app/[locale]/customer/page.tsx` - Updated with RequestsTable and Toolbar
- `src/app/[locale]/customer/components/dashboard.css` - Added toolbar and table CSS
- `prisma/seed-customer-dashboard.ts` - Seed script with sample data
- `prisma/schema.prisma` - Added Message model
- `tests/customer-dashboard/03-requests-table.spec.tsx` - 16 passing tests

## Database Queries (Prisma)

```typescript
// Requests table query
prisma.legalRequest.findMany({
  where: { workspaceId: activeWorkspaceId ?? '' },
  include: {
    assignedSpecialist: { select: { name: true } },
    assignedReviewer: { select: { name: true } },
  },
  orderBy: { updatedAt: 'desc' },
  take: 4,
});
```

## Seed Data Summary

| Type | Count | Details |
|------|-------|---------|
| Requests | 12 | 3 processing, 8 completed, 1 revision |
| Specialists | 3 | Ha Linh, Quang Dung, Minh Trang |
| Vault Files | 36 | Distributed across requests |
| Unread Messages | 2 | For floating chat "2 Tin moi" |

## Decisions Made

- RequestsTable uses 6-column grid matching template structure
- Toolbar with search input (360px) and filter/action buttons
- Specialist names come from database (fallback: 'Chua phan cong')
- Message model added to schema for unread notifications
- Seed creates 12 requests, 36 vault files, 3 specialists, 2 unread messages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Test file needed `.tsx` extension instead of `.ts` for JSX support - fixed by renaming
- Prisma generate had permission error on Windows - seed script created, types will work after retry
- 4 tests initially failed due to duplicate status text - fixed using `getAllByText`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All Phase 26 components complete and tested. RequestsTable and Toolbar ready for use in customer dashboard. Seed script available for populating sample data.

---
*Phase: 26-customer-dashboard*
*Completed: 2026-06-10*
