# Phase 48: Admin Requests Management — Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Kết nối Admin Requests table với dữ liệu thực tế từ Prisma — hiển thị danh sách yêu cầu pháp lý với stats, filters, và action buttons.

**Scope:**
- 4 stat cards (Total, Pending, Approved, High Priority)
- Requests table với 7 columns (Mã hồ sơ, Workspace, Khách hàng, Trạng thái, Người phụ trách, SLA, Thao tác)
- Status badges (Chờ xử lý, Đang review, Đã duyệt, Bị từ chối, Đang phân tích)
- Priority badges (High/Medium/Low)
- SLA calculation (Còn Xh, Đúng hạn, Closed)
- Search và filter toolbar
- Action buttons (Điều phối, Xem, Audit, Xem log)

**Out of scope:**
- Request detail page → Phase 48 (this phase hoặc future)
- Reassignment modal → Phase 48
- Audit log viewer → Phase 50
</domain>

<decisions>
## Implementation Decisions

### Status Mapping (D-01)
Map LegalRequest.status sang UI badges:

| UI Badge | Color | DB Status(es) |
|----------|-------|---------------|
| Chờ xử lý | orange | pending_review |
| Đang review | blue | submitted_for_review |
| Đã duyệt | green | approved, delivered |
| Bị từ chối | red | rejected |
| Đang phân tích | purple | in_progress |

**Notes:**
- Priority từ LegalRequest.priority (HIGH/MEDIUM/LOW)
- SLA: tính từ LegalRequest.slaDeadline vs now()

### Assignee Resolution (D-02)
Dùng LegalRequest.assignedSpecialist trước, fallback sang assignedReviewer.

```typescript
// Prisma query
include: {
  assignedSpecialist: { select: { id: true, name: true } },
  assignedReviewer: { select: { id: true, name: true } },
  workspace: { select: { id: true, name: true, slug: true } },
  createdBy: { select: { id: true, name: true, email: true } },
}
```

### Action Routing (D-03)
- **Điều phối** → Modal: assign specialist/reviewer
- **Xem** → Navigate to `/vi/admin/requests/[id]`
- **Audit** → Navigate to `/vi/admin/audit?requestId=xxx`
- **Xem log** → Navigate to `/vi/admin/audit?requestId=xxx`

### Source Structure (D-04)
- Components: `src/components/admin/`
- API routes: `src/app/api/admin/requests/`
- Page: `src/app/[locale]/admin/requests/page.tsx`
- Clone từ legacy → convert inline styles → Tailwind

### API Endpoints (D-05)
- `GET /api/admin/requests` — list với pagination, search, filters
- `GET /api/admin/requests/[id]` — single request detail
- `PATCH /api/admin/requests/[id]/assign` — reassign specialist/reviewer

### Stat Cards (D-06)
- Total: count of all LegalRequest
- Pending: count WHERE status = 'pending_review'
- Approved: count WHERE status IN ('approved', 'delivered')
- High Priority: count WHERE priority = 'HIGH'

### SLA Calculation (D-07)
```typescript
function getSLAStatus(slaDeadline: Date | null): { variant: string; text: string } {
  if (!slaDeadline) return { variant: 'blue', text: 'No SLA' };
  const now = new Date();
  if (slaDeadline < now) return { variant: 'red', text: 'Quá hạn' };
  const hoursLeft = (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft < 24) return { variant: 'red', text: `Còn ${Math.ceil(hoursLeft)}h` };
  if (hoursLeft < 72) return { variant: 'orange', text: `Còn ${Math.ceil(hoursLeft)}h` };
  return { variant: 'green', text: 'Đúng hạn' };
}
```

### i18n (D-08)
Sử dụng namespace 'AdminRequests' từ translations files.
</decisions>

<canonical_refs>
## Canonical References

### Legacy Source (Reference)
- `src/components/admin/AdminRequestsTable.tsx` — Table component pattern
- `src/components/admin/AdminStatGrid.tsx` — Stat cards pattern
- `src/components/admin/AdminToolbar.tsx` — Toolbar pattern

### Existing Components (Reuse)
- `src/components/admin/` — Phase 46/47 admin components

### API Pattern
- `src/app/api/admin/users/route.ts` — Phase 47 CRUD pattern
- `src/app/api/admin/users/[id]/route.ts` — Phase 47 detail pattern

### Phase 47 Context
- `.planning/phases/47-admin-user-mgmt/47-CONTEXT.md` — Similar structure

### i18n
- `src/messages/vi.json` — AdminRequests translations
- `src/messages/en.json` — AdminRequests translations
</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `AdminStatGrid` — stat cards component
- `AdminToolbar` — search/filter toolbar
- `AdminStatCard` — individual stat card
- Badge component pattern từ `AdminRequestsTable.tsx`

### Established Patterns
- Server component → Prisma → Client component
- API routes với admin role authorization
- Tailwind CSS với variant colors

### Prisma Schema
- `LegalRequest` — main model với status, priority, slaDeadline
- `assignedSpecialistId` / `assignedReviewerId` — FK to User
- `workspaceId` — FK to Workspace
</codebase_context>

<specifics>
## Specific Ideas

### Stat Cards
- Total: prisma.legalRequest.count()
- Pending: prisma.legalRequest.count({ where: { status: 'pending_review' } })
- Approved: prisma.legalRequest.count({ where: { status: { in: ['approved', 'delivered'] } } })
- High Priority: prisma.legalRequest.count({ where: { priority: 'HIGH' } })

### Table Columns
1. Mã hồ sơ (code hoặc id ngắn)
2. Workspace (workspace.name)
3. Khách hàng (createdBy.name + email)
4. Trạng thái (badge theo D-01)
5. Người phụ trách (assignedSpecialist.name)
6. SLA (badge theo D-07)
7. Thao tác (button links)

### Filters
- Search: code, title
- Status: dropdown với 5 options
- Priority: HIGH/MEDIUM/LOW
- Workspace: dropdown

### Pagination
- Default 10 items/page
- URL sync via usePaginationParams
</specifics>

<deferred>
## Deferred Ideas

- Request detail page (/admin/requests/[id]) — future phase
- Reassignment workflow modal — Phase 48+
- Bulk assign actions — Phase 48+
- Export to CSV — Phase 48+
- Audit log viewer — Phase 50
</deferred>

---
*Phase: 48-Admin Requests*
*Context gathered: 2026-06-13*
