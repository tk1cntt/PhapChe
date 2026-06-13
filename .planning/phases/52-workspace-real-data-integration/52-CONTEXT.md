# Phase 52 Context: Workspace Real Data Integration

## Phase Goal
Implement Admin Workspace page (`/admin/workspace`) with real Prisma data, matching mock UI from `layout/admin-workspace.html`.

## Source References
- **Mock UI**: `layout/admin-workspace.html` - full page layout reference with permission card, workspace table
- **DB Models**: `Workspace`, `WorkspaceMembership`
- **Pattern from Phase 51**: `AdminVaultClient.tsx` pattern for admin client components

## Component Architecture
Components saved in `src/components/admin/`:
1. `AdminWorkspaceClient.tsx` - Main client component
2. `AdminWorkspaceTable.tsx` - Workspace list table
3. `AdminWorkspaceStats.tsx` - Stats for workspaces

## Page Layout (from Mock UI)
- Page header with title "Workspace khách hàng" and create button
- Permission card (explains access boundaries)
- Workspace table with 4 columns: Tên workspace, Slug, Thành viên, Trạng thái
- Bottom action button for creating workspace

## API Endpoint
- GET `/api/workspaces` - returns list of workspaces with member counts

## i18n Namespace
Messages in existing namespace (Admin or Workspace)

## Success Criteria
1. Admin Workspace page renders with permission card
2. Workspace table shows real workspaces with member counts
3. Table layout matches mock UI (4 columns)
4. All components in `src/components/admin/`

## Decisions (Auto-resolved)

### Page Structure
- Use permission card pattern from mock UI to explain access boundaries
- Single-page layout with table only (no modals for MVP)

### Table Data
- Show: workspace name, slug, member count, status badge
- Member count: count from WorkspaceMembership table
- Status: "Đang hoạt động" if isActive=true, otherwise "Không hoạt động"

### Actions
- Create workspace button (visual only for MVP)
- No edit/delete in MVP scope
