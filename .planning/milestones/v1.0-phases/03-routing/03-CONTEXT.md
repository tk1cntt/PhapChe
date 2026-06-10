# Phase 3: routing - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers internal routing for submitted legal requests: matter type administration, specialist/reviewer capability definitions, rule-based eligibility suggestions, coordinator assignment/reassignment with audit reason, and specialist assigned queue/details.

This phase does not build document generation, reviewer QC checklist, Legal Vault version history, final delivery, SLA dashboard, AI auto-routing, marketplace matching, or customer-facing legal advice.

</domain>

<decisions>
## Implementation Decisions

### Matter Types and Capability Matrix
- **D-01:** Treat `MatterType` as the shared routing taxonomy. Reuse intake matter types where they exist and let coordinator/admin manage active matter types for routing.
- **D-02:** Capability matrix is rule-based in MVP: users with `specialist` or `reviewer` role are eligible when their configured capabilities include the request matter type.
- **D-03:** Keep availability simple for MVP. Eligibility should consider active user and active workspace membership; advanced workload balancing and SLA prioritization belong to later ops/automation work.

### Suggestions and Assignment
- **D-04:** Suggestions should show eligible specialists and reviewers separately, with clear reason text such as matching matter type/capability and role.
- **D-05:** Coordinator/admin remains final decision maker. System suggests candidates but does not auto-assign.
- **D-06:** Assignment/reassignment must update `LegalRequest.assignedSpecialistId` and `LegalRequest.assignedReviewerId`, create `RequestAssignment` history rows, require a reason, and write audit events.
- **D-07:** Assignment should move requests through the backend workflow state machine from `triage` or `intake_submitted` toward `assigned` only through allowed backend transitions. Frontend must not hard-code status changes.

### Coordinator UI
- **D-08:** Add internal coordinator/admin routing screen using existing admin card/table/button/badge visual language.
- **D-09:** Coordinator UI should prioritize actionable lists: submitted/triage requests, current assignees, matter type, suggested specialist/reviewer, and assignment/reassignment action with required reason.
- **D-10:** Use Vietnamese labels for UI copy and human-readable reasons; keep enum/storage keys in English.

### Specialist Queue
- **D-11:** Specialist gets an assigned queue showing only requests assigned to them through server-side authorization.
- **D-12:** Specialist request detail should expose intake summary and supporting file metadata needed to start work, but no document drafting features yet.
- **D-13:** Reviewer assignment may be configured during routing for future review phase, but reviewer queue/review UI remains Phase 5.

### Security and Audit
- **D-14:** Reuse server-side RBAC/workspace checks for all routing reads and writes. Coordinator/admin can manage assignments within workspace; specialist sees only assigned requests; reviewer sees assigned review-related requests when relevant.
- **D-15:** Audit routing actions with metadata summary only: assignment kind, assignee id, request id, matter type, and reason presence/short reason. Do not store sensitive legal answer content in audit metadata.
- **D-16:** Preserve append-only assignment history; reassignment creates new history rows rather than overwriting audit trail.

### Claude's Discretion
- Exact Prisma model shape for capability records may follow existing schema style, as long as it supports role-specific capabilities per workspace/user/matter type.
- Exact route names and component split may follow existing Next.js App Router/admin patterns.
- Exact suggestion ordering may be simple and deterministic for MVP.
- Exact seed capabilities may be minimal but must demonstrate one specialist and one reviewer eligible for at least one seeded matter type.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/PROJECT.md` — Product vision, capability matrix source context, legal accuracy/security/workflow constraints.
- `.planning/REQUIREMENTS.md` — Phase 3 requirements RTE-01 through RTE-05.
- `.planning/ROADMAP.md` — Phase 3 goal, UI hint, requirements mapping, and phase boundary.
- `.planning/phases/01-foundation/01-CONTEXT.md` — Locked foundation decisions for roles, workspace isolation, server-side authorization, request statuses, workflow transitions, and audit trail.
- `.planning/phases/02-intake/02-CONTEXT.md` — Locked intake decisions for matter type catalog, structured intake data, status flow, upload metadata, and customer status boundaries.

### Source docs
- `docs/note.txt` — Original platform notes and E-Myth/SOP guidance; includes process-oriented routing intent.
- `docs/Có.docx` — Source material referenced by project context; includes coordinator capability matrix and internal specialist/reviewer workflow.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prisma/schema.prisma` — Existing `MatterType`, `LegalRequest`, `RequestAssignment`, `AssignmentKind`, `User`, `WorkspaceMembership`, `RequestStatus`, and audit models provide routing foundation.
- `src/lib/workflow/request-workflow.ts` — Existing `REQUEST_TRANSITIONS`, `getAllowedTransitions`, `canTransitionRequestStatus`, and `transitionRequestStatus` are source of truth for status changes.
- `src/lib/security/rbac.ts` — Existing `canAccessRequest` checks assigned specialist/reviewer and coordinator/admin access; routing must extend or reuse this rather than bypass it.
- `src/lib/intake/catalog.ts` — Seeded MVP matter types (`agency_contract`, `labor_contract`, `trademark_registration`, `unsupported`) should inform initial capability/matter type routing data.
- `src/lib/intake/intake-service.ts` — Existing intake creates/upserts `MatterType`, stores structured answers, and moves unsupported requests to `triage`.
- `src/app/admin/components/ui.tsx` — Existing `Button`, `Badge`, `Card`, `Table`, and `PageHeader` define admin UI visual language.
- `src/app/admin/requests/page.tsx` — Existing admin requests screen shows backend workflow labels and allowed transitions pattern.
- `src/app/requests/[requestId]/page.tsx` — Existing request detail/status page shows secure request reads, file metadata display, and Vietnamese status copy.

### Established Patterns
- Next.js App Router under `src/app` with TypeScript server components/actions.
- Prisma is current data model source and tests target service functions around domain rules.
- UI copy is Vietnamese; code identifiers remain English.
- Backend validates workflow transitions; UI may display allowed options only as UX.
- Audit metadata uses concise summaries and avoids sensitive legal content.
- Current session/auth is env-backed through `src/lib/security/session.ts`; Phase 3 should use same pattern unless planning changes auth globally.

### Integration Points
- Add capability persistence linked to workspace/user/matter type and role/kind.
- Add routing service functions for matter type administration, capability management, suggestion generation, assignment, and reassignment.
- Add coordinator/admin route for routing queue and assignment actions.
- Add specialist route or admin/internal view for assigned queue and request details.
- Add tests for eligibility filtering, assignment authorization, required reason, workflow transition integrity, assignment history, and audit metadata.

</code_context>

<specifics>
## Specific Ideas

- Capability Matrix should reflect project source context: specialist/reviewer tags like labor law, enterprise law, tax, agency contract, trademark.
- Keep matching understandable and explainable: suggested because role + matter type capability match, not opaque scoring.
- Coordinator controls assignment; system recommends only.
- Unsupported requests from Phase 2 land in triage and are natural inputs for coordinator routing.

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Phân quyền phải được kiểm tra server-side cho tất cả routing reads và writes.
- **R-05:** Assignment/Reassignment phải cập nhật LegalRequest.assignedSpecialistId và LegalRequest.assignedReviewerId.
- **R-06:** Assignment phải tạo RequestAssignment history rows và ghi audit events.

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-07-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-08-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-09-VI:** Các nút hành động: Sửa, Xóa, Gửi, Hủy, Lưu, Tiếp tục, Xem, Tải về, Tải lên, Đăng nhập, Đăng xuất.
- **R-10-VI:** Capability Matrix hiển thị specialist/reviewer tags: luật lao động, luật doanh nghiệp, thuế, hợp đồng đại lý, nhãn hiệu.
- **R-11-VI:** Coordinator là người quyết định cuối cùng; system chỉ đề xuất candidates.

#### English
- **R-07-EN:** All user-facing labels must be in proper English.
- **R-08-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-09-EN:** Action buttons: Edit, Delete, Submit, Cancel, Save, Continue, View, Download, Upload, Sign in, Sign out.
- **R-10-EN:** Capability Matrix displays specialist/reviewer tags: labor law, enterprise law, tax, agency contract, trademark.
- **R-11-EN:** Coordinator is the final decision maker; system only suggests candidates.

#### Chinese (中文)
- **R-07-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-08-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-09-ZH:** 操作按钮：编辑、删除、提交、取消、保存、继续、查看、下载、上传、登录、退出。
- **R-10-ZH:** 能力矩阵显示专员/审核员标签：劳动法、企业法、税务、代理合同、商标。
- **R-11-ZH:** 协调员是最终决策者；系统仅提供建议。

#### Japanese (日本語)
- **R-07-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-08-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-09-JA:** 操作ボタン：編集、削除、送信、キャンセル、保存、次へ、表示、ダウンロード、アップロード、ログイン、ログアウト。
- **R-10-JA:** 能力マトリックスはスペシャリスト/レビュアータグを表示：労働法、企業法、税、代理店契約、商標。
- **R-11-JA:** コーディネーターが最終決定者；システムは候補を提案するのみ。

### Phase-Specific Rules

- **R-12:** Capability Matrix là rule-based trong MVP: users với specialist hoặc reviewer role eligible khi capabilities include request matter type.
- **R-13:** Suggestions hiển thị eligible specialists và reviewers riêng biệt với clear reason text.
- **R-14:** Specialist chỉ thấy requests được assigned qua server-side authorization.
- **R-15:** Reviewer assignment có thể được configure trong routing nhưng reviewer queue/review UI thuộc Phase 5.

</rules>

<deferred>
## Deferred Ideas

- Auto-routing without coordinator approval — later automation after enough operational data.
- Workload/SLA scoring and dashboard counts — Phase 7 ops.
- Reviewer queue and QC checklist UI — Phase 5 review.
- Document generation or draft workbench — Phase 4 documents-vault.
- AI matter type detection from uploads/intake — v2 automation.

</deferred>

---

*Phase: 03-routing*
*Context gathered: 2026-05-28*
