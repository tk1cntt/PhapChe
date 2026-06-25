# Roadmap: GitNexus Legal

## Milestones

- ✅ **v1.0 MVP** — Phases 01-14 (shipped 2026-06-05)
- ✅ **v1.1 Auth & i18n** — Phases 15-25 (shipped 2026-06-10)
- ✅ **v2.0 Admin Portal + User Dashboard** — Phases 50-54 (shipped 2026-06-14)
- ✅ **v2.1 Shared Tenant Architecture** — Phases 55-72, 85 (shipped 2026-06-19)
- 🚧 **v2.2 Legacy UI Enhancement** — Phases 73-96 (in progress)
- 📋 **v2.3 AI Features** — Phases TBD

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 01-14) — SHIPPED 2026-06-05</summary>

- [x] Phase 01: Foundation (RBAC, audit, workspace isolation)
- [x] Phase 02: Intake catalog (schema-versioned answers, backend validation)
- [x] Phase 03: Customer intake flow (chat/form hybrid, file upload)
- [x] Phase 04: Routing capability matrix (coordinator assignment)
- [x] Phase 05: Specialist workbench (draft generation, version history)
- [x] Phase 06: Reviewer portal (split-view QC, approve/reject)
- [x] Phase 07: Customer delivery (signed URL downloads)
- [x] Phase 08: Operations dashboard (filters, workload, SLA)
- [x] Phase 09: Folder/Tag (vault file classification)
- [x] Phase 10: Ant Design UI migration
- [x] Phase 11-14: Gap-closure phases (audit, broken routes, auth, delivery)

[Details](.planning/milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 Auth & i18n (Phases 15-25) — SHIPPED 2026-06-10</summary>

- [x] Phase 15: Better Auth integration (login, session management)
- [x] Phase 16-25: Broken routes fix, E2E tests, customer dashboard, i18n infrastructure

[Details](.planning/milestones/v1.1-ROADMAP.md)

</details>

<details>
<summary>✅ v2.0 Admin Portal + User Dashboard (Phases 50-54) — SHIPPED 2026-06-14</summary>

- [x] Phase 49: Operations Real Data Integration
- [x] Phase 50: Audit Real Data Integration
- [x] Phase 51: Vault Real Data Integration
- [x] Phase 52: Workspace Real Data Integration
- [x] Phase 53: User Dashboard Real Data
- [x] Phase 54: i18n Comprehensive Migration

[Details](.planning/milestones/v2.0-ROADMAP.md)

</details>

<details>
<summary>✅ v2.1 Shared Tenant Architecture (Phases 55-72, 85) — SHIPPED 2026-06-19</summary>

**Foundation:**

- [x] Phase 55: Architecture & Standards (1/1 plans)
- [x] Phase 56: Storage Infrastructure (1/1 plans)
- [x] Phase 57: Shared Tenant Architecture (1/1 plans)

**Core Implementation:**

- [x] Phase 58: Core Tables (1/1 plans)
- [x] Phase 59: Partner Model (1/1 plans)
- [x] Phase 60: Engagement System (1/1 plans)
- [x] Phase 61: Request Enhancement (1/1 plans)
- [x] Phase 62: RequestContext & Middleware (1/1 plans)
- [x] Phase 63: Permission Service (1/1 plans)
- [x] Phase 64: Repository Pattern (1/1 plans)
- [x] Phase 65: Data Migration (1/1 plans)
- [x] Phase 66: Partner Auth (2/2 plans)
- [x] Phase 67: Partner Requests (4/4 plans)
- [x] Phase 68: Partner Actions + UI (3/3 plans)
- [x] Phase 69: Organization Management (1/1 plans)
- [x] Phase 70: User Management v2 (1/1 plans)
- [x] Phase 71: Create Request v2 (1/1 plans)
- [x] Phase 72: Workspace Management v2 (1/1 plans)

**Infrastructure:**

- [x] Phase 85: Database Schema Improvement (4/4 plans)

[Details](.planning/milestones/v2.1-ROADMAP.md)

</details>

---

## v2.2 Legacy UI Enhancement

UI screens exist from v2.0 (mock, 30-50%). These phases implement full backend integration following specification-first methodology and `src/docs/` architecture standards.

**Methodology:** Data-First Development — mỗi phase phải hoàn thành full data flow:

1. **API/Service Layer** — tạo endpoints + business logic theo `src/docs/SERVICE_LAYER.md`
2. **Data Seeding** — tạo seed data cho screen đó qua Prisma seed scripts
3. **Frontend Integration** — kết nối UI với real API (React Query hooks)
4. **Tests** — whitebox, blackbox, abnormal, error, E2E (≥90% coverage)

**Per-Phase Done Definition:**

- ✅ API endpoints exist và working
- ✅ Seed data exists cho screen đó
- ✅ UI connected to real APIs (no mock data)
- ✅ Error handling complete (API errors, validation, empty states)
- ✅ Loading states implemented (skeletons, spinners)
- ✅ Tests passing (unit + integration + E2E)
- ✅ i18n complete (all keys translated)
- ✅ Permissions enforced (RBAC checks)
- ✅ Audit logging complete (all actions logged)
- ✅ Coverage ≥90%

---

### Phase 73: Shared Foundation

**Goal:** Tạo shared infrastructure mà nhiều screens sẽ dùng — seed data framework, shared API client, React Query setup, error boundaries, loading states.

**Depends on:** None
**Requirements:** FOUND-01 to FOUND-12
**Plans:** 4/4 plans complete

- [x] 73-01-PLAN.md
- [x] 73-02-PLAN.md
- [x] 73-03-PLAN.md
- [x] 73-04-PLAN.md

**Deliverables:**

- `prisma/seed/` — seed data framework với realistic Vietnamese data
- `src/lib/api/client.ts` — central API client với React Query providers
- `src/components/shared/` — ErrorBoundary, LoadingSkeleton, EmptyState components
- `src/hooks/` — useAuth, usePermissions, useWorkspaceContext hooks
- Sample data: 10 users, 3 orgs, 5 workspaces, 50 requests, 100 audit events, 20 vault files, 30 messages, 5 partners

**Success Criteria:**

1. `npm run seed` populates database với realistic Vietnamese data
2. Central API client supports GET/POST/PATCH/DELETE với error handling
3. React Query providers configured và available globally
4. ErrorBoundary catches và displays API errors gracefully
5. LoadingSkeleton component reusable across all screens
6. EmptyState component shows when no data
7. Seed data covers tất cả entities needed cho 23 screens
8. Custom hooks provide typed access to common data (user, workspace, org)
9. API client handles 401/403/404/500 errors consistently
10. All seed data relationships preserved (org → workspaces → members → requests)
11. i18n translations loaded cho common UI elements
12. Foundation tests passing (unit tests cho client, hooks, seed scripts)

---

### Phase 74: Sign-In

**Screen:** `src/app/[locale]/sign-in/page.tsx` (17 lines, thin wrapper → `<SignInForm />`)

**Goal:** Sign-in form với authentication, error handling, redirect sau login

**Depends on:** Phase 73
**Requirements:** AUTH-01 to AUTH-06
**Plans:** TBD

**Data Flow:**

- API: `POST /api/auth/sign-in` (Better Auth)
- Seed: Test users (customer, specialist, reviewer, admin, partner)
- UI: Connect SignInForm to real auth API
- Tests: Valid login, invalid credentials, role-based redirect, locale preservation

**Success Criteria:**

1. Sign-in form displays email and password fields with validation
2. User can sign in via `POST /api/auth/sign-in` with email/password
3. Error message displays for invalid credentials
4. Redirect to dashboard after successful login based on role
5. Form validates email format and password length inline
6. Locale prefix preserved after redirect (`/vi/dashboard`, `/en/dashboard`)

---

### Phase 75: User Dashboard

**Screen:** `src/app/[locale]/dashboard/page.tsx` (~200 lines, server + client)

**Goal:** User Dashboard với real data từ database, 6 panels, clickable stats

**Depends on:** Phase 74
**Requirements:** U-DASH-01 to U-DASH-08
**Plans:** 1/1 plans complete

- [x] 75-01-PLAN.md — User Dashboard Enhancement (8 tasks)

**Data Flow:**

- API: `GET /api/requests?pageSize=5`, `GET /api/vault?pageSize=5`, `GET /api/audit?actorId=me`
- Seed: Requests với various statuses, vault files, audit events, messages
- UI: 4 stat cards + 6 panels connected to real APIs via React Query
- Tests: Real counts, panel data, navigation, empty states

**Success Criteria:**

1. Dashboard shows 4 stat cards with real counts from Prisma (total, in-progress, completed, overdue)
2. Welcome banner shows user name, organization and workspace
3. Recent cases panel shows 5 most recent cases via `GET /api/requests?pageSize=5`
4. Deadline/SLA panel shows upcoming deadlines with color-coded progress bars
5. Recent documents panel shows latest vault files via `GET /api/vault?pageSize=5`
6. Activity timeline shows recent actions from audit log via `GET /api/audit?actorId=me`
7. Floating chat button shows unread message count
8. Clicking stat cards navigates to relevant page (cases, create, etc.)

---

### Phase 76: Create Request

**Screen:** `src/app/[locale]/create/page.tsx` (~300 lines)

**Goal:** Create Request wizard 4 bước — chọn service type, trả lời câu hỏi, upload tài liệu, xác nhận

**Depends on:** Phase 75
**Requirements:** CREQ-01 to CREQ-11
**Plans:** TBD

**Data Flow:**

- API: `GET /api/intake/forms`, `POST /api/intake/submit`, `POST /api/requests/:id/documents`
- Seed: 5 service types with form definitions, intake questions
- UI: 4-step wizard connected to form engine + upload API
- Tests: All 4 steps, validation, upload progress, draft save, submit confirmation

**Success Criteria:**

1. User sees summary banner with available service types from `GET /api/intake/forms`
2. Service cards display with descriptions and tags
3. Wizard shows 4-step progress indicator
4. User can answer intake questions based on service type (FormDefinition engine)
5. User can upload documents with progress via `POST /api/requests/:id/documents`
6. User can review answers before submit
7. User can submit and see confirmation via `POST /api/intake/submit`
8. Request appears in My Cases after submit
9. Priority selection works (low, medium, high, urgent)
10. Contact info pre-filled from user profile
11. Draft save works — user can save and return later

---

### Phase 77: My Cases

**Screen:** `src/app/[locale]/cases/page.tsx` (~250 lines)

**Goal:** My Cases với case list, search, filter, pagination, detail navigation

**Depends on:** Phase 76
**Requirements:** MYCASE-01 to MYCASE-09
**Plans:** 1/1 plans complete

- [x] 77-01-PLAN.md — My Cases enhancement (3 tasks: type filter wiring, debounce, empty state)

**Data Flow:**

- API: `GET /api/requests?page=&pageSize=10&search=&status=&type=`
- Seed: 50 requests với various statuses, types, priorities, SLA deadlines
- UI: Table connected to real API với search/filter/pagination
- Tests: Filter combinations, pagination, empty state, navigation

**Success Criteria:**

1. Summary banner shows total cases count from `GET /api/requests`
2. Stat cards show correct counts (Tổng, Đang xử lý, Hoàn tất, Quá hạn)
3. Search filters cases by code or type via `?search=`
4. Status filter works via `?status=`
5. Type filter works via `?type=`
6. Table shows 7 columns (code, type, status, priority, assignee, SLA, actions)
7. Clicking case navigates to detail page
8. Pagination works with page size of 10
9. Empty state shows when no cases match filter

---

### Phase 78: Messages

**Screen:** `src/app/[locale]/messages/page.tsx` (~300 lines)

**Goal:** Messages với 3-column layout, thread list, chat, info panel

**Depends on:** Phase 77
**Requirements:** MSG-01 to MSG-08
**Plans:** TBD

**Data Flow:**

- API: `GET /api/messages?requestId=`, `GET /api/messages/:threadId`, `POST /api/messages/send`, `PUT /api/messages/:id/read`
- Seed: 30 messages across 5 threads, linked to requests
- UI: 3-column layout connected to real message APIs
- Tests: Thread list, send message, unread badge, info panel toggle

**Success Criteria:**

1. Messages page shows 3-column layout (threads, chat, info)
2. Thread list shows all message threads via `GET /api/messages?requestId=`
3. User can select thread to view messages via `GET /api/messages/:threadId`
4. Chat panel shows message history with timestamps
5. User can send new message via `POST /api/messages/send`
6. Info panel shows request metadata (status, assignee, SLA)
7. Unread message count badge shows on thread via `PUT /api/messages/:id/read`
8. User can close info panel

---

### Phase 79: User Workspace

**Screen:** `src/app/[locale]/workspace/page.tsx` (~200 lines)

**Goal:** User workspace với members, stats, resources, collaboration

**Depends on:** Phase 78
**Requirements:** UWS-01 to UWS-06
**Plans:** TBD

**Data Flow:**

- API: `GET /api/workspaces/:id/members`, workspace stats, vault files
- Seed: Workspace với 5 members, 20 cases, 15 documents
- UI: Members panel + stats + resources connected to real APIs
- Tests: Member list, stats accuracy, resource display, role permissions

**Success Criteria:**

1. Workspace page shows workspace info (name, organization, settings)
2. Members panel shows all workspace members with roles via `GET /api/workspaces/:id/members`
3. Stats panel shows workspace metrics (cases, documents, members)
4. Resources panel shows recent vault files
5. User can view own role and permissions in workspace
6. Activity feed shows recent workspace actions

---

### Phase 80: User Settings

**Screen:** `src/app/[locale]/settings/page.tsx` (~200 lines)

**Goal:** User settings với profile, password, notifications, language preferences

**Depends on:** Phase 79
**Requirements:** SET-01 to SET-06
**Plans:** TBD

**Data Flow:**

- API: `PUT /api/settings/profile`, `PUT /api/settings/password`, `PUT /api/settings/notifications`, `GET /api/settings/audit`
- Seed: User profile data, notification preferences, audit entries
- UI: Settings form connected to real APIs
- Tests: Profile update, password change, notification toggle, language switch, validation

**Success Criteria:**

1. User can view and edit profile (name, email, phone, title) via `PUT /api/settings/profile`
2. User can change password with current password verification via `PUT /api/settings/password`
3. User can toggle notifications (emailOnReply, slaReminder, weeklySummary) via `PUT /api/settings/notifications`
4. User can change language preference (VI/EN/ZH/JA) with cookie persistence
5. User can view own audit log entries via `GET /api/settings/audit?page=`
6. Settings form validates input and shows errors inline per `src/docs/CODE_STANDARDS.md`

---

### Phase 81: Invite Accept

**Screen:** `src/app/invite/[token]/page.tsx` (215 lines, mixed)

**Goal:** Partner/team member invite acceptance với token validation, role display

**Depends on:** Phase 80
**Requirements:** INV-01 to INV-07
**Plans:** TBD

**Data Flow:**

- API: `GET /api/partner/invite/:token`, `POST /api/partner/invite/accept`
- Seed: 5 pending invites với valid tokens, expired tokens
- UI: Invite page connected to real token validation API
- Tests: Valid token, expired token, invalid token, accept flow, auth redirect

**Success Criteria:**

1. Invite page validates token via `GET /api/partner/invite/:token` on load
2. Page shows invite info (email, role, partner/org name) from real API
3. Role-based UI shows different permissions for admin/specialist/viewer
4. User can accept invite via `POST /api/partner/invite/accept` with token
5. Success state shows after accept with redirect option
6. Error state shows for expired/invalid tokens
7. Unauthenticated users redirect to login then back to invite

---

### Phase 82: Admin Dashboard

**Screen:** `src/app/[locale]/admin/dashboard/page.tsx` (~400 lines)

**Goal:** Admin Dashboard với stats, workload, alerts, audit timeline, clickable navigation

**Depends on:** Phase 81
**Requirements:** ADM-DASH-01 to ADM-DASH-08
**Plans:** TBD

**Data Flow:**

- API: Aggregation endpoints for stats, workload, alerts, audit timeline
- Seed: Data across 3 orgs, 5 workspaces, 50 requests, specialists with assignments
- UI: 4 stat cards + 6 panels connected to real APIs
- Tests: Stat accuracy, workload display, alert conditions, navigation

**Success Criteria:**

1. Admin sees 4 stat cards with real counts by organization
2. Workload panel shows specialist workloads from assignments
3. Alert panel shows system alerts (SLA breaches, pending reviews)
4. Organization panel shows summary (total orgs, workspaces, users)
5. Approval panel shows pending approvals from workflow
6. Audit timeline shows recent audit events from `GET /api/admin/audit`
7. Clicking stat cards navigates to relevant admin pages
8. Floating chat shows alert count

---

### Phase 83: Admin Users List

**Screen:** `src/app/[locale]/admin/users/page.tsx` (~350 lines, real API)

**Goal:** Admin user management với organization filtering, CRUD, role changes, search

**Depends on:** Phase 82
**Requirements:** ADM-USER-01 to ADM-USER-09
**Plans:** TBD

**Data Flow:**

- API: `GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/:id`, `DELETE /api/admin/users/:id`
- Seed: 10 users across 3 orgs with various roles
- UI: User table connected to real CRUD APIs
- Tests: List, search, filter, create, edit, deactivate, bulk actions

**Success Criteria:**

1. Admin sees paginated list of all users via `GET /api/admin/users?page=&pageSize=`
2. Admin can search users by name/email via `?search=`
3. Admin can filter users by role via `?role=`
4. Admin can filter users by organization via `?organizationId=`
5. Admin can create new user with organization assignment via `POST /api/admin/users`
6. Admin can edit user role and organization via `PATCH /api/admin/users/:id`
7. Admin can deactivate/reactivate user account via `DELETE /api/admin/users/:id`
8. User table shows correct stat counts by organization
9. Bulk actions work (activate, deactivate, export)

---

### Phase 84: Admin User Detail

**Screen:** `src/app/[locale]/admin/users/[id]/page.tsx` (35 lines → `<UserActivityClient />`)

**Goal:** User detail với activity, permissions, assignment history

**Depends on:** Phase 83
**Requirements:** ADM-UDET-01 to ADM-UDET-06
**Plans:** TBD

**Data Flow:**

- API: `GET /api/admin/users/:id`, audit log for user, assignment history
- Seed: User profile, 20 audit events, 10 assignments
- UI: Detail page connected to real APIs
- Tests: Profile display, activity timeline, permissions, navigation

**Success Criteria:**

1. Admin sees user profile (name, email, role, org, workspace)
2. Activity timeline shows user's recent actions from audit log
3. Permissions panel shows user's effective permissions
4. Assignment history shows all assigned requests
5. Admin can navigate to related entities (org, workspace, requests)
6. User status (active/inactive) displays correctly

---

### Phase 85: Admin Requests List

**Screen:** `src/app/[locale]/admin/requests/page.tsx` (~300 lines, real API)

**Goal:** Admin Request Management với assign, status change, filters, search

**Depends on:** Phase 84
**Requirements:** ADM-REQ-01 to ADM-REQ-09
**Plans:** TBD

**Data Flow:**

- API: `GET /api/requests`, `PATCH /api/requests/:id`, `POST /api/requests/:id/workflow/transition`
- Seed: 50 requests với various statuses, types, priorities, assignees
- UI: Request table connected to real APIs với workflow transitions
- Tests: List, search, filter, assign, status change, navigation

**Success Criteria:**

1. Admin sees all requests with organization filtering via `GET /api/requests`
2. Admin can search requests by code via `?search=`
3. Admin can filter requests by status via `?status=`
4. Admin can filter requests by type via `?type=`
5. Admin can assign specialist or partner via `PATCH /api/requests/:id`
6. Admin can change request status via `POST /api/requests/:id/workflow/transition`
7. Request table shows priority badges and SLA bars
8. Pagination works with page size of 20
9. Click navigates to request detail page

---

### Phase 86: Admin Request Detail

**Screen:** `src/app/[locale]/admin/requests/[id]/page.tsx` (442 lines, real API)

**Goal:** Request detail với full info, SLA tracking, partner assignment, audit metadata

**Depends on:** Phase 85
**Requirements:** ADM-RDET-01 to ADM-RDET-07
**Plans:** TBD

**Data Flow:**

- API: `GET /api/requests/:id`, SLA calculation, partner info, audit metadata
- Seed: Request với full detail, SLA deadline, partner assignment, audit trail
- UI: Detail page connected to real APIs
- Tests: Hero section, SLA display, partner card, navigation, error handling

**Success Criteria:**

1. Detail page shows hero section (title, code, status badge, workspace)
2. Stat grid shows customer, workspace, created, updated dates
3. SLA card shows deadline with remaining/overdue calculation
4. Partner card shows assigned partner with engagement link
5. Admin can view audit metadata and correlation IDs
6. Navigation buttons work (back, view audit, export)
7. Error handling for 401/403/404 with retry

---

### Phase 87: Admin Partner List

**Screen:** `src/app/[locale]/admin/partner/page.tsx` (337 lines, real API)

**Goal:** Partner management với request list, status, customer info

**Depends on:** Phase 86
**Requirements:** ADM-PTR-01 to ADM-PTR-08
**Plans:** TBD

**Data Flow:**

- API: `GET /api/admin/partner/requests`, export endpoint
- Seed: 5 partners with engagements, 20 partner requests
- UI: Partner request table connected to real APIs
- Tests: List, search, filter, pagination, export, navigation

**Success Criteria:**

1. Admin sees partner request list via `GET /api/admin/partner/requests`
2. Stat grid shows total, in-progress, pending-review, completed counts
3. Search filters by partner name or request code
4. Status filter works
5. Table shows partner, request, customer, status, actions
6. Pagination works (10/25/50 page sizes)
7. Click navigates to partner detail page
8. Export functionality works

---

### Phase 88: Admin Partner Detail

**Screen:** `src/app/[locale]/admin/partner/[id]/page.tsx` (5 lines → `<PartnerActivityClient />`)

**Goal:** Partner detail với engagement info, request history

**Depends on:** Phase 87
**Requirements:** ADM-PDET-01 to ADM-PDET-05
**Plans:** TBD

**Data Flow:**

- API: `GET /api/admin/partner/:id`, engagement info, request history
- Seed: Partner với engagement, 10 requests, audit events
- UI: Detail page connected to real APIs
- Tests: Engagement display, request history, navigation, activity feed

**Success Criteria:**

1. Detail page shows partner engagement info
2. Request history shows all requests for this partner
3. Engagement scope and service types display
4. Admin can navigate to related entities
5. Activity feed shows partner-specific audit events

---

### Phase 89: Admin Organizations List

**Screen:** `src/app/[locale]/admin/organizations/page.tsx` (511 lines, real API)

**Goal:** Organization management với CRUD, business type, workspace counts

**Depends on:** Phase 88
**Requirements:** ADM-ORG-01 to ADM-ORG-08
**Plans:** TBD

**Data Flow:**

- API: `GET /api/admin/organizations`, `POST /api/admin/organizations`
- Seed: 3 organizations with various business types, workspace counts
- UI: Org table connected to real CRUD APIs
- Tests: List, search, create form, validation, pagination, navigation

**Success Criteria:**

1. Admin sees organization list via `GET /api/admin/organizations`
2. Stat grid shows total, active, inactive counts
3. Admin can create organization via `POST /api/admin/organizations` with form validation
4. Create form fields: name, businessType, registrationNumber, address, contactEmail
5. Search filters by name
6. Table shows org name, business type, workspaces, status
7. Pagination works (10/20/50 page sizes)
8. Click navigates to org detail page

---

### Phase 90: Admin Organization Detail

**Screen:** `src/app/[locale]/admin/organizations/[id]/page.tsx` (436 lines, heavy backend)

**Goal:** Org detail với workspaces, requests, partners, documents, members, audit

**Depends on:** Phase 89
**Requirements:** ADM-ODET-01 to ADM-ODET-08
**Plans:** TBD

**Data Flow:**

- API: Parallel Prisma queries for org detail (10+ queries)
- Seed: Org với 3 workspaces, 15 requests, 2 partners, 10 documents, 8 members, 15 audit events
- UI: Detail page with 8 panels connected to real APIs
- Tests: All panels, data accuracy, navigation, loading states

**Success Criteria:**

1. Detail page shows org info with parallel Prisma queries
2. Workspaces panel shows all org workspaces with per-workspace stats
3. Requests panel shows open, in-progress, SLA-at-risk counts
4. Partners panel shows engagements with partner names
5. Documents panel shows recent vault files
6. Members panel shows distinct users across workspaces
7. Audit feed shows 15 recent audit events
8. Recent requests panel shows 10 latest requests

---

### Phase 91: Admin Operations

**Screen:** `src/app/[locale]/admin/operations/page.tsx` (~300 lines)

**Goal:** Operations với workload monitoring, SLA tracking, audit timeline

**Depends on:** Phase 90
**Requirements:** ADM-OPS-01 to ADM-OPS-07
**Plans:** TBD

**Data Flow:**

- API: Operations aggregation, workload by specialist, SLA calculations
- Seed: 5 specialists with assignments, requests with SLA deadlines
- UI: Operations table with SLA bars connected to real APIs
- Tests: SLA calculations, color coding, filter by specialist, sort by SLA

**Success Criteria:**

1. Operations page shows stat cards (total requests, active, overdue, completed)
2. Workload panel shows specialist assignments with counts
3. Audit timeline shows recent operations
4. Operations table shows requests with SLA progress bars
5. SLA bars are color-coded (green: >50%, yellow: 20-50%, red: <20%)
6. Admin can filter by specialist via `?assignedTo=`
7. Admin can sort by SLA deadline via `?sort=slaDeadline&order=asc`

---

### Phase 92: Admin Audit

**Screen:** `src/app/[locale]/admin/audit/page.tsx` (~300 lines, real API)

**Goal:** Audit với security logs, search, filter, pagination, compliance reporting

**Depends on:** Phase 91
**Requirements:** ADM-AUD-01 to ADM-AUD-10
**Plans:** TBD

**Data Flow:**

- API: `GET /api/admin/audit?page=&search=&action=&from=&to=`
- Seed: 100 audit events (security, operations, access types)
- UI: Audit table connected to real API với search/filter/pagination
- Tests: Stat cards, search, filter, date range, pagination, monospace correlation IDs

**Success Criteria:**

1. Audit page shows 4 stat cards (total, security, operations, access)
2. Security notice explains safe display of sensitive data
3. Control alerts show security metrics (failed logins, permission denials)
4. Activity timeline shows recent events
5. Audit table shows 7 columns (timestamp, actor, action, target, type, IP, correlation)
6. Admin can search by actor or target via `?search=`
7. Admin can filter by action type via `?action=`
8. Admin can filter by date range via `?from=&to=`
9. Pagination works with page size of 50
10. Correlation IDs shown in monospace font

---

### Phase 93: Admin Vault

**Screen:** `src/app/[locale]/admin/vault/page.tsx` (~300 lines, real API)

**Goal:** Vault với file management, folders, tags, signed URLs

**Depends on:** Phase 92
**Requirements:** VAULT-01 to VAULT-12
**Plans:** TBD

**Data Flow:**

- API: `GET /api/vault`, `POST /api/vault/upload`, `GET /api/vault/:id/download`, folder/tag CRUD
- Seed: 20 vault files, 5 folders, 10 tags with counts
- UI: Vault table + folder tree + tag panel connected to real APIs
- Tests: File list, upload, download (signed URL), folder CRUD, tag CRUD, filters

**Success Criteria:**

1. Vault page shows stat cards (total files, folders, tags)
2. Folder panel shows folder tree via `GET /api/vault/folders`
3. Tag panel shows classification tags with counts
4. Vault table shows files via `GET /api/vault`
5. Admin can search files by name via `?search=`
6. Admin can filter by folder via `?folderId=`
7. Admin can filter by tag via `?tagId=`
8. Admin can upload new file via `POST /api/vault/upload`
9. Admin can download file via signed URL `GET /api/vault/:id/download`
10. Admin can create folder via `POST /api/vault/folders`
11. Admin can create tag via `POST /api/vault/:id/tags`
12. Security badges show encryption/permission status

---

### Phase 94: Admin Workspace

**Screen:** `src/app/[locale]/admin/workspace/page.tsx` (~250 lines, real API)

**Goal:** Admin Workspace Management với CRUD, member invites, role changes

**Depends on:** Phase 93
**Requirements:** ADM-WS-01 to ADM-WS-08
**Plans:** TBD

**Data Flow:**

- API: `GET /api/workspaces`, `POST /api/workspaces`, `POST /api/workspaces/:id/invite`, member CRUD
- Seed: 5 workspaces across 3 orgs, 15 members with various roles
- UI: Workspace table connected to real CRUD APIs
- Tests: List, search, create, invite member, change role, remove member, deactivate

**Success Criteria:**

1. Admin sees all workspaces with organization grouping via `GET /api/workspaces`
2. Admin can search workspaces by name via `?search=`
3. Admin can view workspace details via `GET /api/workspaces/:id`
4. Admin can create new workspace via `POST /api/workspaces`
5. Admin can invite member by email via `POST /api/workspaces/:id/invite`
6. Admin can change member role via `PATCH /api/workspaces/:id/members/:userId`
7. Admin can remove member via `DELETE /api/workspaces/:id/members/:userId`
8. Admin can deactivate workspace via `DELETE /api/workspaces/:id`

---

### Phase 95: Partner Dashboard

**Screen:** `src/app/[locale]/partner/dashboard/page.tsx` (61 lines, real backend from v2.1)

**Goal:** Partner Dashboard với assigned requests, member management, engagement stats — verify và hoàn thiện backend integration từ v2.1

**Depends on:** Phase 94
**Requirements:** P-DASH-01 to P-DASH-07
**Plans:** TBD

**Data Flow:**

- API: `GET /api/partner/requests`, `GET /api/partner/members` (existing from v2.1)
- Seed: Partner với 10 assigned requests, 3 members, engagement data
- UI: Dashboard connected to existing partner APIs — verify completeness
- Tests: Request list, stat accuracy, member panel, session validation

**Success Criteria:**

1. Partner sees assigned requests list from `GET /api/partner/requests`
2. Stat cards show correct counts (total, in-progress, pending-review, completed)
3. Member management panel shows partner members with roles via `GET /api/partner/members`
4. Engagement stats show active engagements and service scopes
5. Partner can view request details and navigate to case
6. Session validation redirects non-partner users to dashboard
7. Partner context (partnerName, memberCount) displays correctly

---

### Phase 96: Partner Settings

**Screen:** `src/app/[locale]/partner/settings/page.tsx` (51 lines, real backend from v2.1)

**Goal:** Partner Settings với organization profile, member roles, notification preferences — verify và hoàn thiện backend integration từ v2.1

**Depends on:** Phase 95
**Requirements:** P-SET-01 to P-SET-06
**Plans:** TBD

**Data Flow:**

- API: `PUT /api/partner/settings`, `POST /api/partner/invite` (existing from v2.1)
- Seed: Partner profile, member roles, notification preferences
- UI: Settings form connected to existing partner APIs — verify completeness
- Tests: Profile edit, member role management, invite, notification toggle

**Success Criteria:**

1. Partner can view organization profile (name, business type, contact info)
2. Partner can edit organization profile via `PUT /api/partner/settings`
3. Partner can manage member roles (admin, specialist, viewer)
4. Partner can invite new member via `POST /api/partner/invite`
5. Partner can toggle notification preferences
6. Settings form validates input and shows errors inline

---

## Progress

| Phase | Name | Screen | Status | Completed |
|-------|------|--------|--------|-----------|
| 73 | Shared Foundation | 4/4 | Complete   | 2026-06-20 |
| 74 | Sign-In | `[locale]/sign-in` | Complete   | 2026-06-20 |
| 75 | User Dashboard | 1/1 | Complete    | 2026-06-21 |
| 76 | Create Request | `[locale]/create` | Complete   | 2026-06-20 |
| 77 | My Cases | 1/1 | Complete    | 2026-06-21 |
| 78 | Messages | `[locale]/messages` | Not started | - |
| 79 | User Workspace | `[locale]/workspace` | Not started | - |
| 80 | User Settings | `[locale]/settings` | Not started | - |
| 81 | Invite Accept | `invite/[token]` | Not started | - |
| 82 | Admin Dashboard | `admin/dashboard` | Not started | - |
| 83 | Admin Users List | `admin/users` | Not started | - |
| 84 | Admin User Detail | `admin/users/[id]` | Not started | - |
| 85 | Admin Requests List | `admin/requests` | Not started | - |
| 86 | Admin Request Detail | `admin/requests/[id]` | Not started | - |
| 87 | Admin Partner List | `admin/partner` | Not started | - |
| 88 | Admin Partner Detail | `admin/partner/[id]` | Not started | - |
| 89 | Admin Orgs List | `admin/organizations` | Not started | - |
| 90 | Admin Org Detail | `admin/organizations/[id]` | Not started | - |
| 91 | Admin Operations | `admin/operations` | Not started | - |
| 92 | Admin Audit | `admin/audit` | Not started | - |
| 93 | Admin Vault | `admin/vault` | Not started | - |
| 94 | Admin Workspace | `admin/workspace` | Not started | - |
| 95 | Partner Dashboard | `partner/dashboard` | Not started | - |
| 96 | Partner Settings | `partner/settings` | Not started | - |

---

_Last updated: 2026-06-20 after Phase 76 completion — 24 phases (73-96), 4 completed, data-first approach_
