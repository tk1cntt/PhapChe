# Phase 32: Admin Dashboard - Context

**Gathered:** 2026-06-11 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Render admin dashboard (`admin-dashboard.html`) with all components: 4 stat cards (128 users, 12 workspaces, 6 SLA warnings, 3 alerts), admin banner with system status, workload list with 4 specialists and progress bars, alerts panel with 4 alert items, workspace panel with 3 sample workspaces, approvals panel with 3 pending items, audit timeline with 3 recent entries, requests table with 7 columns and 5 sample rows, toolbar with search/filters, and floating alert button with notification badge.

Depends on Phase 31 (Settings). Success criteria: all components render matching template exactly.

</domain>

<decisions>
## Implementation Decisions

### Layout structure
- **D-01:** AdminLayout (Sidebar 262px) + Main content with topbar
- **D-02:** Main content scrolls independently (`overflow: auto` on `.content`)
- **D-03:** Responsive: min-width 1450px for desktop view matching template
- **D-04:** AdminLayoutShell component wrapping admin portal pages (sidebar + topbar)

### Component architecture
- **D-05:** StatCard component (reuse from Phase 26) with icon/variant props (blue, green, orange, red)
- **D-06:** AdminBanner component with gradient background and system status message
- **D-07:** WorkloadPanel component with WorkloadItem children (avatar, name, role, progress bar, count)
- **D-08:** AlertPanel component with AlertItem children (icon, title, description, badge)
- **D-09:** WorkspacePanel component with WorkspaceItem children (initials, name, stats, badge)
- **D-10:** ApprovalPanel component with ApprovalItem children (icon, title, description, badge)
- **D-11:** AuditTimeline component with timeline items (dot, title, description, relative time)
- **D-12:** AdminRequestsTable component with 7-column grid layout
- **D-13:** FloatingAlertButton component with notification badge (red gradient with yellow border)

### Data source
- **D-14:** All sample data from SQLite database via Prisma queries
- **D-15:** Stat values: 128 users (+14 this month), 12 workspaces (11 active), 6 SLA warnings, 3 audit alerts
- **D-16:** Admin banner reads system status from database (42 open files, 6 near SLA, 3 audit alerts, 12 workspaces)
- **D-17:** Workload list reads from `user` table filtered by specialist/reviewer roles with request counts
- **D-18:** Alert list reads from `audit_event` table filtered by alert types
- **D-19:** Workspace panel reads from `workspace` table
- **D-20:** Approval panel reads from pending approval requests
- **D-21:** Audit timeline reads from `audit_event` table with recent entries
- **D-22:** Requests table reads from `request` table with full status/SLA data

### Styling approach
- **D-23:** Match template CSS exactly: Inter font, CSS variables for colors, custom shadows
- **D-24:** Use Tailwind CSS utilities where possible, custom CSS for complex components
- **D-25:** Badge component with color variants: green (Active, Vault), orange (SLA, Pending), blue (Internal, Review), red (Audit, High)
- **D-26:** Progress bar with 3 states: ok (green gradient), warn (orange), danger (red)
- **D-27:** Floating alert button: red gradient with yellow border (`border: 3px solid #facc15`)
- **D-28:** Timeline dot with teal color (#087f78) and light teal border (#d9f8f4)

### Test coverage
- **D-29:** Whitebox: Unit tests for StatCard, AdminBanner, WorkloadPanel, AlertPanel, WorkspacePanel, ApprovalPanel, AuditTimeline, AdminRequestsTable, FloatingAlertButton
- **D-30:** Blackbox: Integration tests for API endpoints returning admin dashboard data
- **D-31:** Abnormal: Empty workspace state, no users, no alerts, no pending approvals
- **D-32:** Error: Error boundary fallback UI, loading skeleton
- **D-33:** E2E: Full admin dashboard render with all components visible

### Claude's Discretion
- Exact spacing/padding values (template uses specific px values)
- Icon library choice (Lucide React recommended for consistency)
- Animation/transition timing
- Floating button position (fixed right:22px, bottom:20px)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Template source
- `layout/admin-dashboard.html` — Full template with all CSS, HTML structure, sample data

### Requirements
- `requirements/REQUIREMENTS.md` § Admin Dashboard — ADMIN-DASH-01 through ADMIN-DASH-10

### Success criteria
- `planning/ROADMAP.md` § Phase 32 — Success criteria for admin dashboard render

### Tech stack
- `src/app/components/AdminLayout.tsx` — Existing admin layout shell component
- `src/app/components/Sidebar.tsx` — Existing sidebar with admin nav items
- `src/app/components/Topbar.tsx` — Existing topbar component
- Phase 26 (Customer Dashboard) — StatCard component pattern to reuse
- Phase 31 (Settings) — Must be completed before this phase

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/app/components/AdminLayout.tsx` — AdminLayoutShell wrapping admin pages
- `src/app/components/Sidebar.tsx` — Admin sidebar with 6 nav items (Dashboard, Users, Workspaces, Requests, Operations, Audit, Vault)
- `src/app/components/Topbar.tsx` — Topbar with search, language, notifications, avatar
- `src/components/ui/ErrorFallback.tsx` — Error boundary pattern
- `src/components/ui/PageSkeleton.tsx` — Loading skeleton for pages
- `src/components/ui/CardSkeleton.tsx` — Card skeleton for stat cards

### Established Patterns
- Next.js 14 App Router with TypeScript
- Ant Design 6 + Tailwind CSS
- Prisma + SQLite for data layer
- Better Auth for authentication
- next-intl for i18n (4 languages: VI/EN/ZH/JA)
- StatCard component pattern from Phase 26

### Integration Points
- Route: `/[locale]/admin` or `/admin` with locale prefix
- AdminLayout component wraps admin portal pages
- Database queries are NOT filtered by workspace (admin sees all)

</codebase_context>

<specifics>
## Specific Ideas

- Template uses custom CSS (not Ant Design components for main layout)
- Stat card icons: Users (blue), Building (green), Clock (orange), AlertTriangle (red)
- Admin banner gradient: `#ffffff` to `#f0fdfa`
- Floating alert: `background: linear-gradient(180deg, #ef4444, #dc2626)` with `border: 3px solid #facc15`
- Notification badge text: "3 Alerts"
- Timeline dot: `background: #087f78` with `border: 4px solid #d9f8f4`
- Progress bar: `background: linear-gradient(90deg, #0b8f86, #22c55e)`

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Phân quyền phải được kiểm tra server-side cho mọi request, document, review và vault file access.
- **R-05:** Frontend role checks chỉ mang tính UX, không phải bảo mật.
- **R-06:** Admin queries NOT filtered by workspace (admin sees all tenants).

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-07-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-08-VI:** Stat cards: Tổng người dùng, Workspaces, Sắp quá SLA, Cảnh báo audit.
- **R-09-VI:** Panel titles: Workload chuyên viên, Cảnh báo cần xử lý, Workspace nổi bật, Chờ phê duyệt, Timeline audit gần đây.
- **R-10-VI:** Badge texts: Active, Internal, Pending, Review, High, Audit, SLA, Role, Vault.
- **R-11-VI:** Button texts: Xuất báo cáo, Tạo hồ sơ mới, Xem audit, Điều phối workload.
- **R-12-VI:** Floating button: 3 Alerts.

#### English
- **R-07-EN:** All user-facing labels must be in proper English.
- **R-08-EN:** Stat cards: Total Users, Workspaces, Near SLA, Audit Alerts.
- **R-09-EN:** Panel titles: Specialist Workload, Alerts to Process, Featured Workspaces, Pending Approvals, Recent Audit Timeline.
- **R-10-EN:** Badge texts: Active, Internal, Pending, Review, High, Audit, SLA, Role, Vault.
- **R-11-EN:** Button texts: Export Report, Create New File, View Audit, Distribute Workload.
- **R-12-EN:** Floating button: 3 Alerts.

#### Chinese (中文)
- **R-07-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-08-ZH:** 统计卡片：总用户数、工作区、即将超时、审计警报。
- **R-09-ZH:** 面板标题：专家工作负载、待处理警报、特色工作区、待批准、最近审计时间线。
- **R-10-ZH:** 徽章文本：活跃、内部、待处理、审核、高、审计、SLA、角色、保险库。
- **R-11-ZH:** 按钮文本：导出报告、创建新文件、查看审计、分配工作负载。
- **R-12-ZH:** 浮动按钮：3条警报。

#### Japanese (日本語)
- **R-07-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-08-JA:** 統計カード：総ユーザー数、ワークスペース、期限間近、監査アラート。
- **R-09-JA:** パネルタイトル：専門家ワークロード、処理待ちアラート、注目ワークスペース、承認待ち、最近の監査タイムライン。
- **R-10-JA:** タグテキスト：アクティブ、内部、保留中、レビュー、高、監査、SLA、役割、ヴォールト。
- **R-11-JA:** ボタンテキスト：レポート出力、新規ファイル作成、監査表示、ワークロード分散。
- **R-12-JA:** フローティングボタン：3件のアラート。

### Phase-Specific Rules

- **R-13:** AdminLayout component với sidebar (262px) + main content area.
- **R-14:** Admin queries NOT filtered by workspace (sees all tenants).
- **R-15:** Stat values computed from database counts (128 users, 12 workspaces, 6 SLA, 3 alerts).
- **R-16:** Workload list filtered by specialist/reviewer roles.
- **R-17:** Alert list filtered by audit_event types.
- **R-18:** Audit timeline reads recent entries from audit_event table.

</rules>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 32-admin-dashboard*
*Context gathered: 2026-06-11*
