# Phase 29: Messages - Context

**Gathered:** 2026-06-11 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Render Messages page (`user-messages.html`) with 3-column layout (thread list, chat panel, info panel), 4 stat cards (8 cuộc hội thoại, 4 tin chưa đọc, 21 đã phản hồi, 14 tệp đính kèm), 4 sample threads with avatars (HL, QD, MT, KA), message history with in/out styling, and info panel with request metadata. Users can view and manage conversations with legal specialists per request.

Depends on Phase 28 (My Cases). Success criteria: all components render matching template exactly.

</domain>

<decisions>
## Implementation Decisions

### Layout structure
- **D-01:** UserLayout wrapper (sidebar 262px + main content)
- **D-02:** 3-column message layout: thread list (360px) + chat panel (1fr) + info panel (320px)
- **D-03:** Message layout grid gap: 20px
- **D-04:** Each panel: background #fff, border-radius 15px, box-shadow var(--soft-shadow)

### Page header
- **D-05:** Page title: "Tin nhắn"
- **D-06:** Subtitle: "Trao đổi an toàn với chuyên viên pháp lý theo từng hồ sơ, có lưu lịch sử và tệp liên quan."

### Stat cards (4 cards)
- **D-07:** Grid: repeat(4, 1fr), gap 18px
- **D-08:** Card 1: icon 💬, title "Cuộc hội thoại", value 8, desc "3 thread đang mở" (blue)
- **D-09:** Card 2: icon ✉, title "Tin chưa đọc", value 4, desc "Từ chuyên viên pháp lý" (orange)
- **D-10:** Card 3: icon ✓, title "Đã phản hồi", value 21, desc "Trong 30 ngày" (green)
- **D-11:** Card 4: icon 📎, title "Tệp đính kèm", value 14, desc "Trong các hồ sơ" (purple)

### Thread list panel
- **D-12:** ThreadListPanel component
- **D-13:** Thread items with: avatar circle (42px), initials (font-weight 800), thread body (title + preview), timestamp
- **D-14:** Thread avatars: HL (blue #dbeafe), QD, MT, KA (varying colors)
- **D-15:** Active thread: background #ecfdf9
- **D-16:** Thread item: padding 16px, border-bottom 1px solid var(--border)
- **D-17:** Sample threads:
  - HL: "REQ-2026-019 · Phụ lục SLA" - 12p
  - QD: "REQ-2026-021 · Hợp đồng dịch vụ" - 45p
  - MT: "Thông báo workspace" - 2h
  - KA: "REQ-2026-012 · Nhãn hiệu" - 1d

### Chat panel
- **D-18:** ChatPanel component
- **D-19:** Chat header: height 72px, border-bottom, shows request title + specialist info + status badge
- **D-20:** Messages container: padding 20px, gap 16px, min-height 460px
- **D-21:** Message bubble (in): background #f1f5f9, color #0f172a, max-width 72%
- **D-22:** Message bubble (out): background #087f78, color #fff, margin-left auto
- **D-23:** Message styles: padding 14px 16px, border-radius 14px, font-size 14px, line-height 1.55
- **D-24:** Composer: border-top, padding 16px, flex gap 12px
- **D-25:** Composer input: flex 1, height 44px, border-radius 8px, placeholder "Nhập tin nhắn cho chuyên viên..."
- **D-26:** Send button: create-btn style (teal gradient)

### Info panel
- **D-27:** InfoPanel component
- **D-28:** Panel title: "Thông tin hồ sơ" with left-aligned header
- **D-29:** Info boxes: border 1px solid #edf2f7, background #fbfdff, border-radius 12px, padding 14px, margin-bottom 14px
- **D-30:** Info fields:
  - Mã hồ sơ: "REQ-2026-019 · Legal Amendment"
  - SLA còn lại: "5 giờ · cần phản hồi trước 17:00 hôm nay"
  - Tài liệu liên quan: "Phu-luc-SLA-v2.docx, Hop-dong-dich-vu-An-Phat.pdf"
  - Người tham gia: "Mai Phương, Hà Linh, Quang Dũng, Minh Trang"
- **D-31:** "Mở hồ sơ chi tiết" button: ghost-btn style, width 100%

### Floating chat
- **D-32:** FloatingChatButton component
- **D-33:** Style: red gradient (#ef4444 to #dc2626), yellow border (#facc15)
- **D-34:** Badge text: "2 Tin mới"

### Data source
- **D-35:** All sample data from SQLite database via Prisma queries
- **D-36:** Thread list reads from `message_thread` table filtered by workspace
- **D-37:** Messages read from `message` table filtered by thread
- **D-38:** Stats computed from database counts: conversations, unread, replied, attachments

### Test coverage
- **D-39:** Whitebox: Unit tests for ThreadListPanel, ChatPanel, InfoPanel, MessageBubble, Composer
- **D-40:** Blackbox: Integration tests for API endpoints returning messages data
- **D-41:** Abnormal: Empty thread list, no messages in thread, long message content
- **D-42:** Error: Error boundary fallback UI, loading skeleton
- **D-43:** E2E: Full Messages render with thread selection and message display

### Claude's Discretion
- Message timestamp display format (relative time)
- Scroll behavior in thread list and chat panel
- Composer input validation
- Online/offline status indicator for specialists

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Template source
- `layout/user-messages.html` — Full template with all CSS, HTML structure, sample data

### Requirements
- `planning/REQUIREMENTS.md` § Messages (user-messages.html) — CUST-MSG-01 through CUST-MSG-04

### Success criteria
- `planning/ROADMAP.md` § Phase 29 — Success criteria for Messages render

### Tech stack
- `src/app/[locale]/customer/components/UserLayout.tsx` — User layout component (reusable)
- `src/components/ui/` — Existing UI components (ErrorFallback, PageSkeleton, CardSkeleton)
- `src/app/[locale]/customer/components/StatCard.tsx` — StatCard component from Phase 26
- Phase 26 — Customer Dashboard patterns and components
- Phase 27 — Create Request patterns
- Phase 28 — My Cases patterns

### Prior phases
- Phase 26 CONTEXT.md — Layout structure, StatCard component, data patterns
- Phase 27 CONTEXT.md — Component patterns, UserLayout usage
- Phase 28 CONTEXT.md — Table patterns, toolbar, data patterns

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/app/[locale]/customer/components/UserLayout.tsx` — Sidebar + topbar layout, nav items
- `src/app/[locale]/customer/components/StatCard.tsx` — StatCard component with variants (blue, orange, green, purple)
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
- Route: `/[locale]/[workspaceSlug]/messages` or `/[workspaceSlug]/messages`
- UserLayout component wraps user portal pages
- Database queries filter by workspace scope (tenant isolation)
- API routes for message thread and message retrieval

</codebase_context>

<specifics>
## Specific Ideas

- Template uses custom CSS (not Ant Design for main layout)
- Thread avatars: circular, 42px, initials in font-weight 800
- Active thread: background #ecfdf9 (light teal)
- Message bubbles: max-width 72%, border-radius 14px
- Incoming messages: background #f1f5f9, text #0f172a
- Outgoing messages: background #087f78 (teal), text #fff
- Info boxes: border #edf2f7, background #fbfdff, border-radius 12px
- Floating chat: red gradient with yellow border, "2 Tin mới" badge

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Phân quyền phải được kiểm tra server-side cho mọi message access.
- **R-05:** Database queries phải filter by workspace scope (tenant isolation).

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-06-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-07-VI:** Page title: Tin nhắn. Subtitle: Trao đổi an toàn với chuyên viên pháp lý theo từng hồ sơ, có lưu lịch sử và tệp liên quan.
- **R-08-VI:** Stat titles: Cuộc hội thoại, Tin chưa đọc, Đã phản hồi, Tệp đính kèm.
- **R-09-VI:** Stat descriptions: 3 thread đang mở, Từ chuyên viên pháp lý, Trong 30 ngày, Trong các hồ sơ.
- **R-10-VI:** Info panel: Thông tin hồ sơ, Mã hồ sơ, SLA còn lại, Tài liệu liên quan, Người tham gia.
- **R-11-VI:** Composer placeholder: "Nhập tin nhắn cho chuyên viên..."
- **R-12-VI:** Action buttons: Gửi, Mở hồ sơ chi tiết.
- **R-13-VI:** Floating chat: Hỗ trợ, 2 Tin mới.

#### English
- **R-06-EN:** All user-facing labels must be in proper English.
- **R-07-EN:** Page title: Messages. Subtitle: Secure communication with legal specialists per request, with history and related files.
- **R-08-EN:** Stat titles: Conversations, Unread messages, Replied, Attachments.
- **R-09-EN:** Stat descriptions: 3 open threads, From legal specialists, In 30 days, In all cases.
- **R-10-EN:** Info panel: Case Information, Case code, SLA remaining, Related documents, Participants.
- **R-11-EN:** Composer placeholder: "Type a message for the specialist..."
- **R-12-EN:** Action buttons: Send, Open case details.
- **R-13-EN:** Floating chat: Support, 2 New messages.

#### Chinese (中文)
- **R-06-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-07-ZH:** 页面标题：消息。副标题：按案件与法律专家安全交流，保存历史记录和相关文件。
- **R-08-ZH:** 统计标题：会话、未读消息、已回复、附件。
- **R-09-ZH:** 统计描述：3个开放主题，来自法律专家，30天内，在所有案件中。
- **R-10-ZH:** 信息面板：案件信息、案件编号、剩余SLA、相关文件、参与者。
- **R-11-ZH:** 输入框占位符："输入给专家的消息..."
- **R-12-ZH:** 操作按钮：发送，打开案件详情。
- **R-13-ZH:** 浮动聊天：支持，2条新消息。

#### Japanese (日本語)
- **R-06-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-07-JA:** ページタイトル：メッセージ。サブタイトル：案件ごとに法務スペシャリストとの安全なコミュニケーション、履歴と関連ファイルの保存。
- **R-08-JA:** 統計タイトル：会話、未読メッセージ、返信済み、添付ファイル。
- **R-09-JA:** 統計説明：3つのオープンスレッド、法務スペシャリストから、30日以内、すべての案件内。
- **R-10-JA:** 情報パネル：案件情報、案件番号、残りSLA、関連ファイル、参加者。
- **R-11-JA:** コンポーザープレースホルダー："スペシャリストへのメッセージを入力..."
- **R-12-JA:** 操作ボタン：送信、案件詳細を開く。
- **R-13-JA:** フローティングチャット：サポート、2件の新規メッセージ。

### Phase-Specific Rules

- **R-14:** Thread list filters by workspace scope.
- **R-15:** Messages read from message table filtered by thread_id.
- **R-16:** Thread selection updates chat panel and info panel.
- **R-17:** Message send creates new message record in database.

</rules>

<deferred>
## Deferred Ideas

- Real-time message updates (WebSocket/SSE) — future phase
- Message search functionality — future phase
- File attachment in composer — future phase
- Typing indicators — future phase
- Read receipts — future phase

---

*Phase: 29-messages*
*Context gathered: 2026-06-11*
