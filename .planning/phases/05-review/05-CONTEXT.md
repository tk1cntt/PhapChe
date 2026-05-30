# Phase 5: review - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning
**Mode:** auto-selected defaults

<domain>
## Phase Boundary

Phase 5 delivers the reviewer portal with split-view interface (draft left, QC checklist right), static checklist derived from QC-LEG-01 criteria, checklist item response tracking, approval that marks documents final-ready, and revision flow that returns documents to specialist with failed criteria and comments.

This phase does not build customer delivery/download UX, e-signature integration, OCR, AI legal advice, operations dashboards, or dynamic per-template checklist configuration.

</domain>

<decisions>
## Implementation Decisions

### Checklist Model
- **D-01:** Checklist is static, derived from QC-LEG-01 defined in PROJECT.md. Three groups: Formal Requirements (3 items), Legal Content (4 items), Operational & Signing (2 items). No dynamic per-template checklist for MVP.
- **D-02:** Checklist items are stored as seed data or code constants, not user-manageable records. Admin does not configure checklist items in MVP.
- **D-03:** Each checklist item has: id, group (formal/legal_content/operational), label (Vietnamese), required flag, and sort order.

### Review Data Model
- **D-04:** Extend existing `Review` model with: `documentVersionId`, `status` enum (in_progress/approved/rejected), `decision` (approve/reject), `generalComment`, `completedAt`.
- **D-05:** Introduce `ReviewChecklistItem` seed reference model and `ReviewChecklistAnswer` model linking review to each checklist item with: `itemId`, `passed` (boolean), `comment` (optional per-item comment for failures).
- **D-06:** Review must reference a specific `DocumentVersion` id, not just `Document` id. This ensures reviewer approves the exact version submitted.
- **D-07:** Reviewer can only submit approval when all required checklist items are marked `passed: true`. Validation happens server-side.

### Reviewer Portal Layout
- **D-08:** Split view layout: left panel shows document version content, right panel shows QC checklist with pass/fail toggles and comment fields per item.
- **D-09:** Reviewer portal uses existing admin Card/Table/Button/Badge UI patterns with Vietnamese labels consistent with specialist and admin screens.
- **D-10:** Reviewer queue page shows document versions in `submitted_for_review` status assigned to the current reviewer, with request title, matter type, submission time, and specialist name.

### Revision Flow
- **D-11:** Reviewer can request revision by marking one or more checklist items as failed with optional per-item comments, plus optional general revision comment.
- **D-12:** Revision submission changes `DocumentVersion.status` back to `draft` (or a new `revision_required` status if cleaner), and moves request workflow through backend state machine to `revision_required`.
- **D-13:** Specialist sees revision feedback on their workbench: which checklist items failed, per-item comments, and general comment. Specialist can then generate new draft version.
- **D-14:** Previous review record and its checklist answers are preserved even after revision — audit trail is append-only.

### Approval Flow
- **D-15:** Reviewer approval marks `DocumentVersion.status` as `final` and sets `Review.status` to `approved`.
- **D-16:** Approval moves request workflow through backend transition to `approved` status. Frontend displays allowed transition; backend validates.
- **D-17:** Approval creates audit event with reviewer id, document version id, review id, and timestamp. No sensitive legal content in audit metadata.

### Security and Audit
- **D-18:** Reviewer can only see and review document versions assigned to them via server-side RBAC check. Reuse existing `canAccessRequest` and extend with review-specific checks.
- **D-19:** All review actions (start review, answer checklist item, approve, reject/revise) create append-only audit events.
- **D-20:** Specialist cannot see reviewer-only comments on checklist items until revision is requested. Customer never sees internal review data.

### Claude's Discretion
- Exact split view component layout and responsive behavior may follow existing patterns.
- Checklist seed data exact labels may be refined but must cover all 9 QC-LEG-01 criteria.
- Review submission confirmation UX (modal, inline, or redirect) may follow existing patterns.
- Exact Prisma model field names may follow existing schema naming conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/PROJECT.md` — Product vision, QC-LEG-01 reviewer checklist criteria (3 groups, 9 items), reviewer portal split-view requirement, legal accuracy constraints, workflow integrity.
- `.planning/REQUIREMENTS.md` — Phase 5 requirements REV-01 through REV-09.
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and phase boundary.

### Prior phase context (locked decisions)
- `.planning/phases/01-foundation/01-CONTEXT.md` — Workspace isolation, RBAC, audit trail, workflow state machine, request statuses including `pending_review`, `revision_required`, `approved`.
- `.planning/phases/02-intake/02-CONTEXT.md` — Structured intake data, matter type catalog, request creation.
- `.planning/phases/03-routing/03-CONTEXT.md` — Assignment model, specialist/reviewer assignment ids on LegalRequest, coordinator routing boundary.
- `.planning/phases/04-documents-vault/04-CONTEXT.md` — DocumentVersion model, template governance, draft generation, vault file metadata, submit-for-review action, specialist workbench.

### Source docs
- `docs/note.txt` — Original platform notes and E-Myth/SOP guidance.
- `docs/Có.docx` — QC-LEG-01 checklist criteria source, reviewer portal requirements, operational workflow.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prisma/schema.prisma` — Existing `Review` model (minimal: id, workspaceId, requestId, documentId, reviewerId), `DocumentVersion` model with status enum (`draft`, `submitted_for_review`, `final`), `Document` model, `VaultFile`, `WorkflowTransition`, `AuditEvent`.
- `src/lib/workflow/request-workflow.ts` — Backend state machine with `REQUEST_TRANSITIONS`, `getAllowedTransitions`, `transitionRequestStatus`. Already has `pending_review` and `revision_required` states.
- `src/lib/security/rbac.ts` — `canAccessRequest` checks assigned specialist/reviewer and coordinator/admin access. Reviewer-specific checks need extension.
- `src/lib/audit/audit.ts` — `recordAuditEvent` for append-only audit trail.
- `src/app/admin/components/ui.tsx` — `Button`, `Badge`, `Card`, `Table`, `PageHeader` define admin UI visual language.
- `src/app/specialist/requests/[requestId]/components/document-versions.tsx` — Existing component showing document version list with status badges and submit-for-review action.
- `src/app/specialist/requests/[requestId]/page.tsx` — Specialist workbench showing intake summary, vault files, document versions, and generate draft form.

### Established Patterns
- Next.js App Router server components/actions with TypeScript.
- Prisma schema is central source for domain persistence and migrations.
- UI copy is Vietnamese; code identifiers/enums remain English.
- Backend validates workflow transitions; UI displays allowed options as UX only.
- Audit metadata uses concise summaries, avoids sensitive legal content.
- Admin screens use card/table layout with consistent component library.

### Integration Points
- Extend `Review` Prisma model with status, documentVersionId, decision, comments.
- Add `ReviewChecklistAnswer` model linking review to checklist items.
- Add reviewer route under `src/app/reviewer/` or `src/app/admin/reviews/`.
- Add reviewer queue page, review detail page with split view.
- Add review service module under `src/lib/reviews/` with checklist seeding, review submission, approval, and revision logic.
- Extend specialist workbench to display revision feedback.
- Add tests for review authorization, checklist completion validation, approval/rejection workflow transitions, and audit events.

</code_context>

<specifics>
## Specific Ideas

- QC-LEG-01 checklist from PROJECT.md has 3 groups: Formal Requirements (template match, spelling/presentation, entity info match), Legal Content (legal basis current, clear rights/obligations, risk clauses, customer pain fit), Operational & Signing (signature area, confidentiality classification).
- Reviewer portal should feel like a quality gate: clear pass/fail per item, obvious approve/reject actions, no ambiguity about what's been checked.
- Revision feedback should be actionable: specialist knows exactly which item failed and why, can fix and resubmit.
- Keep review workflow transparent: both reviewer and specialist can see current review status and history.

</specifics>

<deferred>
## Deferred Ideas

- Dynamic checklist configuration per template — v2 enhancement when templates have specific QC needs.
- Inline document annotation/comments on specific text passages — defer to post-MVP.
- Reviewer performance metrics and review time tracking — Phase 7 ops.
- Customer delivery and signed download — Phase 6.
- AI-assisted pre-review risk flagging — v2 automation.

</deferred>

---

*Phase: 05-review*
*Context gathered: 2026-05-30*
