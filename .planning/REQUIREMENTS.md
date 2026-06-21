# Requirements: GitNexus Legal — v2.2 Legacy UI Enhancement

**Defined:** 2026-06-19
**Milestone:** v2.2 Legacy UI Enhancement — Specification-first backend integration for existing UI
**Core Value:** SME gửi yêu cầu pháp lý đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.
**Total Screens:** 21 UI files → 21 Phases (73-93)

---

## Testing Requirements

### Per-Feature Test Coverage

Mỗi phase phải có đầy đủ test coverage:

| Test Type | Description | Coverage Target |
|-----------|-------------|----------------|
| **Whitebox** | Unit tests cho services, repositories, utilities | ≥80% line coverage |
| **Blackbox** | Integration tests cho API endpoints, database queries | ≥90% endpoint coverage |
| **Abnormal** | Edge cases, boundary conditions, empty states | All user flows covered |
| **Error** | Error boundaries, fallback logic, retry logic | All error paths covered |
| **E2E** | Full user flows từ UI → API → DB → Response | All critical paths |

### Data Rules

**Strict DB-only data:**

- ✅ Tất cả sample data phải insert vào SQLite qua Prisma seed scripts
- ✅ Hiển thị từ database queries
- ❌ Không hardcode bất kỳ giá trị nào trong components
- ❌ Không mock data trong components (chỉ mock trong unit tests nếu cần)

### Specification-First Approach

Mỗi phase phải tuân thủ methodology từ `docs/requirement.md`:

1. **System Discovery** — Phân tích existing code (services, APIs, permissions, workflows)
2. **UI Analysis** — Phân tích mockup screens (components, tables, forms, filters, actions)
3. **Gap Analysis** — So sánh existing vs new UI (reusable, missing, deprecated, changed)
4. **Target System Design** — Functional spec, domain model, permissions, workflows
5. **API Design** — Endpoint spec theo `src/docs/API_STANDARDS.md`
6. **Frontend Architecture** — Component strategy theo `src/docs/DOMAIN_STRUCTURE.md`
7. **Implementation Plan** — Epic → Feature → Task
8. **Implementation** — DB → Backend → API → Frontend → Tests

### Architectural Constraints

Mỗi phase phải tuân thủ nghiêm ngặt 9 tài liệu trong `src/docs/`:

| Document | Key Rule |
|----------|----------|
| `DOMAIN_STRUCTURE.md` | Folder organization, component granularity (4 levels) |
| `API_STANDARDS.md` | Response envelope, HTTP status codes, pagination |
| `API_REGISTRY.md` | Central catalog — check trước khi tạo endpoint mới |
| `SERVICE_LAYER.md` | Business logic trong services, không trong components |
| `CODE_STANDARDS.md` | Naming, import order, TypeScript conventions |
| `I18N_RULES.md` | Component-first i18n, next-intl, decision matrix |
| `FORM_DEFINITION.md` | Dynamic forms, FormRenderer, validation flow |
| `WORKFLOW_DEFINITION.md` | State machine, transitions, role-based permissions |
| `TEMPLATE_ENGINE.md` | {{variable}} syntax, render API, versioning |

---

## Phase-to-Screen Mapping

| Phase | Screen | Route | Lines | Integration |
|-------|--------|-------|-------|-------------|
| 73 | Sign-In | `[locale]/sign-in/page.tsx` | 17 | 🟡 Thin wrapper → `<SignInForm />` |
| 74 | User Dashboard | `[locale]/dashboard/page.tsx` | ~200 | 🟡 Mixed — server + client components |
| 75 | Create Request | `[locale]/create/page.tsx` | ~300 | 🟡 Mixed — draft save partially real |
| 76 | My Cases | `[locale]/cases/page.tsx` | ~250 | 🟡 Mixed — table partially real |
| 77 | Messages | `[locale]/messages/page.tsx` | ~300 | 🟡 Mixed — chat partially real |
| 78 | User Workspace | `[locale]/workspace/page.tsx` | ~200 | 🟡 Mixed |
| 79 | User Settings | `[locale]/settings/page.tsx` | ~200 | 🟡 Mixed |
| 80 | Invite Accept | `invite/[token]/page.tsx` | 215 | 🟠 Mixed — accept real, validation mocked |
| 81 | Admin Dashboard | `[locale]/admin/dashboard/page.tsx` | ~400 | 🟡 Mixed |
| 82 | Admin Users List | `[locale]/admin/users/page.tsx` | ~350 | 🔴 Real API |
| 83 | Admin User Detail | `[locale]/admin/users/[id]/page.tsx` | 35 | 🔴 Real backend |
| 84 | Admin Requests List | `[locale]/admin/requests/page.tsx` | ~300 | 🔴 Real API |
| 85 | Admin Request Detail | `[locale]/admin/requests/[id]/page.tsx` | 442 | 🔴 Real API |
| 86 | Admin Partner List | `[locale]/admin/partner/page.tsx` | 337 | 🔴 Real API |
| 87 | Admin Partner Detail | `[locale]/admin/partner/[id]/page.tsx` | 5 | 🟡 Thin wrapper |
| 88 | Admin Orgs List | `[locale]/admin/organizations/page.tsx` | 511 | 🔴 Real API (GET + POST) |
| 89 | Admin Org Detail | `[locale]/admin/organizations/[id]/page.tsx` | 436 | 🔴 Heavy backend (10+ Prisma) |
| 90 | Admin Operations | `[locale]/admin/operations/page.tsx` | ~300 | 🟡 Mixed |
| 91 | Admin Audit | `[locale]/admin/audit/page.tsx` | ~300 | 🔴 Real API |
| 92 | Admin Vault | `[locale]/admin/vault/page.tsx` | ~300 | 🔴 Real API |
| 93 | Admin Workspace | `[locale]/admin/workspace/page.tsx` | ~250 | 🔴 Real API |

---

## USER PAGES (Phases 73-80)

---

## Sign-In (Phase 73)

**Screen:** `src/app/[locale]/sign-in/page.tsx` (17 lines, thin wrapper → `<SignInForm />`)

**Goal:** Sign-in form với authentication, error handling, redirect sau login

- [ ] **AUTH-01**: Sign-in form displays email and password fields with validation
- [ ] **AUTH-02**: User can sign in via `POST /api/auth/sign-in` with email/password
- [ ] **AUTH-03**: Error message displays for invalid credentials
- [ ] **AUTH-04**: Redirect to dashboard after successful login based on role
- [ ] **AUTH-05**: Form validates email format and password length inline
- [ ] **AUTH-06**: Locale prefix preserved after redirect (`/vi/dashboard`, `/en/dashboard`)

---

## User Dashboard (Phase 74)

**Screen:** `src/app/[locale]/dashboard/page.tsx` (~200 lines, server + client)

**Goal:** User Dashboard với real data từ database, 6 panels, clickable stats

- [x] **U-DASH-01**: Dashboard shows 4 stat cards with real counts from Prisma (total, in-progress, completed, overdue)
- [ ] **U-DASH-02**: Welcome banner shows user name, organization and workspace
- [ ] **U-DASH-03**: Recent cases panel shows 5 most recent cases via `GET /api/requests?pageSize=5`
- [ ] **U-DASH-04**: Deadline/SLA panel shows upcoming deadlines with color-coded progress bars
- [ ] **U-DASH-05**: Recent documents panel shows latest vault files via `GET /api/vault?pageSize=5`
- [ ] **U-DASH-06**: Activity timeline shows recent actions from audit log via `GET /api/audit?actorId=me`
- [ ] **U-DASH-07**: Floating chat button shows unread message count
- [x] **U-DASH-08**: Clicking stat cards navigates to relevant page (cases, create, etc.)

---

## Create Request (Phase 75)

**Screen:** `src/app/[locale]/create/page.tsx` (~300 lines)

**Goal:** Create Request wizard 4 bước — chọn service type, trả lời câu hỏi, upload tài liệu, xác nhận

- [ ] **CREQ-01**: User sees summary banner with available service types from `GET /api/intake/forms`
- [ ] **CREQ-02**: Service cards display with descriptions and tags
- [ ] **CREQ-03**: Wizard shows 4-step progress indicator
- [ ] **CREQ-04**: User can answer intake questions based on service type (FormDefinition engine)
- [ ] **CREQ-05**: User can upload documents with progress via `POST /api/requests/:id/documents`
- [ ] **CREQ-06**: User can review answers before submit
- [ ] **CREQ-07**: User can submit and see confirmation via `POST /api/intake/submit`
- [ ] **CREQ-08**: Request appears in My Cases after submit
- [ ] **CREQ-09**: Priority selection works (low, medium, high, urgent)
- [ ] **CREQ-10**: Contact info pre-filled from user profile
- [ ] **CREQ-11**: Draft save works — user can save and return later

---

## My Cases (Phase 76)

**Screen:** `src/app/[locale]/cases/page.tsx` (~250 lines)

**Goal:** My Cases với case list, search, filter, pagination, detail navigation

- [ ] **MYCASE-01**: Summary banner shows total cases count from `GET /api/requests`
- [ ] **MYCASE-02**: Stat cards show correct counts (Tổng, Đang xử lý, Hoàn tất, Quá hạn)
- [ ] **MYCASE-03**: Search filters cases by code or type via `?search=`
- [ ] **MYCASE-04**: Status filter works via `?status=`
- [ ] **MYCASE-05**: Type filter works via `?type=`
- [ ] **MYCASE-06**: Table shows 7 columns (code, type, status, priority, assignee, SLA, actions)
- [ ] **MYCASE-07**: Clicking case navigates to detail page
- [ ] **MYCASE-08**: Pagination works with page size of 10
- [ ] **MYCASE-09**: Empty state shows when no cases match filter

---

## Messages (Phase 77)

**Screen:** `src/app/[locale]/messages/page.tsx` (~300 lines)

**Goal:** Messages với 3-column layout, thread list, chat, info panel

- [ ] **MSG-01**: Messages page shows 3-column layout (threads, chat, info)
- [ ] **MSG-02**: Thread list shows all message threads via `GET /api/messages?requestId=`
- [ ] **MSG-03**: User can select thread to view messages via `GET /api/messages/:threadId`
- [ ] **MSG-04**: Chat panel shows message history with timestamps
- [ ] **MSG-05**: User can send new message via `POST /api/messages/send`
- [ ] **MSG-06**: Info panel shows request metadata (status, assignee, SLA)
- [ ] **MSG-07**: Unread message count badge shows on thread via `PUT /api/messages/:id/read`
- [ ] **MSG-08**: User can close info panel

---

## User Workspace (Phase 78)

**Screen:** `src/app/[locale]/workspace/page.tsx` (~200 lines)

**Goal:** User workspace với members, stats, resources, collaboration

- [ ] **UWS-01**: Workspace page shows workspace info (name, organization, settings)
- [ ] **UWS-02**: Members panel shows all workspace members with roles via `GET /api/workspaces/:id/members`
- [ ] **UWS-03**: Stats panel shows workspace metrics (cases, documents, members)
- [ ] **UWS-04**: Resources panel shows recent vault files
- [ ] **UWS-05**: User can view own role and permissions in workspace
- [ ] **UWS-06**: Activity feed shows recent workspace actions

---

## User Settings (Phase 79)

**Screen:** `src/app/[locale]/settings/page.tsx` (~200 lines)

**Goal:** User settings với profile, password, notifications, language preferences

- [ ] **SET-01**: User can view and edit profile (name, email, phone, title) via `PUT /api/settings/profile`
- [ ] **SET-02**: User can change password with current password verification via `PUT /api/settings/password`
- [ ] **SET-03**: User can toggle notifications (emailOnReply, slaReminder, weeklySummary) via `PUT /api/settings/notifications`
- [ ] **SET-04**: User can change language preference (VI/EN/ZH/JA) with cookie persistence
- [ ] **SET-05**: User can view own audit log entries via `GET /api/settings/audit?page=`
- [ ] **SET-06**: Settings form validates input and shows errors inline per `src/docs/CODE_STANDARDS.md`

---

## Invite Accept (Phase 80)

**Screen:** `src/app/invite/[token]/page.tsx` (215 lines, mixed)

**Goal:** Partner/team member invite acceptance với token validation, role display

- [ ] **INV-01**: Invite page validates token via `GET /api/partner/invite/:token` on load
- [ ] **INV-02**: Page shows invite info (email, role, partner/org name) from real API
- [ ] **INV-03**: Role-based UI shows different permissions for admin/specialist/viewer
- [ ] **INV-04**: User can accept invite via `POST /api/partner/invite/accept` with token
- [ ] **INV-05**: Success state shows after accept with redirect option
- [ ] **INV-06**: Error state shows for expired/invalid tokens
- [ ] **INV-07**: Unauthenticated users redirect to login then back to invite

---

## ADMIN PAGES (Phases 81-93)

---

## Admin Dashboard (Phase 81)

**Screen:** `src/app/[locale]/admin/dashboard/page.tsx` (~400 lines)

**Goal:** Admin Dashboard với stats, workload, alerts, audit timeline, clickable navigation

- [ ] **ADM-DASH-01**: Admin sees 4 stat cards with real counts by organization
- [ ] **ADM-DASH-02**: Workload panel shows specialist workloads from assignments
- [ ] **ADM-DASH-03**: Alert panel shows system alerts (SLA breaches, pending reviews)
- [ ] **ADM-DASH-04**: Organization panel shows summary (total orgs, workspaces, users)
- [ ] **ADM-DASH-05**: Approval panel shows pending approvals from workflow
- [ ] **ADM-DASH-06**: Audit timeline shows recent audit events from `GET /api/admin/audit`
- [ ] **ADM-DASH-07**: Clicking stat cards navigates to relevant admin pages
- [ ] **ADM-DASH-08**: Floating chat shows alert count

---

## Admin Users List (Phase 82)

**Screen:** `src/app/[locale]/admin/users/page.tsx` (~350 lines, real API)

**Goal:** Admin user management với organization filtering, CRUD, role changes, search

- [ ] **ADM-USER-01**: Admin sees paginated list of all users via `GET /api/admin/users?page=&pageSize=`
- [ ] **ADM-USER-02**: Admin can search users by name/email via `?search=`
- [ ] **ADM-USER-03**: Admin can filter users by role via `?role=`
- [ ] **ADM-USER-04**: Admin can filter users by organization via `?organizationId=`
- [ ] **ADM-USER-05**: Admin can create new user with organization assignment via `POST /api/admin/users`
- [ ] **ADM-USER-06**: Admin can edit user role and organization via `PATCH /api/admin/users/:id`
- [ ] **ADM-USER-07**: Admin can deactivate/reactivate user account via `DELETE /api/admin/users/:id`
- [ ] **ADM-USER-08**: User table shows correct stat counts by organization
- [ ] **ADM-USER-09**: Bulk actions work (activate, deactivate, export)

---

## Admin User Detail (Phase 83)

**Screen:** `src/app/[locale]/admin/users/[id]/page.tsx` (35 lines → `<UserActivityClient />`)

**Goal:** User detail với activity, permissions, assignment history

- [ ] **ADM-UDET-01**: Admin sees user profile (name, email, role, org, workspace)
- [ ] **ADM-UDET-02**: Activity timeline shows user's recent actions from audit log
- [ ] **ADM-UDET-03**: Permissions panel shows user's effective permissions
- [ ] **ADM-UDET-04**: Assignment history shows all assigned requests
- [ ] **ADM-UDET-05**: Admin can navigate to related entities (org, workspace, requests)
- [ ] **ADM-UDET-06**: User status (active/inactive) displays correctly

---

## Admin Requests List (Phase 84)

**Screen:** `src/app/[locale]/admin/requests/page.tsx` (~300 lines, real API)

**Goal:** Admin Request Management với assign, status change, filters, search

- [ ] **ADM-REQ-01**: Admin sees all requests with organization filtering via `GET /api/requests`
- [ ] **ADM-REQ-02**: Admin can search requests by code via `?search=`
- [ ] **ADM-REQ-03**: Admin can filter requests by status via `?status=`
- [ ] **ADM-REQ-04**: Admin can filter requests by type via `?type=`
- [ ] **ADM-REQ-05**: Admin can assign specialist or partner via `PATCH /api/requests/:id`
- [ ] **ADM-REQ-06**: Admin can change request status via `POST /api/requests/:id/workflow/transition`
- [ ] **ADM-REQ-07**: Request table shows priority badges and SLA bars
- [ ] **ADM-REQ-08**: Pagination works with page size of 20
- [ ] **ADM-REQ-09**: Click navigates to request detail page

---

## Admin Request Detail (Phase 85)

**Screen:** `src/app/[locale]/admin/requests/[id]/page.tsx` (442 lines, real API)

**Goal:** Request detail với full info, SLA tracking, partner assignment, audit metadata

- [ ] **ADM-RDET-01**: Detail page shows hero section (title, code, status badge, workspace)
- [ ] **ADM-RDET-02**: Stat grid shows customer, workspace, created, updated dates
- [ ] **ADM-RDET-03**: SLA card shows deadline with remaining/overdue calculation
- [ ] **ADM-RDET-04**: Partner card shows assigned partner with engagement link
- [ ] **ADM-RDET-05**: Admin can view audit metadata and correlation IDs
- [ ] **ADM-RDET-06**: Navigation buttons work (back, view audit, export)
- [ ] **ADM-RDET-07**: Error handling for 401/403/404 with retry

---

## Admin Partner List (Phase 86)

**Screen:** `src/app/[locale]/admin/partner/page.tsx` (337 lines, real API)

**Goal:** Partner management với request list, status, customer info

- [ ] **ADM-PTR-01**: Admin sees partner request list via `GET /api/admin/partner/requests`
- [ ] **ADM-PTR-02**: Stat grid shows total, in-progress, pending-review, completed counts
- [ ] **ADM-PTR-03**: Search filters by partner name or request code
- [ ] **ADM-PTR-04**: Status filter works
- [ ] **ADM-PTR-05**: Table shows partner, request, customer, status, actions
- [ ] **ADM-PTR-06**: Pagination works (10/25/50 page sizes)
- [ ] **ADM-PTR-07**: Click navigates to partner detail page
- [ ] **ADM-PTR-08**: Export functionality works

---

## Admin Partner Detail (Phase 87)

**Screen:** `src/app/[locale]/admin/partner/[id]/page.tsx` (5 lines → `<PartnerActivityClient />`)

**Goal:** Partner detail với engagement info, request history

- [ ] **ADM-PDET-01**: Detail page shows partner engagement info
- [ ] **ADM-PDET-02**: Request history shows all requests for this partner
- [ ] **ADM-PDET-03**: Engagement scope and service types display
- [ ] **ADM-PDET-04**: Admin can navigate to related entities
- [ ] **ADM-PDET-05**: Activity feed shows partner-specific audit events

---

## Admin Organizations List (Phase 88)

**Screen:** `src/app/[locale]/admin/organizations/page.tsx` (511 lines, real API)

**Goal:** Organization management với CRUD, business type, workspace counts

- [ ] **ADM-ORG-01**: Admin sees organization list via `GET /api/admin/organizations`
- [ ] **ADM-ORG-02**: Stat grid shows total, active, inactive counts
- [ ] **ADM-ORG-03**: Admin can create organization via `POST /api/admin/organizations` with form validation
- [ ] **ADM-ORG-04**: Create form fields: name, businessType, registrationNumber, address, contactEmail
- [ ] **ADM-ORG-05**: Search filters by name
- [ ] **ADM-ORG-06**: Table shows org name, business type, workspaces, status
- [ ] **ADM-ORG-07**: Pagination works (10/20/50 page sizes)
- [ ] **ADM-ORG-08**: Click navigates to org detail page

---

## Admin Organization Detail (Phase 89)

**Screen:** `src/app/[locale]/admin/organizations/[id]/page.tsx` (436 lines, heavy backend)

**Goal:** Org detail với workspaces, requests, partners, documents, members, audit

- [ ] **ADM-ODET-01**: Detail page shows org info with parallel Prisma queries
- [ ] **ADM-ODET-02**: Workspaces panel shows all org workspaces with per-workspace stats
- [ ] **ADM-ODET-03**: Requests panel shows open, in-progress, SLA-at-risk counts
- [ ] **ADM-ODET-04**: Partners panel shows engagements with partner names
- [ ] **ADM-ODET-05**: Documents panel shows recent vault files
- [ ] **ADM-ODET-06**: Members panel shows distinct users across workspaces
- [ ] **ADM-ODET-07**: Audit feed shows 15 recent audit events
- [ ] **ADM-ODET-08**: Recent requests panel shows 10 latest requests

---

## Admin Operations (Phase 90)

**Screen:** `src/app/[locale]/admin/operations/page.tsx` (~300 lines)

**Goal:** Operations với workload monitoring, SLA tracking, audit timeline

- [ ] **ADM-OPS-01**: Operations page shows stat cards (total requests, active, overdue, completed)
- [ ] **ADM-OPS-02**: Workload panel shows specialist assignments with counts
- [ ] **ADM-OPS-03**: Audit timeline shows recent operations
- [ ] **ADM-OPS-04**: Operations table shows requests with SLA progress bars
- [ ] **ADM-OPS-05**: SLA bars are color-coded (green: >50%, yellow: 20-50%, red: <20%)
- [ ] **ADM-OPS-06**: Admin can filter by specialist via `?assignedTo=`
- [ ] **ADM-OPS-07**: Admin can sort by SLA deadline via `?sort=slaDeadline&order=asc`

---

## Admin Audit (Phase 91)

**Screen:** `src/app/[locale]/admin/audit/page.tsx` (~300 lines, real API)

**Goal:** Audit với security logs, search, filter, pagination, compliance reporting

- [ ] **ADM-AUD-01**: Audit page shows 4 stat cards (total, security, operations, access)
- [ ] **ADM-AUD-02**: Security notice explains safe display of sensitive data
- [ ] **ADM-AUD-03**: Control alerts show security metrics (failed logins, permission denials)
- [ ] **ADM-AUD-04**: Activity timeline shows recent events
- [ ] **ADM-AUD-05**: Audit table shows 7 columns (timestamp, actor, action, target, type, IP, correlation)
- [ ] **ADM-AUD-06**: Admin can search by actor or target via `?search=`
- [ ] **ADM-AUD-07**: Admin can filter by action type via `?action=`
- [ ] **ADM-AUD-08**: Admin can filter by date range via `?from=&to=`
- [ ] **ADM-AUD-09**: Pagination works with page size of 50
- [ ] **ADM-AUD-10**: Correlation IDs shown in monospace font

---

## Admin Vault (Phase 92)

**Screen:** `src/app/[locale]/admin/vault/page.tsx` (~300 lines, real API)

**Goal:** Vault với file management, folders, tags, signed URLs

- [ ] **VAULT-01**: Vault page shows stat cards (total files, folders, tags)
- [ ] **VAULT-02**: Folder panel shows folder tree via `GET /api/vault/folders`
- [ ] **VAULT-03**: Tag panel shows classification tags with counts
- [ ] **VAULT-04**: Vault table shows files via `GET /api/vault`
- [ ] **VAULT-05**: Admin can search files by name via `?search=`
- [ ] **VAULT-06**: Admin can filter by folder via `?folderId=`
- [ ] **VAULT-07**: Admin can filter by tag via `?tagId=`
- [ ] **VAULT-08**: Admin can upload new file via `POST /api/vault/upload`
- [ ] **VAULT-09**: Admin can download file via signed URL `GET /api/vault/:id/download`
- [ ] **VAULT-10**: Admin can create folder via `POST /api/vault/folders`
- [ ] **VAULT-11**: Admin can create tag via `POST /api/vault/:id/tags`
- [ ] **VAULT-12**: Security badges show encryption/permission status

---

## Admin Workspace (Phase 93)

**Screen:** `src/app/[locale]/admin/workspace/page.tsx` (~250 lines, real API)

**Goal:** Admin Workspace Management với CRUD, member invites, role changes

- [ ] **ADM-WS-01**: Admin sees all workspaces with organization grouping via `GET /api/workspaces`
- [ ] **ADM-WS-02**: Admin can search workspaces by name via `?search=`
- [ ] **ADM-WS-03**: Admin can view workspace details via `GET /api/workspaces/:id`
- [ ] **ADM-WS-04**: Admin can create new workspace via `POST /api/workspaces`
- [ ] **ADM-WS-05**: Admin can invite member by email via `POST /api/workspaces/:id/invite`
- [ ] **ADM-WS-06**: Admin can change member role via `PATCH /api/workspaces/:id/members/:userId`
- [ ] **ADM-WS-07**: Admin can remove member via `DELETE /api/workspaces/:id/members/:userId`
- [ ] **ADM-WS-08**: Admin can deactivate workspace via `DELETE /api/workspaces/:id`

---

## PARTNER PAGES (Phases 94-95)

---

## Partner Dashboard (Phase 94)

**Screen:** `src/app/[locale]/partner/dashboard/page.tsx` (61 lines, real backend from v2.1)

**Goal:** Partner Dashboard với assigned requests, member management, engagement stats — verify và hoàn thiện backend integration từ v2.1

- [ ] **P-DASH-01**: Partner sees assigned requests list from `GET /api/partner/requests`
- [ ] **P-DASH-02**: Stat cards show correct counts (total, in-progress, pending-review, completed)
- [ ] **P-DASH-03**: Member management panel shows partner members with roles via `GET /api/partner/members`
- [ ] **P-DASH-04**: Engagement stats show active engagements and service scopes
- [ ] **P-DASH-05**: Partner can view request details and navigate to case
- [ ] **P-DASH-06**: Session validation redirects non-partner users to dashboard
- [ ] **P-DASH-07**: Partner context (partnerName, memberCount) displays correctly

---

## Partner Settings (Phase 95)

**Screen:** `src/app/[locale]/partner/settings/page.tsx` (51 lines, real backend from v2.1)

**Goal:** Partner Settings với organization profile, member roles, notification preferences — verify và hoàn thiện backend integration từ v2.1

- [ ] **P-SET-01**: Partner can view organization profile (name, business type, contact info)
- [ ] **P-SET-02**: Partner can edit organization profile via `PUT /api/partner/settings`
- [ ] **P-SET-03**: Partner can manage member roles (admin, specialist, viewer)
- [ ] **P-SET-04**: Partner can invite new member via `POST /api/partner/invite`
- [ ] **P-SET-05**: Partner can toggle notification preferences
- [ ] **P-SET-06**: Settings form validates input and shows errors inline

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI tự kết luận pháp lý | Rủi ro sai luật; defer to v2.3 |
| Open lawyer marketplace | Khó kiểm soát chất lượng; defer to future |
| Workflow builder tùy biến | Overbuild cho MVP; dùng state machine cố định |
| Template inheritance (Global → Customer → Partner) | Complex scope; defer to v2.3 |
| AI-agent automation readiness | API/schema design supports it but AI features defer to v2.3 |
| Partner Dashboard/Settings full rebuild | Already implemented real backend in v2.1; v2.2 chỉ verify và hoàn thiện |

---

## Traceability

| Requirement | Phase | Screen | Status |
|-------------|-------|--------|--------|
| AUTH-01 to AUTH-06 | Phase 73 | Sign-In | Pending |
| U-DASH-01 to U-DASH-08 | Phase 74 | User Dashboard | Pending |
| CREQ-01 to CREQ-11 | Phase 75 | Create Request | Pending |
| MYCASE-01 to MYCASE-09 | Phase 76 | My Cases | Pending |
| MSG-01 to MSG-08 | Phase 77 | Messages | Pending |
| UWS-01 to UWS-06 | Phase 78 | User Workspace | Pending |
| SET-01 to SET-06 | Phase 79 | User Settings | Pending |
| INV-01 to INV-07 | Phase 80 | Invite Accept | Pending |
| ADM-DASH-01 to ADM-DASH-08 | Phase 81 | Admin Dashboard | Pending |
| ADM-USER-01 to ADM-USER-09 | Phase 82 | Admin Users List | Pending |
| ADM-UDET-01 to ADM-UDET-06 | Phase 83 | Admin User Detail | Pending |
| ADM-REQ-01 to ADM-REQ-09 | Phase 84 | Admin Requests List | Pending |
| ADM-RDET-01 to ADM-RDET-07 | Phase 85 | Admin Request Detail | Pending |
| ADM-PTR-01 to ADM-PTR-08 | Phase 86 | Admin Partner List | Pending |
| ADM-PDET-01 to ADM-PDET-05 | Phase 87 | Admin Partner Detail | Pending |
| ADM-ORG-01 to ADM-ORG-08 | Phase 88 | Admin Orgs List | Pending |
| ADM-ODET-01 to ADM-ODET-08 | Phase 89 | Admin Org Detail | Pending |
| ADM-OPS-01 to ADM-OPS-07 | Phase 90 | Admin Operations | Pending |
| ADM-AUD-01 to ADM-AUD-10 | Phase 91 | Admin Audit | Pending |
| VAULT-01 to VAULT-12 | Phase 92 | Admin Vault | Pending |
| ADM-WS-01 to ADM-WS-08 | Phase 93 | Admin Workspace | Pending |
| P-DASH-01 to P-DASH-07 | Phase 94 | Partner Dashboard | Pending |
| P-SET-01 to P-SET-06 | Phase 95 | Partner Settings | Pending |

**Coverage:**

- v2.2 requirements: 173 total
- Mapped to phases: 23 (73-95)
- Mapped to screens: 23 UI files
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-19*
*Last updated: 2026-06-19 during v2.2 milestone — expanded to 23 phases (73-95) with partner pages*
