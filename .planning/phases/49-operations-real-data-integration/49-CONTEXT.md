# Phase 49: Operations — Real Data Integration - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect the Operations page at `/vi/admin/operations` to real operational workload, SLA, and workflow/audit data while matching `layout/admin-operations.html`. The implementation must live under locale routing (`src/app/[locale]/admin/operations`) and new/cloned UI source must be placed in `src/components` (primarily `src/components/admin`), not in `src/legacy`. `src/legacy` and `layout/` are reference sources only.

</domain>

<decisions>
## Implementation Decisions

### Data Contract
- **D-01:** Use a single aggregate endpoint for the screen, expected as `/api/admin/operations`, returning the data needed for stats, workload, recent operations timeline, and operations table in one response.
- **D-02:** The endpoint must be backed by real DB/service data, not hardcoded UI samples. It should reuse and extend existing Operations service logic where appropriate (`src/lib/ops/ops-service.ts`).
- **D-03:** Support full operations filters in scope: workspace, status, matter type, specialist, reviewer, date range, and search if needed for the template toolbar/table behavior.
- **D-04:** The main timeline is a recent global Operations timeline scoped by the authenticated admin's workspace/permissions, sourced from audit events and workflow transitions. It is not a selected-row-only timeline for this phase.

### Component Split
- **D-05:** Build screen-specific components under `src/components/admin`, with a client container such as `AdminOperationsClient` and focused child components for stats, workload, timeline, and operations table.
- **D-06:** Keep the page integration in `src/app/[locale]/admin/operations/page.tsx`. Do not create non-locale admin routes and do not place new source under `src/legacy`.
- **D-07:** Match `layout/admin-operations.html` as closely as possible for layout, spacing, colors, typography, shadows, and visual hierarchy. Legacy/mock files are only references to clone from.
- **D-08:** `AdminOperationsClient` owns loading, error, retry, empty, filter, and refresh state. Child components should primarily render typed props and remain easy to whitebox test.

### SLA Behavior
- **D-09:** SLA bars should prefer real deadline data (`LegalRequest.slaDeadline`) when available, then fallback to status age/currentStatusSince from workflow transitions or request timestamps when deadline data is missing.
- **D-10:** Use a 4-level SLA visual model: green for OK, orange for near-due/aging warning, red for overdue/danger, and blue for no-SLA/informational fallback.
- **D-11:** Missing deadline or missing workflow transition data must render an explicit fallback such as `Chưa có SLA` / informational blue or a safe derived status. The UI must not crash and must not substitute hardcoded sample values.

### Test Scope
- **D-12:** Use layered full test coverage: whitebox component tests, blackbox API/service tests, abnormal edge-case tests, error tests, and Playwright E2E.
- **D-13:** Test data must be inserted into the database through seed/helpers and then read back through service/API/UI. No UI hardcoded sample data is allowed.
- **D-14:** Required E2E flow: admin logs in, visits `/vi/admin/operations`, sees stats/workload/timeline/table from DB, applies filters that change table rows, and verifies SLA colors/fallback behavior.
- **D-15:** Coverage target remains at least 90% per project instruction. Every UI feature touched in this phase needs corresponding whitebox, blackbox, abnormal, error, and E2E coverage.

### Claude's Discretion
Planner/researcher may decide exact DTO field names, pagination defaults, and component file names as long as they preserve the decisions above, match existing code style, and avoid scope creep such as export/drill-down interactions unless already present in the template and trivial to wire.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope and Requirements
- `.planning/ROADMAP.md` — Phase 49 goal, dependencies, success criteria, and pending plan entry.
- `.planning/REQUIREMENTS.md` — Admin Operations template requirements `ADMIN-OPS-01..06` and testing/data rules.
- `.planning/PROJECT.md` — Project constraints: DB-only data, i18n/locale routing, UI parity, service layer, security/RBAC, workflow integrity.
- `.planning/STATE.md` — Current milestone state showing Phase 49 as next and prior Phase 47/48 completion context.

### UI Reference
- `layout/admin-operations.html` — canonical visual reference for Operations page pixel parity.
- `src/legacy` — reference-only source; do not add new implementation here.

### Existing Code Integration
- `src/app/[locale]/admin/operations/page.tsx` — current placeholder route to replace/integrate.
- `src/lib/ops/ops-service.ts` — existing Operations service types and queries for dashboard/workload/request timeline.
- `src/components/admin/WorkloadPanel.tsx` — reusable workload visual pattern.
- `src/components/admin/AdminStatGrid.tsx` — reusable admin stat grid/cards.
- `src/components/admin/AdminToolbar.tsx` — reusable admin toolbar/filter visual pattern.
- `src/components/ui/Paging.tsx` — common paging component if Operations table requires pagination.
- `src/components/admin/AdminRequestsClient.tsx` — recent admin real-data client-fetch/filter/error pattern from Phase 48.
- `src/app/api/admin/requests/route.ts` — recent API route pattern for admin list data, auth checks, stats, filters, and DTO transformation.

### Testing Patterns
- `.planning/codebase/TESTING.md` — test organization, required categories, DB seed helper patterns, and E2E guidance.
- `.planning/codebase/ARCHITECTURE.md` — service-layer and RBAC constraints; avoid direct business logic in UI where service methods are appropriate.
- `.planning/codebase/STRUCTURE.md` — route/component placement conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/ops/ops-service.ts`: Already contains `getOpsDashboard`, `getOpsRequestTimeline`, DTO types, authorization helpers, workload aggregation, request rows, and workflow/audit timeline concepts. Research/planning should inspect whether it already satisfies the new aggregate endpoint or needs extension for SLA deadline/search/pagination/global recent timeline.
- `src/components/admin/WorkloadPanel.tsx`: Existing workload UI with progress bars and empty state; can be reused or cloned into a more Operations-specific component if template parity requires differences.
- `src/components/admin/AdminStatGrid.tsx`: Existing admin stat card pattern for the four stat cards required by Operations.
- `src/components/admin/AdminToolbar.tsx`: Existing search/filter/refresh/export visual pattern used by admin screens. Use only capabilities in scope; avoid adding real export if not needed for Phase 49.
- `src/components/ui/Paging.tsx`: Existing paging pattern from Phase 48 if Operations table needs pagination.

### Established Patterns
- Locale routes live under `src/app/[locale]/...`; Phase 49 must integrate at `src/app/[locale]/admin/operations/page.tsx`.
- Recent admin real-data screens use a client component that fetches an API route, owns loading/error/retry/filter state, and renders typed child components.
- Business logic should live in service/API layers with Prisma and RBAC checks; UI components should render data returned from DB-backed APIs.
- DB-only rule is strict: template values may be seeded into SQLite, but displayed values must be queried from DB.

### Integration Points
- Add/replace Operations page route in `src/app/[locale]/admin/operations/page.tsx`.
- Add aggregate API route under `src/app/api/admin/operations/route.ts` if not already present.
- Add Operations components under `src/components/admin/` only.
- Extend/add tests near components/services and in Playwright E2E using DB seed helpers.

</code_context>

<specifics>
## Specific Ideas

- User explicitly requested: “tích hợp vào `src\app\[locale]`; tạo source theo component và lưu ở `src/components`, không phải `src/legacy`; source ở `src/legacy` và mock UI ở folder `layout` chỉ để tham khảo và clone ra dùng.”
- The main screen should remain Operations overview, not a new detailed drill-down workflow.
- Pixel parity with `layout/admin-operations.html` matters as much as real data integration.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 49-Operations — Real Data Integration*
*Context gathered: 2026-06-13*
