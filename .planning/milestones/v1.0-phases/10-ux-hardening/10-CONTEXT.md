# Phase 10: ux-hardening - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Source:** `/gsd-audit-milestone` gap closure

<domain>
## Phase Boundary

Close DLV-02 UX degradation (customer download redirect), fix `listDocumentVersions` Prisma duplicate `document` key, and surface deliver/close feedback to specialist.

This phase does not change review service layer (Phase 08), folder/tag classification (Phase 09), or any backend workflow rules.

</domain>

<decisions>
## Implementation Decisions

### listDocumentVersions Fix (BLOCKER)
- **D-01:** `src/lib/documents/draft-service.ts` `listDocumentVersions` (around line 199-220) has two `document: { ... }` blocks in the Prisma `select`. Merge into a single block. This unblocks the specialist workbench.
- **D-02:** Add regression test that calls `listDocumentVersions` with a real or mocked Prisma client and asserts it does not throw on duplicate key.

### Customer Download UX (DLV-02)
- **D-03:** `src/app/customer/requests/[requestId]/page.tsx` renders download link as `/api/vault/${document.vaultFileId}/download` with a bare path. Change to inline the signed URL from `requestVaultFileAccess()` so the browser makes a single request without redirect.
- **D-04:** Signed URL TTL remains 15 minutes per Phase 06 CONTEXT D-08.
- **D-05:** Add regression test covering the customer download path with a valid signed URL.

### Deliver/Close Feedback
- **D-06:** `src/app/specialist/requests/[requestId]/page.tsx` does not render `markDeliveredAction`/`closeDeliveredAction` result. Consume the `{ ok, message }` state and render success/failure messages using existing `Badge` or inline copy.
- **D-07:** Success message uses Vietnamese copy: "Đã giao tài liệu thành công" / "Đã đóng hồ sơ".
- **D-08:** Failure message uses Vietnamese copy: the error message from the action result.

### Claude's Discretion
- Exact UI for action result feedback (inline alert, banner, badge) may follow existing patterns.
- Exact test harness for regression tests may use `tsx` scripts consistent with existing service tests.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project requirements
- `.planning/REQUIREMENTS.md` — DLV-02, DLV-05 (UX feedback).
- `.planning/ROADMAP.md` — Phase 10 goal, success criteria.

### Audit source
- `.planning/v1.0-MILESTONE-AUDIT.md` — G-2 (listDocumentVersions bug), G-4 (customer download UX), G-5 (silent deliver/close feedback).

### Existing implementation anchors
- `src/lib/documents/draft-service.ts` — `listDocumentVersions` (bug location).
- `src/lib/documents/vault-service.ts` — `requestVaultFileAccess()` returns signed URL.
- `src/app/customer/requests/[requestId]/page.tsx` — Customer delivery page with bare download link.
- `src/app/specialist/requests/[requestId]/page.tsx` — Specialist page with deliver/close forms.
- `src/app/specialist/requests/[requestId]/actions.ts` — `markDeliveredAction`, `closeDeliveredAction` returning `{ ok, message }`.
- `src/app/admin/components/ui.tsx` — Badge, Button for feedback rendering.

</canonical_refs>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Signed URL TTL là 15 phút theo Phase 06 CONTEXT D-08.
- **R-05:** Regression tests phải cover customer download path và listDocumentVersions.

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-06-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-07-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-08-VI:** Success messages: Đã giao tài liệu thành công, Đã đóng hồ sơ.
- **R-09-VI:** Error messages: Hiển thị error message từ action result.
- **R-10-VI:** Các nút hành động: Tải về, Xem chi tiết, Giao tài liệu, Đóng hồ sơ.

#### English
- **R-06-EN:** All user-facing labels must be in proper English.
- **R-07-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-08-EN:** Success messages: Documents delivered successfully, Case closed.
- **R-09-EN:** Error messages: Display error message from action result.
- **R-10-EN:** Action buttons: Download, View details, Deliver, Close case.

#### Chinese (中文)
- **R-06-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-07-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-08-ZH:** 成功消息：文档交付成功、案件已关闭。
- **R-09-ZH:** 错误消息：显示操作结果中的错误消息。
- **R-10-ZH:** 操作按钮：下载、查看详情、交付、关闭案件。

#### Japanese (日本語)
- **R-06-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-07-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-08-JA:** 成功メッセージ：書類納品成功、ケースクローズ。
- **R-09-JA:** エラーメッセージ：アクション結果のエラーメッセージを表示。
- **R-10-JA:** 操作ボタン：ダウンロード、詳細を見る、納品、ケースを閉じる。

### Phase-Specific Rules

- **R-11:** listDocumentVersions fix: Merge two document: { ... } blocks into single block in Prisma select.
- **R-12:** Customer download UX: Inline signed URL từ requestVaultFileAccess() thay vì bare path redirect.
- **R-13:** Deliver/Close Feedback: Consume { ok, message } state và render success/failure messages.

</rules>

<deferred>
## Deferred Ideas

- Email provider real integration (currently stub) — v2 production.
- Delivery notification queue/worker — v2 infra.
- Customer in-app notification center — v2 customer UX.

</deferred>

---

*Phase: 10-ux-hardening*
*Context gathered: 2026-06-02*
