# Phase 6: delivery - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Mode:** --auto (default selections applied)

<domain>
## Phase Boundary

Phase 6 delivers secure customer delivery for approved final documents and request closure after delivery. Customers can view only their own approved final documents, download through short-lived signed links, receive ready notification, and never see internal notes, reviewer-only comments, or unapproved drafts.

This phase does not build e-signature integration, OCR, AI legal advice, in-app notification center, operations/SLA dashboards, or customer download analytics.

</domain>

<decisions>
## Implementation Decisions

### Customer Portal
- **D-01:** Add dedicated customer request detail route at `/customer/requests/[requestId]` for delivered/final document access, rather than adding delivery into internal specialist/reviewer/admin UI.
- **D-02:** Customer portal must use server-side session/RBAC checks and only show requests where the customer is the request creator in the same active workspace.
- **D-03:** UI should reuse existing Card/Button/Badge/PageHeader visual language with Vietnamese copy and minimal customer-facing workflow language.

### Final Document Visibility
- **D-04:** Customer sees only `DocumentVersion` records with status `final` and related `VaultFile` artifacts for their own request.
- **D-05:** Hide all draft, `submitted_for_review`, reviewer checklist/comment, internal notes, template input snapshots, and specialist workbench data from customer routes and APIs.
- **D-06:** Do not rely on frontend filtering for secrecy. Filtering must happen in server-side queries/services before data reaches UI.

### Signed Download Links
- **D-07:** Replace the current `requestVaultFileAccess()` stub with a real signed URL abstraction boundary. It may use an MVP local/dev fallback, but production path must not expose raw `storageKey`.
- **D-08:** Signed URL TTL is 15 minutes. Download responses should make expiry clear to customer.
- **D-09:** Add server-side download API route such as `/api/vault/[vaultFileId]/download` that validates `canAccessVaultFile`, verifies final-document visibility for customers, records audit, then returns or redirects to signed URL.
- **D-10:** Audit download/access events with identifiers and safe metadata only: vault file id, request id, actor id, action, expiry timestamp. Do not log legal content or raw storage key.

### Ready Notification
- **D-11:** MVP notification channel is email, using a lightweight provider abstraction. Resend is acceptable if dependency/config already fits, but planner may choose minimal adapter/stub if no email provider is configured.
- **D-12:** Notification triggers when request transitions to `delivered`, not merely when reviewer approves. Approval means final-ready; delivery means customer should be told.
- **D-13:** Email content includes request title, document filenames/list, customer portal link or download action link, and 15-minute expiry warning. Keep content simple; no complex template builder.
- **D-14:** No notification preferences or opt-out in MVP.

### Delivery and Close Flow
- **D-15:** Delivery transition remains backend workflow state machine: `approved` → `delivered` → `closed`.
- **D-16:** Specialist assigned to the request or coordinator/admin can mark an approved request as delivered if final documents exist.
- **D-17:** Specialist or coordinator/admin can close a delivered request. Customer download confirmation is not required before closure.
- **D-18:** Close action requires a reason and records audit/workflow transition. Delivery action should also create delivery audit event.
- **D-19:** Frontend can show allowed actions, but backend validates role, assignment, current status, final document existence, and transition legality.

### Claude's Discretion
- Exact download button placement may be inline in document list for simplicity.
- Exact close confirmation UI may use existing form/action patterns as long as reason is captured.
- Exact provider module names may follow existing `src/lib/documents` / `src/lib/*` style.
- Exact email text can be concise Vietnamese copy.

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/PROJECT.md` — Product vision, Legal Vault security constraints, reviewer-before-final constraint, workflow integrity, traceability.
- `.planning/REQUIREMENTS.md` — Phase 6 requirements DLV-01 through DLV-05.
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, UI hint, and phase boundary.

### Prior phase context (locked decisions)
- `.planning/phases/01-foundation/01-CONTEXT.md` — Workspace isolation, roles, server-side RBAC, request workflow states including `approved`, `delivered`, `closed`, append-only audit trail.
- `.planning/phases/02-intake/02-CONTEXT.md` — Customer-facing route patterns, request status visibility, private upload semantics.
- `.planning/phases/03-routing/03-CONTEXT.md` — Assignment model and coordinator/specialist role boundaries.
- `.planning/phases/04-documents-vault/04-CONTEXT.md` — DocumentVersion model, final document/vault artifact metadata, private storage boundary, signed URL abstraction requirement.
- `.planning/phases/05-review/05-CONTEXT.md` — Review approval marks exact `DocumentVersion` final and request `approved`; customer never sees internal review data.

### Source code references
- `prisma/schema.prisma` — `RequestStatus`, `DocumentVersionStatus`, `LegalRequest`, `Document`, `DocumentVersion`, `VaultFile`, `AuditEvent` models.
- `src/lib/workflow/request-workflow.ts` — Backend workflow transitions: `approved -> delivered -> closed` and transition authorization.
- `src/lib/security/rbac.ts` — Existing `canAccessRequest`, `canAccessVaultFile`, and server-side access patterns.
- `src/lib/documents/vault-service.ts` — Existing vault listing/metadata/access functions; `requestVaultFileAccess()` is current signed URL stub to harden.
- `src/app/specialist/requests/[requestId]/page.tsx` — Request detail/workbench layout patterns and status label copy.
- `src/app/admin/components/ui.tsx` — Shared Card/Button/Badge/PageHeader/Table UI patterns.

### Source docs
- `docs/note.txt` — Original Legal-as-a-Service workflow notes and SOP orientation.
- `docs/Có.docx` — Source context for reviewer/delivery/legal operations flow as referenced by project context.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/documents/vault-service.ts` — `listVaultFiles()`, `getVaultFileMetadata()`, `storeVaultFile()`, and `requestVaultFileAccess()` provide vault service starting point; current access URL is a stub and must be replaced/hardened.
- `src/lib/security/rbac.ts` — `canAccessRequest()` already lets customers access only requests they created; `canAccessVaultFile()` delegates through request access.
- `src/lib/workflow/request-workflow.ts` — Existing state machine already includes `approved -> delivered -> closed` but role authorization currently allows coordinator close only; planning may need to extend for assigned specialist delivery/close per decisions while preserving backend validation.
- `src/app/admin/components/ui.tsx` — Existing UI primitives should be reused for customer delivery list and close/deliver forms.
- `src/app/specialist/requests/[requestId]/page.tsx` — Existing request detail pattern shows status, intake, vault files, document versions; customer route should reuse structure but filter aggressively.
- `prisma/schema.prisma` — `DocumentVersionStatus.final`, `VaultFile.documentVersionId`, and `LegalRequest.status` support final-document delivery path.

### Established Patterns
- Next.js App Router server components/actions with TypeScript.
- Prisma is central persistence layer.
- UI copy is Vietnamese; enum/code identifiers remain English.
- Backend validates workflow transitions; frontend displays allowed actions only as UX.
- Audit metadata uses concise summaries and avoids sensitive legal content.
- Vault code already tries not to expose `storageKey` in list/metadata paths; delivery must preserve that boundary.

### Integration Points
- Add customer route under `src/app/customer/requests/[requestId]/page.tsx` or equivalent.
- Add/extend vault download API route under `src/app/api/vault/[vaultFileId]/download/route.ts`.
- Add final-document query/service helper that joins request, documents, document versions, and vault files while filtering to `DocumentVersionStatus.final`.
- Add delivery/close server actions or service functions that use `transitionRequestStatus()` and record audit.
- Add email notification adapter/service and trigger around delivered transition.
- Add tests for customer visibility filtering, forbidden draft/internal review exposure, signed URL expiry/audit, notification trigger, and close reason enforcement.

</code_context>

<specifics>
## Specific Ideas

- Delivery is proof of end-to-end MVP: approved version becomes customer-visible, downloadable securely, and request can close with audit trail.
- Keep customer portal simple: request title/status, final document list, download actions, expiry notice, and no internal operational details.
- Treat review approval as final-ready, not customer delivery. Customer notification waits until delivered state.
- Use email-only notification for MVP; in-app notifications and preferences are deferred.

</specifics>

<deferred>
## Deferred Ideas

### Ideas Noted for Later
- E-sign integration — v2 signature flow after delivery stabilizes.
- In-app notification center — future customer communication phase; email-only for MVP.
- Customer download tracking/confirmation — useful analytics/audit enhancement, not required for DLV-05 closure.
- Notification preferences/opt-out — post-MVP customer settings.

### Reviewed Todos (not folded)
None — no matching pending todos for Phase 6.

</deferred>

---

*Phase: 06-delivery*
*Context gathered: 2026-05-31*
