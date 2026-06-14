# Requirements: GitNexus Legal — v2.1 Feature Implementation

**Defined:** 2026-06-14
**Milestone:** v2.1 Feature Implementation — Complete User & Admin Portals
**Core Value:** SME gửi yêu cầu pháp lý đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

## Testing Requirements

### Per-Screen Test Coverage

Mỗi màn hình phase phải có đầy đủ test coverage:

| Test Type | Description | Coverage Target |
|-----------|-------------|----------------|
| **Whitebox** | Unit tests cho components, hooks, utilities | ≥80% line coverage |
| **Blackbox** | Integration tests cho API endpoints, database queries | ≥90% endpoint coverage |
| **Abnormal** | Edge cases, boundary conditions, empty states | All user flows covered |
| **Error** | Error boundaries, fallback UI, retry logic | All error paths covered |
| **E2E** | Full user flows từ UI → DB → UI | All critical paths |

### Data Rules

**Strict DB-only data:**

- ✅ Tất cả sample data phải insert vào SQLite qua Prisma seed scripts
- ✅ Hiển thị từ database queries
- ❌ Không hardcode bất kỳ giá trị nào trong UI components
- ❌ Không mock data trong components (chỉ mock trong unit tests nếu cần)

---

## v2.1 Requirements

### Phase 55: Architecture & Standards

- [ ] **ARCH-01**: Component audit complete — all components documented with purpose, props, usage
- [ ] **ARCH-02**: API patterns standardized — consistent request/response format, error handling
- [ ] **ARCH-03**: Shared components registry — StatCard, Badge, Button, Input, Select, Modal, etc.
- [ ] **ARCH-04**: Service layer established — business logic separated from UI components
- [ ] **ARCH-05**: Type definitions unified — TypeScript interfaces for all entities, no `as any`
- [ ] **ARCH-06**: Code standards documented — naming conventions, file structure, import order
- [ ] **ARCH-07**: i18n rules established — when to use translations vs hardcoded strings

### Phase 56: Settings (User)

- [ ] **SET-01**: User can view and edit profile (name, email, phone, title)
- [ ] **SET-02**: User can change password with current password verification
- [ ] **SET-03**: User can toggle notifications (emailOnReply, slaReminder, weeklySummary)
- [ ] **SET-04**: User can change language preference (VI/EN/ZH/JA)
- [ ] **SET-05**: User can view own audit log entries
- [ ] **SET-06**: Settings form validates input and shows errors inline

### Phase 57: User Management (Admin)

- [ ] **ADM-USER-01**: Admin can view list of all users with pagination
- [ ] **ADM-USER-02**: Admin can search users by name/email
- [ ] **ADM-USER-03**: Admin can filter users by role (customer, specialist, reviewer, coordinator, admin)
- [ ] **ADM-USER-04**: Admin can filter users by workspace
- [ ] **ADM-USER-05**: Admin can view user details (name, email, role, workspace, status, last active)
- [ ] **ADM-USER-06**: Admin can create new user with email and role
- [ ] **ADM-USER-07**: Admin can edit user role
- [ ] **ADM-USER-08**: Admin can deactivate/reactivate user account
- [ ] **ADM-USER-09**: User table shows correct stat counts

### Phase 58: Create Request (User)

- [ ] **CREQ-01**: User can select service type (5 types: Khuyen nghi, Nhanh, So huu tri tue, Tu van phap luat, Dangkynhanh)
- [ ] **CREQ-02**: User sees service cards with descriptions and tags
- [ ] **CREQ-03**: Wizard shows step progress (Step 1: Service → Step 2: Questions → Step 3: Documents → Step 4: Review)
- [ ] **CREQ-04**: User can answer intake questions based on service type
- [ ] **CREQ-05**: User can upload documents with progress indicator
- [ ] **CREQ-06**: User can review answers before submit
- [ ] **CREQ-07**: User can submit request and see confirmation
- [ ] **CREQ-08**: After submit, request appears in My Cases with status "Dang cho xu ly"
- [ ] **CREQ-09**: Priority selection works (thap, trung binh, cao)
- [ ] **CREQ-10**: Contact info pre-filled from user profile

### Phase 59: Workspace Management (Admin)

- [ ] **ADM-WS-01**: Admin can view all workspaces with member counts
- [ ] **ADM-WS-02**: Admin can search workspaces by name
- [ ] **ADM-WS-03**: Admin can view workspace details (name, members, requests, vault files)
- [ ] **ADM-WS-04**: Admin can create new workspace
- [ ] **ADM-WS-05**: Admin can invite member to workspace by email
- [ ] **ADM-WS-06**: Admin can change member role within workspace
- [ ] **ADM-WS-07**: Admin can remove member from workspace
- [ ] **ADM-WS-08**: Admin can deactivate workspace

### Phase 60: My Cases (User)

- [ ] **MYCASE-01**: User sees summary banner with total cases count
- [ ] **MYCASE-02**: User sees stat cards (Tong, Dang xu ly, Hoan tat, Qua han)
- [ ] **MYCASE-03**: User can search cases by code or type
- [ ] **MYCASE-04**: User can filter cases by status (Dang cho, Dang xu ly, Da hoan tat, Tu choi)
- [ ] **MYCASE-05**: User can filter cases by type
- [ ] **MYCASE-06**: Cases table shows 7 columns (Ma, Loai, Trang thai, Nguoi phu trach, Cap nhat, SLA, Thao tac)
- [ ] **MYCASE-07**: User can click case to view details
- [ ] **MYCASE-08**: Pagination works with page size of 10
- [ ] **MYCASE-09**: Empty state shows when no cases match filter

### Phase 61: Dashboard (User)

- [ ] **U-DASH-01**: Dashboard shows 4 stat cards with real counts
- [ ] **U-DASH-02**: Welcome banner shows workspace name and stats
- [ ] **U-DASH-03**: Recent cases panel shows 5 most recent cases with status badges
- [ ] **U-DASH-04**: Deadline/SLA panel shows upcoming deadlines with progress bars
- [ ] **U-DASH-05**: Recent documents panel shows latest vault files
- [ ] **U-DASH-06**: Activity timeline shows recent actions with relative timestamps
- [ ] **U-DASH-07**: Floating chat button shows unread message count
- [ ] **U-DASH-08**: Clicking stat cards navigates to relevant page

### Phase 62: Request Management (Admin)

- [ ] **ADM-REQ-01**: Admin sees all requests with workspace filtering
- [ ] **ADM-REQ-02**: Admin can search requests by code
- [ ] **ADM-REQ-03**: Admin can filter requests by status
- [ ] **ADM-REQ-04**: Admin can filter requests by type
- [ ] **ADM-REQ-05**: Admin can assign specialist to request
- [ ] **ADM-REQ-06**: Admin can change request status
- [ ] **ADM-REQ-07**: Admin can view request details
- [ ] **ADM-REQ-08**: Request table shows priority badges (Cao, Trung binh, Thap)
- [ ] **ADM-REQ-09**: Pagination works with page size of 20

### Phase 63: Admin Dashboard

- [ ] **ADM-DASH-01**: Admin sees 4 stat cards (Tong users, Tong workspaces, Canh bao SLA, Alert)
- [ ] **ADM-DASH-02**: Workload panel shows specialist workloads with progress bars
- [ ] **ADM-DASH-03**: Alert panel shows system alerts
- [ ] **ADM-DASH-04**: Workspace panel shows workspace summary
- [ ] **ADM-DASH-05**: Approval panel shows pending approvals
- [ ] **ADM-DASH-06**: Audit timeline shows recent audit events
- [ ] **ADM-DASH-07**: Clicking stat cards navigates to relevant admin pages
- [ ] **ADM-DASH-08**: Floating chat shows alert count

### Phase 64: Operations (Admin)

- [ ] **ADM-OPS-01**: Operations page shows stat cards (Ho so dang mo, Sap qua SLA, Hoan tat hom nay, Canh bao)
- [ ] **ADM-OPS-02**: Workload panel shows specialist assignments
- [ ] **ADM-OPS-03**: Audit timeline shows recent operations
- [ ] **ADM-OPS-04**: Operations table shows requests with SLA bars
- [ ] **ADM-OPS-05**: SLA bars are color-coded (xanh: ok, cam: warning, do: danger)
- [ ] **ADM-OPS-06**: Admin can filter by specialist
- [ ] **ADM-OPS-07**: Admin can sort by SLA deadline

### Phase 65: Messages (User)

- [ ] **MSG-01**: Messages page shows 3-column layout (thread list, chat, info)
- [ ] **MSG-02**: Thread list shows all message threads with preview
- [ ] **MSG-03**: User can select thread to view messages
- [ ] **MSG-04**: Chat panel shows message history with timestamps
- [ ] **MSG-05**: User can send new message in chat
- [ ] **MSG-06**: Info panel shows request metadata
- [ ] **MSG-07**: Unread message count badge shows on thread
- [ ] **MSG-08**: User can close info panel

### Phase 66: Audit (Admin)

- [ ] **ADM-AUD-01**: Audit page shows 4 stat cards (Tong su kien, Hop le, Can ra soat, Canh bao)
- [ ] **ADM-AUD-02**: Security notice explains safe display
- [ ] **ADM-AUD-03**: Control alerts show security metrics
- [ ] **ADM-AUD-04**: Activity timeline shows recent events
- [ ] **ADM-AUD-05**: Audit table shows 7 columns (Time, Actor, Workspace, Action, Target, Correlation ID, Metadata)
- [ ] **ADM-AUD-06**: Admin can search by actor or target
- [ ] **ADM-AUD-07**: Admin can filter by action type
- [ ] **ADM-AUD-08**: Admin can filter by date range
- [ ] **ADM-AUD-09**: Pagination works with page size of 50
- [ ] **ADM-AUD-10**: Correlation IDs shown in monospace font

### Phase 67: Vault (Admin)

- [ ] **VAULT-01**: Vault page shows stat cards (Tong thu muc, Tep phap ly, The phan loai, Bao mat)
- [ ] **VAULT-02**: Folder panel shows folder tree
- [ ] **VAULT-03**: Tag panel shows classification tags with counts
- [ ] **VAULT-04**: Vault table shows files with 7 columns
- [ ] **VAULT-05**: Admin can search files by name
- [ ] **VAULT-06**: Admin can filter by folder
- [ ] **VAULT-07**: Admin can filter by tag
- [ ] **VAULT-08**: Admin can upload new file to vault
- [ ] **VAULT-09**: Admin can download file (signed URL)
- [ ] **VAULT-10**: Admin can create folder
- [ ] **VAULT-11**: Admin can create tag
- [ ] **VAULT-12**: Security badges show encryption/permission status

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI tự kết luận pháp lý | Rủi ro sai luật và liability cao |
| Open lawyer marketplace | Khó kiểm soát chất lượng |
| Workflow builder tùy biến | Overbuild; dùng state machine cố định |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SET-01..06 | Phase 55 | Pending |
| ADM-USER-01..09 | Phase 56 | Pending |
| CREQ-01..10 | Phase 57 | Pending |
| ADM-WS-01..08 | Phase 58 | Pending |
| MYCASE-01..09 | Phase 59 | Pending |
| U-DASH-01..08 | Phase 60 | Pending |
| ADM-REQ-01..09 | Phase 61 | Pending |
| ADM-DASH-01..08 | Phase 62 | Pending |
| ADM-OPS-01..07 | Phase 63 | Pending |
| MSG-01..08 | Phase 64 | Pending |
| ADM-AUD-01..10 | Phase 65 | Pending |
| VAULT-01..12 | Phase 66 | Pending |

**Coverage:**

- v2.1 requirements: 96 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-14*
*Last updated: 2026-06-14 after v2.1 milestone initialization*
