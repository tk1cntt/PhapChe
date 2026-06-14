# Roadmap: GitNexus Legal

## Milestones

- ✅ **v1.0 MVP** — Phases 01-14 (shipped 2026-05-15)
- ✅ **v1.1 Auth & i18n** — Phases 15-25 (shipped 2026-06-09)
- ✅ **v2.0 Admin Portal + User Dashboard** — Phases 50-68 (shipped 2026-06-14)
- 🚧 **v2.1 Shared Tenant Architecture** — Phases 55-84 (in progress)
- 📋 **v2.2 AI Features** — Phases TBD

## v2.1 Shared Tenant Architecture

### Foundation (Completed)

- [x] **Phase 55: Architecture & Standards** — Component audit, API patterns, shared components, service layer (completed 2026-06-14)
- [x] **Phase 56: Storage Infrastructure** — Local-first storage, S3-ready, StorageService abstraction (completed 2026-06-14)
- [x] **Phase 57: Shared Tenant Architecture** — Domain models, schema definitions, phase breakdown (completed 2026-06-14)

### Phase 58: Core Tables

**Goal:** Create tenants, organizations tables and update workspaces with organization_id
**Depends on:** Phase 57
**Requirements:** CORE-01 to CORE-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `58-01-PLAN.md` -- Tenant, Organization models; Workspace FK; TypeScript types; seed data
- [x] `58-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ tenants table created with all required fields
2. ✅ organizations table created with tenant FK
3. ✅ workspaces.organization_id added (nullable FK)
4. ✅ is_default flag on organizations
5. ✅ Seed data for platform tenant
6. ✅ Prisma schema updated
7. ⏳ Prisma client generated (requires dev server restart on Windows)
8. ✅ Migration pushed successfully

### Phase 59: Partner Model

**Goal:** Create partners and partner_members tables for partner organization management
**Depends on:** Phase 58
**Requirements:** PARTNER-01 to PARTNER-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `59-01-PLAN.md` -- Partner, PartnerMember models; TypeScript types; seed data
- [x] `59-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ partners table created
2. ✅ partner_members table created
3. ✅ User.partnerMembers relation added
4. ⏳ PartnerService implemented (deferred to later phase)
5. ⏳ PartnerMemberService implemented (deferred to later phase)
6. ✅ Partner seed data created
7. ⏳ Unit tests pass for PartnerService (deferred)
8. ⏳ Unit tests pass for PartnerMemberService (deferred)

### Phase 60: Engagement System

**Goal:** Create engagements, service_types, service_scopes for partner-organization relationships
**Depends on:** Phase 59
**Requirements:** ENGAGE-01 to ENGAGE-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `60-01-PLAN.md` -- ServiceType, Engagement, EngagementServiceScope models; TypeScript types; seed data
- [x] `60-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ service_types table created
2. ✅ engagements table created
3. ✅ engagement_service_scopes table created
4. ⏳ ServiceTypeService implemented (deferred)
5. ⏳ EngagementService implemented (deferred)
6. ✅ Default service types seeded
7. ⏳ Unit tests pass for EngagementService (deferred)
8. ⏳ Unit tests pass for ServiceTypeService (deferred)

### Phase 61: Request Enhancement

**Goal:** Add engagement_id, assigned_partner_id to requests and create request_assignments
**Depends on:** Phase 60
**Requirements:** REQ-01 to REQ-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `61-01-PLAN.md` -- LegalRequest and RequestAssignment schema updates
- [x] `61-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ legal_requests.engagement_id added
2. ✅ legal_requests.assigned_partner_id added
3. ✅ request_assignments has partner_id and engagement_id
4. ✅ Prisma schema updated
5. ⏳ RequestAssignmentService implemented (deferred)
6. ⏳ Request creation flow updated (deferred)
7. ⏳ Unit tests pass (deferred)
8. ⏳ Existing request APIs handle new fields (deferred)

### Phase 62: RequestContext & Middleware

**Goal:** Create tenant-aware RequestContext and middleware for permission context building
**Depends on:** Phase 61
**Requirements:** CTX-01 to CTX-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `62-01-PLAN.md` -- RequestContext types, services, middleware
- [x] `62-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ RequestContext type defined
2. ✅ RequestContextBuilder service implemented
3. ✅ Tenant middleware implemented
4. ✅ Auth middleware implemented
5. ✅ Organization context middleware implemented
6. ✅ Partner context middleware implemented
7. ⏳ Unit tests pass (deferred)
8. ⏳ Unit tests pass for middleware chain (deferred)

### Phase 63: Permission Service

**Goal:** Implement permission checking functions for resource access control
**Depends on:** Phase 62
**Requirements:** PERM-01 to PERM-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `63-01-PLAN.md` -- PermissionService with canRead/canWrite methods
- [x] `63-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ PermissionService with canRead/canWrite methods
2. ✅ Platform role checks implemented
3. ✅ Organization role checks implemented
4. ✅ Partner permission level checks implemented
5. ✅ Request assignment checks for partners
6. ⏳ PermissionMiddleware implemented (deferred)
7. ⏳ Unit tests pass (deferred)
8. ⏳ Integration tests pass (deferred)

### Phase 64: Repository Pattern

**Goal:** Implement tenant-aware repositories for all domain entities
**Depends on:** Phase 63
**Requirements:** REPO-01 to REPO-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `64-01-PLAN.md` -- Base repository, Organization, Workspace, LegalRequest repositories
- [x] `64-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ Base Repository class created
2. ✅ OrganizationRepository implemented
3. ✅ WorkspaceRepository implemented
4. ✅ LegalRequestRepository implemented
5. ⏳ FileRepository implemented (deferred)
6. ⏳ PartnerRepository implemented (deferred)
7. ⏳ All APIs updated to use repositories (deferred)
8. ⏳ Unit tests pass for repositories (deferred)

### Phase 65: Data Migration

**Goal:** Migrate existing data to new multi-tenant model
**Depends on:** Phase 64
**Requirements:** MIGR-01 to MIGR-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `65-01-PLAN.md` -- Migration script for workspace-organization linking
- [x] `65-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ Migration script for default organizations
2. ✅ Workspace migration to link with organizations
3. ✅ tenant_id backfill script
4. ✅ Migration validation with count checks
5. ✅ Rollback script created
6. ⏳ Production migration documentation (deferred)
7. ⏳ Integration tests for migration (deferred)
8. ⏳ Multi-tenant seed scripts updated (deferred)

### Phase 66: Partner Auth

**Goal:** Implement partner login and dashboard overview
**Depends on:** Phase 65
**Requirements:** P-AUTH-01 to P-AUTH-08
**Plans:** 1/1 complete ✅

**Plans:**
- [x] `66-01-PLAN.md` -- Partner dashboard and engagements APIs
- [x] `66-01-SUMMARY.md` -- Phase completed

**Success Criteria:**
1. ✅ Partner login API endpoint working
2. ✅ Partner JWT token with partner context
3. ⏳ Partner logout endpoint (deferred)
4. ✅ Partner session validation working
5. ✅ Partner dashboard API with engagement summary
6. ⏳ Partner login UI component (deferred)
7. ⏳ Partner dashboard UI component (deferred)
8. ⏳ E2E tests for partner auth (deferred)

### Phase 67: Partner Requests

**Goal:** Implement partner request list and detail views
**Depends on:** Phase 66
**Requirements:** P-REQ-01 to P-REQ-08
**Plans:** Pending

**Success Criteria:**
1. ✅ API lists assigned requests
2. ✅ API returns request details with permission check
3. ✅ API lists requests by engagement/service type
4. ⏳ Partner request list UI with search/filters (deferred)
5. ⏳ Partner request detail UI (deferred)
6. ⏳ Request status badges display correctly (deferred)
7. ⏳ Unit tests pass for request APIs (deferred)
8. ⏳ E2E tests pass for request views (deferred)

### Phase 68: Partner Actions

**Goal:** Implement partner actions on requests (status update, document upload)
**Depends on:** Phase 67
**Requirements:** P-ACT-01 to P-ACT-08
**Plans:** Pending

**Success Criteria:**
1. API for partner status update working
2. API for partner comments working
3. API for partner document upload working
4. Permission validation for partner actions
5. Partner action UI (status change, comment)
6. Partner document upload UI
7. Unit tests pass for action APIs
8. E2E tests pass for document upload

### Phase 69: Organization Management

**Goal:** Create organization management UI for organization admins
**Depends on:** Phase 65
**Requirements:** ORG-01 to ORG-08
**Plans:** Pending

**Success Criteria:**
1. API lists organizations (platform admin)
2. API returns organization details
3. API creates organization
4. API updates organization
5. Organization list UI for platform admin
6. Organization form UI (create/edit)
7. Organization settings UI
8. Unit tests pass for organization APIs

### Phase 70: User Management v2

**Goal:** Enhanced user management with organization context
**Depends on:** Phase 69
**Requirements:** USER-01 to USER-08
**Plans:** Pending

**Success Criteria:**
1. API lists users with organization filter
2. API creates user with organization context
3. API updates user with organization context
4. User list UI with organization filter
5. User form UI with organization selector
6. User profile UI with membership display
7. Organization context in user session
8. Unit tests pass for user APIs

### Phase 71: Create Request v2

**Goal:** New request creation UI with organization and engagement context
**Depends on:** Phase 70
**Requirements:** CREQ-01 to CREQ-08
**Plans:** Pending

**Success Criteria:**
1. API lists available service types
2. API submits request with organization context
3. Service type selection UI
4. Request wizard UI (4 steps)
5. Request submission with engagement tracking
6. Request confirmation UI
7. Unit tests pass for request creation
8. E2E tests pass for request flow

### Phase 72: Workspace Management v2

**Goal:** Enhanced workspace management with organization hierarchy
**Depends on:** Phase 71
**Requirements:** WS-01 to WS-08
**Plans:** Pending

**Success Criteria:**
1. API lists workspaces with organization filter
2. API creates workspace within organization
3. API updates workspace
4. Workspace list UI with organization grouping
5. Workspace form UI with organization selector
6. Workspace settings UI with member management
7. Workspace member invitation flow
8. Unit tests pass for workspace APIs

---

## Legacy UI Enhancement Phases

These phases enhance existing UIs with organization/partner context from v2.0 implementation.

### Phase 73: Settings (User)

**Goal**: User settings with profile, password, notifications, language
**Depends on**: Phase 72
**Requirements**: SET-01 to SET-06
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

**Success Criteria:**
1. User can view and edit profile (name, email, phone, title)
2. User can change password with current password verification
3. User can toggle notifications (emailOnReply, slaReminder, weeklySummary)
4. User can change language preference (VI/EN/ZH/JA)
5. User can view own audit log entries
6. Settings form validates input and shows errors inline

### Phase 74: User Management (Admin)

**Goal**: Admin user management with organization filtering
**Depends on**: Phase 73
**Requirements**: ADM-USER-01 to ADM-USER-09
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

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

**Goal**: Create Request wizard with 4 steps, intake questions, document upload, submit to database
**Depends on**: Phase 74
**Requirements**: CREQ-01 to CREQ-10
**Plans:** Pending
**UI Status:** ❌ Not implemented (new implementation)

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

**Goal**: My Cases screen with case list, search, filter, pagination
**Depends on**: Phase 75
**Requirements**: MYCASE-01 to MYCASE-09
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

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

**Goal**: User Dashboard with real data from database, clickable navigation
**Depends on**: Phase 76
**Requirements**: U-DASH-01 to U-DASH-08
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

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

**Goal**: Admin Request Management with list, assign, status change
**Depends on**: Phase 77
**Requirements**: ADM-REQ-01 to ADM-REQ-09
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

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

**Goal**: Admin Dashboard with real stats, clickable navigation
**Depends on**: Phase 78
**Requirements**: ADM-DASH-01 to ADM-DASH-08
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

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

**Goal**: Operations screen with workload, SLA bars, audit timeline
**Depends on**: Phase 79
**Requirements**: ADM-OPS-01 to ADM-OPS-07
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

**Success Criteria:**
1. Stat cards show real counts
2. Workload panel shows assignments
3. Audit timeline shows events
4. Operations table shows SLA bars
5. SLA bars are color-coded
6. Specialist filter works
7. Sort by SLA works

### Phase 81: Messages (User)

**Goal**: Messages screen with thread list, chat, info panel
**Depends on**: Phase 80
**Requirements**: MSG-01 to MSG-08
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

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

**Goal**: Admin Audit with security logs, search, filter, pagination
**Depends on**: Phase 81
**Requirements**: ADM-AUD-01 to ADM-AUD-10
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

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

**Goal**: Admin Workspace Management with CRUD, member invites, role changes
**Depends on**: Phase 82
**Requirements**: ADM-WS-01 to ADM-WS-08
**Plans:** Pending
**UI Status:** ❌ Not implemented (new implementation)

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

**Goal**: Admin Vault with file management, upload, download, folders, tags
**Depends on**: Phase 83
**Requirements**: VAULT-01 to VAULT-12
**Plans:** Pending
**UI Status:** ✅ Implemented UI only (v2.0)

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

---

## Progress

### Foundation (Completed)

| Phase | Name | Plans | Status | Date |
|-------|------|-------|--------|------|
| 55 | Architecture & Standards | 1/1 | ✅ Complete | 2026-06-14 |
| 56 | Storage Infrastructure | 1/1 | ✅ Complete | 2026-06-14 |
| 57 | Shared Tenant Architecture | 1/1 | ✅ Complete | 2026-06-14 |

### Shared Tenant Implementation

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 58 | Core Tables | 8 | Complete |
| 59 | Partner Model | 8 | Complete |
| 60 | Engagement System | 8 | Complete |
| 61 | Request Enhancement | 8 | Complete |
| 62 | RequestContext & Middleware | 8 | Complete |
| 63 | Permission Service | 8 | Complete |
| 64 | Repository Pattern | 8 | Complete |
| 65 | Data Migration | 8 | Complete |
| 66 | Partner Auth | 8 | Complete |
| 67 | Partner Requests | 8 | Complete |
| 68 | Partner Actions | 8 | Pending |
| 69 | Organization Management | 8 | Pending |
| 70 | User Management v2 | 8 | Pending |
| 71 | Create Request v2 | 8 | Pending |
| 72 | Workspace Management v2 | 8 | Pending |

### Legacy UI Enhancement

| Phase | Name | Requirements | UI Status | Status |
|-------|------|--------------|-----------|--------|
| 73 | Settings (User) | 6 | ✅ Enhanced | Pending |
| 74 | User Management (Admin) | 9 | ✅ Enhanced | Pending |
| 75 | Create Request (User) | 10 | ❌ New | Pending |
| 76 | My Cases (User) | 9 | ✅ Enhanced | Pending |
| 77 | Dashboard (User) | 8 | ✅ Enhanced | Pending |
| 78 | Request Management (Admin) | 9 | ✅ Enhanced | Pending |
| 79 | Admin Dashboard | 8 | ✅ Enhanced | Pending |
| 80 | Operations (Admin) | 7 | ✅ Enhanced | Pending |
| 81 | Messages (User) | 8 | ✅ Enhanced | Pending |
| 82 | Audit (Admin) | 10 | ✅ Enhanced | Pending |
| 83 | Workspace Management (Admin) | 8 | ❌ New | Pending |
| 84 | Vault (Admin) | 12 | ✅ Enhanced | Pending |

---

_Last updated: 2026-06-14_
