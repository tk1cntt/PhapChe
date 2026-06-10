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

<deferred>
## Deferred Ideas

- Multi-step wizard navigation (steps 2-4) — Phase 27 can implement step 1 display, navigation logic deferred
- File upload for Documents step — Phase 27 displays placeholder, file upload functionality deferred
- AI service type suggestion from uploaded documents — v2.0 feature

</deferred>

---

*Phase: 27-create-request*
*Context gathered: 2026-06-11*
