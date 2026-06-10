# Roadmap: Legal-as-a-Service Platform

**Last updated:** 2026-06-10
**Current milestone:** v1.2 UI/UX Improvements

## Milestones

- [x] **v1.0 MVP** — Phases 01-14, 49 plans, 70 tasks (shipped 2026-06-05)
- [x] **v1.1 Auth & Hardening** — Phases 15-22, 18 plans, 23 tasks (shipped 2026-06-10)
- [ ] **v1.2 UI/UX Improvements** — Phases 23-25 (planning)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 01-14) — SHIPPED 2026-06-05</summary>

- [x] Phase 01: foundation (4/4 plans) — completed 2026-06-01
- [x] Phase 02: intake (4/4 plans) — completed 2026-06-01
- [x] Phase 03: routing (5/5 plans) — completed 2026-06-01
- [x] Phase 04: documents-vault (4/4 plans) — completed 2026-06-01
- [x] Phase 05: review (3/3 plans) — completed 2026-06-01
- [x] Phase 06: delivery (6/6 plans) — completed 2026-06-01
- [x] Phase 07: ops (4/4 plans) — completed 2026-06-01
- [x] Phase 08: reviewer-service (2/2 plans) — completed 2026-06-03
- [x] Phase 09: folder-tag (2/2 plans) — completed 2026-06-03
- [x] Phase 10: ux-hardening (1/1 plan) — completed 2026-06-03
- [x] Phase 11: wire-review-init (1/1 plans) — completed 2026-06-04
- [x] Phase 12: ops-sla-drill-in (1/1 plans) — completed 2026-06-05
- [x] Phase 13: service-cleanup-wiring (3/3 plans) — completed 2026-06-05
- [x] Phase 14: antd-layout-redesign (9/9 plans) — completed 2026-06-05

</details>

<details>
<summary>✅ v1.1 Auth & Hardening (Phases 15-22) — SHIPPED 2026-06-10</summary>

- [x] Phase 15: auth (3/3 plans) — completed 2026-06-05
- [x] Phase 16: fix-14-failed-routes (3/3 plans) — completed 2026-06-07
- [x] Phase 17: fix-remaining-routes (5/5 plans) — completed 2026-06-08
- [x] Phase 18: ui-test-cases (3/3 plans) — completed 2026-06-08
- [x] Phase 19: customer-dashboard (1/1 plans) — completed 2026-06-08
- [x] Phase 20: internationalization (1/1 plans) — completed 2026-06-09
- [x] Phase 21: gap-validation (1/1 plans) — completed 2026-06-09
- [x] Phase 22: tech-debt-cleanup (1/1 plans) — completed 2026-06-10

</details>

<details>
<summary>🚧 v1.2 UI/UX Improvements (Phases 23-25) — Planning</summary>

- [x] Phase 23: quick-wins — Error boundaries + Skeleton templates
- [ ] Phase 24: tanstack-query — TanStack Query setup + migration
- [ ] Phase 25: pagination-search — Tables pagination + search/filter

</details>

## Phase Details

### Phase 23: Quick Wins

**Goal:** Admin pages display skeleton loading screens and catch errors gracefully with retry capability.

**Depends on:** Nothing (foundation work)

**Requirements:** ERR-01, ERR-02, ERR-03, ERR-04, LOAD-01, LOAD-02, LOAD-03, LOAD-04

**Success Criteria** (what must be TRUE):

1. Each admin page is wrapped in an Error Boundary that catches React rendering errors
2. Error fallback displays clear error message with Retry button that reloads the page
3. All errors are logged to console with stack trace for debugging
4. Shared `<ErrorFallback />` component is used across all admin pages (no duplicate implementations)
5. Admin pages display `<PageSkeleton />` matching table layout during initial data fetch
6. Card-based pages display `<CardSkeleton />` component
7. Skeleton components are reusable — imported from shared location, not hard-coded per page

**Plans:** 1/1 plans complete

Plans:
- [x] 23-01-PLAN.md — Shared ErrorFallback and Skeleton components + integration into admin pages

**UI hint:** yes

---

### Phase 24: TanStack Query

**Goal:** TanStack Query v5 integrated for caching, deduplication, and improved data fetching patterns.

**Depends on:** Phase 23

**Requirements:** DATA-01, DATA-02, DATA-03, DATA-04, DATA-05

**Success Criteria** (what must be TRUE):

1. `@tanstack/react-query@5` installed and working in the project
2. `<QueryClientProvider>` added to app layout with proper configuration
3. Query key convention established: `['entity', workspaceId?, options]` format used consistently
4. React Query devtools panel visible in development mode, completely hidden in production
5. Cache configured with staleTime: 30s and gcTime: 5min

**Plans:** 1/1

Plans:
- [ ] 24-01-PLAN.md — TanStack Query v5 setup and configuration

**UI hint:** yes

---

### Phase 25: Pagination & Search

**Goal:** Tables support server-side pagination and users can search/filter data with URL persistence.

**Depends on:** Phase 24

**Requirements:** PAGE-01, PAGE-02, PAGE-03, SCH-01, SCH-02, SCH-03, SCH-04

**Success Criteria** (what must be TRUE):

1. Tables (requests, users, audit) display pagination controls with page sizes: 10, 25, 50
2. Current page number persists in URL query params (e.g., `?page=2&pageSize=25`)
3. Pagination fetches only requested page from server (server-side, not client-side)
4. Global search bar visible in admin header triggers search across entities
5. Column filters available in table headers for filtering specific columns
6. Search input debounces by 300ms before triggering query
7. Search and filter state persists in URL params (shareable/bookmarkable URLs)

**Plans:** Not planned yet

**UI hint:** yes

---

## v1.2 Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 23. Quick Wins | 1/1 | Complete    | 2026-06-10 |
| 24. TanStack Query | 0/1 | Not started | - |
| 25. Pagination & Search | 0/1 | Not started | - |

## v1.2 Requirement Coverage

| Requirement | Phase | Description |
|-------------|-------|-------------|
| ERR-01 | Phase 23 | Each admin page wrapped in Error Boundary |
| ERR-02 | Phase 23 | Error fallback displays error message + Retry button |
| ERR-03 | Phase 23 | Errors logged to console for debugging |
| ERR-04 | Phase 23 | Shared ErrorFallback component used across all pages |
| LOAD-01 | Phase 23 | Admin pages display skeleton loading screens during data fetch |
| LOAD-02 | Phase 23 | PageSkeleton component matches table layout structure |
| LOAD-03 | Phase 23 | CardSkeleton component for card-based content |
| LOAD-04 | Phase 23 | Skeleton components reusable across all admin pages |
| DATA-01 | Phase 24 | TanStack Query v5 installed and configured |
| DATA-02 | Phase 24 | QueryClientProvider added to app layout |
| DATA-03 | Phase 24 | Query key convention established |
| DATA-04 | Phase 24 | React Query devtools enabled in development only |
| DATA-05 | Phase 24 | Cache configuration: staleTime 30s, gcTime 5min |
| PAGE-01 | Phase 25 | Tables support pagination with page sizes: 10, 25, 50 |
| PAGE-02 | Phase 25 | Page state synced to URL query params |
| PAGE-03 | Phase 25 | Server-side pagination for requests, users, audit tables |
| SCH-01 | Phase 25 | Global search bar in admin header |
| SCH-02 | Phase 25 | Column filters in table headers |
| SCH-03 | Phase 25 | Debounced search: 300ms delay |
| SCH-04 | Phase 25 | Search state persisted in URL params |

**Coverage:** 20/20 requirements mapped

---

## Archive

Full milestone details: `.planning/milestones/v1.0-ROADMAP.md`
Requirements archive: `.planning/milestones/v1.0-REQUIREMENTS.md`
Milestone audit: `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
v1.1 details: `.planning/milestones/v1.1-ROADMAP.md`
v1.1 audit: `.planning/milestones/v1.1-MILESTONE-AUDIT.md`

---

*Last updated: 2026-06-10*
