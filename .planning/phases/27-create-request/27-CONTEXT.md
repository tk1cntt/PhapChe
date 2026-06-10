# Phase 27: Create Request - Context

**Gathered:** 2026-06-11 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Render Create Request wizard (`user-create-request.html`) with 4-step flow (Service → Questions → Docs → Review), service type selection, sidebar summary panel, checklist panel, and form fields. Wizard allows users to select legal service type and provide initial information for request creation.

Depends on Phase 26 (Customer Dashboard). Success criteria: all wizard components render matching template exactly.

</domain>

<decisions>
## Implementation Decisions

### Layout structure
- **D-01:** UserLayout wrapper (sidebar 262px + main content)
- **D-02:** 2-column grid: main form area (1fr) + sidebar (360px)
- **D-03:** Page header with title, subtitle, action buttons (Lưu nháp, Xem hồ sơ nháp)

### Wizard component
- **D-04:** WizardSteps component with 4 steps: Dịch vụ (1), Câu hỏi (2), Tài liệu (3), Kiểm tra (4)
- **D-05:** Step indicators with numbers in circles, connecting lines between steps
- **D-06:** Active step shows green circle (#10b981), inactive shows gray (#eef2f7)
- **D-07:** Current step badge shows "Bước X / 4" in orange pill

### Service selection
- **D-08:** 5 service type options with radio-style selection
- **D-09:** Service cards show: title, description, and tags (Khuyến nghị, Nhanh, IP, Cần tài liệu, Phân loại)
- **D-10:** Tag colors: green (#ccfbf1/#0f766e), blue (#dbeafe/#2563eb), orange (#ffedd5/#ea580c), purple (#ede9fe/#7c3aed), red (#ffe4e6/#ef4444)
- **D-11:** Selected service has teal border (#087f78) and light green background (#ecfdf9)

### Service types
- **D-12:** Soạn hợp đồng đại lý (default selected, tag: Khuyến nghị)
- **D-13:** Soạn hợp đồng lao động (tag: Nhanh)
- **D-14:** Đăng ký nhãn hiệu (tag: IP)
- **D-15:** Rà soát hợp đồng / NDA (tag: Cần tài liệu)
- **D-16:** Dịch vụ khác / chưa rõ loại việc (tag: Phân loại)

### Form fields
- **D-17:** Workspace dropdown (Công ty An Phát, Công ty Minh Khang, Workspace nội bộ)
- **D-18:** Priority dropdown (Thông thường, Cần xử lý sớm, Khẩn cấp)
- **D-19:** Contact name field (pre-filled from user profile)
- **D-20:** Contact email field (pre-filled from user profile)
- **D-21:** Description textarea for brief request description

### Sidebar panels
- **D-22:** Summary panel (Tóm tắt hồ sơ) showing: selected service, workspace, processing estimate, status
- **D-23:** Checklist panel (Checklist cần chuẩn bị) with 4 pre-checked items:
  - Thông tin đối tác
  - Điều khoản thương mại
  - Phạm vi đại lý
  - Tài liệu liên quan
- **D-24:** Checklist items show green checkmark circles

### Action buttons
- **D-25:** Back to dashboard button (ghost style)
- **D-26:** Save draft button (ghost style)
- **D-27:** Continue button (teal gradient, primary action)

### Floating chat
- **D-28:** Floating chat button with "Hỗ trợ" label
- **D-29:** Style: red gradient (#ef4444 to #dc2626), yellow border (#facc15)

### Data source
- **D-30:** All sample data from SQLite database via Prisma queries
- **D-31:** Service types from `service_type` table
- **D-32:** User profile data from `user` table
- **D-33:** Workspace options from `workspace` table

### Test coverage
- **D-34:** Whitebox: Unit tests for WizardSteps, ServiceCard, SummaryPanel, ChecklistPanel, FormFields
- **D-35:** Blackbox: Integration tests for API endpoints (save draft, get service types)
- **D-36:** Abnormal: No service selected, all form fields empty, workspace selection
- **D-37:** Error: Error boundary fallback UI, form validation errors
- **D-38:** E2E: Full wizard render with service selection and form submission

### Claude's Discretion
- Exact wizard step navigation logic (next/previous buttons)
- Form validation rules
- Continue button behavior after step 1
- Animation/transition timing between steps

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Template source
- `layout/user-create-request.html` — Full template with all CSS, HTML structure, sample data

### Requirements
- `requirements/REQUIREMENTS.md` § Create Request (user-create-request.html) — CUST-CREATE-01 through CUST-CREATE-06

### Success criteria
- `planning/ROADMAP.md` § Phase 27 — Success criteria for Create Request wizard

### Tech stack
- `src/app/[locale]/customer/components/UserLayout.tsx` — User layout component (reusable)
- `src/components/ui/` — Existing UI components (ErrorFallback, PageSkeleton, CardSkeleton)
- Phase 26 — Customer Dashboard patterns and components

### Prior phases
- Phase 26 CONTEXT.md — Layout structure and component patterns

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/app/[locale]/customer/components/UserLayout.tsx` — Sidebar + topbar layout, already has nav items
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
- Route: `/[locale]/[workspaceSlug]/create` or `/[workspaceSlug]/create`
- UserLayout component wraps user portal pages
- Database queries filter by workspace scope (tenant isolation)
- API routes for draft saving and service type retrieval

</codebase_context>

<specifics>
## Specific Ideas

- Template uses custom CSS (not Ant Design components for wizard layout)
- Service card hover: border-color rgba(8, 127, 120, 0.35), background #fbfffe
- Service card selected: border-color #087f78, background #ecfdf9
- Form inputs: height 44px for select, 94px for textarea
- Service options show processing time estimate (e.g., "2-3 ngày")
- Summary panel mini-icons: gradient background #d4f4ed to #eefbf8, teal color

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Phân quyền phải được kiểm tra server-side cho mọi intake, upload và status-read operation.
- **R-05:** Database queries phải filter by workspace scope (tenant isolation).

### i18n Rules (Quy tắc đa ngôn ngữ)

#### Vietnamese (Tiếng Việt)
- **R-06-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-07-VI:** Trạng thái hồ sơ: Đang nhập thông tin, Đã gửi yêu cầu, Cần phân loại, Đã phân công, Đang xử lý, Chờ kiểm tra chất lượng, Cần chỉnh sửa nội bộ, Đã được duyệt, Đã giao tài liệu, Đã đóng hồ sơ, Đã hủy.
- **R-08-VI:** Wizard steps: Dịch vụ, Câu hỏi, Tài liệu, Kiểm tra. Bước X / 4.
- **R-09-VI:** Service types: Soạn hợp đồng đại lý (Khuyến nghị), Soạn hợp đồng lao động (Nhanh), Đăng ký nhãn hiệu (IP), Rà soát hợp đồng / NDA (Cần tài liệu), Dịch vụ khác (Phân loại).
- **R-10-VI:** Form fields: Workspace, Ưu tiên, Tên liên hệ, Email liên hệ, Mô tả.
- **R-11-VI:** Sidebar: Tóm tắt hồ sơ, Checklist cần chuẩn bị.
- **R-12-VI:** Checklist items: Thông tin đối tác, Điều khoản thương mại, Phạm vi đại lý, Tài liệu liên quan.
- **R-13-VI:** Buttons: Lưu nháp, Xem hồ sơ nháp, Tiếp tục, Hỗ trợ.
- **R-14-VI:** Priority: Thông thường, Cần xử lý sớm, Khẩn cấp.

#### English
- **R-06-EN:** All user-facing labels must be in proper English.
- **R-07-EN:** Request statuses: Filling in information, Request submitted, Needs triage, Assigned, In progress, Pending quality review, Needs internal revision, Approved, Documents delivered, Case closed, Cancelled.
- **R-08-EN:** Wizard steps: Service, Questions, Documents, Review. Step X / 4.
- **R-09-EN:** Service types: Draft agency contract (Recommended), Draft labor contract (Fast), Trademark registration (IP), Contract/NDA review (Documents needed), Other services (Classification).
- **R-10-EN:** Form fields: Workspace, Priority, Contact name, Contact email, Description.
- **R-11-EN:** Sidebar: File Summary, Preparation Checklist.
- **R-12-EN:** Checklist items: Partner information, Commercial terms, Agency scope, Related documents.
- **R-13-EN:** Buttons: Save draft, View draft, Continue, Support.
- **R-14-EN:** Priority: Normal, Needs early processing, Urgent.

#### Chinese (中文)
- **R-06-ZH:** 所有用户界面标签必须使用正确的中文。
- **R-07-ZH:** 请求状态：正在填写信息、已提交请求、待分诊、已分配、处理中、待质量审核、需内部修订、已批准、文档已交付、案件已关闭、已取消。
- **R-08-ZH:** 向导步骤：服务、问题、文档、检查。步骤 X / 4。
- **R-09-ZH:** 服务类型：起草代理合同（推荐）、起草劳动合同（快速）、商标注册（知识产权）、合同/保密协议审查（需要文件）、其他服务（分类）。
- **R-10-ZH:** 表单字段：工作区、优先级、联系人姓名、联系人邮箱、描述。
- **R-11-ZH:** 侧边栏：文件摘要、准备清单。
- **R-12-ZH:** 清单项目：合作伙伴信息、商业条款、代理范围、相关文件。
- **R-13-ZH:** 按钮：保存草稿、查看草稿、继续、支持。
- **R-14-ZH:** 优先级：正常、需要提前处理、紧急。

#### Japanese (日本語)
- **R-06-JA:** すべてのユーザーインターフェースラベルには正しい日本語を使用してください。
- **R-07-JA:** リクエストステータス：情報入力中、リクエスト送信済み、トリアージュ必要、担当者決定、処理中、品質レビュー待ち、内部修正必要、承認済み、書類納品済み、ケースクローズ、キャンセル。
- **R-08-JA:** ウィザードステップ：サービス、質問、書類、確認。ステップ X / 4。
- **R-09-JA:** サービスタイプ：代理店契約作成（推奨）、労働契約作成（高速）、商標登録（知的財産）、契約/NDAレビュー（書類必要）、その他のサービス（分類）。
- **R-10-JA:** フォームフィールド：ワークスペース、優先度、連絡先名、連絡先メール、説明。
- **R-11-JA:** サイドバー：ファイル要約、準備チェックリスト。
- **R-12-JA:** チェックリスト項目：パートナー情報、商業条件、代理範囲関連書類。
- **R-13-JA:** ボタン：下書き保存、下書き表示、次へ、サポート。
- **R-14-JA:** 優先度：通常、早期処理必要、緊急。

### Phase-Specific Rules

- **R-15:** 4-step wizard flow: Service → Questions → Docs → Review.
- **R-16:** Service types từ service_type table trong database.
- **R-17:** User profile data từ user table (pre-filled form fields).
- **R-18:** Workspace options từ workspace table.
- **R-19:** Form validation rules cho required fields.
- **R-20:** Floating chat button với Hỗ trợ label.

</rules>

<deferred>
## Deferred Ideas

- Multi-step wizard navigation (steps 2-4) — Phase 27 can implement step 1 display, navigation logic deferred
- File upload for Documents step — Phase 27 displays placeholder, file upload functionality deferred
- AI service type suggestion from uploaded documents — v2.0 feature

</deferred>

---

*Phase: 27-create-request*
*Context gathered: 2026-06-11*
