# Phase 1: foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 01-foundation
**Mode:** auto
**Areas discussed:** Product Boundary, Roles and Workspaces, Authorization, Workflow State, Audit Trail, Technical Direction

---

## Product Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Recommended narrow MVP foundation | Auth/RBAC, tenant/workspace model, request shell, backend workflow state machine, append-only audit only. | ✓ |
| Broader platform shell | Include more portal/doc/review scaffolding early. | |
| UI-first admin foundation | Prioritize admin screens before domain enforcement. | |

**User's choice:** Auto-selected recommended narrow MVP foundation.
**Notes:** Existing context already matched this. No app code found; greenfield foundation remains right scope.

---

## Roles and Workspaces

| Option | Description | Selected |
|--------|-------------|----------|
| Five required roles + workspace isolation | customer, specialist, reviewer, coordinator_admin, super_admin; every SME as isolated workspace. | ✓ |
| Simpler admin/customer only | Faster but would undercut later routing/review phases. | |
| Fully customizable roles | Flexible but overbuilt for MVP. | |

**User's choice:** Auto-selected five required roles + workspace isolation.
**Notes:** Matches FND-01 and FND-04.

---

## Authorization

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side RBAC everywhere | Enforce access for requests, documents, reviews, vault files on backend. | ✓ |
| Frontend + API checks | Risk inconsistent enforcement. | |
| Basic route guards only | Too weak for sensitive legal records. | |

**User's choice:** Auto-selected server-side RBAC everywhere.
**Notes:** Frontend checks may exist for UX only.

---

## Workflow State

| Option | Description | Selected |
|--------|-------------|----------|
| Backend state machine | Status changes only through allowed backend transitions with transition audit data. | ✓ |
| Direct status updates | Simpler but breaks workflow integrity. | |
| Frontend-driven status flow | Violates project constraint. | |

**User's choice:** Auto-selected backend state machine.
**Notes:** Matches FND-05 and project constraint.

---

## Audit Trail

| Option | Description | Selected |
|--------|-------------|----------|
| Append-only minimal sensitive metadata | Records critical actions without storing unnecessary legal content. | ✓ |
| Verbose full-content audit | More detail but sensitive-data risk. | |
| Defer audit until later | Violates FND-03 and traceability needs. | |

**User's choice:** Auto-selected append-only minimal sensitive metadata.
**Notes:** Audit starts in Phase 1; later phases extend action coverage.

---

## Technical Direction

| Option | Description | Selected |
|--------|-------------|----------|
| Recommended modular monolith | Next.js + TypeScript, PostgreSQL + Prisma, auth provider researched during planning. | ✓ |
| Microservices | Overbuilt for MVP. | |
| No stack decision | Slows planning; conflicts with research summary. | |

**User's choice:** Auto-selected recommended modular monolith.
**Notes:** Auth provider choice remains Claude/research discretion, bounded by roles/workspace/server-side enforcement.

---

## Claude's Discretion

- Exact auth provider selection may be researched/planned.
- Exact naming conventions may follow framework norms.
- Exact admin UI styling may use standard shadcn/Tailwind patterns if chosen.

## Deferred Ideas

- Chat/form intake UI and structured intake questions — Phase 2 `intake`.
- Capability Matrix details and assignment queues — Phase 3 `routing`.
- Document templates, Legal Vault files, document versioning — Phase 4 `documents-vault`.
- Reviewer split view and QC checklist — Phase 5 `review`.
- Secure signed download links and customer delivery — Phase 6 `delivery`.
- SLA/workload dashboard — Phase 7 `ops`.
- OCR, e-sign, AI draft/risk flags, compliance calendar, billing automation — v2/deferred.
