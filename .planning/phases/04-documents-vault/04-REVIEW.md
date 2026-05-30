---
status: issues_found
files_reviewed: 19
depth: standard
findings:
  critical: 3
  warning: 4
  info: 5
  total: 12
---

# Code Review: Phase 04 — documents-vault

**Reviewed:** 2026-05-29 (updated 2026-05-30)
**Depth:** standard
**Files Reviewed:** 19

**Summary:** Review 15 files (4 services, 3 tests, 4 pages, 3 components, 1 schema). Found bugs, authorization gaps, and code quality issues. Most critical: admin mutations lack workspace membership checks, signed URL stub has no real security, params/searchParams not awaited in Next.js 15.

## Critical

### CR-01: Vault audit event uses wrong field for workspaceId
**File:** `src/lib/documents/vault-service.ts:100`
`getVaultFileMetadata` writes audit event with `workspaceId: vaultFile.fileKind ?? ''` — uses `fileKind` (e.g. 'intake_upload') instead of actual workspaceId. Audit records have wrong workspaceId, breaking audit trail traceability.
**Fix:** Add `workspaceId: true` to select at line 83-95, then use `vaultFile.workspaceId` at line 100.

### CR-02: Admin mutation functions lack workspace membership check
**File:** `src/lib/documents/template-service.ts:60, 100, 123, 153, 183, 213`
Functions `createTemplate`, `updateTemplate`, `approveTemplate`, `publishTemplate`, `deprecateTemplate`, `createNewVersion` only call `isAdmin(session)` without `canAccessWorkspace(session, workspaceId)`. Admin in workspace A can operate on templates in workspace B.
**Fix:** Add `canAccessWorkspace` check to each admin function.

### CR-03: Signed URL stub has no real security
**File:** `src/lib/documents/vault-service.ts:144`
`requestVaultFileAccess` creates URL with `token=stub` — fixed token, no cryptographic signing. Anyone knowing vaultFileId can construct the URL. Critical for legal document system.
**Fix:** Use HMAC-based token with expiry.

## Warning

### WR-01: Duplicate `document` key in Prisma select
**File:** `src/lib/documents/draft-service.ts:199-219`
Object select in `listDocumentVersions` has `document` key appearing twice. Second key silently overwrites first.

### WR-02: Dead code — unused `templates` variable in generateDraft
**File:** `src/lib/documents/draft-service.ts:75`
`getTemplatesForGeneration` call returns value never read. Extra DB query with empty string matterTypeKey.

### WR-03: publishTemplate allows publish from draft (bypasses approval)
**File:** `src/lib/documents/template-service.ts:162`
Only blocks `published` and `deprecated`, allows direct publish from `draft`.

### WR-04: vault-service test seed assigns wrong otherCustomerId
**File:** `src/lib/documents/vault-service.test.ts:120`
`otherCustomerId: customer.id` uses user from main workspace, not otherWorkspace. Cross-workspace RBAC test is incorrect.

## Info

### IN-01: Duplicate formatDate function across 4 files
Files: `document-versions.tsx:32`, `vault-files.tsx:39`, specialist `page.tsx:40`, admin templates `page.tsx:29`

### IN-02: isAdmin/session role check pattern repeated 10+ times
Files: `template-service.ts`, admin pages

### IN-03: Status label maps duplicated between pages
Files: template detail page, templates list page, document-versions.tsx

### IN-04: VariableSchema type cast unsafe (double `as unknown as`)
**File:** specialist `page.tsx:200`

### IN-05: Array index as React key in variable schema builder
**File:** `src/app/admin/templates/new/variable-schema-builder.tsx:54`
`rows.map((row, i) => <tr key={i} ...>)` uses array index as key. Acceptable for append-only list with stable ordering.

## Plan 04-04 Review (2026-05-30)

Plan 04-04 changes reviewed: `schema.prisma`, `page.tsx`, `actions.ts`, `variable-schema-builder.tsx`.
**No new findings.** Gap closure changes are clean — schema fields nullable for backward compatibility, server-side validation of variableSchema, safe non-null assertions on validated fields.
