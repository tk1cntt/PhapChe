# Phase 49: Operations — Real Data Integration - Research

**Researched:** 2026-06-13
**Domain:** Next.js App Router admin operations dashboard, Prisma-backed workload/SLA/audit aggregation, React client UI parity
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

None — discussion stayed within phase scope.
</user_constraints>

## Summary

Phase 49 should be planned as a surgical real-data integration over an existing placeholder page: `src/app/[locale]/admin/operations/page.tsx` currently renders only “Admin Operations coming soon”, while `src/lib/ops/ops-service.ts` already contains Operations domain types, admin authorization, filter parsing, dashboard aggregation, workload aggregation, per-request timeline, and workflow/audit timeline DTO concepts. The primary work is to extend that service for aggregate endpoint needs, especially `LegalRequest.slaDeadline`, search, pagination metadata, global recent timeline, workspace options for filters, and template-shaped table DTOs.

Use the current project’s established pattern from Phase 48: a Next.js App Router API route under `src/app/api/admin/operations/route.ts`, a client container under `src/components/admin/AdminOperationsClient.tsx`, typed child components, and `AdminLayout`/locale page integration under `src/app/[locale]/admin/operations/page.tsx`.

**Primary recommendation:** Plan one vertical slice: extend `ops-service.ts` DTO/query logic, add `/api/admin/operations`, clone template-matched admin Operations components under `src/components/admin`, wire the locale page, then add DB-seeded service/API/component/E2E tests covering success, filters, empty/fallback SLA, forbidden, and API failure paths.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Operations aggregate data contract | API / Backend | Service Layer | `/api/admin/operations` owns HTTP contract; `src/lib/ops/ops-service.ts` owns Prisma/RBAC/business aggregation. |
| Workload aggregation | Service Layer | Database / Storage | Workload comes from `LegalRequest.assignedSpecialistId`, `assignedReviewerId`, statuses, and grouped counts. |
| SLA calculation | Service Layer | UI rendering | Service should derive `green/orange/red/blue`, label, percent, and source from `slaDeadline` or workflow/request timestamps; UI should only render typed fields. |
| Recent Operations timeline | Service Layer | Database / Storage | Global recent timeline must merge `AuditEvent` and `WorkflowTransition` scoped by workspace/permissions; existing per-request timeline demonstrates both sources. |
| Filter/search/refresh state | Browser / Client | API / Backend | `AdminOperationsClient` owns loading/error/retry/filter/refresh state; API applies filters to real DB queries. |
| UI parity with `layout/admin-operations.html` | Browser / Client | — | Template-matched CSS/layout belongs in React components under `src/components/admin`, not service/API. |
| Tenant/admin authorization | Service Layer | API / Backend | Existing `requireOpsAdmin()` checks active membership role in workspace; API should also require app session before calling service. |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMIN-OPS-REAL-01 | User sees operations stat cards from database. | Use aggregate endpoint stats derived from `LegalRequest` counts, deadline buckets, completed-today counts, and audit warning counts. |
| ADMIN-OPS-REAL-02 | User sees specialist workload from real assignments. | Reuse/extend `getOpsDashboard()` workload derived from assigned specialist/reviewer and active statuses. |
| ADMIN-OPS-REAL-03 | User sees operations/audit timeline from real events. | Extend service with global recent timeline from `AuditEvent` and `WorkflowTransition`, not selected-row-only timeline. |
| ADMIN-OPS-REAL-04 | User sees operations table with SLA bars from real deadlines. | Extend request row DTO to include `slaDeadline`, fallback status-age SLA, visual level, percent, label, and source. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- All communication and user-facing content must be Vietnamese.
- Do not use `taskkill //F //IM node.exe`.
- Every UI feature needs whitebox, blackbox, abnormal, error, and e2e tests; fixes need e2e tests; coverage minimum is 90%.
- All displayed data must be inserted into DB and read back from DB; no hardcoded UI data.
- Phase/quick slugs must be short English.
- Prefer minimum code, no speculative features, and surgical changes only.
- Workflow integrity: status changes must go through backend state machine, not frontend hardcoded logic.
- Security: enforce tenant/request permissions and auditability.

## Standard Stack

No new runtime package is recommended for Phase 49. Use existing dependencies already in `package.json`: Next.js App Router, React, Prisma, Vitest, React Testing Library, and Playwright.

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── app/
│   ├── [locale]/admin/operations/page.tsx      # locale page integration only
│   └── api/admin/operations/route.ts           # single aggregate endpoint
├── components/
│   └── admin/
│       ├── AdminOperationsClient.tsx           # client state/fetch/filter/retry
│       ├── AdminOperationsStats.tsx            # operations-specific stat mapping if needed
│       ├── AdminOperationsWorkload.tsx         # template-matched workload list
│       ├── AdminOperationsTimeline.tsx         # global recent operations timeline
│       ├── AdminOperationsToolbar.tsx          # template-matched filter/search controls
│       └── AdminOperationsTable.tsx            # 7-column table + SLA bars
└── lib/
    └── ops/
        ├── ops-service.ts                      # extend existing service and DTOs
        └── ops-service.test.ts                 # DB-backed blackbox/abnormal/error tests
```

### Pattern 1: Thin Route Handler + Service Delegation

API route validates session, parses `NextRequest.nextUrl.searchParams`, delegates to `ops-service.ts`, and returns JSON.

### Pattern 2: Service-Derived UI DTOs

Convert DB/domain fields into screen-safe DTOs in the service/API boundary: status label/variant, SLA visual level, percent, action label, assignee display, and timeline text.

### Pattern 3: Explicit SLA Fallback Model

Derive SLA from `LegalRequest.slaDeadline` first; if absent, derive safe aging from latest workflow transition or `createdAt`; if neither is meaningful, return blue/no-SLA informational state.

Recommended DTO shape:

```typescript
type OpsSlaDto = {
  level: 'ok' | 'warn' | 'danger' | 'info';
  label: string;
  percent: number;
  source: 'deadline' | 'status_age' | 'request_age' | 'none';
};
```

### Anti-Patterns to Avoid

- Direct Prisma in React components.
- Hardcoded template samples in components.
- Selected-row timeline only.
- Frontend status/SLA business rules scattered across children.
- Adding export/drill-down features beyond template wiring.

## Common Pitfalls

1. Forgetting `slaDeadline` in the existing Ops service.
2. Workspace scope too narrow or too broad; follow existing Phase 47/48 admin scoping patterns and never broaden coordinator scope silently.
3. Timeline merges sources without stable ordering/deduplication.
4. Manual `useEffect` fetch race conditions; use cleanup/ignore or AbortController.
5. Pixel parity lost by over-reusing generic panels; create Operations-specific children if needed.

## Open Questions

1. Super admin default scope should be resolved by inspecting Phase 47/48 admin workspace scoping; keep consistent and do not broaden coordinator scope.
2. “Audit warnings” should be derived conservatively from existing actions if supported; otherwise count SLA danger/warnings and label accurately.
3. Operations table row display ID should use `LegalRequest.code` when present, fallback deterministic short id, not hardcoded `OPS-###`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest for components; Playwright for E2E; Node built-in test runner used in some service tests. |
| Config file | `vitest.config.ts`; Playwright config/scripts from project. |
| Quick run command | `npx vitest run tests/admin-operations src/lib/ops/ops-service.test.ts` |
| Full suite command | `npm run typecheck && npx vitest run --coverage && npm run test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ADMIN-OPS-REAL-01 | Stat cards show DB-derived open, near-SLA, completed-today, alert counts | blackbox service/API + component | `npx vitest run tests/admin-operations/admin-operations.spec.tsx src/lib/ops/ops-service.test.ts` | ❌ Wave 0 |
| ADMIN-OPS-REAL-02 | Workload panel shows real assigned specialists/reviewers with progress bars | whitebox component + blackbox service | `npx vitest run tests/admin-operations/admin-operations-workload.spec.tsx src/lib/ops/ops-service.test.ts` | ❌ Wave 0 |
| ADMIN-OPS-REAL-03 | Recent global timeline renders real audit/workflow events | blackbox service/API + component | `npx vitest run tests/admin-operations/admin-operations-timeline.spec.tsx src/lib/ops/ops-service.test.ts` | ❌ Wave 0 |
| ADMIN-OPS-REAL-04 | Operations table renders 7 columns and 4-level SLA bars from real deadlines/fallbacks | whitebox/abnormal/error/E2E | `npx vitest run tests/admin-operations/admin-operations-table.spec.tsx && npm run test:e2e -- operations` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `tests/admin-operations/admin-operations.spec.tsx` — covers component whitebox, abnormal, and error render paths.
- [ ] `tests/admin-operations/admin-operations-table.spec.tsx` — covers status/SLA/priority variants and empty/fallback rows.
- [ ] `src/lib/ops/ops-service.test.ts` — covers DB-backed service filters, SLA derivation, authorization, global timeline.
- [ ] `tests/e2e/admin-operations.spec.ts` or existing E2E location — covers admin login, page render, filters changing rows, SLA colors/fallback.
- [ ] API route tests for `/api/admin/operations` forbidden/error/success if project has route-test harness; otherwise service blackbox plus E2E must cover API behavior.

## Security Domain

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-tenant data exposure via missing workspace filter | Information Disclosure | Service-level workspace scope and admin membership checks before querying. |
| Non-admin access to operations aggregate endpoint | Elevation of Privilege | `requireAppSession()` plus role/membership validation in `requireOpsAdmin()`. |
| Filter injection / invalid status/date params | Tampering | Use Prisma parameterized query API and whitelist statuses with `parseStatusParam()`. |
| Audit timeline leakage | Information Disclosure | Filter `AuditEvent` and `WorkflowTransition` by permitted workspace/request IDs. |
| Workflow integrity drift in UI | Tampering | UI only displays state; status changes remain backend state-machine responsibility. |

## Sources

- `CLAUDE.md`
- `.planning/phases/49-operations-real-data-integration/49-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `src/lib/ops/ops-service.ts`
- `prisma/schema.prisma`
- `layout/admin-operations.html`
- `package.json`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: MEDIUM

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 for project/codebase-specific findings; re-check package versions and Next.js docs if implementation starts later.
