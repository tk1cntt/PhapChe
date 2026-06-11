# Roadmap: GitNexus Legal — v1.4 Template Parity

## Milestones

- ✅ **v1.0 MVP** - Phases 01-14 (shipped 2026-05-15)
- ✅ **v1.1 Auth & i18n** - Phases 15-25 (shipped 2026-06-09)
- 🚧 **v1.4 Template Parity** - Phases 26-38 (in progress)
- 📋 **v2.0 AI Features** - Phases TBD (planned)

## Overview

v1.4 tập trung vào việc align toàn bộ 13 màn hình (6 user + 7 admin) với template HTML trong thư mục layout/, mỗi màn hình có data sample y hệt template. Mỗi phase là một screen riêng biệt với e2e test verify render.

## Phases

- [x] **Phase 26: Customer Dashboard** - user-dashboard.html (10 requirements) (completed 2026-06-10)
- [ ] **Phase 27: Create Request** - user-create-request.html (6 requirements)
- [x] **Phase 28: My Cases** - user-cases.html (5 requirements) (completed 2026-06-10)
- [ ] **Phase 29: Messages** - user-messages.html (4 requirements)
- [ ] **Phase 30: Workspace** - user-workspace.html (4 requirements)
- [ ] **Phase 31: Settings** - user-settings.html (5 requirements)
- [ ] **Phase 32: Admin Dashboard** - admin-dashboard.html (10 requirements)
- [ ] **Phase 33: User Management** - admin-user-management.html (6 requirements)
- [ ] **Phase 34: Admin Requests** - admin-request.html (5 requirements)
- [ ] **Phase 35: Admin Operations** - admin-operations.html (6 requirements)
- [ ] **Phase 36: Admin Audit** - admin-audit.html (7 requirements)
- [ ] **Phase 37: Admin Vault** - admin-vault.html (6 requirements)
- [ ] **Phase 38: Admin Workspace** - admin-workspace.html (4 requirements)

## Phase Details

### Phase 26: Customer Dashboard
**Goal**: Customer dashboard renders with all stat cards, case list, deadline panel, recent docs, activity timeline, and full requests table matching template exactly
**Depends on**: Phase 25 (Auth & i18n)
**Requirements**: CUST-DASH-01, CUST-DASH-02, CUST-DASH-03, CUST-DASH-04, CUST-DASH-05, CUST-DASH-06, CUST-DASH-07, CUST-DASH-08, CUST-DASH-09, CUST-DASH-10
**Success Criteria** (what must be TRUE):
  1. User sees 4 stat cards with exact values (12 hồ sơ, 3 đang xử lý, 8 hoàn tất, 36 vault)
  2. User sees welcome banner with workspace status message
  3. User sees case list with status badges (Đang review, Cần phản hồi, Đã duyệt)
  4. User sees deadline/SLA panel with progress bars
  5. User sees recent documents panel with PDF/DOC badges
  6. User sees activity timeline with relative timestamps
  7. User sees requests table with 7 columns showing 4 sample rows
  8. User sees floating chat button with "2 Tin mới" badge
**Plans:** 3/3 plans complete
- [x] 26-01-PLAN.md — Foundation components
- [x] 26-02-PLAN.md — Dashboard page with panels
- [x] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 27: Create Request
**Goal**: Create request wizard renders with 4-step flow, service options, sidebar summary, and checklist matching template
**Depends on**: Phase 26
**Requirements**: CUST-CREATE-01, CUST-CREATE-02, CUST-CREATE-03, CUST-CREATE-04, CUST-CREATE-05, CUST-CREATE-06
**Success Criteria** (what must be TRUE):
  1. User sees 4-step wizard (Service, Questions, Docs, Review) with step indicators
  2. User sees 5 service type options with radio selection
  3. User sees service cards with tags (Khuyến nghị, Nhanh, IP, Cần tài liệu, Phân loại)
  4. User sees sidebar summary panel with selected service and workspace info
  5. User sees checklist panel with 4 preparation items
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 28: My Cases
**Goal**: My Cases page renders with summary banner, 4 stats, toolbar filters, and requests table matching template
**Depends on**: Phase 27
**Requirements**: CUST-CASES-01, CUST-CASES-02, CUST-CASES-03, CUST-CASES-04, CUST-CASES-05
**Success Criteria** (what must be TRUE):
  1. User sees summary banner with total cases message
  2. User sees 4 stats cards (Tổng: 12, Đang xử lý: 3, Hoàn tất: 8, Quá hạn: 1)
  3. User sees toolbar with search and filter dropdowns functional
  4. User sees requests table with 7 columns and 5 sample rows
**Plans:** 3/3 plans complete
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 29: Messages
**Goal**: Messages page renders with 3-column layout, thread list, chat panel, and info panel matching template
**Depends on**: Phase 28
**Requirements**: CUST-MSG-01, CUST-MSG-02, CUST-MSG-03, CUST-MSG-04
**Success Criteria** (what must be TRUE):
  1. User sees 3-column layout (thread list, chat panel, info panel)
  2. User sees thread list with 4 sample threads and avatars (HL, QD, MT, KA)
  3. User sees chat panel with message history and in/out styling
  4. User sees info panel with request metadata (mã, SLA, tài liệu, người tham gia)
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 30: Workspace
**Goal**: Workspace page renders with stats, banner, member grid, and permission panel matching template
**Depends on**: Phase 29
**Requirements**: CUST-WS-01, CUST-WS-02, CUST-WS-03, CUST-WS-04
**Success Criteria** (what must be TRUE):
  1. User sees 4 stats cards (Workspace: Active, Thành viên: 6, Hồ sơ: 12, Vault scope: 96%)
  2. User sees workspace banner with company name (Công ty An Phát)
  3. User sees member grid with 4 sample members and role badges
  4. User sees permission/security panel with tenant isolation info
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 31: Settings
**Goal**: Settings page renders with 6 tabs, profile form, notification toggles, and security settings matching template
**Depends on**: Phase 30
**Requirements**: CUST-SET-01, CUST-SET-02, CUST-SET-03, CUST-SET-04, CUST-SET-05
**Success Criteria** (what must be TRUE):
  1. User sees settings menu with 6 tabs (Hồ sơ cá nhân, Bảo mật, Thông báo, Workspace, Ngôn ngữ, Audit)
  2. User sees profile form with 6 fields matching template
  3. User sees notification toggles with 3 items and on/off states
  4. User sees security toggles with 2FA and login alerts options
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 32: Admin Dashboard
**Goal**: Admin dashboard renders with stats, workload list, alerts, workspaces, approvals, audit timeline, and requests table matching template
**Depends on**: Phase 31
**Requirements**: ADMIN-DASH-01, ADMIN-DASH-02, ADMIN-DASH-03, ADMIN-DASH-04, ADMIN-DASH-05, ADMIN-DASH-06, ADMIN-DASH-07, ADMIN-DASH-08, ADMIN-DASH-09, ADMIN-DASH-10
**Success Criteria** (what must be TRUE):
  1. User sees 4 stat cards with exact values (128 users, 12 workspaces, 6 SLA warnings, 3 alerts)
  2. User sees admin banner with system status message
  3. User sees workload list with 4 specialists and progress bars
  4. User sees alerts panel with 4 alert items and badge types
  5. User sees workspace panel with 3 sample workspaces
  6. User sees approvals panel with 3 pending items
  7. User sees audit timeline with 3 recent entries
  8. User sees requests table with 7 columns and 5 sample rows
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 33: User Management
**Goal**: User management page renders with stats, role pills, and user table matching template
**Depends on**: Phase 32
**Requirements**: ADMIN-USER-01, ADMIN-USER-02, ADMIN-USER-03, ADMIN-USER-04, ADMIN-USER-05, ADMIN-USER-06
**Success Criteria** (what must be TRUE):
  1. User sees 4 stats cards (Total: 128, Active: 112, Workspaces: 12, Pending: 9)
  2. User sees role pills with 6 roles and counts
  3. User sees user table with 8 columns and 8 sample users
  4. User sees role badges color-coded by role type
  5. User sees toolbar with search and filter dropdowns functional
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 34: Admin Requests
**Goal**: Admin requests page renders with stats, requests table, and priority badges matching template
**Depends on**: Phase 33
**Requirements**: ADMIN-REQ-01, ADMIN-REQ-02, ADMIN-REQ-03, ADMIN-REQ-04, ADMIN-REQ-05
**Success Criteria** (what must be TRUE):
  1. User sees 4 stats cards (Tổng: 18, Đang chờ: 5, Đã duyệt: 9, Ưu tiên cao: 3)
  2. User sees requests table with 6 columns and 6 sample rows
  3. User sees status badges and priority badges (High/Medium/Low)
  4. User sees toolbar with search and filter functional
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 35: Admin Operations
**Goal**: Admin operations page renders with stats, workload panel, audit timeline, and operations table with SLA bars matching template
**Depends on**: Phase 34
**Requirements**: ADMIN-OPS-01, ADMIN-OPS-02, ADMIN-OPS-03, ADMIN-OPS-04, ADMIN-OPS-05, ADMIN-OPS-06
**Success Criteria** (what must be TRUE):
  1. User sees 4 stats cards (Hồ sơ đang mở: 24, Sắp quá SLA: 6, Hoàn tất hôm nay: 11, Cảnh báo: 3)
  2. User sees workload panel with 4 specialists and progress bars
  3. User sees audit timeline with 4 recent operations
  4. User sees operations table with 7 columns and SLA bars
  5. User sees SLA bars color-coded (green/orange/red)
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 36: Admin Audit
**Goal**: Admin audit page renders with stats, security notice, security list, activity timeline, and audit table with correlation IDs matching template
**Depends on**: Phase 35
**Requirements**: ADMIN-AUD-01, ADMIN-AUD-02, ADMIN-AUD-03, ADMIN-AUD-04, ADMIN-AUD-05, ADMIN-AUD-06, ADMIN-AUD-07
**Success Criteria** (what must be TRUE):
  1. User sees 4 stats cards (Tổng: 1,284, Hợp lệ: 1,239, Cần rà soát: 32, Cảnh báo: 7)
  2. User sees security notice explaining safe display principles
  3. User sees security list with 3 items (Truy cập bị từ chối: 7, Thay đổi role: 12, Audit hoàn chỉnh: 98%)
  4. User sees activity timeline with 4 recent entries
  5. User sees audit table with 7 columns including correlation IDs
  6. User sees correlation IDs in monospace font and action badges color-coded
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 37: Admin Vault
**Goal**: Admin vault page renders with stats, folder panel, tag panel, and vault table with security badges matching template
**Depends on**: Phase 36
**Requirements**: ADMIN-VAULT-01, ADMIN-VAULT-02, ADMIN-VAULT-03, ADMIN-VAULT-04, ADMIN-VAULT-05, ADMIN-VAULT-06
**Success Criteria** (what must be TRUE):
  1. User sees 4 stats cards (Tổng thư mục: 12, Tệp pháp lý: 248, Thẻ: 18, Bảo mật: 96%)
  2. User sees folder panel with 4 sample folders and file counts
  3. User sees tag panel with 4 sample tags and file counts
  4. User sees vault table with 7 columns and 6 sample files
  5. User sees security badges showing encryption/permission status
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

### Phase 38: Admin Workspace
**Goal**: Admin workspace page renders with permission card, workspace table, and toolbar matching template
**Depends on**: Phase 37
**Requirements**: ADMIN-WS-01, ADMIN-WS-02, ADMIN-WS-03, ADMIN-WS-04
**Success Criteria** (what must be TRUE):
  1. User sees permission card with workspace scope and security info
  2. User sees workspace table with permissions and member counts
  3. User sees sample workspaces (An Phát, Minh Khang, Internal)
  4. User sees toolbar with search and filter functional
**Plans:** 3 plans
- [ ] 26-01-PLAN.md — Foundation components
- [ ] 26-02-PLAN.md — Dashboard page with panels
- [ ] 26-03-PLAN.md — Table and seed data
**UI hint**: yes

## Progress

| Phase | Screen | Requirements | Plans Complete | Status | Completed |
|-------|--------|--------------|----------------|--------|-----------|
| 26. Customer Dashboard | user-dashboard.html | 10 | 0/10 | Not started | - |
| 27. Create Request | user-create-request.html | 6 | 0/6 | Not started | - |
| 28. My Cases | user-cases.html | 5 | 0/5 | Not started | - |
| 29. Messages | user-messages.html | 4 | 0/4 | Not started | - |
| 30. Workspace | user-workspace.html | 4 | 0/4 | Not started | - |
| 31. Settings | user-settings.html | 5 | 0/5 | Not started | - |
| 32. Admin Dashboard | admin-dashboard.html | 10 | 0/10 | Not started | - |
| 33. User Management | admin-user-management.html | 6 | 0/6 | Not started | - |
| 34. Admin Requests | admin-request.html | 5 | 0/5 | Not started | - |
| 35. Admin Operations | admin-operations.html | 6 | 0/6 | Not started | - |
| 36. Admin Audit | admin-audit.html | 7 | 0/7 | Not started | - |
| 37. Admin Vault | admin-vault.html | 6 | 0/6 | Not started | - |
| 38. Admin Workspace | admin-workspace.html | 4 | 0/4 | Not started | - |

---

**Coverage:**
- v1.4 requirements: 78 total
- Mapped to phases: 78
- Unmapped: 0 ✓

*Last updated: 2026-06-10*
