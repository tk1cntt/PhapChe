# Phase 1: foundation - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers security and workflow foundation: tenant/workspace isolation, user and role management, server-side access control, append-only audit events, and backend-owned request status transitions.

This phase does not build customer intake, document generation, reviewer checklist UI, Legal Vault file storage, delivery, reporting, OCR, e-sign, billing, or AI automation.

</domain>

<decisions>
## Implementation Decisions

### Product Boundary
- **D-01:** Build greenfield modular monolith foundation. No existing `src/` or `app/` code found.
- **D-02:** Keep foundation scope narrow: auth/RBAC, tenant/workspace model, request shell, workflow state machine, audit events.

### Roles and Workspaces
- **D-03:** Support five roles from day one: `customer`, `specialist`, `reviewer`, `coordinator_admin`, `super_admin`.
- **D-04:** Model every SME as separate customer workspace/organization.
- **D-05:** Internal users access request data only through assignment or admin-level permission.

### Authorization
- **D-06:** Enforce authorization server-side for every request, document, review, and vault file access path.
- **D-07:** Frontend role checks are UX only, not security.
- **D-08:** Use least-privilege defaults: customer sees own workspace, specialist sees assigned work, reviewer sees review-assigned work, coordinator/admin manages operations, super admin manages system setup.

### Workflow State
- **D-09:** Request status changes go through backend workflow transitions only.
- **D-10:** Initial request states: `draft_intake`, `intake_submitted`, `triage`, `assigned`, `in_progress`, `pending_review`, `revision_required`, `approved`, `delivered`, `closed`, `cancelled`.
- **D-11:** Every transition records actor, timestamp, from-state, to-state, and optional reason.

### Audit Trail
- **D-12:** Audit log must be append-only from Phase 1.
- **D-13:** Audit events include actor, workspace/customer, action, target type/id, timestamp, request correlation id, and metadata summary.
- **D-14:** Phase 1 audits user/role changes, request creation/status changes, and assignment-related changes; later phases extend file/document/review/delivery actions.
- **D-15:** Do not store unnecessary sensitive legal content in audit metadata; store identifiers, summaries, hashes, or references.

### Technical Direction
- **D-16:** Follow project stack direction unless research/planning finds blocker: Next.js + TypeScript modular monolith, PostgreSQL + Prisma, S3/R2-style storage later, worker later.
- **D-17:** Prioritize clean domain model and enforceable server-side boundaries over polished UI.

### Claude's Discretion
- Exact auth provider selection may be researched/planned, but must preserve roles, workspace isolation, and server-side permission checks.
- Exact table/type naming can follow framework conventions as long as role/workspace/request/audit/workflow concepts stay explicit.
- Exact admin UI styling can use standard shadcn/Tailwind patterns if used.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/PROJECT.md` — Project vision, constraints, security/legal accuracy principles, key product decisions.
- `.planning/REQUIREMENTS.md` — Phase 1 requirements FND-01 through FND-05.
- `.planning/ROADMAP.md` — Phase 1 boundary, goal, success criteria, and downstream phase separation.
- `.planning/research/SUMMARY.md` — Recommended architecture, stack, pitfalls, and phase order.

### Source docs
- `docs/note.txt` — Original BA notes for platform actors, features, MVP backlog, and E-Myth SOP guidance.
- `docs/Có.docx` — Reviewer checklist and coordinator/capability matrix source material; project artifacts contain normalized extracted content.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None found. No `src/` or `app/` application code exists in project root.

### Established Patterns
- No existing application patterns found. Project is effectively greenfield.
- GSD planning artifacts are current source of truth.

### Integration Points
- New implementation should create initial application structure.
- Phase 1 should expose foundation entities/services later phases reuse: users, organizations/workspaces, roles, permissions, legal request shell, workflow transitions, and audit events.

</code_context>

<specifics>
## Specific Ideas

- Keep product positioning as legal operations system, not AI lawyer.
- Model request/workflow foundations now so later intake, routing, documents, review, delivery, and ops phases plug in.
- Preserve legal traceability: every meaningful state/security change should be auditable.

</specifics>

<deferred>
## Deferred Ideas

- Chat/form intake UI and structured intake questions — Phase 2 `intake`.
- Capability Matrix details and assignment queues — Phase 3 `routing`.
- Document templates, Legal Vault files, document versioning — Phase 4 `documents-vault`.
- Reviewer split view and QC checklist — Phase 5 `review`.
- Secure signed download links and customer delivery — Phase 6 `delivery`.
- SLA/workload dashboard — Phase 7 `ops`.
- OCR, e-sign, AI draft/risk flags, compliance calendar, billing automation — v2/deferred.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-05-26*
