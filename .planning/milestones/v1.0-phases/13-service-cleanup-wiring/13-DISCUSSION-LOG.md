# Phase 13: service-cleanup-wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 13-service-cleanup-wiring
**Mode:** Auto (all gray areas auto-resolved)
**Areas discussed:** listDocumentVersions wiring, storeVaultFile adoption, Audit page real data

---

## listDocumentVersions Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Replace inline Prisma with listDocumentVersions | Specialist page calls existing service function instead of raw Prisma query | ✓ (auto) |

**User's choice:** Auto-selected (recommended default)
**Notes:** The specialist page at `src/app/specialist/requests/[requestId]/page.tsx` has inline Prisma at lines 60-76 and template enrichment at lines 106-118 which duplicate `listDocumentVersions` logic. Replacing with the existing service function consolidates data access and eliminates maintenance burden.

---

## storeVaultFile Adoption

| Option | Description | Selected |
|--------|-------------|----------|
| Add optional `tx` param to storeVaultFile | Modify storeVaultFile to accept optional Prisma.TransactionClient — preserves atomicity for draft-service's outer transaction | ✓ (auto) |

**User's choice:** Auto-selected (recommended default)
**Notes:** Two call sites adopt storeVaultFile:
1. `upload-service.ts` (no outer transaction) — simple replacement
2. `draft-service.ts` (inside `prisma.$transaction`) — needs optional `tx` parameter on `storeVaultFile`

---

## Audit Page Real Data

| Option | Description | Selected |
|--------|-------------|----------|
| Direct Prisma query in page | Match existing pattern (specialist detail page) with `prisma.auditEvent.findMany` | ✓ (auto) |

**User's choice:** Auto-selected (recommended default)
**Notes:** Replace `const auditEvents = [...]` hardcoded array with real Prisma query. Add `requireAppSession()` for auth. Filter by workspace if applicable.

---

## Claude's Discretion

- Implementation detail of optional `tx` parameter for `storeVaultFile`
- Field ordering in audit event query
- Empty state handling for audit page

## Deferred Ideas

- `deleteVaultFile` orphaned — no requirement demands delete UI
- `getVaultFileMetadata` orphaned — `listVaultFiles` used instead
- `answerChecklistItem` orphaned — design choice (bulk-submit on approve/reject)
