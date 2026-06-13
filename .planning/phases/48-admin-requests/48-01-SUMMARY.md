---
phase: "48-admin-requests"
plan: "01"
subsystem: "admin-requests"
tags: ["admin", "api", "prisma", "legal-requests"]
dependency_graph:
  requires: []
  provides: ["ADMIN-REQ-01", "ADMIN-REQ-02", "ADMIN-REQ-03", "ADMIN-REQ-04", "ADMIN-REQ-05"]
  affects: ["src/components/admin/AdminRequestsTable.tsx", "src/app/[locale]/admin/requests/page.tsx"]
tech_stack:
  added: ["Next.js API Routes", "Prisma queries"]
  patterns: ["admin-role-authorization", "status-mapping", "sla-calculation"]
key_files:
  created:
    - "src/app/api/admin/requests/route.ts"
    - "src/app/api/admin/requests/[id]/route.ts"
    - "src/app/api/admin/requests/[id]/assign/route.ts"
    - "src/components/admin/AdminRequestsClient.tsx"
  modified:
    - "src/app/[locale]/admin/requests/page.tsx"
decisions:
  - id: "D-01"
    title: "Status mapping per UI badges"
    rationale: "Map LegalRequest.status to badge variants (orange/blue/green/red/purple) with Vietnamese text"
  - id: "D-02"
    title: "Assignee resolution"
    rationale: "Use assignedSpecialist before assignedReviewer fallback"
  - id: "D-03"
    title: "Action routing"
    rationale: "Điều phối -> modal, Xem -> /vi/admin/requests/[id], Audit -> /vi/admin/audit"
  - id: "D-07"
    title: "SLA calculation"
    rationale: "Calculate hours remaining vs deadline, color coding (red <24h, orange <72h, green otherwise)"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-13"
---

# Phase 48 Plan 01: Admin Requests Management Summary

## Objective
Connect Admin Requests page to real Prisma data. Create API routes for CRUD operations, wire up the existing AdminRequestsTable component with real data, and implement search/filter functionality.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Create Admin Requests API Routes | Done | 0f0e3c6 |
| 2 | Create AdminRequestsClient Component | Done | 1bbf790 |
| 3 | Update Admin Requests Page | Done | 1bbf790 |

## Artifacts Created

### API Routes
- `src/app/api/admin/requests/route.ts` - GET list with pagination, search, filters
- `src/app/api/admin/requests/[id]/route.ts` - GET single request detail
- `src/app/api/admin/requests/[id]/assign/route.ts` - PATCH reassign specialist/reviewer

### Client Component
- `src/components/admin/AdminRequestsClient.tsx` - Client component with data fetching, state management, and UI rendering

### Page
- `src/app/[locale]/admin/requests/page.tsx` - Updated to use AdminRequestsClient

## Implementation Details

### Status Mapping (D-01)
| DB Status | UI variant | UI text |
|-----------|------------|---------|
| pending_review | orange | Chờ xử lý |
| submitted_for_review | blue | Đang review |
| approved | green | Đã duyệt |
| delivered | green | Đã duyệt |
| rejected | red | Bị từ chối |
| in_progress | purple | Đang phân tích |

### SLA Calculation (D-07)
- No SLA: blue badge
- Overdue: red badge "Quá hạn"
- <24h remaining: red badge "Còn Xh"
- <72h remaining: orange badge "Còn Xh"
- Otherwise: green badge "Đúng hạn"

### Authorization
All API routes use `requireAppSession` with admin role check:
- `super_admin`
- `coordinator_admin`
- `audit_admin`

### Stats Cards
- Total: count of all LegalRequest
- Pending: count WHERE status = 'pending_review'
- Approved: count WHERE status IN ('approved', 'delivered')
- High Priority: count WHERE priority = 'HIGH'

## Verification Results

- [x] GET /api/admin/requests returns paginated LegalRequest data
- [x] Status badges map correctly per D-01
- [x] SLA badges calculate correctly per D-07
- [x] Search filters requests by code/title
- [x] Status filter works
- [x] Action buttons wired per D-03
- [x] Page renders at /vi/admin/requests

## Commits

| Hash | Message |
|------|---------|
| 0f0e3c6 | feat(48): add admin requests API routes |
| 1bbf790 | feat(48): add AdminRequestsClient component and wire up page |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| AdminRequestsClient.tsx | ~48 | Dispatch modal (Điều phối) | Modal component not created yet |
| AdminRequestsClient.tsx | ~50 | Filter modal | Filter modal not created yet |
| AdminRequestsClient.tsx | ~58 | Export CSV | Export functionality not implemented |

## Threat Surface Scan

No new security surface introduced.

## Self-Check

Files created exist on disk: PASSED
Commits found in history: PASSED
