# Phase 7: ops - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 07-ops
**Mode:** auto
**Areas discussed:** Dashboard metrics, Filtering, Workload, SLA timestamps, Audit timeline

---

## Dashboard metrics

| Option | Description | Selected |
|--------|-------------|----------|
| MVP operational counts | Counts by status, assignee, reviewer, aging; direct OPS-01 fit | ✓ |
| Analytics-heavy charts | More visual, but bigger scope and less necessary for MVP | |
| Minimal table only | Fastest, but misses dashboard success criterion | |

**User's choice:** Auto-selected recommended default: MVP operational counts.
**Notes:** Counts must come from backend models, not fixtures.

---

## Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side filters | Customer/workspace, matter type, status, assignee, reviewer, date range; secure and scalable enough | ✓ |
| Client-only filters | Simpler UI, but wrong security boundary and poor scale | |
| Search-first filters | Useful later, but fuzzy/full-text search is extra scope | |

**User's choice:** Auto-selected recommended default: server-side filters.
**Notes:** Compose filters with AND semantics. No saved views in MVP.

---

## Workload

| Option | Description | Selected |
|--------|-------------|----------|
| Simple counts | Per specialist/reviewer counts by active statuses; direct OPS-03 fit | ✓ |
| Capacity scoring | Needs policy and tuning; overbuild for MVP | |
| Availability scheduler | New scheduling capability, out of Phase 7 scope | |

**User's choice:** Auto-selected recommended default: simple counts.
**Notes:** Use assignments/current assignee fields as source of truth.

---

## SLA timestamps

| Option | Description | Selected |
|--------|-------------|----------|
| Basic timestamps | Derive aging from request dates and workflow transitions; direct OPS-04 fit | ✓ |
| Full SLA policy engine | Thresholds, calendars, breach rules; too much for MVP | |
| Manual SLA fields | Easy to display but weak traceability | |

**User's choice:** Auto-selected recommended default: basic timestamps.
**Notes:** Display operational aging; no escalation automation.

---

## Audit timeline

| Option | Description | Selected |
|--------|-------------|----------|
| Safe timeline | Chronological audit/workflow events with identifiers and metadataSummary | ✓ |
| Full raw metadata | More detail, but risks exposing legal/sensitive content | |
| Status-only timeline | Safe, but too narrow for OPS-05 | |

**User's choice:** Auto-selected recommended default: safe timeline.
**Notes:** Hide raw legal content, document text, reviewer-only comments, and sensitive file contents.

---

## Claude's Discretion

- Exact card layout, grouping, empty/loading states, and query decomposition.
- Reuse existing admin UI and Vietnamese labels.

## Deferred Ideas

- Advanced SLA breach policy/escalation.
- Productivity/performance analytics.
- Customer download analytics.
- Saved filter views, fuzzy search, CSV/PDF export.
