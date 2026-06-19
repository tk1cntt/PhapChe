# Phase 57: Shared Tenant Architecture — Context

**Phase:** 57
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Mode:** discuss-phase (completed)
**Source:** `docs/shared_customer_partner_collaboration.md`

## Domain

**Shared Customer + Partner Collaboration** — Multi-tenant architecture where customers own data, partners are authorized processors, and the platform orchestrates, controls, audits, and operates.

---

## Decisions Made

### 1. Database Technology
**Decision:** Keep SQLite (defer PostgreSQL)
- Rationale: MVP scope, simpler operations
- Future: Can migrate after validating the model

### 2. Organization vs Workspace Model
**Decision:** Organization = Company, Workspace = Team inside Organization
```
Organization (SME Company - công ty/doanh nghiệp)
  └── Workspace A (Legal Team - phòng pháp chất)
  └── Workspace B (HR Team - phòng nhân sự)
  └── Workspace C (Finance Team - phòng kế toán)
```
- Organization = Khách hàng SME (công ty/doanh nghiệp)
- Workspace = Team bên trong Organization (phòng ban, team)

### 3. Organization Creation Flow
**Decision:** Organization được tạo sau khi user xác nhận công ty với giấy tờ
- User mới → Default Organization → Xác nhận công ty với giấy tờ → Real Organization
- Migration: Thêm bảng Organization, Workspace giữ nguyên và thêm organization_id

### 4. Partner Model
**Decision:** Partner không có workspace riêng
- Partner chỉ có member list
- Partner làm việc trong workspace của organization khi được assign
- Partner có dashboard riêng để quản lý engagements và requests được assign

### 5. Partner Access Model
**Decision:** Engagement-based + Direct Assignment (Hybrid)
- Partner sees data via: active engagement + service scope + request assignment
- Permission levels: case_assigned, service_wide, full_access

### 6. Data Ownership
**Decision:** Organization owns all data
```
legal_requests.organization_id ✓
files.organization_id ✓
vault_files.organization_id ✓
workflow_instances.organization_id ✓
```

**NOT:** `file.partner_id = Partner X`
**YES:** `file.organization_id = Organization A` + permission via engagement

### 7. Migration Strategy
**Decision:** Incremental migration per phase
- Each phase implements its feature and migrates data gradually
- No big-bang migration
- Maintain backward compatibility during transition

### 8. Phase Structure
**Decision:** Many small vertical slices (20-30 phases)
- Each phase = complete vertical slice
- Each phase = working feature when done
- Enables parallel development and faster value delivery

### 9. Phase 57 Scope
**Decision:** Phase 57 does NOT implement source code
- Phase 57 = Define system architecture and divide into small phases
- Define domain models, schema, and phase breakdown
- Each subsequent phase implements one vertical slice

---

## Data Ownership Hierarchy

```
Tenant (Platform)
  └── Organization A (SME Company)
  │     └── Workspace A1 (Legal Team)
  │     └── Workspace A2 (HR Team)
  │
  └── Organization B (SME Company)
        └── Workspace B1 (Finance Team)

Partner X ← Engagement → Organization A
  - Service: trademark_registration (case_assigned)
  - Service: employment_contract (service_wide)

Partner Y ← Engagement → Organization A
  - Service: compliance_calendar (full_access)
```

---

## New Tables to Add

### Core Tables (Phase 57 planning only, implementation in subsequent phases)

| Table | Purpose | Phase |
|-------|---------|-------|
| `tenants` | Shared platform tenant | 57 (schema only) |
| `organizations` | Customer companies | 57 (schema only) |
| `partners` | Service providers | 57 (schema only) |
| `partner_members` | Users belonging to partners | 57 (schema only) |
| `partner_organization_engagements` | Partner-organization relationships | 57 (schema only) |
| `engagement_service_scopes` | Service types per engagement | 57 (schema only) |
| `service_types` | Catalog of business services | 57 (schema only) |
| `partner_service_types` | Partner service offerings | 57 (schema only) |

### Existing Tables to Modify

| Table | Changes |
|-------|---------|
| `Workspace` | Add `organization_id` (FK to Organization) |
| `WorkspaceMembership` | Add `tenant_id` |
| `User` | Add `partner_members` relation |
| `LegalRequest` | Add `engagement_id`, `assigned_partner_id` |
| `File` | Add `tenant_id`, `partner_id` for access tracking |

---

## RequestContext Structure

```typescript
type RequestContext = {
  tenantId: string;
  userId?: string;

  platformRoles: string[];  // platform_admin, platform_staff

  organizationMemberships: {
    organizationId: string;
    role: string;            // owner, admin, member, viewer
    permissions: string[];
  }[];

  partnerMemberships: {
    partnerId: string;
    role: string;            // owner, admin, legal_staff, viewer
    permissions: string[];
  }[];

  apiClientId?: string;
  scopes?: string[];
};
```

---

## Permission Rules

### Partner sees data when:
1. Has active engagement with organization
2. Engagement has matching service_type
3. Has appropriate permission_level:
   - `case_assigned`: Only assigned requests
   - `service_wide`: All requests of that service type
   - `full_access`: All organization data (rare, contractual)

### Platform roles:
- `platform_admin`: Full system access
- `platform_staff`: Support and operations access

### Organization roles:
- `owner`: Full organization control
- `admin`: Organization management
- `member`: Standard access
- `viewer`: Read-only access

### Partner roles:
- `owner`: Partner account management
- `admin`: Team management
- `legal_staff`: Request handling
- `viewer`: Read-only

---

## Proposed Phase Structure (Vertical Slices)

```
Phase 57: Architecture Definition (THIS PHASE)
  └── Define domain models, schema, phase breakdown
  └── No code implementation

Phase 58: Core Tables Implementation
  └── tenants, organizations, workspaces (updated)
  └── Seed data for MVP

Phase 59: Partner Model
  └── partners, partner_members
  └── Partner registration flow

Phase 60: Engagement System
  └── partner_organization_engagements
  └── engagement_service_scopes
  └── Service type management

Phase 61: Request Enhancement
  └── LegalRequest updates (engagement_id, assigned_partner_id)
  └── request_assignments table

Phase 62: RequestContext & Middleware
  └── RequestContext type and builder
  └── Tenant-aware middleware

Phase 63: Permission Service
  └── Permission checking functions
  └── canReadRequest, canReadFile, canWriteRequest

Phase 64: Repository Pattern
  └── Tenant-aware repositories
  └── LegalRequestRepository, FileRepository, etc.

Phase 65: Partner Portal - Auth
  └── Partner login
  └── Partner dashboard overview

Phase 66: Partner Portal - Requests
  └── View assigned requests
  └── Request detail view

Phase 67: Partner Portal - Actions
  └── Update request status
  └── Upload documents to request

Phase 68: Organization Management UI
  └── Create/edit organization
  └── Organization settings

[Continue with more phases as needed...]
```

---

## API Versioning

**Decision:** `/api/v1/...` with context-based access
- All APIs share same base path
- Permission determined by RequestContext
- No separate partner/organization API namespaces

---

## Deferred Ideas

These are captured for future phases:
- PostgreSQL migration (after validating model)
- API clients for partners
- Webhooks for partners
- Advanced workflow inheritance (3-tier)

---

## Canonical Refs

- `docs/shared_customer_partner_collaboration.md` — Primary architecture document
- `prisma/schema.prisma` — Current database schema
- `src/lib/types/` — Existing type definitions
- `src/docs/SERVICE_LAYER.md` — Service layer patterns

---

*Context created: 2026-06-14*
*Source: docs/shared_customer_partner_collaboration.md + discuss-phase decisions*
