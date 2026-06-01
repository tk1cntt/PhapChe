# Phase 7: ops - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** --auto (recommended defaults applied)

<domain>
## Phase Boundary

Provide admin operational visibility for the legal workflow: dashboard counts, request filters, workload views, SLA timestamp/aging tracking, and per-request audit timeline. Phase 7 does not add advanced analytics, SLA escalation automation, billing analytics, customer-facing reporting, saved filter views, fuzzy search, CSV/PDF export, or employee productivity scoring.

</domain>

<decisions>
## Implementation Decisions

### Dashboard metrics
- **D-01:** Build MVP operational counts by request status, assigned specialist, assigned reviewer, and aging. This directly covers OPS-01 and roadmap success criteria.
- **D-02:** Prefer plain admin cards and tables over analytics-heavy charts. Charts may be added only if already cheap from existing data, not as separate scope.
- **D-03:** Counts must be derived from backend data (`LegalRequest`, assignments, workflow timestamps), not hard-coded fixtures or frontend-only state.

### Request filtering
- **D-04:** Implement admin-facing server-side filters for customer/workspace, matter type, status, assignee, reviewer, and date range.
- **D-05:** Filters should compose together with AND semantics. No saved views, faceted search, fuzzy search, or export in MVP.
- **D-06:** Filtering must respect server-side RBAC. Admin visibility comes from `coordinator_admin` / `super_admin`; frontend navigation hiding is UX only.

### Workload view
- **D-07:** Show simple workload counts per specialist and reviewer, split by active request statuses where useful.
- **D-08:** Do not build capacity scoring, availability scheduling, productivity/performance analytics, or auto-balancing in Phase 7. Keep the ops MVP readable and evidence-based.
- **D-09:** Workload source of truth is `LegalRequest.assignedSpecialistId`, `LegalRequest.assignedReviewerId`, and `RequestAssignment` history where needed.

### SLA timestamps and aging
- **D-10:** Track basic SLA timestamps by deriving milestone times from request lifecycle fields and `WorkflowTransition.createdAt`.
- **D-11:** Display aging in human-operational terms: created age, time in current status, pending review age, delivered/closed timing when available.
- **D-12:** No SLA policy engine, breach escalation automation, business-hours calendar, or configurable SLA thresholds in MVP unless already trivial from existing data.

### Audit timeline
- **D-13:** Admin can view chronological timeline for a single request using safe audit events and workflow transitions.
- **D-14:** Timeline should show time, actor, action/status change, target, correlation id, reason, and `metadataSummary` where present.
- **D-15:** Do not expose raw legal content, full document text, internal reviewer-only comments, sensitive file contents, or raw `storageKey` in timeline. Use identifiers and safe summaries only.

### Claude's Discretion
- Exact card layout, table grouping, badge colors, and empty/loading states may follow existing admin UI patterns.
- Exact query decomposition may be chosen by researcher/planner, as long as server-side filtering/RBAC and simple MVP scope remain intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and phase scope
- `.planning/PROJECT.md` — Project constraints: legal accuracy, security, workflow integrity, traceability, MVP scope, and audit requirements.
- `.planning/REQUIREMENTS.md` — OPS-01 through OPS-05 requirements and v2/out-of-scope boundaries.
- `.planning/ROADMAP.md` — Phase 7 goal and success criteria.

### Locked prior decisions
- `.planning/phases/01-foundation/01-CONTEXT.md` — Server-side RBAC, append-only audit, backend-owned workflow transitions, workspace isolation.
- `.planning/phases/03-routing/03-CONTEXT.md` — Capability routing foundations; workload/SLA scoring deferred from routing.
- `.planning/phases/05-review/05-CONTEXT.md` — Reviewer portal and review records; reviewer performance/review time metrics deferred to ops.
- `.planning/phases/06-delivery/06-CONTEXT.md` — Delivery/close events and decision to defer customer download analytics.

### Existing implementation anchors
- `prisma/schema.prisma` — Data models for `LegalRequest`, `RequestAssignment`, `WorkflowTransition`, `Review`, `VaultFile`, `AuditEvent`, users, roles, and statuses.
- `src/lib/workflow/request-workflow.ts` — Backend status transition rules and workflow audit recording.
- `src/lib/security/rbac.ts` — Request/workspace/vault access rules.
- `src/lib/audit/audit.ts` — Safe audit event creation and `metadataSummary` constraints.
- `src/app/admin/components/ui.tsx` — Admin UI primitives: `Card`, `Table`, `Badge`, `Button`, `PageHeader`.
- `src/app/admin/components/admin-shell.tsx` — Admin layout and navigation pattern.
- `src/app/admin/requests/page.tsx` — Existing request admin page pattern and status labels.
- `src/app/admin/audit/page.tsx` — Existing audit table pattern and safe metadata note.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AdminShell` from `src/app/admin/components/admin-shell.tsx`: use for ops/admin pages and navigation consistency.
- `Card`, `Table`, `Badge`, `Button`, `PageHeader` from `src/app/admin/components/ui.tsx`: reuse for dashboard metric cards, workload tables, filter panels, and timeline rows.
- `getAllowedTransitions` and workflow transition model from `src/lib/workflow/request-workflow.ts`: use request lifecycle as source for aging/status labels, not frontend-only logic.
- `recordAuditEvent` from `src/lib/audit/audit.ts`: existing audit format constrains timeline fields to safe metadata.

### Established Patterns
- Next.js App Router pages under `src/app/admin/*/page.tsx` use server-rendered admin screens and shared admin components.
- Prisma is accessed through `src/lib/prisma.ts` and models in `prisma/schema.prisma`.
- RBAC is server-side via `src/lib/security/rbac.ts`; UI navigation cannot be the security boundary.
- Audit metadata is intentionally summarized; no raw sensitive legal content should be displayed in operational views.
- UI copy is Vietnamese; code identifiers and enums remain English.

### Integration Points
- Add ops dashboard under admin namespace, likely `src/app/admin/ops/page.tsx`, and add nav item to `AdminShell` if planner chooses a new route.
- Query `LegalRequest` for status, workspace/customer, assignee/reviewer, created/updated dates, and joins to intake/matter type where needed.
- Query `RequestAssignment` for assignment history and workload context.
- Query `WorkflowTransition` for SLA milestone timestamps and current-status aging.
- Query `AuditEvent` and `WorkflowTransition` for request audit timeline.

</code_context>

<specifics>
## Specific Ideas

- Use a practical operations cockpit style: metric cards first, filterable request list second, workload table third, and drill-in audit timeline per request.
- Keep Phase 7 focused on “what needs attention now” rather than analytics depth.
- Prefer Vietnamese labels consistent with current admin pages.

</specifics>

<deferred>
## Deferred Ideas

- Advanced SLA breach policy/escalation — future phase after basic timestamps prove useful.
- Productivity/performance analytics — future phase; avoid turning MVP ops into employee scoring.
- Customer download analytics — explicitly deferred from Phase 6 and not required for OPS-01..OPS-05.
- Saved filter views, fuzzy search, CSV/PDF export — useful later, not Phase 7 MVP.

</deferred>

---

*Phase: 07-ops*
*Context gathered: 2026-06-01*
