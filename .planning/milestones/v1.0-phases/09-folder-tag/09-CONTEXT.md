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

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Folder/tag operations là coordinator/admin only.
- **R-05:** Classification mutations phải emit recordAuditEvent với safe metadata.
- **R-06:** Folder có recursive self-relation via parentId; Tag là flat per workspace.

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-07-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-08-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-09-VI:** Các nút hành động: Tạo thư mục, Tạo thẻ, Di chuyển, Gắn thẻ, Xóa thẻ.
- **R-10-VI:** Vault labels: Thư mục, Thẻ phân loại, Tệp trong vault, Chưa có thư mục, Chưa có thẻ.

#### English
- **R-07-EN:** All user-facing labels must be in proper English.
- **R-08-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-09-EN:** Action buttons: Create folder, Create tag, Move, Tag, Untag.
- **R-10-EN:** Vault labels: Folders, Tags, Files in Vault, No folders, No tags.

#### Chinese (中文)
- **R-07-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-08-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-09-ZH:** 操作按钮：创建文件夹、创建标签、移动、添加标签、移除标签。
- **R-10-ZH:** 档案标签：文件夹、标签、档案中的文件、无文件夹、无标签。

#### Japanese (日本語)
- **R-07-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-08-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-09-JA:** 操作ボタン：フォルダ作成、タグ作成、移動、タグ付け、タグ解除。
- **R-10-JA:** ボルトラベル：フォルダ、タグ分類、ボルト内ファイル、フォルダなし、タグなし。

### Phase-Specific Rules

- **R-11:** Folder model có id, workspaceId, name, parentId (self-FK), createdAt, updatedAt.
- **R-12:** Tag model có id, workspaceId, key (unique per workspace), label, createdAt.
- **R-13:** VaultFileFolder và VaultFileTag join tables với proper indexes.
- **R-14:** Customer delivery page và ops dashboard có thể display folder/tag names read-only.

</rules>

<deferred>
## Deferred Ideas

- Customer-facing folder browsing or tag search — v2 customer UX enhancement.
- Auto-classification of files by OCR/AI — v2 automation.
- Tag-based notification rules — v2 compliance.

</deferred>

---

*Phase: 09-folder-tag*
*Context gathered: 2026-06-02*
