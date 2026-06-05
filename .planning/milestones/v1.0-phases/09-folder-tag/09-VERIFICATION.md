---
phase: 09
slug: folder-tag
status: passed
verified_at: 2026-06-03
---

# Phase 09 — Verification Report

## Goal

Add Folder/Tag models, classification service and admin browse UI to satisfy VLT-05.

## Result: PASSED

Schema pushed, service shipped with 6/6 e2e tests, admin UI complete with RBAC and Vietnamese copy.

## Requirement Traceability

| REQ-ID | Status | Evidence |
|--------|--------|----------|
| VLT-05 (folder/tag classification) | ✓ | Folder, Tag, VaultFileFolder, VaultFileTag models in `prisma/schema.prisma`; `classification-service.ts` with 8 RBAC-gated CRUD functions; `/admin/vault` page with folder list, tag list, file browser, create/move/tag/untag actions |

## Implementation Evidence

### Schema (`prisma/schema.prisma`)
- `model Folder` — workspaceId, name, parentId (self-relation FolderHierarchy), unique [workspaceId, parentId, name]
- `model Tag` — workspaceId, key, label, unique [workspaceId, key]
- `model VaultFileFolder` — composite PK [vaultFileId, folderId]
- `model VaultFileTag` — composite PK [vaultFileId, tagId]
- Workspace back-relations: `folders`, `tags` (no join back-relations — kept schema clean)
- VaultFile back-relations: `vaultFileFolders`, `vaultFileTags`

### Service (`src/lib/documents/classification-service.ts`)
- 8 exports verified: `listFolders`, `createFolder`, `moveFileToFolder`, `listTags`, `createTag`, `tagFile`, `untagFile`, `listFileClassifications`
- All mutations emit `recordAuditEvent` with safe metadata (no content, no storageKey, no PII)
- `moveFileToFolder` and `tagFile` use `prisma.$transaction` with audit in same tx
- RBAC: admin-only mutations, workspace-access reads, throws FORBIDDEN / WORKSPACE_MISMATCH / *_NOT_FOUND / *_DUPLICATE

### Tests (`src/lib/documents/classification-service.test.ts`)
- 6/6 passing against real Prisma dev DB
- Coverage: createFolder happy + RBAC negative + moveFileToFolder transactional + tagFile idempotent + untagFile negative + listFileClassifications integration
- Cleanup in reverse dependency order including AuditEvent

### UI (`src/app/admin/vault/`)
- `page.tsx` — server component with session guard + role check + activeWorkspaceId null guard
- `actions.ts` — 5 server actions with revalidatePath
- `components/folder-form.tsx` — useActionState
- `components/tag-form.tsx` — useActionState
- `components/move-file-form.tsx` — useTransition with applied-tags removable chips
- `src/app/admin/components/admin-shell.tsx` — added "Phân loại vault" nav item

## Files Created/Modified

```
prisma/schema.prisma (modified — 4 new models + back-relations)
src/lib/documents/classification-service.ts (232 lines, new)
src/lib/documents/classification-service.test.ts (225 lines, new)
src/app/admin/components/admin-shell.tsx (modified — 1 nav item added)
src/app/admin/vault/page.tsx (new)
src/app/admin/vault/actions.ts (new)
src/app/admin/vault/components/folder-form.tsx (new)
src/app/admin/vault/components/tag-form.tsx (new)
src/app/admin/vault/components/move-file-form.tsx (new)
```

## Commits
```
1c7b060 feat(09-01): add Folder, Tag, VaultFileFolder, VaultFileTag models
c002f22 fix(09-01): remove Workspace back-relation to join tables
468aae4 feat(09-01): push schema to dev database
6cc38d0 feat(09-01): add classification service with 8 RBAC-gated CRUD functions
ace6200 feat(09-01): add 6 e2e tests for classification service
8db61bd docs(09-01): complete folder-tag schema + service plan
<latest> feat(09-02): admin /vault page, server actions, 3 client form components
56b9a1b fix(09-02): resolve activeWorkspaceId null and Button type errors
b7ee994 docs(09-02): complete folder-tag admin UI plan
```

## Test Result
- 6/6 classification tests pass
- 6/6 phase 08 review-service tests still pass
- `npx tsc --noEmit` reports 0 errors in `src/app/admin/vault/`
- Pre-existing errors in `src/app/admin/templates/` remain (out of scope)

## Cross-Phase Integration
- Customer delivery page and ops dashboard do not expose folder/tag mutation controls (verified: no imports of `classification-service` outside `src/app/admin/vault/`)
- Folder/tag operations are coordinator_admin / super_admin only
- Audit events fire with safe metadata (no file content, no storageKey, no PII)
