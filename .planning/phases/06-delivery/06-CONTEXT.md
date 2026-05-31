# Phase 6: delivery - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver approved final documents securely to customers and close requests. Customer sees only approved final documents via short-lived signed URLs. Internal notes, reviewer comments, and drafts stay hidden. Customer notified when ready. Request closed with audit trail.
</domain>

<decisions>
## Implementation Decisions

### Customer Portal Location
- **D-01:** Customer portal at `/customer/requests/[requestId]` — dedicated route, not tab in shared UI
- Reuses existing request pages structure but filtered to `role=customer`

### Final Document Filtering
- **D-02:** Final documents identified by `request.status = 'approved'` — documentVersion status 'approved' is implicit when request transitions to approved
- Customer sees documents attached to their own requests only (RBAC via `canAccessRequest` with customer role)
- Internal notes, reviewer comments, drafts stay hidden by RBAC — no special filtering logic needed

### Download URL Implementation
- **D-03:** Use real signed URL with storage provider (R2/S3) — current stub in `vault-service.ts:requestVaultFileAccess` needs real implementation
- Signed URL TTL: 15 minutes (matches existing stub)
- Download API route: `/api/vault/[vaultFileId]/download` — validates RBAC, generates provider signed URL

### Notification Channel
- **D-04:** Email notification via Resend — lightweight MVP choice, no complex email builder needed
- Notification triggered when request transitions `delivered`
- Email contains: request title, document list, download link (short-lived), expiry warning

### Close Request Flow
- **D-05:** Specialist or coordinator can close request after delivery (status `delivered` → `closed`)
- Customer download confirmation NOT required to close — auditor sees delivery audit event as proof
- Close action requires reason (audit requirement)

### Claude's Discretion
- Download button UI (inline vs modal) — use inline for simplicity
- Close request confirmation dialog style — standard confirmation with reason field
- Document list display format (table vs cards) — follow existing patterns in specialist/reviewer portals

### Folded Todos
None

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Workflow & Security
- `src/lib/workflow/request-workflow.ts` — status transitions, `delivered` and `closed` states
- `src/lib/security/rbac.ts` — `canAccessRequest`, `canAccessVaultFile` for RBAC enforcement
- `src/lib/documents/vault-service.ts` — `requestVaultFileAccess` stub needing real implementation

### Existing Patterns
- `src/app/specialist/requests/[requestId]/page.tsx` — existing request detail page (follow layout pattern)
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` — split-view pattern

### Requirements
- `.planning/REQUIREMENTS.md` §Delivery — DLV-01, DLV-02, DLV-03, DLV-04, DLV-05

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `vault-service.ts` `requestVaultFileAccess()` — stub already exists, needs real signed URL provider
- `transitionRequestStatus()` in `request-workflow.ts` — handles `delivered` and `closed` transitions
- RBAC functions — `canAccessRequest`, `canAccessVaultFile` already exist

### Established Patterns
- Page structure: `src/app/[role]/requests/[requestId]/page.tsx` — customer follows same pattern at `/customer/`
- Status transitions via backend workflow, never hardcoded in frontend
- Audit events recorded for all state changes

### Integration Points
- Customer portal `/customer/` needs new route group
- Download API route `/api/vault/[vaultFileId]/download` — currently stub
- Notification trigger: `request-workflow.ts` after `delivered` transition

</codebase_context>

<specifics>
## Specific Ideas

- No specific reference designs — follow existing specialist portal patterns for consistency
- Email template: simple text email with document list and download link
- No notification preferences in MVP — all notifications sent, no opt-out

</specifics>

<deferred>
## Deferred Ideas

### Ideas Noted for Later
- **E-sign integration** — belongs in Phase 7+ after delivery workflow stabilizes
- **In-app notification center** — email-only for MVP, in-app notifications future phase
- **Customer download tracking** — track if customer actually downloaded, not just notified

### Reviewed Todos (not folded)
None — discussion stayed within phase scope

</deferred>

---

*Phase: 6-delivery*
*Context gathered: 2026-05-31*
*Mode: --auto (default selections applied)*