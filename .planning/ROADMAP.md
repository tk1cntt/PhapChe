# Roadmap: GitNexus Legal — v2.0 UI Parity

## Milestones

- ✅ **v1.0 MVP** - Phases 01-14 (shipped 2026-05-15)
- ✅ **v1.1 Auth & i18n** - Phases 15-25 (shipped 2026-06-09)
- ✅ **v1.4 Template Parity** - Phases 26-33 (UI completed, backend pending — 2026-06-12)
- 🚧 **v2.0 UI Parity** - Phases 39-51 (in progress)
- 📋 **v2.1 Architecture Refactor** - Phases TBD
- 📋 **v2.2 AI Features** - Phases TBD

## Overview

v2.0 tập trung vào việc kết nối Mock UI (đã hoàn chỉnh trong v1.4) với backend services thực tế. Approach: Adopt Mock UI Pattern — giữ UI đẹp, viết backend connection.

**Current Status:**

- Mock UI (src/app/[locale]/[workspaceSlug]/) ✅ Hoàn chỉnh
- Backend services (src/lib/, src/app/api/) ⚠️ Cần kết nối

## Phases (v2.0)

- 📋 **Phase 39: Customer Dashboard** — Connect mock data → real Prisma queries
- 📋 **Phase 40: Route Scaffold** — Create page.tsx for all v2 routes
- 📋 **Phase 41: Create Request Wizard** — Connect Steps 3-4 → real API
- 🚧 **Phase 42: My Cases** — Connect filter/search → real data
- 📋 **Phase 43: Messages** — Connect real-time messaging API
- 📋 **Phase 44: Workspace** — Connect workspace management
- 📋 **Phase 45: Settings** — Connect profile/security forms
- 📋 **Phase 46: Admin Dashboard** — Connect stats → real queries
- 📋 **Phase 47: User Management** — Connect CRUD → real API
- 📋 **Phase 48: Admin Requests** — Connect table → real data
- 📋 **Phase 49: Admin Operations** — Connect audit timeline
- 📋 **Phase 50: Admin Audit** — Connect security logs
- 📋 **Phase 51: Admin Vault** — Connect file management
- 📋 **Phase 52: Admin Workspace** — Connect permissions

## Phase Details

### Phase 26: Customer Dashboard

**Goal**: Customer dashboard renders with all stat cards, case list, deadline panel, recent docs, activity timeline, and full requests table matching template exactly
**Depends on**: Phase 25 (Auth & i18n)
**Requirements**: CUST-DASH-01, CUST-DASH-02, CUST-DASH-03, CUST-DASH-04, CUST-DASH-05, CUST-DASH-06, CUST-DASH-07, CUST-DASH-08, CUST-DASH-09, CUST-DASH-10
**Success Criteria** (what must be TRUE):

  1. User sees 4 stat cards with exact values (12 ho so, 3 dang xu ly, 8 hoan tat, 36 vault)
  2. User sees welcome banner with workspace status message
  3. User sees case list with status badges (Dang review, Can phan hoi, Da duyet)
  4. User sees deadline/SLA panel with progress bars
  5. User sees recent documents panel with PDF/DOC badges
  6. User sees activity timeline with relative timestamps
  7. User sees requests table with 7 columns showing 4 sample rows
  8. User sees floating chat button with "2 Tin moi" badge

**Plans:** 3/3 plans complete

- [x] 26-01-PLAN.md — Foundation components
- [x] 26-02-PLAN.md — Dashboard page with panels
- [x] 26-03-PLAN.md — Table and seed data

### Phase 27: Create Request

**Goal**: Create request wizard renders with 4-step flow, service options, sidebar summary, and checklist matching template
**Depends on**: Phase 26
**Requirements**: CUST-CREATE-01, CUST-CREATE-02, CUST-CREATE-03, CUST-CREATE-04, CUST-CREATE-05, CUST-CREATE-06
**Success Criteria** (what must be TRUE):

  1. User sees 4-step wizard (Service, Questions, Docs, Review) with step indicators
  2. User sees 5 service type options with radio selection
  3. User sees service cards with tags (Khuyen nghi, Nhanh, IP, Can tai lieu, Phan loai)
  4. User sees sidebar summary panel with selected service and workspace info
  5. User sees checklist panel with 4 preparation items

**Plans:** 3/3 plans complete

- [x] 27-01-PLAN.md — Page route with UserLayout and WizardSteps
- [x] 27-02-PLAN.md — Service selection components and sidebar panels
- [x] 27-03-PLAN.md — Form fields, integration, and floating chat

### Phase 28: My Cases

**Goal**: My Cases page renders with summary banner, 4 stats, toolbar filters, and requests table matching template
**Depends on**: Phase 27
**Requirements**: CUST-CASES-01, CUST-CASES-02, CUST-CASES-03, CUST-CASES-04, CUST-CASES-05
**Success Criteria** (what must be TRUE):

  1. User sees summary banner with total cases message
  2. User sees 4 stats cards (Tong: 12, Dang xu ly: 3, Hoan tat: 8, Qua han: 1)
  3. User sees toolbar with search and filter dropdowns functional
  4. User sees requests table with 7 columns and 5 sample rows

**Plans:** 3/3 plans complete

- [x] 28-01-PLAN.md — Summary banner and stat cards
- [x] 28-02-PLAN.md — Toolbar and requests table
- [x] 28-03-PLAN.md — E2E tests and seed data

### Phase 29: Messages

**Goal**: Messages page renders with 3-column layout, thread list, chat panel, and info panel matching template
**Depends on**: Phase 28
**Requirements**: CUST-MSG-01, CUST-MSG-02, CUST-MSG-03, CUST-MSG-04
**Success Criteria** (what must be TRUE):

  1. User sees 3-column layout (thread list, chat panel, info panel)
  2. User sees thread list with 4 sample threads and avatars (HL, QD, MT, KA)
  3. User sees chat panel with message history and in/out styling
  4. User sees info panel with request metadata (ma, SLA, tai lieu, nguoi tham gia)

**Plans:** 3/3 plans complete

- [x] 29-01-PLAN.md — Page route and layout foundation
- [x] 29-02-PLAN.md — Thread list panel component
- [x] 29-03-PLAN.md — Chat panel and info panel components

### Phase 30: Workspace

**Goal**: Workspace page renders with stats, banner, member grid, and permission panel matching template
**Depends on**: Phase 29
**Requirements**: CUST-WS-01, CUST-WS-02, CUST-WS-03, CUST-WS-04
**Success Criteria** (what must be TRUE):

  1. User sees 4 stats cards (Workspace: Active, Thanh vien: 6, Ho so: 12, Vault scope: 96%)
  2. User sees workspace banner with company name (Cong ty An Phat)
  3. User sees member grid with 4 sample members and role badges
  4. User sees permission/security panel with tenant isolation info

**Plans:** 3/3 plans complete

- [x] 30-01-PLAN.md — Page route [planned] and stat cards
- [x] 30-02-PLAN.md — Member grid [planned] and workspace banner
- [x] 30-03-PLAN.md — Permission panel [planned] and integration

### Phase 31: Settings

**Goal**: Settings page renders with 6 tabs, profile form, notification toggles, and security settings matching template
**Depends on**: Phase 30
**Requirements**: CUST-SET-01, CUST-SET-02, CUST-SET-03, CUST-SET-04, CUST-SET-05
**Success Criteria** (what must be TRUE):

  1. User sees settings menu with 6 tabs (Ho so ca nhan, Bao mat, Thong bao, Workspace, Ngon ngu, Audit)
  2. User sees profile form with 6 fields matching template
  3. User sees notification toggles with 3 items and on/off states
  4. User sees security toggles with 2FA and login alerts options

**Plans:** 3/3 plans complete

- [x] 31-01-PLAN.md — Page route and settings menu
- [x] 31-02-PLAN.md — Profile form and notification toggles
- [x] 31-03-PLAN.md — Security settings and integration

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

**Plans:** 2/3 plans complete

- [x] 32-01-PLAN.md — Page route and stat cards (2ef5069, 9b38bf2, 9077499)
- [x] 32-02-PLAN.md — Workload, alerts, and approvals panels (f3bd64b, 01ce6be, 2b5b88f, 49302c3)
- [x] 32-03-PLAN.md — Audit timeline and requests table (f406f80, 5f93775, a39be38, 114718e, 00a4a2b)

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

**Plans:** 3/3 plans complete

- [x] 33-01-PLAN.md — Page route and stat cards
- [x] 33-02-PLAN.md — Role pills and user table
- [x] 33-03-PLAN.md — Toolbar and integration

### Phase 34: Admin Requests

**Goal**: Admin requests page renders with stats, requests table, and priority badges matching template
**Depends on**: Phase 33
**Requirements**: ADMIN-REQ-01, ADMIN-REQ-02, ADMIN-REQ-03, ADMIN-REQ-04, ADMIN-REQ-05
**Success Criteria** (what must be TRUE):

  1. User sees 4 stats cards (Tong: 18, Dang cho: 5, Da duyet: 9, Uu tien cao: 3)
  2. User sees requests table with 6 columns and 6 sample rows
  3. User sees status badges and priority badges (High/Medium/Low)
  4. User sees toolbar with search and filter functional

**Plans:** 3 plans

- [ ] 34-01-PLAN.md — Page route and stat cards
- [ ] 34-02-PLAN.md — Requests table with badges
- [ ] 34-03-PLAN.md — Toolbar and integration

### Phase 35: Admin Operations

**Goal**: Admin operations page renders with stats, workload panel, audit timeline, and operations table with SLA bars matching template
**Depends on**: Phase 34
**Requirements**: ADMIN-OPS-01, ADMIN-OPS-02, ADMIN-OPS-03, ADMIN-OPS-04, ADMIN-OPS-05, ADMIN-OPS-06
**Success Criteria** (what must be TRUE):

  1. User sees 4 stats cards (Ho so dang mo: 24, Sap qua SLA: 6, Hoan tat hom nay: 11, Canh bao: 3)
  2. User sees workload panel with 4 specialists and progress bars
  3. User sees audit timeline with 4 recent operations
  4. User sees operations table with 7 columns and SLA bars
  5. User sees SLA bars color-coded (green/orange/red)

**Plans:** 3 plans

- [ ] 35-01-PLAN.md — Page route and stat cards
- [ ] 35-02-PLAN.md — Workload panel and audit timeline
- [ ] 35-03-PLAN.md — Operations table with SLA bars

### Phase 36: Admin Audit

**Goal**: Admin audit page renders with stats, security notice, security list, activity timeline, and audit table with correlation IDs matching template
**Depends on**: Phase 35
**Requirements**: ADMIN-AUD-01, ADMIN-AUD-02, ADMIN-AUD-03, ADMIN-AUD-04, ADMIN-AUD-05, ADMIN-AUD-06, ADMIN-AUD-07
**Success Criteria** (what must be TRUE):

  1. User sees 4 stats cards (Tong: 1,284, Hop le: 1,239, Can ra soat: 32, Canh bao: 7)
  2. User sees security notice explaining safe display principles
  3. User sees security list with 3 items (Truy cap bi tu choi: 7, Thay doi role: 12, Audit hoan chinh: 98%)
  4. User sees activity timeline with 4 recent entries
  5. User sees audit table with 7 columns including correlation IDs
  6. User sees correlation IDs in monospace font and action badges color-coded

**Plans:** 3 plans

- [ ] 36-01-PLAN.md — Page route and stat cards
- [ ] 36-02-PLAN.md — Security notice and activity timeline
- [ ] 36-03-PLAN.md — Audit table with correlation IDs

### Phase 37: Admin Vault

**Goal**: Admin vault page renders with stats, folder panel, tag panel, and vault table with security badges matching template
**Depends on**: Phase 36
**Requirements**: ADMIN-VAULT-01, ADMIN-VAULT-02, ADMIN-VAULT-03, ADMIN-VAULT-04, ADMIN-VAULT-05, ADMIN-VAULT-06
**Success Criteria** (what must be TRUE):

  1. User sees 4 stats cards (Tong thu muc: 12, Tep phap ly: 248, The: 18, Bao mat: 96%)
  2. User sees folder panel with 4 sample folders and file counts
  3. User sees tag panel with 4 sample tags and file counts
  4. User sees vault table with 7 columns and 6 sample files
  5. User sees security badges showing encryption/permission status

**Plans:** 3 plans

- [ ] 37-01-PLAN.md — Page route and stat cards
- [ ] 37-02-PLAN.md — Folder and tag panels
- [ ] 37-03-PLAN.md — Vault table with security badges

### Phase 38: Admin Workspace

**Goal**: Admin workspace page renders with permission card, workspace table, and toolbar matching template
**Depends on**: Phase 37
**Requirements**: ADMIN-WS-01, ADMIN-WS-02, ADMIN-WS-03, ADMIN-WS-04
**Success Criteria** (what must be TRUE):

  1. User sees permission card with workspace scope and security info
  2. User sees workspace table with permissions and member counts
  3. User sees sample workspaces (An Phat, Minh Khang, Internal)
  4. User sees toolbar with search and filter functional

**Plans:** 3 plans

- [ ] 38-01-PLAN.md — Page route and permission card
- [ ] 38-02-PLAN.md — Workspace table
- [ ] 38-03-PLAN.md — Toolbar and integration

### Phase 39: v2.0 Foundation — Restructure + Multilingual Schema

**Goal**: Restructure source code + Design multilingual database schema
**Depends on**: Phase 25 (Auth & i18n)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, RESTRUCTURE, i18n requirements from requirement.txt
**Success Criteria** (what must be TRUE):

  1. src/v2/ directory created with clean structure (app/, components/, lib/)
  2. src/legacy/ contains old code for reference
  3. Database schema supports multilingual content (title_vi, title_zh, title_jp, title_en)
  4. Seed data includes all 4 languages (VI, ZH, JP, EN)
  5. No hardcoded text in components — all strings use i18n keys

**Plans:** 4/4 plans complete

- [x] 39-00-PLAN.md — Source code restructure
- [x] 39-01-PLAN.md — Multilingual schema design
- [x] 39-02-PLAN.md — Seed data with 4 languages
- [x] 39-03-PLAN.md — i18n cleanup and verification

### Phase 40: v2 Route Scaffold

**Goal**: Create page.tsx skeletons for all 13 v2 routes (6 user + 7 admin)
**Depends on**: Phase 39 (Multilingual Schema)
**Requirements**: SCAFFOLD-01, SCAFFOLD-02
**Success Criteria** (what must be TRUE):

  1. All 13 routes have page.tsx with layout wrapper
  2. User pages use UserLayout wrapper
  3. Admin pages use AdminLayout wrapper
  4. Pages are navigable without errors

**Plans:** 1/1 plans

- [ ] 40-01-PLAN.md — Route scaffolding (pending)

### Phase 41: v2 Create Request Wizard

**Goal**: Connect Create Request wizard Steps 3-4 to real API endpoints
**Depends on**: Phase 40 (Route Scaffold)
**Requirements**: CUST-CREATE-03, CUST-CREATE-04, CUST-CREATE-06
**Success Criteria** (what must be TRUE):

  1. User sees MatterType labels from SEED_MATTER_TYPES in their locale (VI/EN/ZH/JA)
  2. User can upload documents via POST /api/v2/intake/attach-file
  3. User can submit request via POST /api/v2/intake/submit
  4. Inline errors display below invalid fields

**Plans:** 1/1 plans complete

- [x] 41-01-PLAN.md — API endpoints and multilingual integration

### Phase 42: My Cases — Connect filter/search to real data

**Goal**: Connect My Cases page to real Prisma queries instead of mock data
**Depends on**: Phase 41 (Create Request Wizard)
**Requirements**: CUST-CASES-01, CUST-CASES-02, CUST-CASES-03, CUST-CASES-04, CUST-CASES-05
**Success Criteria** (what must be TRUE):

  1. User sees 4 stat cards with real counts from database (Total, Processing, Completed, Overdue)
  2. User sees requests table with data from LegalRequest + MatterType labels
  3. Search filters requests by code/type across real data
  4. Status filter shows only matching requests
  5. SLA calculation uses slaDeadline from LegalRequest

**Plans:** 1/1 plans

- [ ] 42-01-PLAN.md — Prisma queries and client-side filtering (pending)

## Progress

| Phase | Screen | Requirements | Plans Complete | Status | Completed |
|-------|--------|--------------|----------------|--------|-----------|
| 26. Customer Dashboard | user-dashboard.html | 10 | 3/3 | Complete | 2026-06-10 |
| 27. Create Request | user-create-request.html | 6 | 3/3 | Complete | 2026-06-10 |
| 28. My Cases | user-cases.html | 5 | 3/3 | Complete | 2026-06-10 |
| 29. Messages | user-messages.html | 4 | 3/3 | Complete | 2026-06-11 |
| 30. Workspace | user-workspace.html | 4 | 3/3 | Complete | 2026-06-11 |
| 31. Settings | user-settings.html | 5 | 3/3 | Complete | 2026-06-11 |
| 32. Admin Dashboard | admin-dashboard.html | 10 | 3/3 | Complete | 2026-06-12 |
| 33. User Management | admin-user-management.html | 6 | 3/3 | Complete | 2026-06-12 |
| 34. Admin Requests | admin-request.html | 5 | 0/3 | Not started | - |
| 35. Admin Operations | admin-operations.html | 6 | 0/3 | Not started | - |
| 36. Admin Audit | admin-audit.html | 7 | 0/3 | Not started | - |
| 37. Admin Vault | admin-vault.html | 6 | 0/3 | Not started | - |
| 38. Admin Workspace | admin-workspace.html | 4 | 0/3 | Not started | - |
| 39. Multilingual Schema | v2.0 foundation | 5 | 4/4 | Complete | 2026-06-12 |
| 40. v2 Route Scaffold | v2 page skeletons | 2 | 0/1 | Pending | - |
| 41. Create Request Wizard | v2 API connection | 3 | 1/1 | Complete | 2026-06-13 |
| 42. My Cases | v2 real data | 5 | 0/1 | Pending | - |

---

**Coverage:**

- v1.4 requirements: 78 total
- Mapped to phases: 78
- Unmapped: 0

*Last updated: 2026-06-13*
