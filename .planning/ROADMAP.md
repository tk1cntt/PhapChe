# Roadmap: GitNexus Legal

## Milestones

- ✅ **v1.0 MVP** — Phases 01-14 (shipped 2026-05-15)
- ✅ **v1.1 Auth & i18n** — Phases 15-25 (shipped 2026-06-09)
- ✅ **v2.0 Admin Portal + User Dashboard** — Phases 50-54 (shipped 2026-06-14)
- 🚧 **v2.1 Feature Implementation** — Phases 55-68 (in progress)
- 📋 **v2.2 AI Features** — Phases TBD

## v2.1 Vertical Slices (Feature Implementation)

### Foundation

- [x] **Phase 55: Architecture & Standards** — Component audit, API patterns, shared components, service layer, type definitions, code standards (completed 2026-06-14)
- [x] **Phase 56: Storage Infrastructure** — Local-first storage, S3-ready, StorageService abstraction, file metadata schema (completed 2026-06-14)

### Level 1: Independent Screens

- [ ] **Phase 57: Settings (User)** — Profile, password, notifications, language, audit log
- [ ] **Phase 58: User Management (Admin)** — CRUD users, roles, search, filter

### Level 2: Depends on Foundation

- [ ] **Phase 59: Create Request (User)** — Wizard, intake questions, document upload, submit
- [ ] **Phase 60: Workspace Management (Admin)** — Workspace CRUD, member invites, permissions

### Level 3: Depends on Level 2

- [ ] **Phase 61: My Cases (User)** — Case list, search, filter, pagination
- [ ] **Phase 62: Dashboard (User)** — Stats, recent cases, deadlines, activity
- [ ] **Phase 63: Request Management (Admin)** — Request list, assign, status change

### Level 4: Depends on Level 3

- [ ] **Phase 64: Admin Dashboard** — Stats, workload, alerts, timeline
- [ ] **Phase 65: Operations (Admin)** — Workload, SLA bars, audit timeline

### Level 5: Depends on Level 4

- [ ] **Phase 66: Messages (User)** — Thread list, chat, info panel
- [ ] **Phase 67: Audit (Admin)** — Security logs, search, filter, pagination

### Level 6: Depends on Level 5

- [ ] **Phase 68: Vault (Admin)** — File management, upload, download, folders, tags

## Phase Details

### Phase 55: Architecture & Standards

**Goal**: Refactor source code structure, define conventions, establish reusable patterns
**Depends on**: None (Foundation)
**Requirements**: ARCH-01 to ARCH-17 (17 total)
**Plans:** 1/1 plans complete

**Plans:**

- [x] 55-01-PLAN.md — Standards documentation, component registry, StatCard unification, type unification

**Success Criteria:**

1. Component audit complete — all components documented
2. API patterns standardized — consistent response format
3. Shared components extracted — StatCard, Badge, Button, etc.
4. Service layer established — business logic separated from UI
5. Type definitions unified — no `as any` casts
6. Code standards documented — naming, structure, import order
7. i18n rules established — when to use translations

### Phase 56: Storage Infrastructure

**Goal**: Implement Local-first Storage Architecture, S3-ready by configuration, StorageService abstraction, file metadata schema
**Depends on**: Phase 55 (Architecture standards)
**Reference**: `docs/local_store_to_s3.md`
**Requirements**: STORAGE-01, STORAGE-02, STORAGE-03, STORAGE-04, STORAGE-05, STORAGE-06, STORAGE-07, STORAGE-08
**Plans:** 1/1 plans complete

**Plans:**

- [x] 56-01-PLAN.md — StorageProvider interface, LocalStorageAdapter, StorageService, File API routes, database schema, audit logging, migration command skeleton

**Success Criteria:**

1. StorageProvider interface defined
2. LocalStorageAdapter implemented
3. StorageService abstracts all file operations
4. File metadata stored in database
5. ObjectKey convention established
6. Upload/Download/Delete APIs working
7. Audit logging for file operations
8. Migration command ready for S3 transition

### Phase 57: Settings (User)

**Goal**: User Settings screen with profile editing, password change, notifications toggle, language selection, audit log viewing
**Depends on**: Phase 55, Phase 56
**Requirements**: SET-01, SET-02, SET-03, SET-04, SET-05, SET-06

**Success Criteria:**

1. User can view and edit profile (name, email, phone, title)
2. User can change password with current password verification
3. User can toggle notifications (emailOnReply, slaReminder, weeklySummary)
4. User can change language preference
5. User can view own audit log entries
6. Form validates input and shows errors inline

### Phase 58: User Management (Admin)

**Goal**: Admin User Management with full CRUD, role assignment, search, filter, pagination
**Depends on**: Phase 55, Phase 56
**Requirements**: ADM-USER-01, ADM-USER-02, ADM-USER-03, ADM-USER-04, ADM-USER-05, ADM-USER-06, ADM-USER-07, ADM-USER-08, ADM-USER-09

**Success Criteria:**

1. Admin sees paginated list of all users
2. Admin can search users by name/email
3. Admin can filter users by role
4. Admin can filter users by workspace
5. Admin can view user details
6. Admin can create new user
7. Admin can edit user role
8. Admin can deactivate/reactivate user
9. User table shows correct stat counts

### Phase 59: Create Request (User)

**Goal**: Create Request wizard with 4 steps, intake questions, document upload, submit to database
**Depends on**: Phase 55, Phase 56
**Requirements**: CREQ-01, CREQ-02, CREQ-03, CREQ-04, CREQ-05, CREQ-06, CREQ-07, CREQ-08, CREQ-09, CREQ-10

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

### Phase 60: Workspace Management (Admin)

**Goal**: Admin Workspace Management with CRUD, member invites, role changes
**Depends on**: Phase 58
**Requirements**: ADM-WS-01, ADM-WS-02, ADM-WS-03, ADM-WS-04, ADM-WS-05, ADM-WS-06, ADM-WS-07, ADM-WS-08

**Success Criteria:**

1. Admin sees all workspaces with member counts
2. Admin can search workspaces
3. Admin can view workspace details
4. Admin can create new workspace
5. Admin can invite member by email
6. Admin can change member role
7. Admin can remove member
8. Admin can deactivate workspace

### Phase 61: My Cases (User)

**Goal**: My Cases screen with case list, search, filter, pagination
**Depends on**: Phase 59
**Requirements**: MYCASE-01, MYCASE-02, MYCASE-03, MYCASE-04, MYCASE-05, MYCASE-06, MYCASE-07, MYCASE-08, MYCASE-09

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

### Phase 62: Dashboard (User)

**Goal**: User Dashboard with real data from database, clickable navigation
**Depends on**: Phase 59
**Requirements**: U-DASH-01, U-DASH-02, U-DASH-03, U-DASH-04, U-DASH-05, U-DASH-06, U-DASH-07, U-DASH-08

**Success Criteria:**

1. Stat cards show real counts
2. Welcome banner shows workspace name
3. Recent cases panel shows 5 cases
4. Deadline/SLA panel shows progress bars
5. Recent documents panel shows files
6. Activity timeline shows timestamps
7. Floating chat shows unread count
8. Stat cards are clickable

### Phase 63: Request Management (Admin)

**Goal**: Admin Request Management with list, assign, status change
**Depends on**: Phase 59
**Requirements**: ADM-REQ-01, ADM-REQ-02, ADM-REQ-03, ADM-REQ-04, ADM-REQ-05, ADM-REQ-06, ADM-REQ-07, ADM-REQ-08, ADM-REQ-09

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

### Phase 64: Admin Dashboard

**Goal**: Admin Dashboard with real stats, clickable navigation
**Depends on**: Phase 63
**Requirements**: ADM-DASH-01, ADM-DASH-02, ADM-DASH-03, ADM-DASH-04, ADM-DASH-05, ADM-DASH-06, ADM-DASH-07, ADM-DASH-08

**Success Criteria:**

1. Stat cards show real counts
2. Workload panel shows specialists
3. Alert panel shows system alerts
4. Workspace panel shows summary
5. Approval panel shows pending
6. Audit timeline shows events
7. Stat cards are clickable
8. Floating chat shows alerts

### Phase 65: Operations (Admin)

**Goal**: Operations screen with workload, SLA bars, audit timeline
**Depends on**: Phase 63
**Requirements**: ADM-OPS-01, ADM-OPS-02, ADM-OPS-03, ADM-OPS-04, ADM-OPS-05, ADM-OPS-06, ADM-OPS-07

**Success Criteria:**

1. Stat cards show real counts
2. Workload panel shows assignments
3. Audit timeline shows events
4. Operations table shows SLA bars
5. SLA bars are color-coded
6. Specialist filter works
7. Sort by SLA works

### Phase 66: Messages (User)

**Goal**: Messages screen with thread list, chat, info panel
**Depends on**: Phase 59, Phase 65
**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07, MSG-08

**Success Criteria:**

1. 3-column layout displays
2. Thread list shows all threads
3. Selecting thread shows messages
4. Chat shows message history
5. User can send messages
6. Info panel shows request metadata
7. Unread badge displays
8. Info panel can be closed

### Phase 67: Audit (Admin)

**Goal**: Admin Audit with security logs, search, filter, pagination
**Depends on**: Phase 65
**Requirements**: ADM-AUD-01, ADM-AUD-02, ADM-AUD-03, ADM-AUD-04, ADM-AUD-05, ADM-AUD-06, ADM-AUD-07, ADM-AUD-08, ADM-AUD-09, ADM-AUD-10

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

### Phase 68: Vault (Admin)

**Goal**: Admin Vault with file management, upload, download, folders, tags
**Depends on**: Phase 60, Phase 65
**Requirements**: VAULT-01, VAULT-02, VAULT-03, VAULT-04, VAULT-05, VAULT-06, VAULT-07, VAULT-08, VAULT-09, VAULT-10, VAULT-11, VAULT-12

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

| Phase | Screen | Milestone | Status | Requirements |
|-------|--------|-----------|--------|--------------|
| 55 | Architecture & Standards | 1/1 | Complete    | 2026-06-14 |
| 56 | Storage Infrastructure | 1/1 | Complete    | 2026-06-14 |
| 57 | Settings (User) | v2.1 | Not started | 6 |
| 58 | User Management (Admin) | v2.1 | Not started | 9 |
| 59 | Create Request (User) | v2.1 | Not started | 10 |
| 60 | Workspace (Admin) | v2.1 | Not started | 8 |
| 61 | My Cases (User) | v2.1 | Not started | 9 |
| 62 | Dashboard (User) | v2.1 | Not started | 8 |
| 63 | Request Management (Admin) | v2.1 | Not started | 9 |
| 64 | Admin Dashboard | v2.1 | Not started | 8 |
| 65 | Operations (Admin) | v2.1 | Not started | 7 |
| 66 | Messages (User) | v2.1 | Not started | 8 |
| 67 | Audit (Admin) | v2.1 | Not started | 10 |
| 68 | Vault (Admin) | v2.1 | Not started | 12 |

---

_Last updated: 2026-06-14 during Phase 56 planning_
