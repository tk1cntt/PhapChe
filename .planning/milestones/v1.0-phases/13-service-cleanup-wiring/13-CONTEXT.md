# Phase 13: service-cleanup-wiring - Context

**Gathered:** 2026-06-05 (auto mode)
**Status:** Ready for planning
**Source:** Gap closure from v1.0-MILESTONE-AUDIT.md (orphaned exports, mock data)

<domain>
## Phase Boundary

Clean up three orphaned service exports and mock data items identified in the milestone audit:

1. **Wire `listDocumentVersions`** — Specialist workbench currently queries Prisma directly instead of calling the existing `listDocumentVersions` service function in `draft-service.ts`.
2. **Adopt `storeVaultFile` wrapper** — `draft-service.ts` and `upload-service.ts` call raw `prisma.vaultFile.create` + manual `recordAuditEvent` instead of the `storeVaultFile` wrapper in `vault-service.ts` which already includes RBAC + audit.
3. **Replace `/admin/audit` mock data** — Admin audit page renders hardcoded mock data instead of querying real `AuditEvent` records from Prisma.

This phase does **not** add new features, change the review service layer, modify folder/tag classification, or alter any backend workflow rules.

</domain>

<decisions>
## Implementation Decisions

### listDocumentVersions Wiring
- **D-01:** Replace the inline Prisma query in `src/app/specialist/requests/[requestId]/page.tsx` with the existing `listDocumentVersions` from `src/lib/documents/draft-service.ts`. The inline query at lines 60-76 (Prisma `findUnique` with `documents.documentVersions` select) and the template enrichment at lines 106-118 are replaced by a single `listDocumentVersions({ session, requestId })` call.
- **D-02:** The `DocumentVersionsList` component interface remains unchanged — only the data source changes. `listDocumentVersions` already returns template labels and enrichment.
- **D-03:** The unused `templateMap` enrichment logic in the specialist page is removed after the replacement.

### storeVaultFile Adoption
- **D-04:** In `src/lib/intake/upload-service.ts`, replace raw `tx.vaultFile.create` (line 42) + manual `recordAuditEvent` (lines 51-63) with a single call to `storeVaultFile` from `src/lib/documents/vault-service.ts`. No transaction nesting issue — upload-service has no outer `$transaction`.
- **D-05:** In `src/lib/documents/draft-service.ts`, the raw `tx.vaultFile.create` (line 147) is inside a `prisma.$transaction` callback. **Chosen approach:** Modify `storeVaultFile` to accept an optional `Prisma.TransactionClient` parameter. When provided, use it instead of the default `prisma` singleton — preserving atomicity of the outer transaction.
- **D-06:** The `storeVaultFile` input already supports all fields used by both services (`requestId`, `storageKey`, `filename`, `fileKind`, `source`, `documentVersionId`, `size`, `contentType`, `correlationId`). No input schema changes needed.

### Audit Page Real Data
- **D-07:** Replace hardcoded `const auditEvents = [...]` mock array in `src/app/admin/audit/page.tsx` with a Prisma query: `prisma.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })`.
- **D-08:** Add `requireAppSession()` for auth (same pattern as other admin pages). Filter by `session.activeWorkspaceId` if present.
- **D-09:** Keep the same table layout and column format — only the data source changes. Audit event data is already safe (metadataSummary only, no raw content/PII).
- **D-10:** No new service function needed — direct Prisma query in the page matches existing patterns (e.g., specialist detail page).

### Claude's Discretion
- Exact implementation of the optional transaction parameter for `storeVaultFile` (optional `tx` param with type `Prisma.TransactionClient | null`)
- Field ordering in audit event query
- Error handling for the audit page (empty state handling)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit findings
- `.planning/v1.0-MILESTONE-AUDIT.md` — Integration findings table: `listDocumentVersions` orphaned (MEDIUM), `storeVaultFile` orphaned (LOW), `/admin/audit` mock data (LOW)
- `.planning/ROADMAP.md` — Phase 13 goal and success criteria

### Existing implementation anchors
- `src/lib/documents/draft-service.ts` — `listDocumentVersions` function (line 187-238), `generateDraft` with raw `vaultFile.create` inside transaction (line 147)
- `src/lib/documents/vault-service.ts` — `storeVaultFile` wrapper with RBAC + audit (line 217-271)
- `src/lib/intake/upload-service.ts` — `attachIntakeFile` with raw `vaultFile.create` (line 42)
- `src/app/specialist/requests/[requestId]/page.tsx` — Specialist detail page with inline Prisma query (lines 60-76, 106-118)
- `src/app/admin/audit/page.tsx` — Admin audit page with hardcoded mock data (lines 4-23)
- `src/lib/audit/audit.ts` — `recordAuditEvent` function and `AuditEvent` model
- `src/lib/prisma.ts` — Prisma singleton

### Specialist page components (unchanged interfaces)
- `src/app/specialist/requests/[requestId]/components/document-versions.tsx` — `DocumentVersionsList` client component consuming version data

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `listDocumentVersions` in `src/lib/documents/draft-service.ts` — tested service function that enriches versions with template labels; currently unused by UI
- `storeVaultFile` in `src/lib/documents/vault-service.ts` — tested wrapper with RBAC check + audit event; currently unused by draft/upload services
- `requireAppSession` in `src/lib/security/session.ts` — auth pattern used across all admin pages

### Established Patterns
- Admin pages under `src/app/admin/` use server-rendered components with direct Prisma queries (specialist detail page, ops pages)
- Service functions in `src/lib/` follow the `({ session, ...input }) => {}` pattern
- Audit events are already safe by design — `recordAuditEvent` enforces no raw content, uses `metadataSummary` only

### Integration Points
- Specialist workbench (`/specialist/requests/[requestId]`) already imports from `draft-service.ts` via `getTemplatesForGeneration` — adding `listDocumentVersions` import is straightforward
- All files are within the same `src/` tree — no cross-package boundaries
- `storeVaultFile` already has the same `vaultFile.create` + `recordAuditEvent` pattern as the raw code it replaces

</code_context>

<specifics>
## Specific Ideas

- The audit page fix is the simplest: replace `const auditEvents = [...]` with `const auditEvents = await prisma.auditEvent.findMany(...)`. Make the page `async` and export as default function. No page layout changes needed.
- For `storeVaultFile` adoption in `draft-service.ts`: the function signature change is `storeVaultFile(input, tx?)` — adding an optional second parameter. When `tx` is provided, `prisma.$transaction` inside storeVaultFile is skipped and `tx` is used directly for both `vaultFile.create` and `recordAuditEvent`.
- `listDocumentVersions` already handles RBAC (`canAccessRequest`) — no auth logic duplication needed.

</specifics>

<deferred>
## Deferred Ideas

- **`deleteVaultFile` orphaned** (from milestone audit, LOW) — no requirement demands delete UI; kept as available service function
- **`getVaultFileMetadata` orphaned** (from milestone audit, LOW) — not consumed; `listVaultFiles` used instead; out of scope for this phase
- **`answerChecklistItem` orphaned** (INFO) — design choice to bulk-submit answers on approve/reject; intentional
- None — discussion stayed within phase scope

### Reviewed Todos (not folded)
- No pending todos matched Phase 13 scope

</deferred>

---

*Phase: 13-service-cleanup-wiring*
*Context gathered: 2026-06-05 (auto mode)*
