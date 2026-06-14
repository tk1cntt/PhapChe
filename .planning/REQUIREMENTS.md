# Requirements: GitNexus Legal — v2.1 Shared Tenant Architecture

**Defined:** 2026-06-14
**Milestone:** v2.1 Shared Tenant Architecture — Multi-tenant with Organization & Partner
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

---

## Architecture Requirements

### Phase 55: Architecture & Standards

- [x] **ARCH-01**: Component audit complete — all components documented with purpose, props, usage
- [x] **ARCH-02**: API patterns standardized — consistent request/response format, error handling
- [x] **ARCH-03**: Shared components registry — StatCard, Badge, Button, Input, Select, Modal, etc.
- [x] **ARCH-04**: Service layer established — business logic separated from UI components
- [x] **ARCH-05**: Type definitions unified — TypeScript interfaces for all entities, no `as any`
- [x] **ARCH-06**: Code standards documented — naming conventions, file structure, import order
- [x] **ARCH-07**: i18n rules established — when to use translations vs hardcoded strings
- [x] **ARCH-08**: Form Definition pattern documented — dynamic forms from database
- [x] **ARCH-09**: Workflow Definition pattern documented — state machine with transitions
- [x] **ARCH-10**: Template Engine pattern documented — {{variable}} syntax for documents
- [x] **ARCH-11**: Shared Component Extraction — StatCard unified with 5 variants
- [x] **ARCH-12**: Storybook setup — visual documentation for components
- [x] **ARCH-13**: Automated Component Registry Generator — scripts/generate-component-registry.mjs
- [x] **ARCH-14**: ESLint Component Naming Rule — no-duplicate-component enforcement
- [x] **ARCH-15**: API Registry — central documentation of all endpoints
- [x] **ARCH-16**: Swagger/OpenAPI Documentation — auto-generated API docs at /api/docs
- [x] **ARCH-17**: Central API Client — single client for all API calls

### Phase 56: Storage Infrastructure

- [x] **STORAGE-01**: StorageProvider interface defined with upload, download, delete, exists methods
- [x] **STORAGE-02**: LocalStorageAdapter implemented for local filesystem storage
- [x] **STORAGE-03**: StorageService abstracts all file operations with tenant isolation
- [x] **STORAGE-04**: File metadata stored in database with organization_id
- [x] **STORAGE-05**: ObjectKey convention: `{organizationId}/{year}/{month}/{uuid}-{filename}`
- [x] **STORAGE-06**: Upload/Download/Delete APIs working with signed URLs
- [x] **STORAGE-07**: Audit logging for all file operations
- [x] **STORAGE-08**: Migration command ready for S3 transition

### Phase 57: Shared Tenant Architecture (Discussion Only)

- [x] **ARCH-ARCH-01**: Domain models defined — Organization, Workspace, Partner, Engagement
- [x] **ARCH-ARCH-02**: Schema structure designed — organization_id FK, partner access model
- [x] **ARCH-ARCH-03**: Phase breakdown created — 15 phases for implementation
- [x] **ARCH-ARCH-04**: Migration strategy defined — incremental per phase

---

## Shared Tenant Implementation Requirements

### Phase 58: Core Tables

**Goal:** Create tenants, organizations tables and update workspaces with organization_id

- [ ] **CORE-01**: Create `tenants` table with id, name, type, settings, created_at, updated_at
- [ ] **CORE-02**: Create `organizations` table with id, tenant_id FK, name, business_type, registration_number, address, contact_email, status, created_at, updated_at
- [ ] **CORE-03**: Add `organization_id` (FK, nullable) to existing `workspaces` table
- [ ] **CORE-04**: Add `is_default` flag to organizations for default org per tenant
- [ ] **CORE-05**: Create seed data for platform tenant and default organization
- [ ] **CORE-06**: Update Prisma schema with all new models and relations
- [ ] **CORE-07**: Generate Prisma client after schema changes
- [ ] **CORE-08**: Write migration script to push schema changes

### Phase 59: Partner Model

**Goal:** Create partners and partner_members tables for partner organization management

- [ ] **PARTNER-01**: Create `partners` table with id, name, type, status, contact_email, phone, address, created_at, updated_at
- [ ] **PARTNER-02**: Create `partner_members` table with id, partner_id FK, user_id FK, role, status, created_at, updated_at
- [ ] **PARTNER-03**: Add `partner_id` FK to users table (nullable, for partner users)
- [ ] **PARTNER-04**: Create PartnerService for CRUD operations
- [ ] **PARTNER-05**: Create PartnerMemberService for member management
- [ ] **PARTNER-06**: Add partner seed data for MVP
- [ ] **PARTNER-07**: Write unit tests for PartnerService
- [ ] **PARTNER-08**: Write unit tests for PartnerMemberService

### Phase 60: Engagement System

**Goal:** Create engagements, service_types, service_scopes tables for partner-organization relationships

- [ ] **ENGAGE-01**: Create `service_types` table with id, name, slug, description, category, is_active
- [ ] **ENGAGE-02**: Create `partner_organization_engagements` table with id, partner_id FK, organization_id FK, status, start_date, end_date, created_at, updated_at
- [ ] **ENGAGE-03**: Create `engagement_service_scopes` table with id, engagement_id FK, service_type_id FK, permission_level (case_assigned, service_wide, full_access), created_at
- [ ] **ENGAGE-04**: Create ServiceTypeService for service type management
- [ ] **ENGAGE-05**: Create EngagementService for engagement CRUD
- [ ] **ENGAGE-06**: Seed default service types (trademark_registration, employment_contract, compliance_calendar, legal_consultation)
- [ ] **ENGAGE-07**: Write unit tests for EngagementService
- [ ] **ENGAGE-08**: Write unit tests for ServiceTypeService

### Phase 61: Request Enhancement

**Goal:** Add engagement_id, assigned_partner_id to requests and create request_assignments table

- [ ] **REQ-01**: Add `engagement_id` (FK, nullable) to `legal_requests` table
- [ ] **REQ-02**: Add `assigned_partner_id` (FK, nullable) to `legal_requests` table
- [ ] **REQ-03**: Create `request_assignments` table with id, request_id FK, partner_id FK, partner_member_id FK, assigned_at, assigned_by, status
- [ ] **REQ-04**: Update LegalRequest model in Prisma schema
- [ ] **REQ-05**: Create RequestAssignmentService for assignment management
- [ ] **REQ-06**: Update request creation flow to include engagement context
- [ ] **REQ-07**: Write unit tests for RequestAssignmentService
- [ ] **REQ-08**: Update existing request API routes to handle new fields

### Phase 62: RequestContext & Middleware

**Goal:** Create tenant-aware RequestContext and middleware for permission context building

- [ ] **CTX-01**: Define RequestContext type with tenantId, userId, platformRoles, organizationMemberships, partnerMemberships
- [ ] **CTX-02**: Create RequestContextBuilder service to construct context from session/token
- [ ] **CTX-03**: Create tenant middleware to extract and validate tenant from request
- [ ] **CTX-04**: Create auth middleware to extract user and build context
- [ ] **CTX-05**: Create organization context middleware to load user's organization memberships
- [ ] **CTX-06**: Create partner context middleware to load user's partner memberships
- [ ] **CTX-07**: Write unit tests for RequestContextBuilder
- [ ] **CTX-08**: Write unit tests for middleware chain

### Phase 63: Permission Service

**Goal:** Implement permission checking functions for resource access control

- [ ] **PERM-01**: Create PermissionService with canReadRequest, canWriteRequest, canReadFile, canWriteFile methods
- [ ] **PERM-02**: Implement platform role checks (platform_admin, platform_staff)
- [ ] **PERM-03**: Implement organization role checks (owner, admin, member, viewer)
- [ ] **PERM-04**: Implement partner permission level checks (case_assigned, service_wide, full_access)
- [ ] **PERM-05**: Implement request assignment checks for partner users
- [ ] **PERM-06**: Create PermissionMiddleware to inject permission checks into API routes
- [ ] **PERM-07**: Write unit tests for PermissionService
- [ ] **PERM-08**: Write integration tests for permission middleware

### Phase 64: Repository Pattern

**Goal:** Implement tenant-aware repositories for all domain entities

- [ ] **REPO-01**: Create base Repository class with tenant context injection
- [ ] **REPO-02**: Create OrganizationRepository with tenant-aware queries
- [ ] **REPO-03**: Create WorkspaceRepository with organization filtering
- [ ] **REPO-04**: Create LegalRequestRepository with tenant and permission filtering
- [ ] **REPO-05**: Create FileRepository with organization and permission filtering
- [ ] **REPO-06**: Create PartnerRepository with engagement joins
- [ ] **REPO-07**: Update all existing API routes to use repositories
- [ ] **REPO-08**: Write unit tests for repositories

### Phase 65: Data Migration

**Goal:** Migrate existing data to new multi-tenant model

- [ ] **MIGR-01**: Create migration script to create default organization for existing workspaces
- [ ] **MIGR-02**: Migrate all existing workspaces to link to default organization
- [ ] **MIGR-03**: Create script to backfill tenant_id on existing records
- [ ] **MIGR-04**: Validate migration results with count checks
- [ ] **MIGR-05**: Create rollback script for migration
- [ ] **MIGR-06**: Document migration steps for production deployment
- [ ] **MIGR-07**: Write integration tests for migration scripts
- [ ] **MIGR-08**: Update seed scripts to generate multi-tenant test data

### Phase 66: Partner Auth

**Goal:** Implement partner login and dashboard overview

- [ ] **P-AUTH-01**: Create partner login API endpoint with email/password
- [ ] **P-AUTH-02**: Create partner JWT token generation with partner context
- [ ] **P-AUTH-03**: Create partner logout API endpoint
- [ ] **P-AUTH-04**: Create partner session validation endpoint
- [ ] **P-AUTH-05**: Create partner dashboard API with engagement summary
- [ ] **P-AUTH-06**: Build partner login UI component
- [ ] **P-AUTH-07**: Build partner dashboard UI component
- [ ] **P-AUTH-08**: Write E2E tests for partner authentication flow

### Phase 67: Partner Requests

**Goal:** Implement partner request list and detail views

- [ ] **P-REQ-01**: Create API endpoint to list requests assigned to partner
- [ ] **P-REQ-02**: Create API endpoint to get request details (with permission check)
- [ ] **P-REQ-03**: Create API endpoint to list requests by engagement/service type
- [ ] **P-REQ-04**: Build partner request list UI with search and filters
- [ ] **P-REQ-05**: Build partner request detail UI component
- [ ] **P-REQ-06**: Implement request status display with appropriate badges
- [ ] **P-REQ-07**: Write unit tests for partner request APIs
- [ ] **P-REQ-08**: Write E2E tests for partner request views

### Phase 68: Partner Actions

**Goal:** Implement partner actions on requests (status update, document upload)

- [ ] **P-ACT-01**: Create API endpoint for partner to update request status
- [ ] **P-ACT-02**: Create API endpoint for partner to add request comments
- [ ] **P-ACT-03**: Create API endpoint for partner to upload documents to request
- [ ] **P-ACT-04**: Implement permission validation for partner actions
- [ ] **P-ACT-05**: Build partner request action UI (status change, add comment)
- [ ] **P-ACT-06**: Build partner document upload UI component
- [ ] **P-ACT-07**: Write unit tests for partner action APIs
- [ ] **P-ACT-08**: Write E2E tests for partner document upload

### Phase 69: Organization Management

**Goal:** Create organization management UI for organization admins

- [ ] **ORG-01**: Create API endpoint to list organizations (platform admin)
- [ ] **ORG-02**: Create API endpoint to get organization details
- [ ] **ORG-03**: Create API endpoint to create organization
- [ ] **ORG-04**: Create API endpoint to update organization
- [ ] **ORG-05**: Build organization list UI for platform admin
- [ ] **ORG-06**: Build organization form UI (create/edit)
- [ ] **ORG-07**: Build organization settings UI for org admin
- [ ] **ORG-08**: Write unit tests for organization APIs

### Phase 70: User Management v2

**Goal:** Enhanced user management with organization context

- [ ] **USER-01**: Create API endpoint to list users with organization filter
- [ ] **USER-02**: Create API endpoint to create user with organization context
- [ ] **USER-03**: Create API endpoint to update user with organization context
- [ ] **USER-04**: Build user list UI with organization filter
- [ ] **USER-05**: Build user form UI (create/edit) with organization selector
- [ ] **USER-06**: Build user profile UI with organization membership display
- [ ] **USER-07**: Add organization context to user session
- [ ] **USER-08**: Write unit tests for user management APIs

### Phase 71: Create Request v2

**Goal:** New request creation UI with organization and engagement context

- [ ] **CREQ-01**: Create API endpoint to list available service types for organization
- [ ] **CREQ-02**: Create API endpoint to submit request with organization context
- [ ] **CREQ-03**: Build service type selection UI with descriptions
- [ ] **CREQ-04**: Build request wizard UI (4 steps) with organization context
- [ ] **CREQ-05**: Implement request submission with engagement tracking
- [ ] **CREQ-06**: Build request confirmation UI component
- [ ] **CREQ-07**: Write unit tests for request creation APIs
- [ ] **CREQ-08**: Write E2E tests for request creation flow

### Phase 72: Workspace Management v2

**Goal:** Enhanced workspace management with organization hierarchy

- [ ] **WS-01**: Create API endpoint to list workspaces with organization filter
- [ ] **WS-02**: Create API endpoint to create workspace within organization
- [ ] **WS-03**: Create API endpoint to update workspace
- [ ] **WS-04**: Build workspace list UI with organization grouping
- [ ] **WS-05**: Build workspace form UI (create/edit) with organization selector
- [ ] **WS-06**: Build workspace settings UI with member management
- [ ] **WS-07**: Implement workspace member invitation flow
- [ ] **WS-08**: Write unit tests for workspace APIs

---

## Legacy UI Enhancement Requirements

These phases enhance existing UIs with organization/partner context.

### Phase 73: Settings (User)

- [ ] **SET-01**: User can view and edit profile (name, email, phone, title)
- [ ] **SET-02**: User can change password with current password verification
- [ ] **SET-03**: User can toggle notifications (emailOnReply, slaReminder, weeklySummary)
- [ ] **SET-04**: User can change language preference (VI/EN/ZH/JA)
- [ ] **SET-05**: User can view own audit log entries
- [ ] **SET-06**: Settings form validates input and shows errors inline

### Phase 74: User Management (Admin)

- [ ] **ADM-USER-01**: Admin can view list of all users with pagination
- [ ] **ADM-USER-02**: Admin can search users by name/email
- [ ] **ADM-USER-03**: Admin can filter users by role
- [ ] **ADM-USER-04**: Admin can filter users by organization
- [ ] **ADM-USER-05**: Admin can view user details with organization context
- [ ] **ADM-USER-06**: Admin can create new user with organization assignment
- [ ] **ADM-USER-07**: Admin can edit user role and organization
- [ ] **ADM-USER-08**: Admin can deactivate/reactivate user account
- [ ] **ADM-USER-09**: User table shows correct stat counts by organization

### Phase 75: My Cases (User)

- [ ] **MYCASE-01**: User sees summary banner with total cases count
- [ ] **MYCASE-02**: User sees stat cards (Tong, Dang xu ly, Hoan tat, Qua han)
- [ ] **MYCASE-03**: User can search cases by code or type
- [ ] **MYCASE-04**: User can filter cases by status
- [ ] **MYCASE-05**: User can filter cases by type
- [ ] **MYCASE-06**: Cases table shows 7 columns
- [ ] **MYCASE-07**: User can click case to view details
- [ ] **MYCASE-08**: Pagination works with page size of 10
- [ ] **MYCASE-09**: Empty state shows when no cases match filter

### Phase 76: Dashboard (User)

- [ ] **U-DASH-01**: Dashboard shows 4 stat cards with real counts
- [ ] **U-DASH-02**: Welcome banner shows organization and workspace name
- [ ] **U-DASH-03**: Recent cases panel shows 5 most recent cases
- [ ] **U-DASH-04**: Deadline/SLA panel shows upcoming deadlines
- [ ] **U-DASH-05**: Recent documents panel shows latest vault files
- [ ] **U-DASH-06**: Activity timeline shows recent actions
- [ ] **U-DASH-07**: Floating chat button shows unread message count
- [ ] **U-DASH-08**: Clicking stat cards navigates to relevant page

### Phase 77: Request Management (Admin)

- [ ] **ADM-REQ-01**: Admin sees all requests with organization filtering
- [ ] **ADM-REQ-02**: Admin can search requests by code
- [ ] **ADM-REQ-03**: Admin can filter requests by status
- [ ] **ADM-REQ-04**: Admin can filter requests by type
- [ ] **ADM-REQ-05**: Admin can assign specialist or partner to request
- [ ] **ADM-REQ-06**: Admin can change request status
- [ ] **ADM-REQ-07**: Admin can view request details
- [ ] **ADM-REQ-08**: Request table shows priority badges
- [ ] **ADM-REQ-09**: Pagination works with page size of 20

### Phase 78: Admin Dashboard

- [ ] **ADM-DASH-01**: Admin sees 4 stat cards with real counts by organization
- [ ] **ADM-DASH-02**: Workload panel shows specialist workloads
- [ ] **ADM-DASH-03**: Alert panel shows system alerts
- [ ] **ADM-DASH-04**: Organization panel shows summary
- [ ] **ADM-DASH-05**: Approval panel shows pending approvals
- [ ] **ADM-DASH-06**: Audit timeline shows recent audit events
- [ ] **ADM-DASH-07**: Clicking stat cards navigates to relevant admin pages
- [ ] **ADM-DASH-08**: Floating chat shows alert count

### Phase 79: Operations (Admin)

- [ ] **ADM-OPS-01**: Operations page shows stat cards
- [ ] **ADM-OPS-02**: Workload panel shows specialist assignments
- [ ] **ADM-OPS-03**: Audit timeline shows recent operations
- [ ] **ADM-OPS-04**: Operations table shows requests with SLA bars
- [ ] **ADM-OPS-05**: SLA bars are color-coded
- [ ] **ADM-OPS-06**: Admin can filter by specialist
- [ ] **ADM-OPS-07**: Admin can sort by SLA deadline

### Phase 80: Messages (User)

- [ ] **MSG-01**: Messages page shows 3-column layout
- [ ] **MSG-02**: Thread list shows all message threads
- [ ] **MSG-03**: User can select thread to view messages
- [ ] **MSG-04**: Chat panel shows message history
- [ ] **MSG-05**: User can send new message in chat
- [ ] **MSG-06**: Info panel shows request metadata
- [ ] **MSG-07**: Unread message count badge shows on thread
- [ ] **MSG-08**: User can close info panel

### Phase 81: Audit (Admin)

- [ ] **ADM-AUD-01**: Audit page shows 4 stat cards
- [ ] **ADM-AUD-02**: Security notice explains safe display
- [ ] **ADM-AUD-03**: Control alerts show security metrics
- [ ] **ADM-AUD-04**: Activity timeline shows recent events
- [ ] **ADM-AUD-05**: Audit table shows 7 columns
- [ ] **ADM-AUD-06**: Admin can search by actor or target
- [ ] **ADM-AUD-07**: Admin can filter by action type
- [ ] **ADM-AUD-08**: Admin can filter by date range
- [ ] **ADM-AUD-09**: Pagination works with page size of 50
- [ ] **ADM-AUD-10**: Correlation IDs shown in monospace font

### Phase 82: Vault (Admin)

- [ ] **VAULT-01**: Vault page shows stat cards
- [ ] **VAULT-02**: Folder panel shows folder tree
- [ ] **VAULT-03**: Tag panel shows classification tags
- [ ] **VAULT-04**: Vault table shows files
- [ ] **VAULT-05**: Admin can search files by name
- [ ] **VAULT-06**: Admin can filter by folder
- [ ] **VAULT-07**: Admin can filter by tag
- [ ] **VAULT-08**: Admin can upload new file to vault
- [ ] **VAULT-09**: Admin can download file (signed URL)
- [ ] **VAULT-10**: Admin can create folder
- [ ] **VAULT-11**: Admin can create tag
- [ ] **VAULT-12**: Security badges show encryption/permission status

### Phase 83: Workspace Management (Admin)

- [ ] **ADM-WS-01**: Admin can view all workspaces with organization grouping
- [ ] **ADM-WS-02**: Admin can search workspaces by name
- [ ] **ADM-WS-03**: Admin can view workspace details
- [ ] **ADM-WS-04**: Admin can create new workspace
- [ ] **ADM-WS-05**: Admin can invite member by email
- [ ] **ADM-WS-06**: Admin can change member role
- [ ] **ADM-WS-07**: Admin can remove member
- [ ] **ADM-WS-08**: Admin can deactivate workspace

---

## Traceability Matrix

| Phase | Requirements | Type | Status |
|-------|-------------|------|--------|
| 55 | ARCH-01 to ARCH-17 | Documentation | Completed |
| 56 | STORAGE-01 to STORAGE-08 | Infrastructure | Completed |
| 57 | ARCH-ARCH-01 to ARCH-ARCH-04 | Architecture | Completed |
| 58 | CORE-01 to CORE-08 | Backend | Pending |
| 59 | PARTNER-01 to PARTNER-08 | Backend | Pending |
| 60 | ENGAGE-01 to ENGAGE-08 | Backend | Pending |
| 61 | REQ-01 to REQ-08 | Backend | Pending |
| 62 | CTX-01 to CTX-08 | Backend | Pending |
| 63 | PERM-01 to PERM-08 | Backend | Pending |
| 64 | REPO-01 to REPO-08 | Backend | Pending |
| 65 | MIGR-01 to MIGR-08 | Data | Pending |
| 66 | P-AUTH-01 to P-AUTH-08 | Frontend+Backend | Pending |
| 67 | P-REQ-01 to P-REQ-08 | Frontend+Backend | Pending |
| 68 | P-ACT-01 to P-ACT-08 | Frontend+Backend | Pending |
| 69 | ORG-01 to ORG-08 | Frontend+Backend | Pending |
| 70 | USER-01 to USER-08 | Frontend+Backend | Pending |
| 71 | CREQ-01 to CREQ-08 | Frontend+Backend | Pending |
| 72 | WS-01 to WS-08 | Frontend+Backend | Pending |

---

## Coverage Summary

- **Total phases:** 28 (Foundation 3 + Implementation 15 + Legacy 10)
- **Total requirements:** ~250
- **Completed:** 21 (17 ARCH + 8 STORAGE + 4 ARCH-ARCH)
- **Pending:** ~229

---
*Requirements defined: 2026-06-14*
*Last updated: 2026-06-14 during Phase 57 discussion*
