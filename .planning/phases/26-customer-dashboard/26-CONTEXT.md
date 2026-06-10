# Phase 26: Customer Dashboard - Context

**Gathered:** 2026-06-10 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Render customer dashboard (`user-dashboard.html`) with all components: 4 stat cards (12 hồ sơ, 3 đang xử lý, 8 hoàn tất, 36 vault), welcome banner, case list, deadline/SLA panel, recent docs, activity timeline, requests table with 7 columns, toolbar with search/filters, and floating chat button with notification badge.

Depends on Phase 25 (Auth & i18n). Success criteria: all components render matching template exactly.

</domain>

<decisions>
## Implementation Decisions

### Layout structure
- **D-01:** Sidebar (262px) + Main content area with topbar
- **D-02:** Main content scrolls independently (`overflow: auto` on `.content`)
- **D-03:** Responsive: min-width 1400px for desktop view matching template

### Component architecture
- **D-04:** UserLayout component wrapping all user portal pages (sidebar + topbar)
- **D-05:** StatCard component for 4 stat cards with icon/variant props (blue, green, orange, purple)
- **D-06:** WelcomeCard component with gradient background and quick action buttons
- **D-07:** CaseListPanel component with CaseItem children
- **D-08:** DeadlinePanel component with progress bars and SLA indicators
- **D-09:** DocumentPanel component with file type badges (PDF/DOC)
- **D-10:** ActivityTimeline component with relative timestamps
- **D-11:** RequestsTable component with 7-column grid layout
- **D-12:** FloatingChatButton component with notification badge

### Data source
- **D-13:** All sample data from SQLite database via Prisma queries
- **D-14:** Stat values computed from database counts: 12 hồ sơ, 3 đang xử lý, 8 hoàn tất, 36 vault
- **D-15:** Welcome message reads workspace status from database
- **D-16:** Requests table reads from `request` table with workspace filter
- **D-17:** Activity timeline reads from `audit_event` table filtered by current workspace

### Styling approach
- **D-18:** Match template CSS exactly: Inter font, CSS variables for colors, custom shadows
- **D-19:** Use Tailwind CSS utilities where possible, custom CSS for complex components
- **D-20:** Badge component with color variants: green (Đã duyệt), orange (Cần phản hồi), blue (Đang review), red (Quá hạn)
- **D-21:** Progress bar with 3 states: ok (green), warn (orange), danger (red)
- **D-22:** Floating chat button: red gradient with yellow border (`border: 3px solid #facc15`)

### Test coverage
- **D-23:** Whitebox: Unit tests for StatCard, WelcomeCard, CaseListPanel, DeadlinePanel, DocumentPanel, ActivityTimeline, RequestsTable, FloatingChatButton
- **D-24:** Blackbox: Integration tests for API endpoints returning dashboard data
- **D-25:** Abnormal: Empty workspace state, no requests state, no activity state
- **D-26:** Error: Error boundary fallback UI, loading skeleton
- **D-27:** E2E: Full dashboard render with all components visible

### Claude's Discretion
- Exact spacing/padding values (template uses specific px values)
- Icon library choice (Lucide React recommended for consistency)
- Animation/transition timing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Template source
- `layout/user-dashboard.html` — Full template with all CSS, HTML structure, sample data

### Requirements
- `requirements/REQUIREMENTS.md` § Customer Dashboard — CUST-DASH-01 through CUST-DASH-10

### Success criteria
- `planning/ROADMAP.md` § Phase 26 — Success criteria for dashboard render

### Tech stack
- `src/components/ui/` — Existing UI components (ErrorFallback, PageSkeleton, CardSkeleton)
- Phase 25 (Auth & i18n) — Must be completed before this phase

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/ErrorFallback.tsx` — Error boundary pattern
- `src/components/ui/PageSkeleton.tsx` — Loading skeleton for pages
- `src/components/ui/CardSkeleton.tsx` — Card skeleton for stat cards

### Established Patterns
- Next.js 14 App Router with TypeScript
- Ant Design 6 + Tailwind CSS
- Prisma + SQLite for data layer
- Better Auth for authentication
- next-intl for i18n (4 languages: VI/EN/ZH/JA)

### Integration Points
- Route: `/[locale]/dashboard` or `/dashboard` with locale prefix
- UserLayout component wraps user portal pages
- Database queries filter by workspace scope (tenant isolation)

</codebase_context>

<specifics>
## Specific Ideas

- Template uses custom CSS (not Ant Design components for main layout)
- Stat card icons: FileText (blue), Clock (orange), CheckCircle (green), Folder (purple)
- Welcome card gradient: `#ffffff` to `#f0fdfa`
- Floating chat: `background: linear-gradient(180deg, #ef4444, #dc2626)` with `border: 3px solid #facc15`
- Notification badge text: "2 Tin mới"

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Phân quyền phải được kiểm tra server-side cho mọi request, document, review và vault file access.
- **R-05:** Frontend role checks chỉ mang tính UX, không phải bảo mật.
- **R-06:** Database queries phải filter by workspace scope (tenant isolation).

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-07-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-08-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-09-VI:** Trạng thái badge: Đã duyệt (xanh), Cần phản hồi (cam), Đang review (xanh dương), Quá hạn (đỏ).
- **R-10-VI:** Stat cards: 12 hồ sơ, 3 đang xử lý, 8 hoàn tất, 36 vault.
- **R-11-VI:** Các nút hành động: Sửa, Xóa, Gửi, Hủy, Lưu, Tiếp tục, Xem, Tải về, Tải lên.
- **R-12-VI:** Floating chat: Hỗ trợ, 2 Tin mới.

#### English
- **R-07-EN:** All user-facing labels must be in proper English.
- **R-08-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-09-EN:** Status badges: Approved (green), Needs response (orange), Under review (blue), Overdue (red).
- **R-10-EN:** Stat cards: 12 files, 3 in progress, 8 completed, 36 vault.
- **R-11-EN:** Action buttons: Edit, Delete, Submit, Cancel, Save, Continue, View, Download, Upload.
- **R-12-EN:** Floating chat: Support, 2 New messages.

#### Chinese (中文)
- **R-07-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-08-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-09-ZH:** 状态徽章：已批准（绿色）、需要回复（橙色）、审核中（蓝色）、已逾期（红色）。
- **R-10-ZH:** 统计卡片：12个文件、3个处理中、8个已完成、36个保管库。
- **R-11-ZH:** 操作按钮：编辑、删除、提交、取消、保存、继续、查看、下载、上传。
- **R-12-ZH:** 浮动聊天：支持、2条新消息。

#### Japanese (日本語)
- **R-07-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-08-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-09-JA:** ステータスタグ：承認済み（緑）、応答必要（オレンジ）、レビュー中（青）、期限超過（赤）。
- **R-10-JA:** 統計カード：12ファイル、3処理中、8完了、36ボルト。
- **R-11-JA:** 操作ボタン：編集、削除、送信、キャンセル、保存、次へ、表示、ダウンロード、アップロード。
- **R-12-JA:** フローティングチャット：サポート、2件の新規メッセージ。

### Phase-Specific Rules

- **R-13:** UserLayout component với sidebar (262px) + main content area.
- **R-14:** Stat values computed from database counts.
- **R-15:** Welcome message reads workspace status từ database.
- **R-16:** Requests table reads from request table với workspace filter.
- **R-17:** Activity timeline reads from audit_event table filtered by current workspace.

</rules>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 26-customer-dashboard*
*Context gathered: 2026-06-10*
