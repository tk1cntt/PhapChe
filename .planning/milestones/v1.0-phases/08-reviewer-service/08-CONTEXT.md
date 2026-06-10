# Phase 08: reviewer-service - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Source:** `/gsd-audit-milestone` gap closure

<domain>
## Phase Boundary

Build the missing reviewer service layer (`src/lib/reviews/review-service.ts`) and fix the reviewer queue/detail UI so REV-01..REV-09 are satisfied end-to-end and the `approved → delivered → closed` flow becomes reachable from the reviewer portal.

This phase does not add dynamic per-template checklist configuration, reviewer performance metrics, inline document annotation, customer delivery UX changes, or folder/tag classification.

</domain>

<decisions>
## Implementation Decisions

### Reviewer Service Layer
- **D-01:** `src/lib/reviews/review-service.ts` exposes `startReview`, `answerChecklistItem`, `approveReview`, `rejectReview`. All server-side, all RBAC-gated via existing `canAccessRequest`.
- **D-02:** `startReview` creates a `Review` row (status `in_progress`) linked to a specific `DocumentVersion`. Returns the review record and existing checklist items.
- **D-03:** `answerChecklistItem` upserts a `ReviewChecklistAnswer` (passed/comment) for one item within the active review.
- **D-04:** `approveReview` checks all required checklist items are `passed: true`; sets `Review.status = approved`, `DocumentVersion.status = final`, `Review.completedAt = now()`; calls `transitionRequestStatus(... 'approved')` — all in one `$transaction`.
- **D-05:** `rejectReview` sets `Review.status = rejected`, `Review.decision = reject`, `DocumentVersion.status = draft`, `Review.completedAt = now()`; calls `transitionRequestStatus(... 'revision_required')` — preserves the review record (REV-08).
- **D-06:** Every review action emits `recordAuditEvent` with safe metadata: reviewId, documentVersionId, decision, checklist pass/fail counts, no legal content.

### Checklist Model
- **D-07:** Checklist items are constants from QC-LEG-01 seeded as in-code seed or existing Prisma seed, consistent with Phase 05 CONTEXT D-01..D-03.
- **D-08:** Each item has: id, group (formal/legal_content/operational), label (Vietnamese), required flag, sort order.

### Reviewer Queue
- **D-09:** `/reviewer/requests` queries `DocumentVersion` where `status = submitted_for_review` and the request is assigned to the current reviewer. Traversal: `DocumentVersion.document.request.assignedReviewerId === session.userId`. Fix the broken `legalRequest.assignedReviewerId` query.
- **D-10:** Remove `versionNumber` reference; use `DocumentVersion.templateVersion` for display.
- **D-11:** Queue shows: request title, matter type, specialist name, submission time, version number.

### Reviewer Detail Page
- **D-12:** `/reviewer/requests/[requestId]/review/[documentVersionId]` loads the real document version content, the checklist, the existing review (if any), and all `ReviewChecklistAnswer` rows for the current review.
- **D-13:** Checklist renders with per-item pass/fail toggle, comment field for failures, and Vietnamese labels.
- **D-14:** Approve button enabled only when all required items are passed; reject button shows failed items and general comment field.
- **D-15:** On approve, redirect to queue with success message; on reject, redirect to queue with "revision requested" message.

### Security and Audit
- **D-16:** Reviewer can only see/review document versions assigned to them. RBAC check uses `canAccessRequest` plus `assignedReviewerId`.
- **D-17:** All review actions create append-only audit events. Specialist cannot see reviewer-only comments until revision is requested (REV-08).
- **D-18:** Customer never sees internal review data.

### Claude's Discretion
- Exact Prisma model field names may follow existing schema conventions.
- Checklist seed approach (code constants vs Prisma seed) may be chosen by planner.
- Review submission confirmation UX may follow existing patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/PROJECT.md` — QC-LEG-01 checklist criteria, reviewer portal split-view requirement, legal accuracy constraints, workflow integrity.
- `.planning/REQUIREMENTS.md` — Phase 08 requirements REV-01 through REV-09.
- `.planning/ROADMAP.md` — Phase 08 goal, success criteria, and gap closure origin.

### Prior phase context (locked decisions)
- `.planning/phases/01-foundation/01-CONTEXT.md` — RBAC, audit trail, workflow state machine including `pending_review` and `revision_required`.
- `.planning/phases/02-intake/02-CONTEXT.md` — Structured intake data, matter type catalog.
- `.planning/phases/03-routing/03-CONTEXT.md` — Assignment model, `assignedReviewerId` on LegalRequest.
- `.planning/phases/04-documents-vault/04-CONTEXT.md` — DocumentVersion model, `submitted_for_review` status, specialist workbench.
- `.planning/phases/05-review/05-CONTEXT.md` — Checklist model decisions (D-01..D-07), reviewer portal layout (D-08..D-10), revision flow (D-11..D-14), approval flow (D-15..D-17), security (D-18..D-20).
- `.planning/phases/06-delivery/06-CONTEXT.md` — Delivery requires `approved` status; DLV-01 depends on `DocumentVersion.status = final`.

### Audit source
- `.planning/v1.0-MILESTONE-AUDIT.md` — G-1 blocker origin, broken flows F-B1, affected REQ-IDs.

### Existing implementation anchors
- `prisma/schema.prisma` — `Review`, `ReviewChecklistAnswer`, `DocumentVersion`, `Document`, `LegalRequest`, `AuditEvent`, `WorkflowTransition` models.
- `src/lib/workflow/request-workflow.ts` — `transitionRequestStatus`, `canTransitionRequestStatus`, `getAllowedTransitions`.
- `src/lib/audit/audit.ts` — `recordAuditEvent` with safe metadata constraints.
- `src/lib/security/rbac.ts` — `canAccessRequest`, `canAccessReview`.
- `src/app/reviewer/requests/page.tsx` — Current broken reviewer queue (must fix Prisma query).
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` — Current stub detail (must replace).
- `src/app/admin/components/ui.tsx` — Card, Table, Badge, Button, PageHeader.

</canonical_refs>

<specifics>
## Specific Ideas

- Checklist QC-LEG-01 has 3 groups, 9 items (Formal 3, Legal Content 4, Operational 2). Use Vietnamese labels from PROJECT.md.
- Reviewer portal should feel like a quality gate: clear pass/fail per item, obvious approve/reject actions.
- Revision feedback should be actionable: specialist knows exactly which item failed and why.
- Keep review workflow transparent: both reviewer and specialist can see current review status and history.
- Consider that the `listDocumentVersions` bug in `draft-service.ts` (duplicate `document` key, Phase 10) may affect whether specialist sees submitted-for-review versions. Phase 08 should note this dependency.

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Reviewer chỉ có thể approve khi tất cả required checklist items được marked passed: true.
- **R-05:** Review phải reference specific DocumentVersion id, không chỉ Document id.
- **R-06:** Tất cả review actions phải emit recordAuditEvent với safe metadata.

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-07-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-08-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-09-VI:** Trạng thái review: Đang thực hiện, Đã phê duyệt, Đã từ chối.
- **R-10-VI:** QC checklist groups: Yêu cầu hình thức, Nội dung pháp lý, Vận hành & Ký nhá.
- **R-11-VI:** Các nút hành động: Phê duyệt, Yêu cầu chỉnh sửa, Bình luận, Gửi.
- **R-12-VI:** Queue hiển thị: tiêu đề yêu cầu, loại việc, tên chuyên viên, thời gian gửi, số phiên bản.

#### English
- **R-07-EN:** All user-facing labels must be in proper English.
- **R-08-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-09-EN:** Review statuses: In progress, Approved, Rejected.
- **R-10-EN:** QC checklist groups: Formal Requirements, Legal Content, Operational & Signing.
- **R-11-EN:** Action buttons: Approve, Request revision, Comment, Submit.
- **R-12-EN:** Queue displays: request title, matter type, specialist name, submission time, version number.

#### Chinese (中文)
- **R-07-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-08-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-09-ZH:** 审核状态：进行中、已批准、已拒绝。
- **R-10-ZH:** 质量审核清单组：形式要求、法律内容、操作与签署。
- **R-11-ZH:** 操作按钮：批准、要求修订、评论、提交。
- **R-12-ZH:** 队列显示：请求标题、事项类型、专员姓名、提交时间、版本号。

#### Japanese (日本語)
- **R-07-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-08-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-09-JA:** レビューステータス：進行中、承認済み、却下。
- **R-10-JA:** 品質チェックリストグループ：形式的要件、法的内容、運用と署名。
- **R-11-JA:** 操作ボタン：承認、修正依頼、コメント、送信。
- **R-12-JA:** キュー表示：リクエストタイトル、事項タイプ、スペシャリスト名、提交時間、バージョン番号。

### Phase-Specific Rules

- **R-13:** review-service.ts phải expose startReview, answerChecklistItem, approveReview, rejectReview.
- **R-14:** approveReview phải kiểm tra all required checklist items passed trước khi set Review.status = approved.
- **R-15:** rejectReview preserves review record (REV-08) và set Review.status = rejected.
- **R-16:** Specialist không thấy reviewer-only comments cho đến khi revision được requested.

</rules>

<deferred>
## Deferred Ideas

- Dynamic checklist configuration per template — v2 enhancement.
- Inline document annotation/comments on specific text passages — post-MVP.
- Reviewer performance metrics and review time tracking — future ops enhancement.
- Customer delivery changes — Phase 10 UX hardening.
- AI-assisted pre-review risk flagging — v2 automation.

</deferred>

---

*Phase: 08-reviewer-service*
*Context gathered: 2026-06-02*
