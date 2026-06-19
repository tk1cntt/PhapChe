# Roadmap: GitNexus Legal

## Milestones

- ✅ **v1.0 MVP** — Phases 01-14 (shipped 2026-06-05)
- ✅ **v1.1 Auth & i18n** — Phases 15-25 (shipped 2026-06-10)
- ✅ **v2.0 Admin Portal + User Dashboard** — Phases 50-54 (shipped 2026-06-14)
- ✅ **v2.1 Shared Tenant Architecture** — Phases 55-72, 85 (shipped 2026-06-19)
- 🚧 **v2.2 Legacy UI Enhancement** — Phases 73-84 (in progress)
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

**Methodology:** Mỗi phase phải qua Discovery → UI Analysis → Gap Analysis → System Design → API Design → Frontend Architecture → Implementation Plan → Implementation (DB → Backend → API → Frontend → Tests).

### Phase 73: Settings (User)

**Goal:** User settings with profile, password, notifications, language
**Depends on:** Phase 72
**Requirements:** SET-01 to SET-06
**Plans:** TBD

**Success Criteria:**
1. User can view and edit profile (name, email, phone, title)
2. User can change password with current password verification
3. User can toggle notifications (emailOnReply, slaReminder, weeklySummary)
4. User can change language preference (VI/EN/ZH/JA)
5. User can view own audit log entries
6. Settings form validates input and shows errors inline

### Phase 74: User Management (Admin)

**Goal:** Admin user management with organization filtering
**Depends on:** Phase 73
**Requirements:** ADM-USER-01 to ADM-USER-09
**Plans:** TBD

**Success Criteria:**
1. Admin sees paginated list of all users
2. Admin can search users by name/email
3. Admin can filter users by role
4. Admin can filter users by organization
5. Admin can view user details with organization context
6. Admin can create new user with organization assignment
7. Admin can edit user role and organization
8. Admin can deactivate/reactivate user
9. User table shows correct stat counts by organization

### Phase 75: Create Request (User)

**Goal:** Create Request wizard with 4 steps, intake questions, document upload, submit to database
**Depends on:** Phase 74
**Requirements:** CREQ-01 to CREQ-10
**Plans:** TBD

**Success Criteria:**
1. User can select service type from 5 options
2. Service cards display with descriptions and tags
3. Wizard shows 4-step progress indicator
4. User can answer intake questions based on service type
5. User can upload documents with progress
6. User can review answers before submit
7. User can submit and see confirmation
8. Request appears in My Cases after submit
9. Priority selection works
10. Contact info pre-filled from profile

### Phase 76: My Cases (User)

**Goal:** My Cases screen with case list, search, filter, pagination
**Depends on:** Phase 75
**Requirements:** MYCASE-01 to MYCASE-09
**Plans:** TBD

**Success Criteria:**
1. Summary banner shows total cases count
2. Stat cards show correct counts
3. Search filters cases by code/type
4. Status filter works
5. Type filter works
6. Table shows 7 columns
7. Clicking case navigates to details
8. Pagination works
9. Empty state displays when no results

### Phase 77: Dashboard (User)

**Goal:** User Dashboard with real data from database, clickable navigation
**Depends on:** Phase 76
**Requirements:** U-DASH-01 to U-DASH-08
**Plans:** TBD

**Success Criteria:**
1. Stat cards show real counts
2. Welcome banner shows workspace name
3. Recent cases panel shows 5 cases
4. Deadline/SLA panel shows progress bars
5. Recent documents panel shows files
6. Activity timeline shows timestamps
7. Floating chat shows unread count
8. Stat cards are clickable

### Phase 78: Request Management (Admin)

**Goal:** Admin Request Management with list, assign, status change
**Depends on:** Phase 77
**Requirements:** ADM-REQ-01 to ADM-REQ-09
**Plans:** TBD

**Success Criteria:**
1. Admin sees all requests with workspace filter
2. Search works by code
3. Status filter works
4. Type filter works
5. Admin can assign specialist
6. Admin can change status
7. Admin can view request details
8. Priority badges display correctly
9. Pagination works

### Phase 79: Admin Dashboard

**Goal:** Admin Dashboard with real stats, clickable navigation
**Depends on:** Phase 78
**Requirements:** ADM-DASH-01 to ADM-DASH-08
**Plans:** TBD

**Success Criteria:**
1. Stat cards show real counts
2. Workload panel shows specialists
3. Alert panel shows system alerts
4. Workspace panel shows summary
5. Approval panel shows pending
6. Audit timeline shows events
7. Stat cards are clickable
8. Floating chat shows alerts

### Phase 80: Operations (Admin)

**Goal:** Operations screen with workload, SLA bars, audit timeline
**Depends on:** Phase 79
**Requirements:** ADM-OPS-01 to ADM-OPS-07
**Plans:** TBD

**Success Criteria:**
1. Stat cards show real counts
2. Workload panel shows assignments
3. Audit timeline shows events
4. Operations table shows SLA bars
5. SLA bars are color-coded
6. Specialist filter works
7. Sort by SLA works

### Phase 81: Messages (User)

**Goal:** Messages screen with thread list, chat, info panel
**Depends on:** Phase 80
**Requirements:** MSG-01 to MSG-08
**Plans:** TBD

**Success Criteria:**
1. 3-column layout displays
2. Thread list shows all threads
3. Selecting thread shows messages
4. Chat shows message history
5. User can send messages
6. Info panel shows request metadata
7. Unread badge displays
8. Info panel can be closed

### Phase 82: Audit (Admin)

**Goal:** Admin Audit with security logs, search, filter, pagination
**Depends on:** Phase 81
**Requirements:** ADM-AUD-01 to ADM-AUD-10
**Plans:** TBD

**Success Criteria:**
1. Stat cards show audit counts
2. Security notice displays
3. Control alerts show metrics
4. Activity timeline shows events
5. Table shows 7 columns
6. Search works by actor/target
7. Action type filter works
8. Date range filter works
9. Pagination works
10. Correlation IDs in monospace

### Phase 83: Workspace Management (Admin)

**Goal:** Admin Workspace Management with CRUD, member invites, role changes
**Depends on:** Phase 82
**Requirements:** ADM-WS-01 to ADM-WS-08
**Plans:** TBD

**Success Criteria:**
1. Admin sees all workspaces with member counts
2. Admin can search workspaces
3. Admin can view workspace details
4. Admin can create new workspace
5. Admin can invite member by email
6. Admin can change member role
7. Admin can remove member
8. Admin can deactivate workspace

### Phase 84: Vault (Admin)

**Goal:** Admin Vault with file management, upload, download, folders, tags
**Depends on:** Phase 83
**Requirements:** VAULT-01 to VAULT-12
**Plans:** TBD

**Success Criteria:**
1. Stat cards show vault counts
2. Folder panel shows tree
3. Tag panel shows tags with counts
4. Vault table shows files
5. Search works by name
6. Folder filter works
7. Tag filter works
8. Admin can upload files
9. Admin can download files
10. Admin can create folders
11. Admin can create tags
12. Security badges display

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 01-14 | v1.0 | Various | Complete | 2026-06-05 |
| 15-25 | v1.1 | Various | Complete | 2026-06-10 |
| 39-54 | v2.0 | Various | Complete | 2026-06-14 |
| 55-72, 85 | v2.1 | ~20 | Complete | 2026-06-19 |
| 73 | v2.2 | TBD | Not started | - |
| 74 | v2.2 | TBD | Not started | - |
| 75 | v2.2 | TBD | Not started | - |
| 76 | v2.2 | TBD | Not started | - |
| 77 | v2.2 | TBD | Not started | - |
| 78 | v2.2 | TBD | Not started | - |
| 79 | v2.2 | TBD | Not started | - |
| 80 | v2.2 | TBD | Not started | - |
| 81 | v2.2 | TBD | Not started | - |
| 82 | v2.2 | TBD | Not started | - |
| 83 | v2.2 | TBD | Not started | - |
| 84 | v2.2 | TBD | Not started | - |

---

_Last updated: 2026-06-19 after v2.2 milestone initialization_
