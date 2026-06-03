---
phase: 09
plan: 01
status: complete
completed_at: 2026-06-03
---

# Phase 09 Plan 01 — Summary

## What was built

### Task 1: Prisma schema additions
- `Folder` model: workspace-scoped, self-relation via `parentId` (FolderHierarchy), unique `[workspaceId, parentId, name]`
- `Tag` model: workspace-scoped, unique `[workspaceId, key]`
- `VaultFileFolder` join table: composite primary key `[vaultFileId, folderId]`
- `VaultFileTag` join table: composite primary key `[vaultFileId, tagId]`
- Back-relations added to `Workspace` (folders, tags) and `VaultFile` (vaultFileFolders, vaultFileTags)
- Workspace back-relations to join tables were intentionally omitted (Prisma requires opposite relation, kept schema clean)

### Task 2: Schema push [BLOCKING]
- `npx prisma db push` succeeded
- 4 new tables created in dev database
- Prisma client regenerated

### Task 3: Classification service (`src/lib/documents/classification-service.ts`)
- 8 exports:
  - `listFolders(session, workspaceId, parentId?)` — workspace-scoped read
  - `createFolder(session, input)` — admin only, audit `folder.created`
  - `moveFileToFolder(session, input)` — admin only, transactional, audit `vault_file.moved_to_folder`
  - `listTags(session, workspaceId)` — workspace-scoped read
  - `createTag(session, input)` — admin only, audit `tag.created`
  - `tagFile(session, input)` — admin only, idempotent transactional upsert, audit `vault_file.tagged`
  - `untagFile(session, input)` — admin only, transactional, audit `vault_file.untagged`
  - `listFileClassifications(session, workspaceId)` — workspace-scoped read returning folders + tags per file
- `isAdmin(session)` helper reused from template-service.ts
- All mutations emit `recordAuditEvent` with safe metadata (≤500 chars, no content/keys/PII)
- RBAC: admin-only mutations, workspace-access for reads, throws `FORBIDDEN` / `WORKSPACE_MISMATCH` / `*_NOT_FOUND` / `*_DUPLICATE`

### Task 4: E2E tests (`src/lib/documents/classification-service.test.ts`)
- 6 tests, all passing against real Prisma dev DB
- Coverage:
  1. `createFolder` happy path + audit verification
  2. `createFolder` rejects non-admin (specialist) with `/FORBIDDEN/`
  3. `moveFileToFolder` transactional join row + audit
  4. `tagFile` idempotent (no duplicate join row) + audit
  5. `untagFile` rejects with `VAULT_FILE_TAG_NOT_FOUND` when no prior tag
  6. `listFileClassifications` returns folders + tags arrays per vault file
- `assertSafeDatabaseUrl()` guard copied verbatim from template-service.test.ts
- Cleanup in reverse dependency order: VaultFileTag → VaultFileFolder → Tag → Folder → AuditEvent → VaultFile → LegalRequest → WorkspaceMembership → Workspace
- Test seed: workspace + 3 users (admin/specialist/actor) + 1 legal request + 1 vault file

## Commits
- `1c7b060` feat(09-01): add Folder, Tag, VaultFileFolder, VaultFileTag models
- `c002f22` fix(09-01): remove Workspace back-relation to join tables
- `468aae4` feat(09-01): push schema to dev database
- `6cc38d0` feat(09-01): add classification service with 8 RBAC-gated CRUD functions
- `ace6200` feat(09-01): add 6 e2e tests for classification service

## Test result
- 6/6 classification tests pass
- 6/6 phase 08 review-service tests still pass (no regression)
- Total: 12/12 e2e tests green

## Deviations from plan
- Removed `Workspace.vaultFileFolders` and `Workspace.vaultFileTags` back-relations after first `prisma db push` failed: Prisma requires a corresponding `@relation` on the join table model, which we deliberately omitted (the join tables reference VaultFile and Folder/Tag directly; Workspace is reachable via denormalized workspaceId on each endpoint). Service layer enforces workspace consistency.
- Added `createdById` (and dropped non-existent `customerWorkspaceId` and `matterTypeKey`) to test seed for `LegalRequest` to match actual schema requirements.

## Out-of-scope (deferred to plan 09-02)
- Admin `/admin/vault` page
- Server actions
- 3 client form components
