---
phase: 13-service-cleanup-wiring
plan: 01
type: execute
tags:
  - gap-closure
  - service-wiring
  - specialist
  - document-versions
depends_on: []
provides:
  - "Specialist workbench uses listDocumentVersions service function"
  - "listDocumentVersions orphan export consumed (MEDIUM gap closure)"
affects:
  - src/app/specialist/requests/[requestId]/page.tsx
tech-stack:
  added: []
  patterns:
    - "Service function call with .catch(() => []) error handling"
    - "Data mapping from flat service response to nested component shape"
key-files:
  created: []
  modified:
    - src/app/specialist/requests/[requestId]/page.tsx
decisions:
  - "D-01: Replace inline Prisma query with listDocumentVersions({ session, requestId })"
  - "D-02: DocumentVersionsList component interface unchanged — only data source changes"
  - "D-03: Remove unused templateMap enrichment logic"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-06-05"
  deletions: 42
  insertions: 11
---

# Phase 13 Plan 01: Wire listDocumentVersions into Specialist Workbench

**One-liner:** Replaced inline Prisma `documents.documentVersions` query and ad-hoc `prisma.documentTemplate.findMany` enrichment in the specialist workbench page with a single `listDocumentVersions()` service call, closing the orphaned export gap from the v1.0 audit (MEDIUM).

## Execution Summary

### Task 1: Replace inline Prisma document-versions query with listDocumentVersions service call

**Commit:** `44a7ee0`

Changes applied to `/mnt/d/PhapChe/src/app/specialist/requests/[requestId]/page.tsx`:

1. **Added import:** `import { listDocumentVersions } from '@/lib/documents/draft-service'` (line 7)
2. **Removed `documents` select block** from the `prisma.legalRequest.findUnique` call (lines 60-76 removed) -- eliminates the inline `documentVersions` Prisma query
3. **Added service call:** `listDocumentVersions({ session, requestId })` with `.catch(() => [])` error handling (line 65) -- matches existing pattern on the page
4. **Replaced enrichment block:** Removed the ~27-line block that did `flatMap` + `templateIds` dedup + `prisma.documentTemplate.findMany` + per-version enrichment loop, and replaced it with a 9-line `versionsFromService.map()` that transforms the flat `templateLabel` field into the nested `{ label, version }` shape expected by `DocumentVersionsList`

**Data flow preserved:**
- `DocumentVersionsList` receives `{ id, templateId, templateVersion, status, generatedContent, createdAt, template: { label, version } }` -- identical shape to before
- `listDocumentVersions` handles RBAC (`canAccessRequest`) and template enrichment internally
- Page no longer calls `prisma.documentTemplate.findMany` for enrichment

## Verification Results

| Check | Result |
|-------|--------|
| `listDocumentVersions` import + call site | Found at lines 7 and 65 |
| `templateMap\|templateIds\|prisma.documentTemplate` references | Empty -- completely removed |
| `documents.*documentVersions` Prisma select | 0 matches -- removed |
| `npm run typecheck` (excluding `admin/templates/`) | No new errors in specialist page |

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The only new call (`listDocumentVersions`) enforces `canAccessRequest` RBAC internally -- same access control as the inline query it replaced. No new network endpoints, auth paths, or trust boundary changes introduced.

## Acceptance Criteria

- [x] File no longer contains `documents.documentVersions` Prisma select inside `findUnique`
- [x] File no longer contains `templateMap` enrichment pattern (no `prisma.documentTemplate.findMany` called from the page)
- [x] File imports and calls `listDocumentVersions` from `@/lib/documents/draft-service`
- [x] `npm run typecheck` passes with zero new errors in the specialist page
- [x] `DocumentVersionsList` prop shape preserved exactly

## Self-Check: PASSED

All verification commands passed:
- Commit `44a7ee0` exists in git log
- File `/mnt/d/PhapChe/src/app/specialist/requests/[requestId]/page.tsx` modified as expected
- Typecheck reveals no new errors
- All grep-based verification checks pass
