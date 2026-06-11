# Phase 33: User Management - Context

**Gathered:** 2026-06-11 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Render user management page (`admin-user-management.html`) with all components: 4 stat cards (Total: 128, Active: 112, Workspaces: 12, Pending: 9), role pills with 6 roles and counts, user table with 8 columns and 8 sample users, role badges color-coded by role type, and toolbar with search and filter dropdowns functional.

Depends on Phase 32 (Admin Dashboard). Success criteria: all components render matching template exactly.

</domain>

<decisions>
## Implementation Decisions

### Layout structure
- **D-01:** AdminLayout (Sidebar 262px) + Main content with topbar
- **D-02:** Main content scrolls independently (`overflow: auto` on `.content`)
- **D-03:** Responsive: min-width 1450px for desktop view matching template
- **D-04:** AdminLayout component wrapping admin portal pages

### Component architecture
- **D-05:** StatCard component (reuse from Phase 32) with icon/variant props (blue, green, orange, purple)
- **D-06:** RolePill component with count badges for role distribution
- **D-07:** UserTable component with 8-column grid layout
- **D-08:** UserRow component with avatar, name, email, role badge, status, workspace, last active, actions
- **D-09:** RoleBadge component with color variants per role type
- **D-10:** UserToolbar component with search input and filter dropdowns

### Data source
- **D-11:** All sample data from SQLite database via Prisma queries
- **D-12:** Stat values: Total: 128, Active: 112, Workspaces: 12, Pending: 9
- **D-13:** Role distribution: 72 customer, 18 specialist, 14 reviewer, 10 coordinator, 4 super_admin, 9 pending (from sample seed)
- **D-14:** User table reads from `user` table with workspace join

### Styling approach
- **D-15:** Match template CSS exactly: Inter font, CSS variables for colors, custom shadows
- **D-16:** Use Tailwind CSS utilities where possible, custom CSS for complex components
- **D-17:** Role badge colors: customer (blue), specialist (teal), reviewer (purple), coordinator (orange), super_admin (red), pending (gray)
- **D-18:** User table with hover states and action links

### Test coverage
- **D-19:** Whitebox: Unit tests for StatCard, RolePill, UserTable, RoleBadge, UserToolbar
- **D-20:** Blackbox: Integration tests for API endpoints returning user management data
- **D-21:** Abnormal: Empty user list, no pending users, filter edge cases
- **D-22:** Error: Error boundary fallback UI, loading skeleton
- **D-23:** E2E: Full user management page render with all components visible

### Claude's Discretion
- Exact spacing/padding values (template uses specific px values)
- Icon library choice (Lucide React recommended for consistency)
- Animation/transition timing
- Filter dropdown implementation details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Template source
- `layout/admin-user-management.html` — Full template with all CSS, HTML structure, sample data

### Requirements
- `requirements/REQUIREMENTS.md` § Admin User Management — ADMIN-USER-01 through ADMIN-USER-06

### Success criteria
- `planning/ROADMAP.md` § Phase 33 — Success criteria for user management render

### Tech stack
- `src/app/components/AdminLayout.tsx` — Existing admin layout shell component
- `src/app/components/Sidebar.tsx` — Existing sidebar with admin nav items
- `src/app/components/Topbar.tsx` — Existing topbar component
- Phase 26 (Customer Dashboard) — StatCard component pattern to reuse
- Phase 32 (Admin Dashboard) — Admin dashboard pattern to follow

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/app/components/AdminLayout.tsx` — AdminLayoutShell wrapping admin pages
- `src/app/components/Sidebar.tsx` — Admin sidebar with 6 nav items
- `src/app/components/Topbar.tsx` — Topbar with search, language, notifications, avatar
- `src/components/ui/ErrorFallback.tsx` — Error boundary pattern
- `src/components/ui/PageSkeleton.tsx` — Loading skeleton for pages

### Established Patterns
- Next.js 14 App Router with TypeScript
- Ant Design 6 + Tailwind CSS
- Prisma + SQLite for data layer
- Better Auth for authentication
- next-intl for i18n (4 languages: VI/EN/ZH/JA)
- StatCard component pattern from Phase 26 and 32

### Integration Points
- Route: `/[locale]/admin/users` or `/admin/users` with locale prefix
- AdminLayout component wraps admin portal pages
- Database queries are NOT filtered by workspace (admin sees all users)
- Link to user detail view (Phase 34 or modal)

</codebase_context>

<specifics>
## Specific Ideas

- Template uses custom CSS (not Ant Design components for main layout)
- Stat card icons: Users (blue), CheckCircle (green), Building (purple), Clock (orange)
- Role badge colors: Customer: blue, Specialist: teal, Reviewer: purple, Coordinator: orange, Super Admin: red, Pending: gray
- User table 8 columns: Ten, Email, Role, Status, Workspace, Last Active, Actions, Details
- Toolbar search: "Tìm theo ten, email, workspace..."

</specifics>

<rules>
## Rules

### Technical Rules

- **R-01:** Mọi thay đổi trạng thái hồ sơ pháp lý phải đi qua backend state machine, không hard-code logic ở frontend.
- **R-02:** Audit log phải là append-only, ghi lại actor, workspace, action, target, timestamp và metadata summary an toàn.
- **R-03:** Dữ liệu pháp lý nhạy cảm không được hiển thị trong audit metadata.
- **R-04:** Phân quyền phải được kiểm tra server-side cho mọi request, document, review và vault file access.
- **R-05:** Frontend role checks chỉ mang tính UX, không phải bảo mật.
- **R-06:** Admin queries NOT filtered by workspace (admin sees all users).

### i18n Rules (Quy tắc đa ngơn ngử)

#### Vietnamese (Tiếng Việt)
- **R-07-VI:** Tất cả nhãn giao diện người dùng phải có tiếng Việt đầy đủ dấu.
- **R-08-VI:** Stat cards: Tong nguời dùng, Active, Workspaces, Cho duyệt.
- **R-09-VI:** Role labels: Customer, Specialist, Reviewer, Coordinator, Super Admin, Pending.
- **R-10-VI:** Toolbar: "Tìm theo ten, email, workspace...", Bộ lọc, Role, Status, Actions.

#### English
- **R-07-EN:** All user-facing labels must be in proper English.
- **R-08-EN:** Stat cards: Total Users, Active, Workspaces, Pending Approval.
- **R-09-EN:** Role labels: Customer, Specialist, Reviewer, Coordinator, Super Admin, Pending.
- **R-10-EN:** Toolbar: "Search by name, email, workspace...", Filters, Role, Status, Actions.

</rules>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 33-user-management*
*Context gathered: 2026-06-11*
