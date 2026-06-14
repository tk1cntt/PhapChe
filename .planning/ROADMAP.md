# Roadmap: GitNexus Legal â€” v2.0 UI Parity

## Milestones

- âœ… **v1.0 MVP** - Phases 01-14 (shipped 2026-05-15)- âœ… **v1.1 Auth & i18n** - Phases 15-25 (shipped 2026-06-09)- âœ… **v1.4 Template Parity** - Phases 26-33 (UI completed, backend pending â€” 2026-06-12)- đŸ§ **v2.0 UI Parity** - Phases 39-51 (in progress)- đŸ“‹ **v2.1 Architecture Refactor** - Phases TBD- đŸ“‹ **v2.2 AI Features** - Phases TBD

## Overview

v2.0 táº­p trung vĂ o viá»‡c káº¿t ná»‘i Mock UI (Ä‘Ă£ hoĂ n chá»‰nh trong v1.4) vá»›i backend services thá»±c táº¿. Approach: Adopt Mock UI Pattern â€” giá»¯ UI Ä‘áº¹p, viáº¿t backend connection.

**Current Status:**
- Mock UI (src/app/[locale]/[workspaceSlug]/) âœ… HoĂ n chá»‰nh- Backend services (src/lib/, src/app/api/) â ï¸ Cáº§n káº¿t ná»‘i

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
- 📋 **Phase 48: Request Management** — Connect table → real data
- ❌ **Phase 49: Operations** — Connect audit timeline
- ❌ **Phase 50: Audit** — Connect security logs
- ❌ **Phase 51: Vault** — Connect file management
- ❌ **Phase 52: Workspace** — Connect permissions
- ❌ **Phase 53: User Dashboard Real Data** — Connect stats → real queries
- 📋 **Phase 54: i18n Comprehensive Migration** — Replace hardcoded strings with i18n keys

## Phase Details

### Phase 53: User Dashboard Real Data

**Goal**: Implement user dashboard with real data from Prisma queries, matching template layout/user-dashboard.html exactly
**Depends on**: Phase 29 (Messages page integration)
**Requirements**: USER-DASH-REAL-01, USER-DASH-REAL-02, USER-DASH-REAL-03, USER-DASH-REAL-04
**Success Criteria** (what must be TRUE):
  1. User sees 4 stat cards with real counts (total requests, in_progress, completed, vault docs)
  2. User sees welcome banner with workspace status message from DB
  3. User sees recent cases panel with status badges from real data
  4. User sees deadline/SLA panel with progress bars from real deadlines
  5. User sees recent documents panel from vault
  6. User sees activity timeline with relative timestamps from audit logs
  7. User sees requests table with real data
  8. User sees floating chat button

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
**Plans:** 1/1 plans complete

- [x] 26-01-PLAN.md â€” Foundation components
- [x] 26-02-PLAN.md â€” Dashboard page with panels
- [x] 26-03-PLAN.md â€” Table and seed data

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
**Plans:** 1/1 plans complete

- [x] 27-01-PLAN.md â€” Page route with UserLayout and WizardSteps
- [x] 27-02-PLAN.md â€” Service selection components and sidebar panels
- [x] 27-03-PLAN.md â€” Form fields, integration, and floating chat

### Phase 28: My Cases

**Goal**: My Cases page renders with summary banner, 4 stats, toolbar filters, and requests table matching template
**Depends on**: Phase 27
**Requirements**: CUST-CASES-01, CUST-CASES-02, CUST-CASES-03, CUST-CASES-04, CUST-CASES-05
**Success Criteria** (what must be TRUE):
  1. User sees summary banner with total cases message
  2. User sees 4 stats cards (Tong: 12, Dang xu ly: 3, Hoan tat: 8, Qua han: 1)
  3. User sees toolbar with search and filter dropdowns functional
  4. User sees requests table with 7 columns and 5 sample rows
**Plans:** 1/1 plans complete

- [x] 28-01-PLAN.md â€” Summary banner and stat cards
- [x] 28-02-PLAN.md â€” Toolbar and requests table
- [x] 28-03-PLAN.md â€” E2E tests and seed data

### Phase 29: Messages

**Goal**: Messages page renders with 3-column layout, thread list, chat panel, and info panel matching template
**Depends on**: Phase 28
**Requirements**: CUST-MSG-01, CUST-MSG-02, CUST-MSG-03, CUST-MSG-04
**Success Criteria** (what must be TRUE):
  1. User sees 3-column layout (thread list, chat panel, info panel)
  2. User sees thread list with 4 sample threads and avatars (HL, QD, MT, KA)
  3. User sees chat panel with message history and in/out styling
  4. User sees info panel with request metadata (ma, SLA, tai lieu, nguoi tham gia)
**Plans:** 1/1 plans complete

- [x] 29-01-PLAN.md â€” Page route and layout foundation
- [x] 29-02-PLAN.md â€” Thread list panel component
- [x] 29-03-PLAN.md â€” Chat panel and info panel components

### Phase 30: Workspace

**Goal**: Workspace page renders with stats, banner, member grid, and permission panel matching template
**Depends on**: Phase 29
**Requirements**: CUST-WS-01, CUST-WS-02, CUST-WS-03, CUST-WS-04
**Success Criteria** (what must be TRUE):
  1. User sees 4 stats cards (Workspace: Active, Thanh vien: 6, Ho so: 12, Vault scope: 96%)
  2. User sees workspace banner with company name (Cong ty An Phat)
  3. User sees member grid with 4 sample members and role badges
  4. User sees permission/security panel with tenant isolation info
**Plans:** 1/1 plans complete

- [x] 30-01-PLAN.md â€” Page route [planned] and stat cards
- [x] 30-02-PLAN.md â€” Member grid [planned] and workspace banner
- [x] 30-03-PLAN.md â€” Permission panel [planned] and integration

### Phase 31: Settings

**Goal**: Settings page renders with 6 tabs, profile form, notification toggles, and security settings matching template
**Depends on**: Phase 30
**Requirements**: CUST-SET-01, CUST-SET-02, CUST-SET-03, CUST-SET-04, CUST-SET-05
**Success Criteria** (what must be TRUE):
  1. User sees settings menu with 6 tabs (Ho so ca nhan, Bao mat, Thong bao, Workspace, Ngon ngu, Audit)
  2. User sees profile form with 6 fields matching template
  3. User sees notification toggles with 3 items and on/off states
  4. User sees security toggles with 2FA and login alerts options
**Plans:** 1/1 plans complete

- [x] 31-01-PLAN.md â€” Page route and settings menu
- [x] 31-02-PLAN.md â€” Profile form and notification toggles
- [x] 31-03-PLAN.md â€” Security settings and integration

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

- [x] 32-01-PLAN.md â€” Page route and stat cards (2ef5069, 9b38bf2, 9077499)
- [x] 32-02-PLAN.md â€” Workload, alerts, and approvals panels (f3bd64b, 01ce6be, 2b5b88f, 49302c3)
- [x] 32-03-PLAN.md â€” Audit timeline and requests table (f406f80, 5f93775, a39be38, 114718e, 00a4a2b)

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
**Plans:** 1/1 plans complete

- [x] 33-01-PLAN.md â€” Page route and stat cards
- [x] 33-02-PLAN.md â€” Role pills and user table
- [x] 33-03-PLAN.md â€” Toolbar and integration

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

- [x] 34-01-PLAN.md â€” Page route and stat cards
- [ ] 34-02-PLAN.md â€” Requests table with badges
- [ ] 34-03-PLAN.md â€” Toolbar and integration

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

- [ ] 35-01-PLAN.md â€” Page route and stat cards
- [ ] 35-02-PLAN.md â€” Workload panel and audit timeline
- [ ] 35-03-PLAN.md â€” Operations table with SLA bars

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

- [ ] 36-01-PLAN.md â€” Page route and stat cards
- [ ] 36-02-PLAN.md â€” Security notice and activity timeline
- [ ] 36-03-PLAN.md â€” Audit table with correlation IDs

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

- [ ] 37-01-PLAN.md â€” Page route and stat cards
- [ ] 37-02-PLAN.md â€” Folder and tag panels
- [ ] 37-03-PLAN.md â€” Vault table with security badges

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

- [ ] 38-01-PLAN.md â€” Page route and permission card
- [ ] 38-02-PLAN.md â€” Workspace table
- [ ] 38-03-PLAN.md â€” Toolbar and integration

### Phase 39: v2.0 Foundation â€” Restructure + Multilingual Schema

**Goal**: Restructure source code + Design multilingual database schema
**Depends on**: Phase 25 (Auth & i18n)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, RESTRUCTURE, i18n requirements from requirement.txt
**Success Criteria** (what must be TRUE):
  1. src/v2/ directory created with clean structure (app/, components/, lib/)
  2. src/legacy/ contains old code for reference
  3. Database schema supports multilingual content (title_vi, title_zh, title_jp, title_en)
  4. Seed data includes all 4 languages (VI, ZH, JP, EN)
  5. No hardcoded text in components â€” all strings use i18n keys
**Plans:** 4/4 plans complete

- [x] 39-00-PLAN.md â€” Source code restructure
- [x] 39-01-PLAN.md â€” Multilingual schema design
- [x] 39-02-PLAN.md â€” Seed data with 4 languages
- [x] 39-03-PLAN.md â€” i18n cleanup and verification

### Phase 40: v2 Route Scaffold

**Goal**: Create page.tsx skeletons for all 13 v2 routes (6 user + 7 admin)
**Depends on**: Phase 39 (Multilingual Schema)
**Requirements**: SCAFFOLD-01, SCAFFOLD-02
**Success Criteria** (what must be TRUE):
  1. All 13 routes have page.tsx with layout wrapper  2. User pages use UserLayout wrapper
  3. Admin pages use AdminLayout wrapper  4. Pages are navigable without errors
**Plans:** 1/1 plans

- [ ] 40-01-PLAN.md â€” Route scaffolding (pending)

### Phase 41: v2 Create Request Wizard

**Goal**: Connect Create Request wizard Steps 3-4 to real API endpoints
**Depends on**: Phase 40 (Route Scaffold)
**Requirements**: CUST-CREATE-03, CUST-CREATE-04, CUST-CREATE-06
**Success Criteria** (what must be TRUE):
  1. User sees MatterType labels from SEED_MATTER_TYPES in their locale (VI/EN/ZH/JA)  2. User can upload documents via POST /api/v2/intake/attach-file  3. User can submit request via POST /api/v2/intake/submit
  4. Inline errors display below invalid fields
**Plans:** 1/1 plans complete

- [x] 41-01-PLAN.md â€” API endpoints and multilingual integration

### Phase 42: My Cases â€” Connect filter/search to real data

**Goal**: Connect My Cases page to real Prisma queries instead of mock data
**Depends on**: Phase 41 (Create Request Wizard)
**Requirements**: CUST-CASES-01, CUST-CASES-02, CUST-CASES-03, CUST-CASES-04, CUST-CASES-05
**Success Criteria** (what must be TRUE):
  1. User sees 4 stat cards with real counts from database (Total, Processing, Completed, Overdue)
  2. User sees requests table with data from LegalRequest + MatterType labels
  3. Search filters requests by code/type across real data
  4. Status filter shows only matching requests
  5. SLA calculation uses slaDeadline from LegalRequest
**Plans:** 1/1 plans complete

- [x] 42-01-PLAN.md â€” Prisma queries and client-side filtering (pending)## Progress

### Phase 45: Settings â€” Real Data Integration

**Goal**: Connect Settings page (/vi/settings) to real Prisma queries. Replace placeholder "Settings coming soon" with full settings functionality including profile form, security settings, notification preferences, workspace settings, language switch, and audit log viewer.
**Depends on**: Phase 42 (My Cases)
**Requirements**: CUST-SET-01, CUST-SET-02, CUST-SET-03, CUST-SET-04, CUST-SET-05
**Success Criteria** (what must be TRUE):
  1. User sees 6-tab settings menu with icons (Ho so ca nhan, Bao mat, Thong bao, Workspace, Ngon ngu, Audit)
  2. User sees profile form with 6 fields pre-filled from database (name, email, phone, title, workspace, timezone)
  3. User sees notification toggles with 3 items (emailOnReply, slaReminder, weeklySummary)
  4. User sees security section with password change form and 2FA toggle  5. User can view audit log entries for their account
**Plans:** 1/1 plans complete

- [x] 45-01-PLAN.md â€” Foundation: Prisma schema + Settings components (SettingsMenu, SettingsStats, ProfileForm, ToggleRow)
- [x] 45-02-PLAN.md â€” API routes: profile, password, notifications, language, audit endpoints
- [x] 45-03-PLAN.md â€” Integration: Settings page + remaining components + API wiring

### Phase 46: Admin Dashboard â€” Real Data Integration

**Goal**: Connect Admin Dashboard page (/vi/admin) to real Prisma queries. Clone admin components from legacy, create API routes, and wire up real data for stats, workload, alerts, workspaces, approvals, timeline, and request table.
**Depends on**: Phase 45 (Settings)
**Requirements**: ADMIN-DASH-REAL-01, ADMIN-DASH-REAL-02, ADMIN-DASH-REAL-03, ADMIN-DASH-REAL-04
**Success Criteria** (what must be TRUE):
  1. User sees 4 stat cards with real counts from database (users, workspaces, near SLA, audit alerts)
  2. User sees workload panel with specialist progress bars
  3. User sees alerts panel with real data
  4. User sees requests table with data from LegalRequest
  5. Admin banner shows real system status
**Plans:** 1/1 plans complete

### Phase 47: User Management — Real Data Integration

**Goal**: Connect User Management page (/vi/admin/users) to real Prisma/API data while matching `layout/admin-user-management.html`.
**Depends on**: Phase 46 (Admin Dashboard)
**Requirements**: ADMIN-USER-REAL-01, ADMIN-USER-REAL-02, ADMIN-USER-REAL-03, ADMIN-USER-REAL-04
**Success Criteria** (what must be TRUE):
  1. User sees 4 stat cards with real counts from database
  2. User sees role pills with counts derived from real users
  3. User table renders users from `/api/admin/users`
  4. Search, role filter, workspace filter, refresh, export and paging use API-backed data
  5. UI matches `layout/admin-user-management.html`
**Plans:** 1/1 plans complete

- [x] 47-01-PLAN.md — Admin users API integration, table, toolbar, paging

### Phase 48: Request Management — Real Data Integration

**Goal**: Connect Request Management page (/vi/admin/requests) to real Prisma/API data while matching `layout/admin-request.html`.
**Depends on**: Phase 47 (User Management)
**Requirements**: ADMIN-REQ-REAL-01, ADMIN-REQ-REAL-02, ADMIN-REQ-REAL-03, ADMIN-REQ-REAL-04
**Success Criteria** (what must be TRUE):
  1. User sees request stat cards with counts from database
  2. User sees request table rows from `/api/admin/requests`
  3. Status badges support multiple workflow statuses with template-matched colors
  4. Toolbar search/filter/workspace controls use API-backed data
  5. Paging uses common `components/ui/Paging`
  6. UI matches `layout/admin-request.html`
**Plans:** 1/1 plans complete

- [x] 48-01-PLAN.md — Admin request management API integration and UI parity

### Phase 49: Operations — Real Data Integration

**Goal**: Connect Operations page (/vi/admin/operations) to real operational workload, SLA, and workflow data while matching `layout/admin-operations.html`.
**Depends on**: Phase 48 (Request Management)
**Requirements**: ADMIN-OPS-REAL-01, ADMIN-OPS-REAL-02, ADMIN-OPS-REAL-03, ADMIN-OPS-REAL-04
**Success Criteria** (what must be TRUE):
  1. User sees operations stat cards from database
  2. User sees specialist workload from real assignments
  3. User sees operations/audit timeline from real events
  4. User sees operations table with SLA bars from real deadlines
  5. UI matches `layout/admin-operations.html`
**Plans:** 1/1 plans

- [ ] 49-01-PLAN.md — Operations real data integration

### Phase 50: Audit — Real Data Integration

**Goal**: Connect Audit page (/vi/admin/audit) to real audit/security events while matching `layout/admin-audit.html`.
**Depends on**: Phase 49 (Operations)
**Requirements**: ADMIN-AUDIT-REAL-01, ADMIN-AUDIT-REAL-02, ADMIN-AUDIT-REAL-03, ADMIN-AUDIT-REAL-04
**Success Criteria** (what must be TRUE):
  1. User sees audit stat cards from audit log data
  2. User sees security notice and security summary from real metrics
  3. User sees activity timeline from audit events
  4. User sees audit table with correlation IDs and action badges
  5. UI matches `layout/admin-audit.html`
**Plans:** 1/1 plans

- [x] 50-01-PLAN.md — Audit real data integration

### Phase 51: Vault — Real Data Integration

**Goal**: Connect Vault page (/vi/admin/vault) to real vault folders/files/tags while matching `layout/admin-vault.html`.
**Depends on**: Phase 50 (Audit)
**Requirements**: ADMIN-VAULT-REAL-01, ADMIN-VAULT-REAL-02, ADMIN-VAULT-REAL-03, ADMIN-VAULT-REAL-04
**Success Criteria** (what must be TRUE):
  1. User sees vault stat cards from real file/folder data
  2. User sees folder panel from database
  3. User sees tag panel from database
  4. User sees vault table with security badges and private file metadata
  5. UI matches `layout/admin-vault.html`
**Plans:** 1/1 plans

- [ ] 51-01-PLAN.md — Vault real data integration

### Phase 52: Workspace — Real Data Integration

**Goal**: Connect Admin Workspace page (/vi/admin/workspaces) to real workspace/member/permission data while matching `layout/admin-workspace.html`.
**Depends on**: Phase 51 (Vault)
**Requirements**: ADMIN-WS-REAL-01, ADMIN-WS-REAL-02, ADMIN-WS-REAL-03, ADMIN-WS-REAL-04
**Success Criteria** (what must be TRUE):
  1. User sees permission card with real workspace scope and security information
  2. User sees workspace table from database
  3. User sees permissions and member counts from real relations
  4. Toolbar search/filter operates on real workspace data
  5. UI matches `layout/admin-workspace.html`
**Plans:** 1/1 plans

- [ ] 52-01-PLAN.md — Admin workspace real data integration

