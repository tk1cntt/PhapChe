# Requirements: GitNexus Legal — v2.2 Legacy UI Enhancement

**Defined:** 2026-06-19
**Milestone:** v2.2 Legacy UI Enhancement — Specification-first backend integration for existing UI
**Core Value:** SME gửi yêu cầu pháp lý đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

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

## User Settings (Phase 73)

**Goal:** User settings với profile, password, notifications, language preferences, audit log

**Specification outputs:**
- `docs/discovery/73-settings-discovery.md` — Existing settings APIs, permissions, data entities
- `docs/ui/73-settings-screen-analysis.md` — All settings screens analyzed
- `docs/analysis/73-settings-gap-analysis.md` — Reusable vs missing vs changed
- `docs/design/73-settings-functional-spec.md` — Actions, validation, workflow, permissions

- [ ] **SET-01**: User can view and edit profile (name, email, phone, title) via `PUT /api/settings/profile`
- [ ] **SET-02**: User can change password with current password verification via `PUT /api/settings/password`
- [ ] **SET-03**: User can toggle notifications (emailOnReply, slaReminder, weeklySummary) via `PUT /api/settings/notifications`
- [ ] **SET-04**: User can change language preference (VI/EN/ZH/JA) with cookie persistence
- [ ] **SET-05**: User can view own audit log entries via `GET /api/settings/audit?page=`
- [ ] **SET-06**: Settings form validates input and shows errors inline per `src/docs/CODE_STANDARDS.md`

---

## Admin User Management (Phase 74)

**Goal:** Admin user management với organization filtering, CRUD, role changes

**Specification outputs:**
- `docs/discovery/74-user-mgmt-discovery.md`
- `docs/ui/74-user-mgmt-screen-analysis.md`
- `docs/analysis/74-user-mgmt-gap-analysis.md`
- `docs/design/74-user-mgmt-functional-spec.md`

- [ ] **ADM-USER-01**: Admin sees paginated list of all users via `GET /api/admin/users?page=&pageSize=`
- [ ] **ADM-USER-02**: Admin can search users by name/email via `?search=`
- [ ] **ADM-USER-03**: Admin can filter users by role via `?role=`
- [ ] **ADM-USER-04**: Admin can filter users by organization via `?organizationId=`
- [ ] **ADM-USER-05**: Admin can view user details with organization context via `GET /api/admin/users/:id`
- [ ] **ADM-USER-06**: Admin can create new user with organization assignment via `POST /api/admin/users`
- [ ] **ADM-USER-07**: Admin can edit user role and organization via `PATCH /api/admin/users/:id`
- [ ] **ADM-USER-08**: Admin can deactivate/reactivate user account via `DELETE /api/admin/users/:id`
- [ ] **ADM-USER-09**: User table shows correct stat counts by organization

---

## Create Request Wizard (Phase 75)

**Goal:** Create Request wizard 4 bước — chọn service type, trả lời câu hỏi, upload tài liệu, xác nhận

**Specification outputs:**
- `docs/discovery/75-create-request-discovery.md`
- `docs/ui/75-create-request-screen-analysis.md`
- `docs/analysis/75-create-request-gap-analysis.md`
- `docs/design/75-create-request-functional-spec.md`

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

---

## My Cases (Phase 76)

**Goal:** My Cases với case list, search, filter, pagination

**Specification outputs:**
- `docs/discovery/76-my-cases-discovery.md`
- `docs/ui/76-my-cases-screen-analysis.md`
- `docs/analysis/76-my-cases-gap-analysis.md`
- `docs/design/76-my-cases-functional-spec.md`

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

## User Dashboard (Phase 77)

**Goal:** User Dashboard với real data, 6 panels, clickable stats

**Specification outputs:**
- `docs/discovery/77-user-dashboard-discovery.md`
- `docs/ui/77-user-dashboard-screen-analysis.md`
- `docs/analysis/77-user-dashboard-gap-analysis.md`
- `docs/design/77-user-dashboard-functional-spec.md`

- [ ] **U-DASH-01**: Dashboard shows 4 stat cards with real counts from Prisma
- [ ] **U-DASH-02**: Welcome banner shows organization and workspace name
- [ ] **U-DASH-03**: Recent cases panel shows 5 most recent cases
- [ ] **U-DASH-04**: Deadline/SLA panel shows upcoming deadlines with color-coded progress
- [ ] **U-DASH-05**: Recent documents panel shows latest vault files
- [ ] **U-DASH-06**: Activity timeline shows recent actions from audit log
- [ ] **U-DASH-07**: Floating chat button shows unread message count
- [ ] **U-DASH-08**: Clicking stat cards navigates to relevant page

---

## Admin Request Management (Phase 78)

**Goal:** Admin Request Management với assign, status change, filters

**Specification outputs:**
- `docs/discovery/78-request-mgmt-discovery.md`
- `docs/ui/78-request-mgmt-screen-analysis.md`
- `docs/analysis/78-request-mgmt-gap-analysis.md`
- `docs/design/78-request-mgmt-functional-spec.md`

- [ ] **ADM-REQ-01**: Admin sees all requests with organization filtering via `GET /api/requests`
- [ ] **ADM-REQ-02**: Admin can search requests by code via `?search=`
- [ ] **ADM-REQ-03**: Admin can filter requests by status via `?status=`
- [ ] **ADM-REQ-04**: Admin can filter requests by type via `?type=`
- [ ] **ADM-REQ-05**: Admin can assign specialist or partner via `PATCH /api/requests/:id`
- [ ] **ADM-REQ-06**: Admin can change request status via workflow transition `POST /api/requests/:id/workflow/transition`
- [ ] **ADM-REQ-07**: Admin can view request details
- [ ] **ADM-REQ-08**: Request table shows priority badges
- [ ] **ADM-REQ-09**: Pagination works with page size of 20

---

## Admin Dashboard (Phase 79)

**Goal:** Admin Dashboard với stats, workload, alerts, audit timeline

**Specification outputs:**
- `docs/discovery/79-admin-dashboard-discovery.md`
- `docs/ui/79-admin-dashboard-screen-analysis.md`
- `docs/analysis/79-admin-dashboard-gap-analysis.md`
- `docs/design/79-admin-dashboard-functional-spec.md`

- [ ] **ADM-DASH-01**: Admin sees 4 stat cards with real counts by organization
- [ ] **ADM-DASH-02**: Workload panel shows specialist workloads from assignments
- [ ] **ADM-DASH-03**: Alert panel shows system alerts (SLA breaches, pending reviews)
- [ ] **ADM-DASH-04**: Organization panel shows summary (total orgs, workspaces, users)
- [ ] **ADM-DASH-05**: Approval panel shows pending approvals from workflow
- [ ] **ADM-DASH-06**: Audit timeline shows recent audit events from `GET /api/admin/audit`
- [ ] **ADM-DASH-07**: Clicking stat cards navigates to relevant admin pages
- [ ] **ADM-DASH-08**: Floating chat shows alert count

---

## Admin Operations (Phase 80)

**Goal:** Operations với workload monitoring, SLA tracking, audit timeline

**Specification outputs:**
- `docs/discovery/80-operations-discovery.md`
- `docs/ui/80-operations-screen-analysis.md`
- `docs/analysis/80-operations-gap-analysis.md`
- `docs/design/80-operations-functional-spec.md`

- [ ] **ADM-OPS-01**: Operations page shows stat cards (total requests, active, overdue, completed)
- [ ] **ADM-OPS-02**: Workload panel shows specialist assignments with counts
- [ ] **ADM-OPS-03**: Audit timeline shows recent operations
- [ ] **ADM-OPS-04**: Operations table shows requests with SLA progress bars
- [ ] **ADM-OPS-05**: SLA bars are color-coded (green: >50%, yellow: 20-50%, red: <20%)
- [ ] **ADM-OPS-06**: Admin can filter by specialist via `?assignedTo=`
- [ ] **ADM-OPS-07**: Admin can sort by SLA deadline via `?sort=slaDeadline&order=asc`

---

## Messages (Phase 81)

**Goal:** Messages với 3-column layout, thread list, chat, info panel

**Specification outputs:**
- `docs/discovery/81-messages-discovery.md`
- `docs/ui/81-messages-screen-analysis.md`
- `docs/analysis/81-messages-gap-analysis.md`
- `docs/design/81-messages-functional-spec.md`

- [ ] **MSG-01**: Messages page shows 3-column layout (threads, chat, info)
- [ ] **MSG-02**: Thread list shows all message threads via `GET /api/messages?requestId=`
- [ ] **MSG-03**: User can select thread to view messages via `GET /api/messages/:threadId`
- [ ] **MSG-04**: Chat panel shows message history with timestamps
- [ ] **MSG-05**: User can send new message via `POST /api/messages/send`
- [ ] **MSG-06**: Info panel shows request metadata (status, assignee, SLA)
- [ ] **MSG-07**: Unread message count badge shows on thread via `PUT /api/messages/:id/read`
- [ ] **MSG-08**: User can close info panel

---

## Admin Audit (Phase 82)

**Goal:** Audit với security logs, search, filter, pagination

**Specification outputs:**
- `docs/discovery/82-audit-discovery.md`
- `docs/ui/82-audit-screen-analysis.md`
- `docs/analysis/82-audit-gap-analysis.md`
- `docs/design/82-audit-functional-spec.md`

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

## Admin Workspace Management (Phase 83)

**Goal:** Admin Workspace Management với CRUD, member invites, role changes

**Specification outputs:**
- `docs/discovery/83-workspace-mgmt-discovery.md`
- `docs/ui/83-workspace-mgmt-screen-analysis.md`
- `docs/analysis/83-workspace-mgmt-gap-analysis.md`
- `docs/design/83-workspace-mgmt-functional-spec.md`

- [ ] **ADM-WS-01**: Admin sees all workspaces with organization grouping via `GET /api/workspaces`
- [ ] **ADM-WS-02**: Admin can search workspaces by name via `?search=`
- [ ] **ADM-WS-03**: Admin can view workspace details via `GET /api/workspaces/:id`
- [ ] **ADM-WS-04**: Admin can create new workspace via `POST /api/workspaces`
- [ ] **ADM-WS-05**: Admin can invite member by email via `POST /api/workspaces/:id/invite`
- [ ] **ADM-WS-06**: Admin can change member role via `PATCH /api/workspaces/:id/members/:userId`
- [ ] **ADM-WS-07**: Admin can remove member via `DELETE /api/workspaces/:id/members/:userId`
- [ ] **ADM-WS-08**: Admin can deactivate workspace via `DELETE /api/workspaces/:id`

---

## Admin Vault (Phase 84)

**Goal:** Admin Vault với file management, folders, tags, signed URLs

**Specification outputs:**
- `docs/discovery/84-vault-discovery.md`
- `docs/ui/84-vault-screen-analysis.md`
- `docs/analysis/84-vault-gap-analysis.md`
- `docs/design/84-vault-functional-spec.md`

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

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI tự kết luận pháp lý | Rủi ro sai luật; defer to v2.3 |
| Open lawyer marketplace | Khó kiểm soát chất lượng; defer to future |
| Workflow builder tùy biến | Overbuild cho MVP; dùng state machine cố định |
| Template inheritance (Global → Customer → Partner) | Complex scope; defer to v2.3 |
| AI-agent automation readiness | API/schema design supports it but AI features defer to v2.3 |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SET-01 to SET-06 | Phase 73 | Pending |
| ADM-USER-01 to ADM-USER-09 | Phase 74 | Pending |
| CREQ-01 to CREQ-10 | Phase 75 | Pending |
| MYCASE-01 to MYCASE-09 | Phase 76 | Pending |
| U-DASH-01 to U-DASH-08 | Phase 77 | Pending |
| ADM-REQ-01 to ADM-REQ-09 | Phase 78 | Pending |
| ADM-DASH-01 to ADM-DASH-08 | Phase 79 | Pending |
| ADM-OPS-01 to ADM-OPS-07 | Phase 80 | Pending |
| MSG-01 to MSG-08 | Phase 81 | Pending |
| ADM-AUD-01 to ADM-AUD-10 | Phase 82 | Pending |
| ADM-WS-01 to ADM-WS-08 | Phase 83 | Pending |
| VAULT-01 to VAULT-12 | Phase 84 | Pending |

**Coverage:**
- v2.2 requirements: 105 total
- Mapped to phases: 12 (73-84)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-19*
*Last updated: 2026-06-19 during v2.2 milestone creation*
