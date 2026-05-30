# Phase 5: review - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 05-review
**Mode:** auto (--auto flag)
**Areas discussed:** Checklist Model, Review Data Model, Reviewer Portal Layout, Revision Flow, Approval Flow

---

## Checklist Model

| Option | Description | Selected |
|--------|-------------|----------|
| Static from QC-LEG-01 | Checklist items from PROJECT.md, seeded as constants. MVP, no admin config needed. | ✓ |
| Dynamic per-template | Each template has its own checklist config. More flexible but overbuild for MVP. | |
| Hybrid | Static base + optional template-specific additions. Complex for MVP. | |

**Auto-selected:** Static from QC-LEG-01 (recommended default)
**Rationale:** PROJECT.md explicitly defines QC-LEG-01 with 3 groups and 9 criteria. MVP should match defined requirements without overbuilding configuration UI.

---

## Review Data Model

| Option | Description | Selected |
|--------|-------------|----------|
| Extend Review model | Add status, documentVersionId, decision, comments to existing Review. Add ReviewChecklistAnswer for per-item tracking. | ✓ |
| New ReviewSession | Create separate ReviewSession + ReviewChecklistItem + ReviewAnswer models. More normalized but adds complexity. | |
| Minimal Review | Just add status and decision to Review. No per-item checklist tracking. | |

**Auto-selected:** Extend Review model + ReviewChecklistAnswer (recommended default)
**Rationale:** Current Review model is too thin for requirements. Need per-item checklist responses for REV-06 (approve only when all required items passed) and REV-07 (failed items with comments).

---

## Reviewer Portal Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Split view | Draft left, checklist right. Matches PROJECT.md and REV-02 requirement exactly. | ✓ |
| Stacked view | Draft on top, checklist below. Simpler but doesn't match requirement. | |
| Tabbed view | Draft and checklist in tabs. Requires context switching. | |

**Auto-selected:** Split view (recommended default)
**Rationale:** PROJECT.md and REV-02 both explicitly require split view with draft left and checklist right.

---

## Revision Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Per-item feedback | Reviewer marks failed checklist items with per-item comments. Returns to specialist with actionable feedback. | ✓ |
| General comment only | Reviewer adds general revision comment. Specialist must guess what failed. | |
| Inline annotation | Reviewer marks specific text passages. Rich but complex for MVP. | |

**Auto-selected:** Per-item feedback (recommended default)
**Rationale:** REV-07 requires failed checklist items with comments. REV-08 requires preserved comments. Per-item feedback is the minimum that meets both requirements.

---

## Approval Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Mark final-ready + approve request | DocumentVersion → final, request → approved, audit event. Matches REV-09. | ✓ |
| Mark final-ready only | DocumentVersion → final but don't change request status. Leaves gap. | |
| Two-step approval | Preliminary approval then coordinator sign-off. Overbuild for MVP. | |

**Auto-selected:** Mark final-ready + approve request (recommended default)
**Rationale:** REV-09 requires marking approved version as final-ready and auditing decision. Request status transition to approved through backend state machine (Phase 1 locked decision).

---

## Claude's Discretion

- Exact split view responsive behavior
- Checklist seed label refinements
- Review submission confirmation UX pattern
- Prisma field naming conventions

## Deferred Ideas

- Dynamic checklist configuration per template — v2
- Inline document text annotation — post-MVP
- Reviewer performance metrics — Phase 7 ops
