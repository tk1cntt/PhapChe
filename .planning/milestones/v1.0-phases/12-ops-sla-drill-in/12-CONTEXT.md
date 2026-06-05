# Phase 12: ops-sla-drill-in - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning (gap closure — code already complete)

<domain>
## Phase Boundary

Render SLA context on the request-specific ops drill-in page to satisfy OPS-04. This is a **verification-only gap closure** — the code was already implemented in Phase 07 (commit `f29979e`) but the audit marked it as unresolved.

This phase does not add SLA policy engine, breach escalation, business-hours calendar, configurable SLA thresholds, or customer-facing SLA reporting.

</domain>

<decisions>
## Implementation Decisions

### SLA context display
- **D-01:** No new code is needed for the SLA drill-in page — `src/app/admin/ops/[requestId]/page.tsx` already renders:
  - `currentStatusSince` (Từ trạng thái hiện tại)
  - `currentStatusAgeDays` (Tuổi trạng thái)
  - `pendingReviewSince` (Chờ review từ)
  - `deliveredAt` (Đã giao lúc)
  - `closedAt` (Đã đóng lúc)
- **D-02:** All SLA fields are derived from `getOpsRequestTimeline` in `ops-service.ts` using `WorkflowTransition.createdAt` — no backend changes needed.
- **D-03:** SLA display uses Vietnamese labels (existing pattern), safe identifiers only — no raw legal content, no PII.
- **D-04:** This phase closes GAP-01 / OPS-04 from `v1.0-MILESTONE-AUDIT.md`.

### Claude's Discretion
- Verification strategy: confirm the SLA data renders correctly in the drill-in page via existing ops-service tests or a quick manual check.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit findings
- `.planning/v1.0-MILESTONE-AUDIT.md` — OPS-04 partial gap: drill-in page missing SLA context (now fixed)
- `.planning/phases/07-ops/07-VERIFICATION.md` — GAP-01: original gap documentation

### Existing implementation
- `src/app/admin/ops/[requestId]/page.tsx` — SLA context rendering (lines 70-93)
- `src/lib/ops/ops-service.ts` — `getOpsRequestTimeline()` computing SLA fields (lines 365-368, 405-417)
- `.planning/phases/07-ops/07-CONTEXT.md` — Prior decisions D-10..D-12 on SLA approach

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getOpsRequestTimeline` from `src/lib/ops/ops-service.ts` — already computes all SLA fields
- `formatOptionalDate` / `formatAge` / `formatDateTime` helpers in the drill-in page — already render SLA context
- `AdminShell`, `Card`, `Badge`, `PageHeader`, `Table` from admin UI components — already used by the page

### Established Patterns
- Ops pages under `src/app/admin/ops/` follow server-rendered pattern with `AdminShell` wrapper
- SLA data is computed from `WorkflowTransition.createdAt` across the codebase — consistent approach
- Vietnamese labels for all user-facing text; English for code identifiers

### Integration Points
- No new integration needed — the drill-in page (`/admin/ops/[requestId]`) already exists and connects to `getOpsRequestTimeline`
- Phase 12 verification may add a test or confirm existing test coverage in `src/lib/ops/ops-service.test.ts`

</code_context>

<specifics>
## Specific Ideas

- This is a **verification-only phase**: confirm the commit `f29979e` closes the gap by reviewing the rendered output. No new development scope needed beyond verification.

</specifics>

<deferred>
## Deferred Ideas

- SLA policy engine/escalation — deferred from Phase 07 D-12; remains out of MVP scope
- Business-hours calendar for SLA calculation — v2 enhancement

</deferred>

---

*Phase: 12-ops-sla-drill-in*
*Context gathered: 2026-06-05*
