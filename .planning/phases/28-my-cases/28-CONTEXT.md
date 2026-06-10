# Phase 28: My Cases - Context

**Gathered:** 2026-06-11 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Render My Cases page (`user-cases.html`) with summary banner, 4 stat cards (Tổng: 12, Đang xử lý: 3, Hoàn tất: 8, Quá hạn: 1), toolbar with search/filters/dropdowns, and 7-column requests table with sample data. Users can view and manage their legal requests with filtering and search capabilities.

Depends on Phase 27 (Create Request). Success criteria: all components render matching template exactly.

</domain>

<decisions>
## Implementation Decisions

### Layout structure
- **D-01:** UserLayout wrapper (sidebar 262px + main content)
- **D-02:** Page header with title "Hồ sơ của tôi" and subtitle
- **D-03:** Content area scrolls independently (`overflow: auto`)

### Summary banner
- **D-04:** SummaryBanner component with gradient background (#fff to #f0fdfa)
- **D-05:** Banner shows: title "Danh sách hồ sơ pháp lý của bạn", description text
- **D-06:** "Tạo yêu cầu mới" button with teal gradient style
- **D-07:** Banner border-radius: 15px, box-shadow: var(--soft-shadow)

### Stat cards
- **D-08:** 4 StatCard components in grid (repeat 4, 1fr)
- **D-09:** Card values from database counts:
  - Tổng hồ sơ: 12 (blue icon)
  - Đang xử lý: 3 (orange icon)
  - Hoàn tất: 8 (green icon)
  - Quá hạn: 1 (red icon)
- **D-10:** StatCard props: icon (emoji), variant (blue/orange/green/red), title, value, description

### Toolbar component
- **D-11:** ToolbarCard component with search input and filter buttons
- **D-12:** Search input: placeholder "Tìm mã hồ sơ, loại yêu cầu...", width 360px
- **D-13:** Filter buttons: Bộ lọc, Trạng thái ▾, Loại yêu cầu ▾ (dropdown style)
- **D-14:** Right tools: Export button, Cột hiển thị button
- **D-15:** Search triggers real-time filtering on input change
- **D-16:** Dropdowns show available filter options from database

### Requests table
- **D-17:** TableCard component with 7 columns (grid-template-columns: 1.05fr 1.15fr .9fr 1fr 1fr .9fr .8fr)
- **D-18:** Column headers: Mã hồ sơ, Loại yêu cầu, Trạng thái, Người phụ trách, Cập nhật, SLA, Thao tác
- **D-19:** Table rows display sample data (REQ-2026-021, 019, 018, 016, 012)
- **D-20:** Case cell: case icon (blue gradient), request code, status text
- **D-21:** Request type cell: Vietnamese title + English subtitle
- **D-22:** Status badges: Đang review (blue), Cần phản hồi (orange), Đã duyệt (green), Quá hạn (red)
- **D-23:** Assignee cell: name + role (Specialist/Reviewer/Coordinator)
- **D-24:** Updated cell: date + time (DD/MM/YYYY, HH:mm ICT)
- **D-25:** SLA cell: time remaining badge (Còn Xh, Còn X ngày, Trễ X ngày)
- **D-26:** Action cell: action link (Mở →, Phản hồi →, Tải kết quả →, Bổ sung →, Xem →)

### Floating chat
- **D-27:** FloatingChatButton component with notification badge
- **D-28:** Style: red gradient (#ef4444 to #dc2626), yellow border (#facc15)
- **D-29:** Badge text: "2 Tin mới"

### Data source
- **D-30:** All sample data from SQLite database via Prisma queries
- **D-31:** Stat values computed from database counts per workspace
- **D-32:** Requests table reads from `request` table with workspace filter
- **D-33:** Filter options from `request.status` enum values

### Test coverage
- **D-34:** Whitebox: Unit tests for SummaryBanner, StatCard, ToolbarCard, TableCard, FloatingChatButton
- **D-35:** Blackbox: Integration tests for API endpoints returning requests data
- **D-36:** Abnormal: Empty workspace state, no requests, filter with no results
- **D-37:** Error: Error boundary fallback UI, loading skeleton
- **D-38:** E2E: Full My Cases render with search and filter functionality

### Claude's Discretion
- Exact filter dropdown options (populated from database)
- Search debounce timing
- Table row hover animation
- Empty state design

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Template source
- `layout/user-cases.html` — Full template with all CSS, HTML structure, sample data

### Requirements
- `planning/REQUIREMENTS.md` § My Cases (user-cases.html) — CUST-CASES-01 through CUST-CASES-05

### Success criteria
- `planning/ROADMAP.md` § Phase 28 — Success criteria for My Cases render

### Tech stack
- `src/app/[locale]/customer/components/UserLayout.tsx` — User layout component (reusable)
- `src/components/ui/` — Existing UI components (ErrorFallback, PageSkeleton, CardSkeleton)
- `src/app/[locale]/customer/components/StatCard.tsx` — StatCard component from Phase 26
- Phase 26 — Customer Dashboard patterns and components
- Phase 27 — Create Request patterns

### Prior phases
- Phase 26 CONTEXT.md — Layout structure, StatCard component, data patterns
- Phase 27 CONTEXT.md — Component patterns, UserLayout usage

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/app/[locale]/customer/components/UserLayout.tsx` — Sidebar + topbar layout, nav items
- `src/app/[locale]/customer/components/StatCard.tsx` — StatCard component with variants
- `src/components/ui/ErrorFallback.tsx` — Error boundary pattern
- `src/components/ui/PageSkeleton.tsx` — Loading skeleton for pages
- `src/components/ui/CardSkeleton.tsx` — Card skeleton for components

### Established Patterns
- Next.js 14 App Router with TypeScript
- Ant Design 6 + Tailwind CSS
- Prisma + SQLite for data layer
- Better Auth for authentication
- next-intl for i18n (4 languages: VI/EN/ZH/JA)
- Custom CSS matching template styles (Inter font, CSS variables for colors)

### Integration Points
- Route: `/[locale]/[workspaceSlug]/cases` or `/[workspaceSlug]/cases`
- UserLayout component wraps user portal pages
- Database queries filter by workspace scope (tenant isolation)
- API routes for search and filter operations

</codebase_context>

<specifics>
## Specific Ideas

- Template uses custom CSS (not Ant Design for main layout)
- Summary banner gradient: `#fff` to `#f0fdfa`, border-radius 15px
- Stat card icons: 📄 (blue), ⏱ (orange), ✓ (green), ! (red)
- Table row hover: background `#fbfdff`
- SLA badge colors: green (Đúng hạn), orange (Còn Xh), red (Trễ X ngày)
- Action link style: color #087f78, font-weight 800
- Floating chat: red gradient with yellow border, "2 Tin mới" badge

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Phân quyền phải được kiểm tra server-side cho mọi request data access.
- **R-05:** Database queries phải filter by workspace scope (tenant isolation).

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-06-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-07-VI:** Page title: Hồ sơ của tôi. Subtitle: Quản lý các yêu cầu pháp lý, trạng thái xử lý, SLA và kết quả tư vấn của bạn.
- **R-08-VI:** Summary banner: Danh sách hồ sơ pháp lý của bạn. Description: Theo dõi trạng thái xử lý, người phụ trách, SLA và kết quả tư vấn trong phạm vi workspace.
- **R-09-VI:** Stat titles: Tổng hồ sơ, Đang xử lý, Hoàn tất, Quá hạn.
- **R-10-VI:** Toolbar: Tìm mã hồ sơ, loại yêu cầu..., Bộ lọc, Trạng thái, Loại yêu cầu, Export, Cột hiển thị.
- **R-11-VI:** Table headers: Mã hồ sơ, Loại yêu cầu, Trạng thái, Người phụ trách, Cập nhật, SLA, Thao tác.
- **R-12-VI:** Status badges: Đang review (xanh dương), Cần phản hồi (cam), Đã duyệt (xanh), Đã nộp (xanh dương), Quá hạn (đỏ).
- **R-13-VI:** SLA badges: Còn Xh, Còn X ngày, Đúng hạn, Theo dõi, Trễ X ngày.
- **R-14-VI:** Action links: Mở →, Phản hồi →, Tải kết quả →, Bổ sung →, Xem →.
- **R-15-VI:** Floating chat: Hỗ trợ, 2 Tin mới.

#### English
- **R-06-EN:** All user-facing labels must be in proper English.
- **R-07-EN:** Page title: My Cases. Subtitle: Manage your legal requests, processing status, SLA and consultation results.
- **R-08-EN:** Summary banner: Your legal case list. Description: Track processing status, assignees, SLA and consultation results within workspace.
- **R-09-EN:** Stat titles: Total Files, In Progress, Completed, Overdue.
- **R-10-EN:** Toolbar: Search request code, type..., Filter, Status, Request type, Export, Display columns.
- **R-11-EN:** Table headers: Case Code, Request Type, Status, Assignee, Updated, SLA, Actions.
- **R-12-EN:** Status badges: Under review (blue), Needs response (orange), Approved (green), Submitted (blue), Overdue (red).
- **R-13-EN:** SLA badges: Xh remaining, X days remaining, On time, Monitoring, X days late.
- **R-14-EN:** Action links: Open →, Respond →, Download results →, Supplement →, View →.
- **R-15-EN:** Floating chat: Support, 2 New messages.

#### Chinese (中文)
- **R-06-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-07-ZH:** 页面标题：我的档案。副标题：管理您的法律请求、处理状态、SLA 和咨询结果。
- **R-08-ZH:** 摘要横幅：您的法律档案列表。描述：在工作区内跟踪处理状态、负责人、SLA 和咨询结果。
- **R-09-ZH:** 统计标题：档案总数、处理中、已完成、已逾期。
- **R-10-ZH:** 工具栏：搜索档案编号、类型...、筛选器、状态、请求类型、导出、显示列。
- **R-11-ZH:** 表格标题：档案编号、请求类型、状态、负责人、更新、SLA、操作。
- **R-12-ZH:** 状态标签：审核中（蓝色）、需要回复（橙色）、已批准（绿色）、已提交（蓝色）、已逾期（红色）。
- **R-13-ZH:** SLA标签：剩余X小时、剩余X天、按期、监控中、逾期X天。
- **R-14-ZH:** 操作链接：打开→、回复→、下载结果→、补充→、查看→。
- **R-15-ZH:** 浮动聊天：支持、2条新消息。

#### Japanese (日本語)
- **R-06-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-07-JA:** ページタイトル：私の案件。サブタイトル：法的リクエスト、処理状況、SLA、コンサルティング結果の管理。
- **R-08-JA:** 概要バナー：あなたの法的案件リスト。説明：ワークスペース内での処理状況、担当、SLA、コンサルティング結果の追跡。
- **R-09-JA:** 統計タイトル：総ファイル数、処理中、完了済み、期限超過。
- **R-10-JA:** ツールバー：案件番号検索、タイプ...、フィルター、状況、リクエストタイプ、エクスポート、表示列。
- **R-11-JA:** テーブルヘッダー：案件番号、リクエストタイプ、状況、担当、更新、SLA、操作。
- **R-12-JA:** ステータスタグ：レビュー中（青）、応答必要（オレンジ）、承認済み（緑）、提交済み（青）、期限超過（赤）。
- **R-13-JA:** SLAタグ：残りX時間、残りX日、定時、モニタリング、X日遅延。
- **R-14-JA:** 操作リンク：開く→、返信→、結果ダウンロード→、補足→、表示→。
- **R-15-JA:** フローティングチャット：サポート、2件の新規メッセージ。

### Phase-Specific Rules

- **R-16:** Table filters by request.status and request.type.
- **R-17:** Search queries request.code and request.type (Vietnamese/English).
- **R-18:** Stat values computed from database counts per workspace.
- **R-19:** SLA calculated from request.slaDeadline and current time.

</rules>

<deferred>
## Deferred Ideas

- Case detail page (clicking "Mở →" navigates to detail view) — Phase 29+ Messages or separate phase
- Bulk actions on table rows (select multiple, export, etc.) — future phase
- Advanced filter options (date range, assignee, priority) — future phase

</deferred>

---

*Phase: 28-my-cases*
*Context gathered: 2026-06-11*
