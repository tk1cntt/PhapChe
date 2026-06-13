# Phase 46: Admin Dashboard — Real Data Integration - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Clone admin components từ `src/legacy/` sang `src/components/admin/`, kết nối Admin Dashboard page với Prisma queries thực tế. Thay thế mock data bằng data từ database cho stats, workload, alerts, workspaces, approvals, timeline, và request table.

</domain>

<decisions>
## Implementation Decisions

### Component Structure
- **D-01:** Clone từng component riêng biệt (1 file/component) từ legacy - nhanh và dễ map 1:1 với source

### Data Fetching
- **D-02:** Server component fetch tất cả data trực tiếp từ Prisma - giống Phase 45 Settings, ít API calls, consistent với existing pattern

### Styling
- **D-03:** Convert inline styles → Tailwind CSS - consistent với project convention, maintainable hơn

### Components to Create
- **D-04:** Clone 8 components: AdminStatCard, AdminBanner, WorkloadPanel, AlertPanel, WorkspacePanel, ApprovalPanel, AuditTimeline, AdminToolbar, AdminRequestsTable

### API Routes
- **D-05:** Tạo API routes cho admin data nếu cần (stats, workload, alerts, requests)

### Claude's Discretion
- Layout grid structure (1.25fr/0.75fr, 0.9fr/0.9fr/1.2fr) - giữ nguyên từ legacy
- Status color mappings - giữ nguyên từ legacy
- SLA calculation logic - giữ nguyên từ legacy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 45 (Reference Pattern)
- `src/components/settings/` — Pattern cho component structure và API routes (đã hoàn thành Phase 45)
- `src/app/[locale]/settings/page.tsx` — Server component pattern với Prisma queries
- `src/app/api/settings/` — API route pattern

### Legacy Source
- `src/legacy/[locale]/admin/page.tsx` — Prisma queries (đã có sẵn)
- `src/legacy/[locale]/admin/AdminDashboardClient.tsx` — Client component structure
- `src/legacy/components/admin/` — 9 admin components cần clone

### i18n
- `src/messages/vi.json` — AdminDashboard translations
- `src/messages/en.json` — AdminDashboard translations

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `lucide-react` icons — đã sử dụng trong Settings
- `next-intl` — đã tích hợp
- Prisma queries pattern từ Settings phase

### Established Patterns
- Server component → Prisma → Client component pattern
- Settings components structure: `src/components/{feature}/`
- API routes: `src/app/api/{feature}/`

### Integration Points
- Admin layout: `src/app/[locale]/admin/page.tsx`
- Admin components: `src/components/admin/`
- Admin API: `src/app/api/admin/`

</codebase_context>

<specifics>
## Specific Ideas

- Stat cards: 4 cards (users, workspaces, near SLA, audit alerts) với variant colors
- Workload panel: Specialist progress bars với role badges
- Alerts panel: 4 alert types (access denied, SLA warning, role change, vault scan)
- Workspace panel: Featured workspaces với member/file counts
- Approval panel: Pending user approvals
- Audit timeline: Recent audit events
- Request table: LegalRequest data với status/sla badges

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 46-Admin Dashboard*
*Context gathered: 2026-06-13*
