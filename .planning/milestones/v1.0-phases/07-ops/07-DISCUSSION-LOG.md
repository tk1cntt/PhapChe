# Phase 7: ops - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 07-ops
**Mode:** --auto
**Areas discussed:** Dashboard metrics, Request filtering, Workload view, SLA timestamps and aging, Audit timeline

---

## Dashboard metrics

| Option | Description | Selected |
|--------|-------------|----------|
| Metric cards + tables | Simple operational cockpit: counts by status/assignee/reviewer/aging, easy to scan and aligned with existing admin UI. | ✓ |
| Analytics-heavy charts | More visual analytics, but risks overbuilding Phase 7 beyond OPS-01. | |
| Raw request table only | Simplest UI but under-serves the dashboard count requirement. | |

**User's choice:** Auto-selected recommended default: Metric cards + tables, charts only if cheap.
**Notes:** Counts must come from backend data, not fixtures/frontend-only state.

---

## Request filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side composable filters | Customer/workspace, matter type, status, assignee, reviewer, and date range compose with AND semantics while preserving RBAC. | ✓ |
| Frontend-only filters | Faster to mock but not acceptable for security/RBAC and larger result sets. | |
| Search-first experience | Useful later, but fuzzy search/saved views are outside Phase 7 MVP. | |

**User's choice:** Auto-selected recommended default: Server-side composable filters with AND semantics.
**Notes:** Filtering must remain admin-facing and server-side.

---

## Workload view

| Option | Description | Selected |
|--------|-------------|----------|
| Simple counts | Show workload per specialist/reviewer by active statuses where useful. | ✓ |
| Capacity scoring | Adds subjective scoring and scheduling policy not yet proven by MVP usage. | |
| Auto-balancing | New automation capability; out of scope for ops visibility phase. | |

**User's choice:** Auto-selected recommended default: Simple counts per specialist/reviewer by active statuses.
**Notes:** Source of truth is assignment fields and assignment history.

---

## SLA timestamps and aging

| Option | Description | Selected |
|--------|-------------|----------|
| Derived basic timestamps | Use request lifecycle fields and WorkflowTransition records for created age, current status age, pending review age, delivered/closed timing. | ✓ |
| Configurable SLA engine | More mature but too much for MVP; needs policies, calendars, thresholds, escalation. | |
| No SLA display | Would miss OPS-04. | |

**User's choice:** Auto-selected recommended default: Derive basic milestone timestamps from lifecycle fields and WorkflowTransition.
**Notes:** No breach escalation automation or business-hours calendar in MVP.

---

## Audit timeline

| Option | Description | Selected |
|--------|-------------|----------|
| Safe identifiers/summaries | Show chronological time, actor, action/status change, target, correlation id, reason, and metadataSummary without raw legal content. | ✓ |
| Full raw metadata | Risks exposing sensitive legal content or internal comments. | |
| Workflow transitions only | Safer but too narrow; OPS-05 asks for audit timeline, not only state changes. | |

**User's choice:** Auto-selected recommended default: Safe chronological identifiers/summaries only.
**Notes:** Do not expose raw legal content, full document text, internal reviewer-only comments, sensitive file contents, or raw storage keys.

---

## Claude's Discretion

- Exact card layout, table grouping, badge colors, and empty/loading states may follow existing admin UI patterns.
- Exact query decomposition may be chosen by researcher/planner, as long as server-side filtering/RBAC and simple MVP scope remain intact.

## Deferred Ideas

- Advanced SLA breach policy/escalation.
- Productivity/performance analytics.
- Customer download analytics.
- Saved filter views, fuzzy search, CSV/PDF export.
