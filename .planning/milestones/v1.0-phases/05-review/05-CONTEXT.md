# Phase 5: review - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning
**Mode:** auto-selected defaults

<domain>
## Phase Boundary

Phase 5 delivers the reviewer portal with split-view interface (draft left, QC checklist right), static checklist derived from QC-LEG-01 criteria, checklist item response tracking, approval that marks documents final-ready, and revision flow that returns documents to specialist with failed criteria and comments.

This phase does not build customer delivery/download UX, e-signature integration, OCR, AI legal advice, operations dashboards, or dynamic per-template checklist configuration.

</domain>

<decisions>
## Implementation Decisions

### Checklist Model
- **D-01:** Checklist is static, derived from QC-LEG-01 defined in PROJECT.md. Three groups: Formal Requirements (3 items), Legal Content (4 items), Operational & Signing (2 items). No dynamic per-template checklist for MVP.
- **D-02:** Checklist items are stored as seed data or code constants, not user-manageable records. Admin does not configure checklist items in MVP.
- **D-03:** Each checklist item has: id, group (formal/legal_content/operational), label (Vietnamese), required flag, and sort order.

### Review Data Model
- **D-04:** Extend existing `Review` model with: `documentVersionId`, `status` enum (in_progress/approved/rejected), `decision` (approve/reject), `generalComment`, `completedAt`.
- **D-05:** Introduce `ReviewChecklistItem` seed reference model and `ReviewChecklistAnswer` model linking review to each checklist item with: `itemId`, `passed` (boolean), `comment` (optional per-item comment for failures).
- **D-06:** Review must reference a specific `DocumentVersion` id, not just `Document` id. This ensures reviewer approves the exact version submitted.
- **D-07:** Reviewer can only submit approval when all required checklist items are marked `passed: true`. Validation happens server-side.

### Reviewer Portal Layout
- **D-08:** Split view layout: left panel shows document version content, right panel shows QC checklist with pass/fail toggles and comment fields per item.
- **D-09:** Reviewer portal uses existing admin Card/Table/Button/Badge UI patterns with Vietnamese labels consistent with specialist and admin screens.
- **D-10:** Reviewer queue page shows document versions in `submitted_for_review` status assigned to the current reviewer, with request title, matter type, submission time, and specialist name.

### Revision Flow
- **D-11:** Reviewer can request revision by marking one or more checklist items as failed with optional per-item comments, plus optional general revision comment.
- **D-12:** Revision submission changes `DocumentVersion.status` back to `draft` (or a new `revision_required` status if cleaner), and moves request workflow through backend state machine to `revision_required`.
- **D-13:** Specialist sees revision feedback on their workbench: which checklist items failed, per-item comments, and general comment. Specialist can then generate new draft version.
- **D-14:** Previous review record and its checklist answers are preserved even after revision — audit trail is append-only.

### Approval Flow
- **D-15:** Reviewer approval marks `DocumentVersion.status` as `final` and sets `Review.status` to `approved`.
- **D-16:** Approval moves request workflow through backend transition to `approved` status. Frontend displays allowed transition; backend validates.
- **D-17:** Approval creates audit event with reviewer id, document version id, review id, and timestamp. No sensitive legal content in audit metadata.

### Security and Audit
- **D-18:** Reviewer can only see and review document versions assigned to them via server-side RBAC check. Reuse existing `canAccessRequest` and extend with review-specific checks.
- **D-19:** All review actions (start review, answer checklist item, approve, reject/revise) create append-only audit events.
- **D-20:** Specialist cannot see reviewer-only comments on checklist items until revision is requested. Customer never sees internal review data.

### Claude's Discretion
- Exact split view component layout and responsive behavior may follow existing patterns.
- Checklist seed data exact labels may be refined but must cover all 9 QC-LEG-01 criteria.
- Review submission confirmation UX (modal, inline, or redirect) may follow existing patterns.
- Exact Prisma model field names may follow existing schema naming conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/PROJECT.md` — Product vision, QC-LEG-01 reviewer checklist criteria (3 groups, 9 items), reviewer portal split-view requirement, legal accuracy constraints, workflow integrity.
- `.planning/REQUIREMENTS.md` — Phase 5 requirements REV-01 through REV-09.
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and phase boundary.

### Prior phase context (locked decisions)
- `.planning/phases/01-foundation/01-CONTEXT.md` — Workspace isolation, RBAC, audit trail, workflow state machine, request statuses including `pending_review`, `revision_required`, `approved`.
- `.planning/phases/02-intake/02-CONTEXT.md` — Structured intake data, matter type catalog, request creation.
- `.planning/phases/03-routing/03-CONTEXT.md` — Assignment model, specialist/reviewer assignment ids on LegalRequest, coordinator routing boundary.
- `.planning/phases/04-documents-vault/04-CONTEXT.md` — DocumentVersion model, template governance, draft generation, vault file metadata, submit-for-review action, specialist workbench.

### Source docs
- `docs/note.txt` — Original platform notes and E-Myth/SOP guidance.
- `docs/Có.docx` — QC-LEG-01 checklist criteria source, reviewer portal requirements, operational workflow.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prisma/schema.prisma` — Existing `Review` model (minimal: id, workspaceId, requestId, documentId, reviewerId), `DocumentVersion` model with status enum (`draft`, `submitted_for_review`, `final`), `Document` model, `VaultFile`, `WorkflowTransition`, `AuditEvent`.
- `src/lib/workflow/request-workflow.ts` — Backend state machine with `REQUEST_TRANSITIONS`, `getAllowedTransitions`, `transitionRequestStatus`. Already has `pending_review` and `revision_required` states.
- `src/lib/security/rbac.ts` — `canAccessRequest` checks assigned specialist/reviewer and coordinator/admin access. Reviewer-specific checks need extension.
- `src/lib/audit/audit.ts` — `recordAuditEvent` for append-only audit trail.
- `src/app/admin/components/ui.tsx` — `Button`, `Badge`, `Card`, `Table`, `PageHeader` define admin UI visual language.
- `src/app/specialist/requests/[requestId]/components/document-versions.tsx` — Existing component showing document version list with status badges and submit-for-review action.
- `src/app/specialist/requests/[requestId]/page.tsx` — Specialist workbench showing intake summary, vault files, document versions, and generate draft form.

### Established Patterns
- Next.js App Router server components/actions with TypeScript.
- Prisma schema is central source for domain persistence and migrations.
- UI copy is Vietnamese; code identifiers/enums remain English.
- Backend validates workflow transitions; UI displays allowed options as UX only.
- Audit metadata uses concise summaries, avoids sensitive legal content.
- Admin screens use card/table layout with consistent component library.

### Integration Points
- Extend `Review` Prisma model with status, documentVersionId, decision, comments.
- Add `ReviewChecklistAnswer` model linking review to checklist items.
- Add reviewer route under `src/app/reviewer/` or `src/app/admin/reviews/`.
- Add reviewer queue page, review detail page with split view.
- Add review service module under `src/lib/reviews/` with checklist seeding, review submission, approval, and revision logic.
- Extend specialist workbench to display revision feedback.
- Add tests for review authorization, checklist completion validation, approval/rejection workflow transitions, and audit events.

</code_context>

<specifics>
## Specific Ideas

- QC-LEG-01 checklist from PROJECT.md has 3 groups: Formal Requirements (template match, spelling/presentation, entity info match), Legal Content (legal basis current, clear rights/obligations, risk clauses, customer pain fit), Operational & Signing (signature area, confidentiality classification).
- Reviewer portal should feel like a quality gate: clear pass/fail per item, obvious approve/reject actions, no ambiguity about what's been checked.
- Revision feedback should be actionable: specialist knows exactly which item failed and why, can fix and resubmit.
- Keep review workflow transparent: both reviewer and specialist can see current review status and history.

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Reviewer chỉ có thể approve khi tất cả required checklist items được marked passed: true.
- **R-05:** Review phải reference specific DocumentVersion id, không chỉ Document id.
- **R-06:** Previous review record và checklist answers được preserve kể cả sau revision — audit trail là append-only.
- **R-07:** Customer không bao giờ thấy internal review data.

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-08-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-09-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-10-VI:** Trạng thái review: Đang thực hiện, Đã phê duyệt, Đã từ chối.
- **R-11-VI:** QC checklist groups: Yêu cầu hình thức (3 items), Nội dung pháp lý (4 items), Vận hành & Ký nhá (2 items).
- **R-12-VI:** Checklist items: Đúng template, Chính tả/trình bày, Thông tin đơn vị khớp, Căn cứ pháp lý còn hiệu lực, Quyền và nghĩa vụ rõ ràng, Điều khoản rủi ro, Phù hợp nhu cầu khách hàng, Vị trí ký, Phân loại bảo mật.
- **R-13-VI:** Các nút hành động: Phê duyệt, Yêu cầu chỉnh sửa, Bình luận, Gửi.

#### English
- **R-08-EN:** All user-facing labels must be in proper English.
- **R-09-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-10-EN:** Review statuses: In progress, Approved, Rejected.
- **R-11-EN:** QC checklist groups: Formal Requirements (3 items), Legal Content (4 items), Operational & Signing (2 items).
- **R-12-EN:** Checklist items: Template match, Spelling/presentation, Entity info match, Legal basis current, Clear rights/obligations, Risk clauses, Customer pain fit, Signature area, Confidentiality classification.
- **R-13-EN:** Action buttons: Approve, Request revision, Comment, Submit.

#### Chinese (中文)
- **R-08-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-09-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-10-ZH:** 审核状态：进行中、已批准、已拒绝。
- **R-11-ZH:** 质量审核清单组：形式要求（3项）、法律内容（4项）、操作与签署（2项）。
- **R-12-ZH:** 清单项目：模板匹配、拼写/呈现、实体信息匹配、法律依据有效、权利义务明确、风险条款、客户痛点匹配、签名位置、保密分类。
- **R-13-ZH:** 操作按钮：批准、要求修订、评论、提交。

#### Japanese (日本語)
- **R-08-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-09-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-10-JA:** レビューステータス：進行中、承認済み、却下。
- **R-11-JA:** 品質チェックリストグループ：形式的要件（3項目）、法的内容（4項目）、運用と署名（2項目）。
- **R-12-JA:** チェックリスト項目：テンプレート一致、スペル/プレゼンテーション、实体情報一致、法的根拠有効、権利と義務明確、リスク条項、顧客課題適合、署名位置、保密分類。
- **R-13-JA:** 操作ボタン：承認、修正依頼、コメント、送信。

### Phase-Specific Rules

- **R-14:** Checklist là static, derived from QC-LEG-01 defined in PROJECT.md.
- **R-15:** Checklist items được stored như seed data hoặc code constants, không phải user-manageable records trong MVP.
- **R-16:** Reviewer có thể request revision bằng cách mark một hoặc nhiều checklist items as failed với optional per-item comments.
- **R-17:** Specialist không thấy reviewer-only comments cho đến khi revision được requested.

</rules>

<deferred>
## Deferred Ideas

- Dynamic checklist configuration per template — v2 enhancement when templates have specific QC needs.
- Inline document annotation/comments on specific text passages — defer to post-MVP.
- Reviewer performance metrics and review time tracking — Phase 7 ops.
- Customer delivery and signed download — Phase 6.
- AI-assisted pre-review risk flagging — v2 automation.

</deferred>

---

*Phase: 05-review*
*Context gathered: 2026-05-30*
