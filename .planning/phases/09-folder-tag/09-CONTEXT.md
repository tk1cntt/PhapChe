# Phase 09: folder-tag - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Source:** `/gsd-audit-milestone` gap closure

<domain>
## Phase Boundary

Add Folder/Tag models to `prisma/schema.prisma`, build a classification service (`src/lib/documents/classification-service.ts`) and admin browse UI at `/admin/vault` so VLT-05 is satisfied.

This phase does not change customer delivery page, ops dashboard, reviewer portal, or draft generation logic. Customer-facing routes do not expose folder/tag mutation controls.

</domain>

<decisions>
## Implementation Decisions

### Schema
- **D-01:** Add `Folder` model: `id`, `workspaceId` (FK), `name`, `parentId?` (self-FK for hierarchy), `createdAt`, `updatedAt`.
- **D-02:** Add `Tag` model: `id`, `workspaceId` (FK), `key` (unique per workspace), `label`, `createdAt`.
- **D-03:** Add join tables: `VaultFileFolder` (`vaultFileId`, `folderId`, unique) and `VaultFileTag` (`vaultFileId`, `tagId`, unique) with proper indexes.
- **D-04:** `Folder` has a recursive self-relation via `parentId`; `Tag` is flat per workspace.

### Service Layer
- **D-05:** `src/lib/documents/classification-service.ts` exposes: `createFolder`, `listFolders`, `moveFileToFolder`, `createTag`, `listTags`, `tagFile`, `untagFile`, `listFileClassifications`.
- **D-06:** All functions enforce server-side RBAC: caller must be `coordinator_admin` or `super_admin` with active membership in the target workspace.
- **D-07:** Classification mutations emit `recordAuditEvent` with safe metadata: action, target vaultFileId/folder/tag id, workspaceId.

### Admin UI
- **D-08:** `/admin/vault` page shows folders as a tree/list, tags as a flat list, and files grouped by folder or filtered by tag.
- **D-09:** Coordinator can create folders, create tags, move files to folders, and apply/remove tags from the admin browse UI.
- **D-10:** Use existing Card/Table/Badge/Button/PageHeader admin UI primitives with Vietnamese labels.

### Security
- **D-11:** Folder/tag operations are coordinator/admin only. Customer, specialist, and reviewer routes do not expose classification mutation controls.
- **D-12:** Customer delivery page and ops dashboard may display folder/tag names read-only in metadata where available, but this is optional and not required.

### Claude's Discretion
- Exact folder tree UI implementation (flat list, collapsible tree, breadcrumb) may follow existing admin patterns.
- Exact tag UI (input, chips, multi-select) may be chosen by planner.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — VLT-05.
- `.planning/ROADMAP.md` — Phase 09 goal, success criteria.

### Prior phase context (locked decisions)
- `.planning/phases/01-foundation/01-CONTEXT.md` — Workspace isolation, RBAC, audit.
- `.planning/phases/04-documents-vault/04-CONTEXT.md` — VaultFile model, vault access patterns, RBAC helpers.

### Audit source
- `.planning/v1.0-MILESTONE-AUDIT.md` — G-3 origin: VLT-05 unimplemented.

### Existing implementation anchors
- `prisma/schema.prisma` — `VaultFile`, `Workspace`, `AuditEvent` models.
- `src/lib/documents/vault-service.ts` — Existing vault list/metadata/access functions.
- `src/lib/security/rbac.ts` — `canAccessWorkspace`, `canAccessVaultFile`.
- `src/lib/audit/audit.ts` — `recordAuditEvent`.
- `src/app/admin/components/admin-shell.tsx` — Admin layout and navigation.
- `src/app/admin/components/ui.tsx` — Card, Table, Badge, Button, PageHeader.

</canonical_refs>

<deferred>
## Deferred Ideas

- Customer-facing folder browsing or tag search — v2 customer UX enhancement.
- Auto-classification of files by OCR/AI — v2 automation.
- Tag-based notification rules — v2 compliance.

</deferred>

---

*Phase: 09-folder-tag*
*Context gathered: 2026-06-02*
