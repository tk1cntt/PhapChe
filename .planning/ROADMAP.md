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
**Plans:** Pending

**Success Criteria:**
1. tenants table created with all required fields
2. organizations table created with tenant FK
3. workspaces.organization_id added (nullable FK)
4. is_default flag on organizations
5. Seed data for platform tenant
6. Prisma schema updated
7. Prisma client generated
8. Migration pushed successfully

### Phase 59: Partner Model

**Goal:** Create partners and partner_members tables for partner organization management
**Depends on:** Phase 58
**Requirements:** PARTNER-01 to PARTNER-08
**Plans:** Pending

**Success Criteria:**
1. partners table created
2. partner_members table created
3. users.partner_id FK added
4. PartnerService implemented
5. PartnerMemberService implemented
6. Partner seed data created
7. Unit tests pass for PartnerService
8. Unit tests pass for PartnerMemberService

### Phase 60: Engagement System

**Goal:** Create engagements, service_types, service_scopes for partner-organization relationships
**Depends on:** Phase 59
**Requirements:** ENGAGE-01 to ENGAGE-08
**Plans:** Pending

**Success Criteria:**
1. service_types table created
2. partner_organization_engagements table created
3. engagement_service_scopes table created
4. ServiceTypeService implemented
5. EngagementService implemented
6. Default service types seeded
7. Unit tests pass for EngagementService
8. Unit tests pass for ServiceTypeService

### Phase 61: Request Enhancement

**Goal:** Add engagement_id, assigned_partner_id to requests and create request_assignments
**Depends on:** Phase 60
**Requirements:** REQ-01 to REQ-08
**Plans:** Pending

**Success Criteria:**
1. legal_requests.engagement_id added
2. legal_requests.assigned_partner_id added
3. request_assignments table created
4. Prisma schema updated
5. RequestAssignmentService implemented
6. Request creation flow updated
7. Unit tests pass for RequestAssignmentService
8. Existing request APIs handle new fields

### Phase 62: RequestContext & Middleware

**Goal:** Create tenant-aware RequestContext and middleware for permission context building
**Depends on:** Phase 61
**Requirements:** CTX-01 to CTX-08
**Plans:** Pending

**Success Criteria:**
1. RequestContext type defined
2. RequestContextBuilder service implemented
3. Tenant middleware implemented
4. Auth middleware implemented
5. Organization context middleware implemented
6. Partner context middleware implemented
7. Unit tests pass for RequestContextBuilder
8. Unit tests pass for middleware chain

### Phase 63: Permission Service

**Goal:** Implement permission checking functions for resource access control
**Depends on:** Phase 62
**Requirements:** PERM-01 to PERM-08
**Plans:** Pending

**Success Criteria:**
1. PermissionService with canRead/canWrite methods
2. Platform role checks implemented
3. Organization role checks implemented
4. Partner permission level checks implemented
5. Request assignment checks for partners
6. PermissionMiddleware implemented
7. Unit tests pass for PermissionService
8. Integration tests pass for middleware

### Phase 64: Repository Pattern

**Goal:** Implement tenant-aware repositories for all domain entities
**Depends on:** Phase 63
**Requirements:** REPO-01 to REPO-08
**Plans:** Pending

**Success Criteria:**
1. Base Repository class created
2. OrganizationRepository implemented
3. WorkspaceRepository implemented
4. LegalRequestRepository implemented
5. FileRepository implemented
6. PartnerRepository implemented
7. All APIs updated to use repositories
8. Unit tests pass for repositories

### Phase 65: Data Migration

**Goal:** Migrate existing data to new multi-tenant model
**Depends on:** Phase 64
**Requirements:** MIGR-01 to MIGR-08
**Plans:** Pending

**Success Criteria:**
1. Migration script for default organizations
2. Workspace migration to link with organizations
3. tenant_id backfill script
4. Migration validation with count checks
5. Rollback script created
6. Production migration documentation
7. Integration tests for migration
8. Multi-tenant seed scripts updated

### Phase 66: Partner Auth

**Goal:** Implement partner login and dashboard overview
**Depends on:** Phase 65
**Requirements:** P-AUTH-01 to P-AUTH-08
**Plans:** Pending

**Success Criteria:**
1. Partner login API endpoint working
2. Partner JWT token with partner context
3. Partner logout endpoint working
4. Partner session validation working
5. Partner dashboard API with engagement summary
6. Partner login UI component
7. Partner dashboard UI component
8. E2E tests pass for partner auth

### Phase 67: Partner Requests

**Goal:** Implement partner request list and detail views
**Depends on:** Phase 66
**Requirements:** P-REQ-01 to P-REQ-08
**Plans:** Pending

**Success Criteria:**
1. API lists assigned requests
2. API returns request details with permission check
3. API lists requests by engagement/service type
4. Partner request list UI with search/filters
5. Partner request detail UI
6. Request status badges display correctly
7. Unit tests pass for request APIs
8. E2E tests pass for request views

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

### Phase 73: Settings (User)

**Goal:** User settings with profile, password, notifications, language
**Depends on:** Phase 72
**Requirements:** SET-01 to SET-06
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement with organization context)

### Phase 74: User Management (Admin)

**Goal:** Admin user management with organization filtering
**Depends on:** Phase 73
**Requirements:** ADM-USER-01 to ADM-USER-09
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 75: My Cases (User)

**Goal:** My Cases screen with case list, search, filter, pagination
**Depends on:** Phase 74
**Requirements:** MYCASE-01 to MYCASE-09
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 76: Dashboard (User)

**Goal:** User Dashboard with organization context
**Depends on:** Phase 75
**Requirements:** U-DASH-01 to U-DASH-08
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 77: Request Management (Admin)

**Goal:** Admin request management with organization filtering
**Depends on:** Phase 76
**Requirements:** ADM-REQ-01 to ADM-REQ-09
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 78: Admin Dashboard

**Goal:** Admin Dashboard with organization context
**Depends on:** Phase 77
**Requirements:** ADM-DASH-01 to ADM-DASH-08
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 79: Operations (Admin)

**Goal:** Operations screen with SLA management
**Depends on:** Phase 78
**Requirements:** ADM-OPS-01 to ADM-OPS-07
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 80: Messages (User)

**Goal:** Messages screen with thread list, chat, info panel
**Depends on:** Phase 79
**Requirements:** MSG-01 to MSG-08
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 81: Audit (Admin)

**Goal:** Admin Audit with security logs
**Depends on:** Phase 80
**Requirements:** ADM-AUD-01 to ADM-AUD-10
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 82: Vault (Admin)

**Goal:** Admin Vault with file management
**Depends on:** Phase 81
**Requirements:** VAULT-01 to VAULT-12
**Plans:** Pending
**UI Status:** Previously implemented (needs enhancement)

### Phase 83: Workspace Management (Admin)

**Goal:** Admin workspace management with organization grouping
**Depends on:** Phase 82
**Requirements:** ADM-WS-01 to ADM-WS-08
**Plans:** Pending
**UI Status:** Not implemented (needs new implementation)

---

## Progress

### Foundation (Completed)

| Phase | Name | Plans | Status | Date |
|-------|------|-------|--------|------|
| 55 | Architecture & Standards | 1/1 | ✅ Complete | 2026-06-14 |
| 56 | Storage Infrastructure | 1/1 | ✅ Complete | 2026-06-14 |
| 57 | Shared Tenant Architecture | 1/1 | ✅ Complete | 2026-06-14 |

### Shared Tenant Implementation

| Phase | Name | Requirements | Plans | Status |
|-------|------|--------------|-------|--------|
| 58 | Core Tables | 8 | Pending | Pending |
| 59 | Partner Model | 8 | Pending | Pending |
| 60 | Engagement System | 8 | Pending | Pending |
| 61 | Request Enhancement | 8 | Pending | Pending |
| 62 | RequestContext & Middleware | 8 | Pending | Pending |
| 63 | Permission Service | 8 | Pending | Pending |
| 64 | Repository Pattern | 8 | Pending | Pending |
| 65 | Data Migration | 8 | Pending | Pending |
| 66 | Partner Auth | 8 | Pending | Pending |
| 67 | Partner Requests | 8 | Pending | Pending |
| 68 | Partner Actions | 8 | Pending | Pending |
| 69 | Organization Management | 8 | Pending | Pending |
| 70 | User Management v2 | 8 | Pending | Pending |
| 71 | Create Request v2 | 8 | Pending | Pending |
| 72 | Workspace Management v2 | 8 | Pending | Pending |

### Legacy UI Enhancement

| Phase | Name | Requirements | UI Status | Status |
|-------|------|--------------|-----------|--------|
| 73 | Settings (User) | 6 | ✅ Enhanced | Pending |
| 74 | User Management (Admin) | 9 | ✅ Enhanced | Pending |
| 75 | My Cases (User) | 9 | ✅ Enhanced | Pending |
| 76 | Dashboard (User) | 8 | ✅ Enhanced | Pending |
| 77 | Request Management (Admin) | 9 | ✅ Enhanced | Pending |
| 78 | Admin Dashboard | 8 | ✅ Enhanced | Pending |
| 79 | Operations (Admin) | 7 | ✅ Enhanced | Pending |
| 80 | Messages (User) | 8 | ✅ Enhanced | Pending |
| 81 | Audit (Admin) | 10 | ✅ Enhanced | Pending |
| 82 | Vault (Admin) | 12 | ✅ Enhanced | Pending |
| 83 | Workspace Management (Admin) | 8 | ❌ New | Pending |

---

_Last updated: 2026-06-14 during Phase 57 discussion_
