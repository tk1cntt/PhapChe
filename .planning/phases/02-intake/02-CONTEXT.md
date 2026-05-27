# Phase 2: intake - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers customer-facing structured intake for legal requests: service type selection, guided questions, structured answer storage with schema version, supporting file upload attachment to request, customer status visibility, and unsupported-request triage marking.

This phase does not build specialist routing, capability matrix, document generation, reviewer QC, Legal Vault version history beyond upload metadata needed for intake, final delivery, OCR, e-sign, billing, or AI legal advice.

</domain>

<decisions>
## Implementation Decisions

### Intake Entry and Flow
- **D-01:** Use chat/form hybrid flow: customer experience should feel like guided chat, but implementation output must be structured fields, not raw conversation only.
- **D-02:** Customer starts by selecting a service/matter type from a small seeded MVP catalog; unsupported/unknown service types route to human triage.
- **D-03:** Keep Phase 2 intake focused on submission flow and status visibility. No AI legal reasoning or automatic legal conclusion.

### Structured Intake Data
- **D-04:** Store intake answers as structured data tied to request plus schemaVersion so later template/document phases can snapshot exact inputs.
- **D-05:** Each matter type has its own question schema. MVP may seed representative legal services from source docs: agency contract, labor contract, trademark registration.
- **D-06:** Required question validation happens before intake_submitted; incomplete answers stay in draft_intake.
- **D-07:** Preserve enough labels/metadata with answers for specialist readability, not only machine keys.

### Request Status and Triage
- **D-08:** Use existing backend workflow states from Phase 1: create request in draft_intake, submit to intake_submitted, coordinator/system may move unsupported requests to 	riage.
- **D-09:** Unsupported requests are not rejected automatically; mark clearly as requiring human triage.
- **D-10:** Customer sees plain Vietnamese status labels and next-step guidance, not raw enum names.

### File Uploads
- **D-11:** Customer can upload supporting files during intake and attach them to the request.
- **D-12:** Store upload records through existing request/workspace-linked VaultFile foundation model for now, with private storage semantics planned; do not expose public file URLs.
- **D-13:** File upload actions must enforce workspace/request authorization server-side and create audit events with metadata summary only, not sensitive document contents.
- **D-14:** OCR or automatic field extraction from uploaded files is out of scope for Phase 2.

### Customer UI
- **D-15:** Add customer-facing route separate from admin foundation, using existing card/table/button visual language but optimized for simple guided request submission.
- **D-16:** Intake screens should show progress through questions, upload area, review/submit step, and submitted status view.
- **D-17:** Customer status view must be read-only; all status changes remain backend workflow transitions.

### Security and Audit
- **D-18:** Reuse Phase 1 server-side RBAC/workspace checks for every intake, upload, and status-read operation.
- **D-19:** Audit important intake events: request created, intake answer saved/submitted, file uploaded, unsupported request marked for triage.
- **D-20:** Avoid storing legal content in audit metadata; use identifiers, matter type, counts, filenames, hashes/summaries where needed.

### Claude's Discretion
- Exact UI component decomposition, form library choice, and API/server action shape may follow existing Next.js patterns.
- Exact seeded service labels/questions may be minimal but must demonstrate at least one supported service and one unsupported/triage path.
- Exact storage backend can remain local/mock-compatible if production S3/R2 integration belongs to later Vault hardening, but access semantics must stay private.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- .planning/PROJECT.md — Product vision, chat/form hybrid intake direction, legal accuracy and security constraints.
- .planning/REQUIREMENTS.md — Phase 2 requirements INT-01 through INT-06.
- .planning/ROADMAP.md — Phase 2 goal, boundary, and success criteria.
- .planning/phases/01-foundation/01-CONTEXT.md — Locked foundation decisions for roles, workspace isolation, request statuses, workflow transitions, and audit trail.

### Source docs
- docs/note.txt — Original service examples and E-Myth/SOP guidance for guided legal intake.
- docs/Có.docx — Source material referenced by project context; informs legal service workflow and later reviewer constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- prisma/schema.prisma — Existing LegalRequest, RequestStatus, VaultFile, AuditEvent, Workspace, User, and role models already cover request shell, status, upload metadata, audit linkage, and tenant isolation.
- src/lib/workflow/request-workflow.ts — Existing REQUEST_TRANSITIONS, getAllowedTransitions, 	ransitionRequestStatus, and role-based transition checks must remain source of truth for status changes.
- src/lib/security/rbac.ts — Existing canAccessRequest, canAccessVaultFile, and workspace membership checks should guard intake reads/writes and uploads.
- src/lib/audit/audit.ts — Existing ecordAuditEvent should record intake and upload audit events with concise metadata.
- src/app/admin/components/ui.tsx — Existing Button, Badge, Card, Table, and PageHeader provide simple design language to reuse or mirror.

### Established Patterns
- Next.js App Router under src/app with TypeScript.
- Prisma PostgreSQL schema is current data model source.
- UI copy currently Vietnamese; continue customer-facing Vietnamese labels.
- Admin screens currently demonstrate static/sample UI; Phase 2 should add real intake persistence paths where needed for requirements.
- Workflow integrity pattern: UI may render allowed transitions, but backend validates transitions.

### Integration Points
- Add intake-specific persistence around LegalRequest rather than bypassing it.
- Add request answer schema/data fields or related model(s) to store structured intake with schema version.
- Add customer-facing route(s) for service selection, guided questions, upload, submit, and status view.
- Add upload handling connected to VaultFile and audit events.
- Add tests around structured intake save/submit, unsupported triage marking, upload authorization, and customer status visibility.

</code_context>

<specifics>
## Specific Ideas

- Initial service examples should reflect project notes: soạn hợp đồng đại lý, soạn hợp đồng lao động, đăng ký nhãn hiệu.
- Agency contract sample questions can include partner name, commission/discount rate, contract term, and special requirements.
- Unsupported requests should produce triage state/flag and human-friendly message: hồ sơ cần chuyên viên phân loại.
- Keep intake as operations intake, not legal advice output.

</specifics>

<deferred>
## Deferred Ideas

- Capability Matrix and specialist/reviewer assignment suggestions — Phase 3 outing.
- Template-driven document generation from intake answers — Phase 4 documents-vault.
- OCR/file content extraction from supporting documents — v2 automation.
- AI intake summarization or draft generation — v2 automation with guardrails.
- E-sign handoff after approval — v2 signature.

</deferred>

---

*Phase: 02-intake*
*Context gathered: 2026-05-27*
