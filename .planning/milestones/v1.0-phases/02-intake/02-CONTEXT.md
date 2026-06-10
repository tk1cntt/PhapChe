# Phase 2: intake - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers customer-facing structured intake for legal requests: service type selection, guided questions, structured answer storage with schema version, supporting file upload attachment to request, customer status visibility, and unsupported-request triage marking.

This phase does not build specialist routing, capability matrix, document generation, reviewer QC, Legal Vault version history beyond upload metadata needed for intake, final delivery, OCR, e-sign, billing, or AI legal advice.

</domain>

<decisions>
## Implementation Decisions

### Intake Entry and Flow
- **D-01:** Use chat/form hybrid flow: customer experience should feel like guided chat, but implementation output must be structured fields, not raw conversation only.
- **D-02:** Customer starts by selecting a service/matter type from a small seeded MVP catalog; unsupported/unknown service types route to human triage.
- **D-03:** Keep Phase 2 intake focused on submission flow and status visibility. No AI legal reasoning or automatic legal conclusion.

### Structured Intake Data
- **D-04:** Store intake answers as structured data tied to request plus schemaVersion so later template/document phases can snapshot exact inputs.
- **D-05:** Each matter type has its own question schema. MVP may seed representative legal services from source docs: agency contract, labor contract, trademark registration.
- **D-06:** Required question validation happens before intake_submitted; incomplete answers stay in draft_intake.
- **D-07:** Preserve enough labels/metadata with answers for specialist readability, not only machine keys.

### Request Status and Triage
- **D-08:** Use existing backend workflow states from Phase 1: create request in draft_intake, submit to intake_submitted, coordinator/system may move unsupported requests to 	riage.
- **D-09:** Unsupported requests are not rejected automatically; mark clearly as requiring human triage.
- **D-10:** Customer sees plain Vietnamese status labels and next-step guidance, not raw enum names.

### File Uploads
- **D-11:** Customer can upload supporting files during intake and attach them to the request.
- **D-12:** Store upload records through existing request/workspace-linked VaultFile foundation model for now, with private storage semantics planned; do not expose public file URLs.
- **D-13:** File upload actions must enforce workspace/request authorization server-side and create audit events with metadata summary only, not sensitive document contents.
- **D-14:** OCR or automatic field extraction from uploaded files is out of scope for Phase 2.

### Customer UI
- **D-15:** Add customer-facing route separate from admin foundation, using existing card/table/button visual language but optimized for simple guided request submission.
- **D-16:** Intake screens should show progress through questions, upload area, review/submit step, and submitted status view.
- **D-17:** Customer status view must be read-only; all status changes remain backend workflow transitions.

### Security and Audit
- **D-18:** Reuse Phase 1 server-side RBAC/workspace checks for every intake, upload, and status-read operation.
- **D-19:** Audit important intake events: request created, intake answer saved/submitted, file uploaded, unsupported request marked for triage.
- **D-20:** Avoid storing legal content in audit metadata; use identifiers, matter type, counts, filenames, hashes/summaries where needed.

### Claude's Discretion
- Exact UI component decomposition, form library choice, and API/server action shape may follow existing Next.js patterns.
- Exact seeded service labels/questions may be minimal but must demonstrate at least one supported service and one unsupported/triage path.
- Exact storage backend can remain local/mock-compatible if production S3/R2 integration belongs to later Vault hardening, but access semantics must stay private.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- .planning/PROJECT.md — Product vision, chat/form hybrid intake direction, legal accuracy and security constraints.
- .planning/REQUIREMENTS.md — Phase 2 requirements INT-01 through INT-06.
- .planning/ROADMAP.md — Phase 2 goal, boundary, and success criteria.
- .planning/phases/01-foundation/01-CONTEXT.md — Locked foundation decisions for roles, workspace isolation, request statuses, workflow transitions, and audit trail.

### Source docs
- docs/note.txt — Original service examples and E-Myth/SOP guidance for guided legal intake.
- docs/Có.docx — Source material referenced by project context; informs legal service workflow and later reviewer constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- prisma/schema.prisma — Existing LegalRequest, RequestStatus, VaultFile, AuditEvent, Workspace, User, and role models already cover request shell, status, upload metadata, audit linkage, and tenant isolation.
- src/lib/workflow/request-workflow.ts — Existing REQUEST_TRANSITIONS, getAllowedTransitions, 	ransitionRequestStatus, and role-based transition checks must remain source of truth for status changes.
- src/lib/security/rbac.ts — Existing canAccessRequest, canAccessVaultFile, and workspace membership checks should guard intake reads/writes and uploads.
- src/lib/audit/audit.ts — Existing ecordAuditEvent should record intake and upload audit events with concise metadata.
- src/app/admin/components/ui.tsx — Existing Button, Badge, Card, Table, and PageHeader provide simple design language to reuse or mirror.

### Established Patterns
- Next.js App Router under src/app with TypeScript.
- Prisma PostgreSQL schema is current data model source.
- UI copy currently Vietnamese; continue customer-facing Vietnamese labels.
- Admin screens currently demonstrate static/sample UI; Phase 2 should add real intake persistence paths where needed for requirements.
- Workflow integrity pattern: UI may render allowed transitions, but backend validates transitions.

### Integration Points
- Add intake-specific persistence around LegalRequest rather than bypassing it.
- Add request answer schema/data fields or related model(s) to store structured intake with schema version.
- Add customer-facing route(s) for service selection, guided questions, upload, submit, and status view.
- Add upload handling connected to VaultFile and audit events.
- Add tests around structured intake save/submit, unsupported triage marking, upload authorization, and customer status visibility.

</code_context>

<specifics>
## Specific Ideas

- Initial service examples should reflect project notes: soạn hợp đồng đại lý, soạn hợp đồng lao động, đăng ký nhãn hiệu.
- Agency contract sample questions can include partner name, commission/discount rate, contract term, and special requirements.
- Unsupported requests should produce triage state/flag and human-friendly message: hồ sơ cần chuyên viên phân loại.
- Keep intake as operations intake, not legal advice output.

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata, chỉ dùng identifier hoặc hash khi cần truy vết.
- **R-04:** Phân quyền phải được kiểm tra server-side cho mọi intake, upload và status-read operation.
- **R-05:** File upload không được phép expose public file URLs, phải dùng private storage semantics.
- **R-06:** Intake answers phải được lưu dưới dạng structured data kèm schemaVersion.

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-07-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-08-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-09-VI:** Các nút hành động: Sửa, Xóa, Gửi, Hủy, Lưu, Tiếp tục, Xem, Tải về, Tải lên, Đăng nhập, Đăng xuất.
- **R-10-VI:** Intake flow: Chọn dịch vụ, Câu hỏi, Tải lên tài liệu, Kiểm tra trước khi gửi, Yêu cầu đã được gửi thành công!
- **R-11-VI:** Customer status view phải là read-only, tất cả status changes phải qua backend workflow transitions.

#### English
- **R-07-EN:** All user-facing labels must be in proper English.
- **R-08-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-09-EN:** Action buttons: Edit, Delete, Submit, Cancel, Save, Continue, View, Download, Upload, Sign in, Sign out.
- **R-10-EN:** Intake flow: Select service, Questions, Upload documents, Review before submitting, Request submitted successfully!
- **R-11-EN:** Customer status view must be read-only; all status changes must go through backend workflow transitions.

#### Chinese (中文)
- **R-07-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-08-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-09-ZH:** 操作按钮：编辑、删除、提交、取消、保存、继续、查看、下载、上传、登录、退出。
- **R-10-ZH:** 接收流程：选择服务、问题、上传文档、提交前审核、请求提交成功！
- **R-11-ZH:** 客户状态视图必须是只读的；所有状态更改必须通过后端工作流转换。

#### Japanese (日本語)
- **R-07-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-08-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-09-JA:** 操作ボタン：編集、削除、送信、キャンセル、保存、次へ、表示、ダウンロード、アップロード、ログイン、ログアウト。
- **R-10-JA:** 受付フロー：サービス選択、質問、書類アップロード、送信前確認、リクエストが正常に送信されました！
- **R-11-JA:** 客户状況表示は読み取り専用，必须通过后端工作流转换进行所有状态更改。

### Phase-Specific Rules

- **R-12:** Sử dụng chat/form hybrid flow: customer experience như guided chat nhưng implementation output phải là structured fields.
- **R-13:** Customer chọn service/matter type từ seeded MVP catalog; unsupported/unknown types route to human triage.
- **R-14:** Required question validation xảy ra trước intake_submitted; incomplete answers stay in draft_intake.
- **R-15:** Unsupported requests được đánh dấu rõ ràng là requiring human triage với thông điệp: hồ sơ cần chuyên viên phân loại.

</rules>

<deferred>
## Deferred Ideas

- Capability Matrix and specialist/reviewer assignment suggestions — Phase 3 routing.
- Template-driven document generation from intake answers — Phase 4 documents-vault.
- OCR/file content extraction from supporting documents — v2 automation.
- AI intake summarization or draft generation — v2 automation with guardrails.
- E-sign handoff after approval — v2 signature.

</deferred>

---

*Phase: 02-intake*
*Context gathered: 2026-05-27*
