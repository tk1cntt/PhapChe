# Phase 30: Workspace - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

User Workspace page displaying workspace stats, member grid, permissions, and resource table. Matches template `layout/user-workspace.html` exactly with sample data for workspace "Công ty An Phát" (an-phat).

</domain>

<decisions>
## Implementation Decisions

### Stats Cards (D-01)
- 4 stat cards matching template: Workspace (Active), Thành viên (6), Hồ sơ (12), Vault scope (96%)
- StatCard component reuse with mixed content (number + text for "Active" status)
- StatCard variant mapping: green for Active/workspace, blue for members, orange for records, purple for vault scope

### Workspace Banner (D-02)
- Banner displays: company name "Công ty An Phát", description text
- "Mời thành viên" button (Invite Member) - visual only for now
- Gradient background: linear-gradient(135deg,#fff,#f0fdfa) matching template

### Member Grid (D-03)
- 2-column grid layout matching template .member-grid
- 4 sample members: Mai Phương (Owner), Linh Anh (Finance), Vân Trang (Legal Contact/Viewer), Hoàng Nam (Invited)
- Role badges: green for Active, blue for Viewer, orange for Invited
- Member avatar shows initials (MP, LA, VT, HN)
- "Quản lý →" link in panel title (visual only)

### Permission/Security Panel (D-04)
- 3 scope items: Tenant isolation, Current user role, Audit
- Each scope item has: bold title, description paragraph
- Border style: 1px solid #edf2f7, border-radius: 12px

### Resource Table (D-05)
- 5 columns: Tài nguyên, Số lượng, Trạng thái, Cập nhật gần nhất, Thao tác
- Grid columns: 1.1fr .9fr .9fr 1fr .8fr
- 3 resource rows: Hồ sơ pháp lý (12 hồ sơ), Tài liệu vault (36 tệp), Lời mời thành viên (2 lời mời)
- Status badges: green for Healthy/Encrypted, orange for Pending
- Action links: "Mở →" and "Gửi lại →"

### Floating Chat Button (D-06)
- Position: fixed right:22px, bottom:20px
- Red gradient background with yellow border
- Badge: "2 Tin mới" notification
- Reuse FloatingChatButton component pattern from Phase 26

### Page Layout (D-07)
- Content sections order: page-header → workspace-banner → stats → member-grid (2 columns) → table-card
- Padding: 31px 36px 42px for content area
- Gap between sections: 24px margin-bottom

### Data Source (D-08)
- All data from database queries via Prisma (Workspace, WorkspaceMembership, User, LegalRequest, VaultFile)
- Seed script creates: "Công ty An Phát" workspace, 4 sample members, 12 requests, 36 vault files
- No hardcoded data in components - fetch from DB

### Sample Data Values (D-09)
- Workspace: Active status, "an-phat" slug
- Members: 6 total (4 active, 2 invited)
- Requests: 12 in workspace
- Vault scope: 96% encrypted/permissioned
- Timestamps: 10/06/2026 21:15, 10/06/2026 20:48, 09/06/2026 16:00

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Templates
- `layout/user-workspace.html` — Full template with all UI elements, colors, spacing, and sample data

### Phase Requirements
- `.planning/REQUIREMENTS.md` §CUST-WS-01..04 — 4 requirements for Workspace screen

### Existing Components
- `src/app/[locale]/customer/components/UserLayout.tsx` — Layout wrapper with sidebar/topbar
- `src/app/[locale]/customer/components/StatCard.tsx` — Reusable stat card component
- `src/app/[locale]/customer/components/Badge.tsx` — Badge component with variants

### Database Schema
- `prisma/schema.prisma` — Workspace, WorkspaceMembership, User, LegalRequest, VaultFile models

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StatCard` component: Can reuse with mixed icon/text content
- `Badge` component: Has green, blue, orange variants matching template badges
- `UserLayout` component: Sidebar navigation already configured for workspace route

### Established Patterns
- Stats grid: 4-column layout with stat cards
- Panel style: border-radius: 15px, border: 1px solid var(--border), box-shadow
- Item list: gap: 13px, items with icons and badges
- Floating chat: fixed position, gradient background

### Integration Points
- Route: `src/app/[locale]/[workspaceSlug]/workspace/page.tsx`
- Components go in: `src/app/[locale]/customer/components/Workspace/`
- Database queries via Prisma in page component
</code_context>

<specifics>
## Specific Ideas

- Member grid uses 2-column layout, not 1-column list
- Permission panel shows 3 scope items with text descriptions
- Resource table has 5 columns matching exact template grid
- Timestamps use DD/MM/YYYY HH:mm format
- Member avatar shows initials in circular background

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 30-workspace*
*Context gathered: 2026-06-11*
