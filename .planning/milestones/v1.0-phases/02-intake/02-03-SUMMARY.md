---
phase: 02-intake
plan: 03
subsystem: uploads
tags: [prisma, vault-file, rbac, audit, intake, node-crypto]

requires:
  - phase: 01-foundation
    provides: LegalRequest, VaultFile, RBAC, audit trail, workspace isolation
  - phase: 02-intake plan 01
    provides: Intake request domain foundation
provides:
  - Private intake file attachment service for request-linked VaultFile metadata
  - Server-side request authorization before upload attachment
  - Audit-safe upload metadata summaries with filename, size, and hash only
affects: [intake-ui, legal-vault, customer-uploads]

tech-stack:
  added: []
  patterns:
    - Request-scoped VaultFile creation derives workspaceId server-side
    - Upload return payload omits storageKey and public URL
    - Upload audit metadata excludes document contents

key-files:
  created:
    - src/lib/intake/upload-service.ts
    - src/lib/intake/upload-service.test.ts
  modified: []

key-decisions:
  - "Use existing VaultFile storageKey field for private semantics; do not add schema fields for size/contentType in this plan."
  - "Hash uploaded bytes for audit summary but do not persist or expose document contents."

patterns-established:
  - "attachIntakeFile checks canAccessRequest before loading request-owned workspace metadata."
  - "VaultFile storageKey uses private/intake workspace/request prefix and never appears in return payload."

requirements-completed: [INT-04]

duration: 18min
completed: 2026-05-27
---

# Phase 02 Plan 03: Private Intake Upload Service Summary

**Request-authorized intake uploads create private VaultFile metadata with audit-safe filename, size, and hash summaries**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-27T17:05:00Z
- **Completed:** 2026-05-27T17:23:04Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Added `attachIntakeFile` service for private intake file attachment to existing `LegalRequest` and `VaultFile` records.
- Enforced server-side request authorization through `canAccessRequest` and derived `workspaceId` from persisted request data.
- Recorded upload audit events with metadata summary only: filename, size, and SHA-256 hash; no document content.
- Verified return payload exposes `vaultFileId`, filename, size, content type, and private flag only; no `storageKey` or public URL.

## Task Commits

1. **Task 1 RED: Add failing upload service tests** - `99bd664` (test)
2. **Task 1 GREEN: Implement private upload attachment service** - `d9f58bc` (feat)

**Plan metadata:** pending final docs commit

_Note: TDD task used separate test and feature commits._

## Files Created/Modified

- `src/lib/intake/upload-service.ts` - Adds `attachIntakeFile` with RBAC guard, private `VaultFile` creation, SHA-256 hash calculation, and audit write.
- `src/lib/intake/upload-service.test.ts` - Verifies authorized upload result, cross-workspace denial, private storageKey semantics, and audit-safe metadata.

## Decisions Made

- Used current `VaultFile` schema without adding size/contentType columns because plan only requires metadata row and private semantics; return can include size/content type from upload input.
- Used local/mock-compatible private storage semantics through generated `storageKey`, not S3/R2 or public file serving.
- Used SHA-256 of uploaded bytes for audit summary to identify payload without storing contents in audit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used POSIX environment assignment for verification commands**
- **Found during:** Task 1 verification
- **Issue:** Bash tool ran POSIX shell; PowerShell-style `$env:DATABASE_URL=...` failed and tests lacked `DATABASE_URL`.
- **Fix:** Re-ran verification with `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" npx tsx ...`.
- **Files modified:** None
- **Verification:** `npx tsx src/lib/intake/upload-service.test.ts` passed with inline `DATABASE_URL`.
- **Committed in:** Not applicable; command correction only.

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Verification command correction only. No product scope change.

## Issues Encountered

- RED gate failed as expected because `./upload-service` did not exist.
- First GREEN verification used wrong shell environment syntax, then passed with POSIX inline env.

## Verification

- `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" npx tsx src/lib/intake/upload-service.test.ts` — passed
- `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" npm run typecheck` — passed

## Known Stubs

None.

## Threat Flags

None beyond plan threat model. Upload service trust boundaries and mitigations match planned RBAC, private return payload, and audit metadata controls.

## User Setup Required

None.

## Next Phase Readiness

- Plan 02 `/intake` server action can import and call `attachIntakeFile`.
- Later Vault hardening can replace mock/local private storageKey generation with S3/R2 signed upload flow without exposing public URLs.

## Self-Check: PASSED

- Created files exist: `src/lib/intake/upload-service.ts`, `src/lib/intake/upload-service.test.ts`.
- Commits exist: `99bd664`, `d9f58bc`.

---
*Phase: 02-intake*
*Completed: 2026-05-27*
