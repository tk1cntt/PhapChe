# Phase 3: routing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 03-routing
**Mode:** auto
**Areas discussed:** Matter Types and Capability Matrix, Suggestions and Assignment, Coordinator UI, Specialist Queue, Security and Audit

---

## Auto-Selected Areas

`--auto` selected all routing gray areas and recommended defaults without interactive prompts.

## Matter Types and Capability Matrix

| Option | Description | Selected |
|--------|-------------|----------|
| Rule-based capability matrix | Match active specialist/reviewer capabilities to request matter type; coordinator decides final assignment. | ✓ |
| Auto-routing | System assigns directly based on scoring. Deferred because MVP needs human-controlled workflow. | |
| Manual-only assignment | Coordinator picks without suggestions. Rejected because RTE-03 requires suggestions. | |

**User's choice:** Auto-selected rule-based capability matrix.
**Notes:** Prior project decision says capability matrix rule-based before auto-routing. Existing `MatterType`, `LegalRequest`, `RequestAssignment`, and role models support this.

---

## Suggestions and Assignment

| Option | Description | Selected |
|--------|-------------|----------|
| Suggestions with required coordinator confirmation | Show eligible specialists/reviewers separately and require assignment reason. | ✓ |
| Silent background matching | Store candidates without UI explanation. Rejected because coordinator needs explainable workflow. | |
| Direct auto-assignment | Assign best candidate automatically. Deferred to later automation. | |

**User's choice:** Auto-selected coordinator-confirmed suggestions.
**Notes:** Assignment must update request assignee fields, create assignment history, use backend workflow transitions, and audit actions.

---

## Coordinator UI

| Option | Description | Selected |
|--------|-------------|----------|
| Actionable routing queue | Admin/coordinator screen with submitted/triage requests, suggestions, current assignees, and assignment reason. | ✓ |
| Configuration-only screen | Manage capabilities without routing queue. Rejected because RTE-04 needs assignment/reassignment flow. | |
| Full ops dashboard | Add counts/workload/SLA. Deferred to Phase 7 ops. | |

**User's choice:** Auto-selected actionable routing queue.
**Notes:** Reuse existing admin UI components and Vietnamese copy.

---

## Specialist Queue

| Option | Description | Selected |
|--------|-------------|----------|
| Assigned queue with request details | Specialist sees assigned requests, intake summary, and file metadata. | ✓ |
| Full document workbench | Adds draft generation/editing. Deferred to Phase 4. | |
| Shared team queue | Specialists see all workspace requests. Rejected because least-privilege pattern says assigned work only. | |

**User's choice:** Auto-selected assigned queue with request details.
**Notes:** Use server-side authorization. Reviewer queue remains Phase 5.

---

## Security and Audit

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side RBAC + append-only assignment/audit history | Enforce workspace/role/assignment checks, create history rows and concise audit metadata. | ✓ |
| Frontend-only role checks | Rejected by Phase 1 locked decision. | |
| Overwrite assignment only | Rejected because traceability requires history. | |

**User's choice:** Auto-selected server-side RBAC + append-only assignment/audit history.
**Notes:** Audit metadata must avoid sensitive legal content.

---

## Claude's Discretion

- Exact Prisma capability model shape.
- Exact route names and component split.
- Exact deterministic suggestion ordering.
- Exact minimal seed capability data.

## Deferred Ideas

- Auto-routing without coordinator approval — later automation.
- Workload/SLA scoring and dashboard counts — Phase 7 ops.
- Reviewer queue and QC checklist UI — Phase 5 review.
- Document generation or draft workbench — Phase 4 documents-vault.
- AI matter type detection from uploads/intake — v2 automation.
