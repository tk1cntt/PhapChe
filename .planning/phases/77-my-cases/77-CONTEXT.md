# Phase 77: My Cases - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

## Phase Boundary

Users can view, search, filter, and navigate their legal cases with real data from the database.

## Requirements (locked via SPEC.md)

**9 requirements are locked.** See `77-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `77-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Server-side data fetching (Prisma queries) — already done in page.tsx
- Client-side filtering and pagination — existing implementation
- Stat card display with accurate counts
- Search and filter functionality
- Table with 7 columns and navigation links
- Empty state when no results

**Out of scope (from SPEC.md):**
- Moving to API-based filtering — client-side filtering kept for MVP
- Real-time updates (SSE/WebSocket) — separate feature
- Bulk actions (select multiple, batch update) — Phase 84
- Export to CSV/PDF — Phase 87
- Case detail page — separate phase

## Implementation Decisions

### Stat Cards Behavior
- **D-01:** Stat cards are NOT clickable — display-only with accurate counts
- **D-02:** Stat card colors: blue (total), orange (processing), green (completed), red (overdue)

### Type Filter
- **D-03:** Type filter `selectedType` state exists but is not wired to filtering logic
- **D-04:** Implement type filter to filter by matterType from intakeSubmission

### Empty State
- **D-05:** Empty state shows: "Không có hồ sơ nào phù hợp với bộ lọc" when no results match

### Table Navigation
- **D-06:** Clicking "View →" link navigates to `/cases/{id}`
- **D-07:** Table row is NOT clickable — only the action link navigates

### Search Behavior
- **D-08:** Search filters by `code` and `type` (case-insensitive)
- **D-09:** Debounce search input with 300ms delay before filtering

### Pagination
- **D-10:** Page size: 10 items per page
- **D-11:** Use existing `Paging` component from `@/components/ui/Paging`

### Loading & Error States
- **D-12:** Server fetches data — no client-side loading state needed for initial load
- **D-13:** Empty state when `filteredRequests.length === 0`

## Existing Code Insights

### Reusable Assets
- `src/components/my-cases/MyCasesClient.tsx` — existing client component with search/filter state
- `src/components/my-cases/MyCasesTable.tsx` — existing table with pagination
- `src/components/my-cases/StatCard.tsx` — existing stat card component
- `src/components/my-cases/SummaryBanner.tsx` — existing banner component
- `src/components/ui/Paging.tsx` — existing pagination component
- `src/components/my-cases/my-cases.css` — existing CSS with teal primary #087f78

### Established Patterns
- Server component pattern: page.tsx fetches data, passes to client component
- Client-side filtering on pre-fetched data array
- i18n keys in `UserCases.*` namespace

### Integration Points
- `page.tsx` → `MyCasesClient` props: `stats`, `requests`, `totalRequests`
- `MyCasesClient` → `MyCasesTable` props: `filteredRequests`, `totalRequests`
- CSS uses custom properties: `--teal: #087f78`

## Specific Ideas

No specific requirements — open to standard approaches following existing patterns.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/ROADMAP.md` §Phase 77 — My Cases phase definition
- `.planning/phases/77-my-cases/77-SPEC.md` — Locked requirements (REQUIRED)

### Architecture
- `src/docs/SERVICE_LAYER.md` — Service layer patterns
- `src/docs/FORM_DEFINITION.md` — Dynamic form patterns (for future phases)

### UI Patterns
- `src/docs/DOMAIN_STRUCTURE.md` — Component granularity levels
- `src/components/COMPONENT_REGISTRY.md` — Shared components catalog

---

*Phase: 77-my-cases*
*Context gathered: 2026-06-21*
