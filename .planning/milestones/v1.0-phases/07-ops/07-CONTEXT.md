# Phase 7: ops - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** --auto (recommended defaults applied)

<domain>
## Phase Boundary

Provide admin operational visibility for the legal workflow: dashboard counts, request filters, workload views, SLA timestamp/aging tracking, and per-request audit timeline. Phase 7 does not add advanced analytics, SLA escalation automation, billing analytics, customer-facing reporting, saved filter views, fuzzy search, CSV/PDF export, or employee productivity scoring.

</domain>

<decisions>
## Implementation Decisions

### Dashboard metrics
- **D-01:** Build MVP operational counts by request status, assigned specialist, assigned reviewer, and aging. This directly covers OPS-01 and roadmap success criteria.
- **D-02:** Prefer plain admin cards and tables over analytics-heavy charts. Charts may be added only if already cheap from existing data, not as separate scope.
- **D-03:** Counts must be derived from backend data (`LegalRequest`, assignments, workflow timestamps), not hard-coded fixtures or frontend-only state.

### Request filtering
- **D-04:** Implement admin-facing server-side filters for customer/workspace, matter type, status, assignee, reviewer, and date range.
- **D-05:** Filters should compose together with AND semantics. No saved views, faceted search, fuzzy search, or export in MVP.
- **D-06:** Filtering must respect server-side RBAC. Admin visibility comes from `coordinator_admin` / `super_admin`; frontend navigation hiding is UX only.

### Workload view
- **D-07:** Show simple workload counts per specialist and reviewer, split by active request statuses where useful.
- **D-08:** Do not build capacity scoring, availability scheduling, productivity/performance analytics, or auto-balancing in Phase 7. Keep the ops MVP readable and evidence-based.
- **D-09:** Workload source of truth is `LegalRequest.assignedSpecialistId`, `LegalRequest.assignedReviewerId`, and `RequestAssignment` history where needed.

### SLA timestamps and aging
- **D-10:** Track basic SLA timestamps by deriving milestone times from request lifecycle fields and `WorkflowTransition.createdAt`.
- **D-11:** Display aging in human-operational terms: created age, time in current status, pending review age, delivered/closed timing when available.
- **D-12:** No SLA policy engine, breach escalation automation, business-hours calendar, or configurable SLA thresholds in MVP unless already trivial from existing data.

### Audit timeline
- **D-13:** Admin can view chronological timeline for a single request using safe audit events and workflow transitions.
- **D-14:** Timeline should show time, actor, action/status change, target, correlation id, reason, and `metadataSummary` where present.
- **D-15:** Do not expose raw legal content, full document text, internal reviewer-only comments, sensitive file contents, or raw `storageKey` in timeline. Use identifiers and safe summaries only.

### Claude's Discretion
- Exact card layout, table grouping, badge colors, and empty/loading states may follow existing admin UI patterns.
- Exact query decomposition may be chosen by researcher/planner, as long as server-side filtering/RBAC and simple MVP scope remain intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and phase scope
- `.planning/PROJECT.md` — Project constraints: legal accuracy, security, workflow integrity, traceability, MVP scope, and audit requirements.
- `.planning/REQUIREMENTS.md` — OPS-01 through OPS-05 requirements and v2/out-of-scope boundaries.
- `.planning/ROADMAP.md` — Phase 7 goal and success criteria.

### Locked prior decisions
- `.planning/phases/01-foundation/01-CONTEXT.md` — Server-side RBAC, append-only audit, backend-owned workflow transitions, workspace isolation.
- `.planning/phases/03-routing/03-CONTEXT.md` — Capability routing foundations; workload/SLA scoring deferred from routing.
- `.planning/phases/05-review/05-CONTEXT.md` — Reviewer portal and review records; reviewer performance/review time metrics deferred to ops.
- `.planning/phases/06-delivery/06-CONTEXT.md` — Delivery/close events and decision to defer customer download analytics.

### Existing implementation anchors
- `prisma/schema.prisma` — Data models for `LegalRequest`, `RequestAssignment`, `WorkflowTransition`, `Review`, `VaultFile`, `AuditEvent`, users, roles, and statuses.
- `src/lib/workflow/request-workflow.ts` — Backend status transition rules and workflow audit recording.
- `src/lib/security/rbac.ts` — Request/workspace/vault access rules.
- `src/lib/audit/audit.ts` — Safe audit event creation and `metadataSummary` constraints.
- `src/app/admin/components/ui.tsx` — Admin UI primitives: `Card`, `Table`, `Badge`, `Button`, `PageHeader`.
- `src/app/admin/components/admin-shell.tsx` — Admin layout and navigation pattern.
- `src/app/admin/requests/page.tsx` — Existing request admin page pattern and status labels.
- `src/app/admin/audit/page.tsx` — Existing audit table pattern and safe metadata note.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AdminShell` from `src/app/admin/components/admin-shell.tsx`: use for ops/admin pages and navigation consistency.
- `Card`, `Table`, `Badge`, `Button`, `PageHeader` from `src/app/admin/components/ui.tsx`: reuse for dashboard metric cards, workload tables, filter panels, and timeline rows.
- `getAllowedTransitions` and workflow transition model from `src/lib/workflow/request-workflow.ts`: use request lifecycle as source for aging/status labels, not frontend-only logic.
- `recordAuditEvent` from `src/lib/audit/audit.ts`: existing audit format constrains timeline fields to safe metadata.

### Established Patterns
- Next.js App Router pages under `src/app/admin/*/page.tsx` use server-rendered admin screens and shared admin components.
- Prisma is accessed through `src/lib/prisma.ts` and models in `prisma/schema.prisma`.
- RBAC is server-side via `src/lib/security/rbac.ts`; UI navigation cannot be the security boundary.
- Audit metadata is intentionally summarized; no raw sensitive legal content should be displayed in operational views.
- UI copy is Vietnamese; code identifiers and enums remain English.

### Integration Points
- Add ops dashboard under admin namespace, likely `src/app/admin/ops/page.tsx`, and add nav item to `AdminShell` if planner chooses a new route.
- Query `LegalRequest` for status, workspace/customer, assignee/reviewer, created/updated dates, and joins to intake/matter type where needed.
- Query `RequestAssignment` for assignment history and workload context.
- Query `WorkflowTransition` for SLA milestone timestamps and current-status aging.
- Query `AuditEvent` and `WorkflowTransition` for request audit timeline.

</code_context>

<specifics>
## Specific Ideas

- Use a practical operations cockpit style: metric cards first, filterable request list second, workload table third, and drill-in audit timeline per request.
- Keep Phase 7 focused on “what needs attention now” rather than analytics depth.
- Prefer Vietnamese labels consistent with current admin pages.

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Dashboard metrics phải được derive từ backend data (LegalRequest, assignments, workflow timestamps), không phải hard-coded fixtures.
- **R-05:** Filters phải compose với AND semantics, không có saved views hoặc fuzzy search trong MVP.
- **R-06:** Timeline chỉ hiển thị safe audit events và workflow transitions.

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-07-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-08-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-09-VI:** Các nút hành động: Sửa, Xóa, Gửi, Hủy, Lưu, Tiếp tục, Xem, Tải về, Tải lên, Đăng nhập, Đăng xuất.
- **R-10-VI:** Dashboard metrics: Tổng hồ sơ, Đang xử lý, Hoàn tất, Quá hạn, Sắp quá SLA.
- **R-11-VI:** SLA labels: Bình thường, Cảnh báo, Nguy hiểm.

#### English
- **R-07-EN:** All user-facing labels must be in proper English.
- **R-08-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-09-EN:** Action buttons: Edit, Delete, Submit, Cancel, Save, Continue, View, Download, Upload, Sign in, Sign out.
- **R-10-EN:** Dashboard metrics: Total requests, In progress, Completed, Overdue, SLA warning.
- **R-11-EN:** SLA labels: Normal, Warning, Critical.

#### Chinese (中文)
- **R-07-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-08-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-09-ZH:** 操作按钮：编辑、删除、提交、取消、保存、继续、查看、下载、上传、登录、退出。
- **R-10-ZH:** 仪表板指标：总请求、处理中、已完成、已逾期、SLA警告。
- **R-11-ZH:** SLA标签：正常、警告、危急。

#### Japanese (日本語)
- **R-07-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-08-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-09-JA:** 操作ボタン：編集、削除、送信、キャンセル、保存、次へ、表示、ダウンロード、アップロード、ログイン、ログアウト。
- **R-10-JA:** ダッシュボード指標：総リクエスト、処理中、完了、期限超過、SLA警告。
- **R-11-JA:** SLAラベル：通常、警告、重大。

### Phase-Specific Rules

- **R-12:** Workload view hiển thị simple workload counts per specialist và reviewer.
- **R-13:** SLA timestamps được track bằng cách derive milestone times từ request lifecycle fields.
- **R-14:** Timeline hiển thị time, actor, action/status change, target, correlation id, reason.
- **R-15:** Không expose raw legal content, full document text, hoặc internal reviewer-only comments trong timeline.

</rules>

<deferred>
## Deferred Ideas

- Advanced SLA breach policy/escalation — future phase after basic timestamps prove useful.
- Productivity/performance analytics — future phase; avoid turning MVP ops into employee scoring.
- Customer download analytics — explicitly deferred from Phase 6 and not required for OPS-01..OPS-05.
- Saved filter views, fuzzy search, CSV/PDF export — useful later, not Phase 7 MVP.

</deferred>

---

*Phase: 07-ops*
*Context gathered: 2026-06-01*
