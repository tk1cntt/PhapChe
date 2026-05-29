# Phase 4: documents-vault - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning
**Mode:** auto-selected defaults

<domain>
## Phase Boundary

Phase 4 delivers document template governance, draft generation from approved templates and structured intake answers, and versioned Legal Vault storage for uploads, drafts, final documents, and review artifacts.

This phase does not build reviewer QC portal/checklist decisions, customer delivery/download UX, e-signature provider integration, OCR, AI legal advice, advanced clause intelligence, or operations/SLA dashboards.

</domain>

<decisions>
## Implementation Decisions

### Template Governance
- **D-01:** Templates are workspace-scoped and matter-type-scoped records with version, status, variable schema, and immutable published versions.
- **D-02:** Template statuses should be explicit: `draft`, `approved`, `published`, `deprecated`. Only `approved` or `published` templates may be used for draft generation.
- **D-03:** Published templates cannot be edited in place. Any change creates a new version linked to the prior template identity/version lineage.
- **D-04:** Admin/coordinator manages templates in an internal admin screen using existing Card/Table/Button/Badge UI patterns and Vietnamese labels.

### Draft Generation
- **D-05:** Specialist generates drafts from a selected approved/published template using structured intake answers from `IntakeSubmission`, not raw chat text.
- **D-06:** Generation must persist an input snapshot: template version, variable values, intake answer snapshot, request id, workspace id, and actor id.
- **D-07:** MVP generation can be deterministic placeholder replacement / structured text assembly. No AI drafting or legal reasoning in this phase.
- **D-08:** Missing required template variables should block generation with clear Vietnamese error messages. Optional variables may render blank or default text by planner discretion.

### Document Versioning
- **D-09:** Introduce document versions as first-class records rather than overwriting `Document` rows. Each generated draft creates a new immutable version.
- **D-10:** Document version statuses should be minimal for Phase 4: `draft`, `submitted_for_review`, `final`. Phase 5 owns reviewer approval/rejection details.
- **D-11:** Submitting for review must reference a specific document version and move request workflow only through backend transition rules.
- **D-12:** Final documents may be represented in schema for forward compatibility, but customer delivery UI remains Phase 6.

### Legal Vault Storage
- **D-13:** Extend `VaultFile` metadata to cover file kind, version, source, storage key, filename, size/content-type if available, and relation to request/document version where applicable.
- **D-14:** Vault entries should be private by default and always checked server-side with existing RBAC helpers before preview/download/action.
- **D-15:** File actions in Phase 4 should log audit events for upload, generated draft creation, preview/download metadata access where implemented, and delete/deprecate actions if implemented.
- **D-16:** Specialist request detail should grow into a workbench showing intake summary, uploaded files metadata, available templates, generated draft versions, and submit-for-review action.

### Security and Traceability
- **D-17:** Never expose raw `storageKey` as a user-facing download URL. If a file link is needed, use a short-lived signed URL abstraction; implementation may be stubbed/local in MVP but must preserve boundary.
- **D-18:** Every generated document version must store `templateId`/`templateVersion` and input snapshot so later review approves the exact version generated.
- **D-19:** Keep sensitive intake answers out of audit metadata. Audit logs may include ids, template key/version, document version id, action, and short reason/status.

### Claude's Discretion
- Exact Prisma model names and enums may follow existing schema style as long as requirements DOC-01..DOC-06 and VLT-01..VLT-05 are traceable.
- Exact document content format may be plain text/HTML persisted as metadata or generated artifact for MVP; do not overbuild DOCX/PDF rendering unless existing stack makes it trivial.
- Exact storage adapter may remain local/stubbed if private boundary and metadata/audit are preserved.
- Exact admin/workbench route names may follow existing App Router conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/PROJECT.md` — Product vision, Legal Vault constraints, template governance, traceability, security, reviewer-before-final constraints.
- `.planning/REQUIREMENTS.md` — Phase 4 requirements DOC-01 through DOC-06 and VLT-01 through VLT-05.
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and phase boundary.

### Prior phase context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Locked decisions for workspace isolation, RBAC, audit trail, workflow state machine.
- `.planning/phases/02-intake/02-CONTEXT.md` — Structured intake, file upload metadata, request status, customer visibility boundaries.
- `.planning/phases/03-routing/03-CONTEXT.md` — Specialist assigned queue/detail boundary and no drafting until Phase 4.
- `.planning/phases/03-routing/03-VERIFICATION.md` — Current routing implementation status, specialist detail behavior, known answerLabels array/object UX note.

### Source docs
- `docs/note.txt` — Original SOP/template-driven legal service notes.
- `docs/Có.docx` — Source context for draft generation, reviewer checklist, Legal Vault, specialist workflow.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prisma/schema.prisma` — Existing `Document`, `VaultFile`, `Review`, `LegalRequest`, `IntakeSubmission`, workflow and audit models are starting point but too thin for versioned templates/drafts.
- `src/lib/security/rbac.ts` — Existing `canAccessRequest`, `canAccessDocument`, `canAccessVaultFile` must gate document/vault reads and writes.
- `src/lib/intake/upload-service.ts` — Existing upload path writes private `VaultFile` metadata and audit event; extend this pattern for generated drafts and vault artifacts.
- `src/app/specialist/requests/[requestId]/page.tsx` — Natural workbench integration point for specialist draft generation and vault metadata.
- `src/app/admin/components/ui.tsx` — Reuse `Card`, `Table`, `Button`, `Badge`, `PageHeader` for template admin and specialist workbench.
- `src/lib/workflow/request-workflow.ts` — Source of truth for status transitions; submit-for-review must use backend workflow rules.
- `src/lib/audit/audit.ts` — Use for template/document/vault actions with safe metadata summaries.

### Established Patterns
- Next.js App Router server components/actions; prefer server-side reads/writes and form actions over client-heavy state.
- Prisma schema is central source for domain persistence.
- UI copy is Vietnamese; code identifiers/enums remain English.
- Admin screens use card/table visual language and server-side auth/session checks.
- Audit metadata is concise and avoids sensitive legal content.
- Files are currently metadata-only; no public storage integration exists yet.

### Integration Points
- Add template admin under internal/admin route.
- Add document/vault service module(s) under `src/lib/documents` or `src/lib/vault` following existing service test style.
- Extend specialist detail page into drafting/vault workbench for assigned requests.
- Extend schema for template, document version, template variable snapshot, and vault artifact metadata.
- Add seed/demo template for at least one existing matter type such as `labor_contract`.

</code_context>

<specifics>
## Specific Ideas

- Keep Phase 4 pragmatic: prove template → draft → versioned vault artifact → submit-for-review path before adding AI, DOCX/PDF rendering, or e-signature.
- Use deterministic template variables so reviewer later can trace exact input-to-output mapping.
- Treat Legal Vault as private metadata + access boundary first; real object storage/signed URL implementation can be minimal as long as interface is safe.
- Specialist workbench should show uploaded intake files as metadata, generated draft versions, and next action toward review.

</specifics>

<deferred>
## Deferred Ideas

- Reviewer split-view checklist and approval/rejection — Phase 5.
- Customer download/delivery and signed final document access — Phase 6.
- OCR and AI drafting/summarization — v2 automation.
- E-signature provider integration — v2 signature.
- Advanced template editor, clause library, DOCX/PDF fidelity, and rich inline comments — defer unless needed for MVP path.

</deferred>

---

*Phase: 04-documents-vault*
*Context gathered: 2026-05-29*
