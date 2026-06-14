# Phase 57: Shared Tenant Architecture — Discussion Log

**Phase:** 57
**Mode:** discuss-phase
**Date:** 2026-06-14

## Discussion Summary

User provided full architecture document (`docs/shared_customer_partner_collaboration.md`) for implementing Shared Customer + Partner Collaboration model. Discussion focused on clarifying the architecture decisions before planning.

## Decisions Made

### 1. Database Technology
- **Decision:** Keep SQLite (defer PostgreSQL)
- **Rationale:** MVP scope, simpler operations. Can migrate after validating the model.

### 2. Organization vs Workspace Model
- **Decision:** Organization = Company, Workspace = Team inside Organization
- **Structure:**
  ```
  Organization (SME Company)
    └── Workspace A (Legal Team)
    └── Workspace B (HR Team)
    └── Workspace C (Finance Team)
  ```

### 3. Organization Creation Flow
- **Decision:** Organization được tạo sau khi user xác nhận công ty với giấy tờ
- **Flow:** User mới → Default Organization → Xác nhận công ty → Real Organization
- **Migration:** Thêm bảng Organization, Workspace giữ nguyên và thêm organization_id

### 4. Partner Model
- **Decision:** Partner không có workspace riêng
- Partner chỉ có member list
- Partner làm việc trong workspace của organization khi được assign
- Partner có dashboard riêng để quản lý engagements và requests

### 5. Partner Access Model
- **Decision:** Engagement-based + Direct Assignment (Hybrid)
- Permission levels: case_assigned, service_wide, full_access

### 6. Phase Structure
- **Decision:** Many small vertical slices (20-30 phases)
- Each phase = complete vertical slice
- Each phase = working feature when done
- Enables parallel development and faster value delivery

### 7. Phase 57 Scope
- **Decision:** Phase 57 does NOT implement source code
- Phase 57 = Define system architecture and divide into small phases
- Define domain models, schema, and phase breakdown
- Subsequent phases implement one vertical slice at a time

## Phase Breakdown

```
Phase 57: Architecture Definition (THIS PHASE) - Define models & phases
Phase 58: Core Tables - tenants, organizations, workspaces
Phase 59: Partner Model - partners, partner_members
Phase 60: Engagement System - engagements, service_scopes
Phase 61: Request Enhancement - request_assignments
Phase 62: RequestContext & Middleware - permission context
Phase 63: Permission Service - permission checking
Phase 64: Repository Pattern - tenant-aware repositories
Phase 65: Partner Portal - Auth
Phase 66: Partner Portal - Requests View
Phase 67: Partner Portal - Actions
Phase 68: Organization Management UI
[Continue with more phases...]
```

## Scope Creep Handled

None - all suggestions were within the architecture definition scope.

## Deferred Ideas

- PostgreSQL migration (after validating model)
- API clients for partners
- Webhooks for partners
- Advanced workflow inheritance (3-tier)

---
*Log created: 2026-06-14*
*Updated: 2026-06-14 (decisions captured)*
