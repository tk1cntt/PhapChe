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

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 26-customer-dashboard*
*Context gathered: 2026-06-10*
