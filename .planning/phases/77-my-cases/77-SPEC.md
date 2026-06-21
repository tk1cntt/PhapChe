# Phase 77: My Cases — Specification

**Created:** 2026-06-21
**Ambiguity score:** 0.12
**Requirements:** 9 locked

## Goal

Users can view, search, filter, and navigate their legal cases with real data from the database.

## Background

The `/cases` page currently fetches all data server-side and passes to `MyCasesClient.tsx`. The client performs client-side filtering on the pre-fetched data. This works but doesn't scale well for large datasets. The page has existing UI components (StatCard, MyCasesTable, MyCasesToolbar) that need verification and enhancement.

**Current state:**
- Server page fetches all requests from Prisma, transforms data, passes to client
- `MyCasesClient` does client-side filter on `requests` prop array
- `MyCasesTable` has pagination (client-side slice, 10 items/page)
- API `/api/requests` exists but uses `skip/take` pagination, no search/status/type filter params

**Gap:**
- Client-side filtering doesn't scale with large datasets
- API needs search, status, type, priority filter params
- Stat cards should link to filtered views
- CSS already exists but needs verification

## Requirements

1. **Summary Banner**: Display total cases count from server data
   - Current: SummaryBanner component exists, receives stats from server
   - Target: Banner shows accurate count from Prisma query
   - Acceptance: Banner renders with correct total from database

2. **Stat Cards with Counts**: Show Tổng, Đang xử lý, Hoàn tất, Quá hạn counts
   - Current: 4 stat cards exist in StatCard.tsx
   - Target: Cards show accurate counts from server (total, processing, completed, overdue)
   - Acceptance: Stats match database counts (verified via Prisma query)

3. **Search Filter**: Filter cases by code or type via search input
   - Current: Client filters `requests` prop array by `searchQuery` state
   - Target: Search input updates `searchQuery`, filters displayed results
   - Acceptance: Typing "REQ-001" shows only matching case; clearing shows all

4. **Status Filter**: Filter by case status via dropdown
   - Current: `selectedStatus` state exists, filters by `statusBadge` field
   - Target: Dropdown filters by under_review/needs_response/approved/overdue/submitted
   - Acceptance: Selecting "overdue" shows only cases with overdue status badge

5. **Type Filter**: Filter by case type (MatterType)
   - Current: `selectedType` state exists but not used in filtering
   - Target: Type dropdown filters by matterType
   - Acceptance: Selecting a type shows only matching cases

6. **Table Display**: 7 columns (code, type, status, priority, assignee, SLA, actions)
   - Current: MyCasesTable renders 7 columns
   - Target: All columns display correct data from server
   - Acceptance: Each row shows code, type, status badge, specialist, updated date, SLA badge, action link

7. **Case Navigation**: Clicking case navigates to detail page
   - Current: `actionHref` points to `/cases/${id}`, rendered as `<a>` tag
   - Target: Clicking row or "View →" link navigates to case detail
   - Acceptance: Clicking any case row navigates to `/cases/{id}`

8. **Pagination**: Table pagination with page size 10
   - Current: MyCasesTable has `current`, `pageSize` state, uses `slice()` for pagination
   - Target: Paging component shows correct page info, Previous/Next buttons work
   - Acceptance: With 25+ cases, page 1 shows 10, page 2 shows 10, page 3 shows 5

9. **Empty State**: Show message when no cases match filter
   - Current: `requests.length === 0` shows empty state div
   - Target: Empty state message displays when filtered results are empty
   - Acceptance: After filtering to non-existent case, empty state shows

## Boundaries

**In scope:**
- Server-side data fetching (Prisma queries) — already done in page.tsx
- Client-side filtering and pagination — existing implementation
- Stat card display with accurate counts
- Search and filter functionality
- Table with 7 columns and navigation links
- Empty state when no results

**Out of scope:**
- Moving to API-based filtering — client-side filtering kept for MVP
- Real-time updates (SSE/WebSocket) — separate feature
- Bulk actions (select multiple, batch update) — Phase 84
- Export to CSV/PDF — Phase 87
- Case detail page — separate phase

## Constraints

- Must use existing server-side data fetching pattern (no client re-fetch)
- CSS must use existing `my-cases.css` with teal primary #087f78
- i18n keys must follow `UserCases.*` namespace
- Pagination must use existing `Paging` component

## Acceptance Criteria

- [ ] Summary banner shows total count from Prisma query
- [ ] 4 stat cards display Tổng, Đang xử lý, Hoàn tất, Quá hạn counts
- [ ] Search input filters cases by code or type
- [ ] Status dropdown filters by under_review/needs_response/approved/overdue/submitted
- [ ] Type dropdown filters by matterType
- [ ] Table shows 7 columns: code, type, status, assignee, updated date, SLA, actions
- [ ] Clicking case row navigates to `/cases/{id}`
- [ ] Pagination shows correct page info with 10 items per page
- [ ] Empty state displays when no cases match current filter
- [ ] All strings use i18n keys from UserCases namespace

## Edge Coverage

**Coverage:** 0/0 applicable edges resolved · 0 unresolved

No applicable edges identified — all requirements are straightforward display/filter operations.

## Prohibitions (must-NOT)

**Coverage:** 1/1 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification |
|----------------------------------|-------------|--------|--------------|
| MUST NOT show real PII in debug logs | All | ✅ resolved | No console.log with user data; audit logs only capture IDs |

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                            |
|--------------------|-------|------|--------|----------------------------------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | View/search/filter/navigate cases|
| Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit in/out scope            |
| Constraint Clarity | 0.85  | 0.65 | ✓      | Existing patterns, teal CSS      |
| Acceptance Criteria| 0.85  | 0.70 | ✓      | 10 pass/fail criteria           |
| **Ambiguity**      | 0.12  | ≤0.20| ✓      |                                  |

Status: ✓ = met minimum

## Interview Log

| Round | Perspective    | Question summary                    | Decision locked                      |
|-------|----------------|-------------------------------------|--------------------------------------|
| 1     | Researcher     | What exists in My Cases today?      | Server fetch, client filter, table  |
| 2     | Simplifier     | Minimum viable scope?               | Keep client-side filter, enhance UI |
| 3     | Boundary Keeper| What's NOT this phase?              | API refactor, bulk actions excluded |

---

*Phase: 77-my-cases*
*Spec created: 2026-06-21*
*Next step: /gsd-discuss-phase 77 — implementation decisions (clickable stat cards, filter UX)*
