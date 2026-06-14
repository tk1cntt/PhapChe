# Phase 58: Core Tables — Context

**Phase:** 58
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Mode:** auto (from Phase 57)
**Source:** Phase 57 architecture decisions

## Domain

**Core Tables Implementation** — Create the foundational multi-tenant database tables: tenants, organizations, and update workspaces with organization_id.

**Note:** This is a **backend-only phase** — database schema changes only. No UI components for this phase.

---

## Decisions Made

### 1. Database Technology
**Decision:** Keep SQLite (defer PostgreSQL)
- Rationale: MVP scope, simpler operations
- Future: Can migrate after validating the model

### 2. Tenant Model
**Decision:** Tenant = Platform (single platform operator)
- Multiple Organizations per Tenant
- Each Organization has its own data isolation

### 3. Organization Model
**Decision:** Organization = Company (SME customer)
```
Tenant (Platform)
  └── Organization A (SME Company)
        └── Workspace A1 (Legal Team)
        └── Workspace A2 (HR Team)
  └── Organization B (SME Company)
        └── Workspace B1 (Finance Team)
```

### 4. Default Organization
**Decision:** User mới → Default Organization → Xác nhận công ty → Real Organization
- `is_default` flag on Organization
- First organization for a tenant is default

### 5. Migration Strategy
**Decision:** Incremental migration per phase
- Each phase implements its feature and migrates data gradually
- No big-bang migration

### 6. Organization Status Values
**Decision:** Organization status values: `active`, `inactive`, `pending`
- `pending` = chờ xác nhận giấy tờ
- `active` = đã xác nhận
- `inactive` = tạm ngưng

### 7. Workspace-Organization Relationship
**Decision:** Many-to-one (Workspace belongs to Organization)
- One Organization can have multiple Workspaces
- One Workspace belongs to exactly one Organization
- `organizationId` is nullable FK (existing workspaces may not have org yet)

---

## Schema Changes

### New Models

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  type      String   @default("platform")
  settings  String   @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  organizations Organization[]
}

model Organization {
  id                 String   @id @default(cuid())
  tenantId           String
  name               String
  businessType       String?
  registrationNumber String?
  address            String?
  contactEmail       String?
  status             String   @default("active")
  isDefault          Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  
  tenant     Tenant     @relation(fields: [tenantId], references: [id])
  workspaces Workspace[]
  
  @@index([tenantId])
  @@index([status])
}
```

### Modified Models

```prisma
model Workspace {
  // ... existing fields ...
  
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
  
  @@index([organizationId])
}
```

---

## TypeScript Types

```typescript
// New types to add in src/lib/types/

interface Tenant {
  id: string;
  name: string;
  type: 'platform';
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Organization {
  id: string;
  tenantId: string;
  name: string;
  businessType?: string;
  registrationNumber?: string;
  address?: string;
  contactEmail?: string;
  status: 'active' | 'inactive' | 'pending';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Updated types
interface Workspace {
  // ... existing fields ...
  organizationId?: string;
  organization?: Organization;
}
```

---

## API Endpoints

### Tenant Endpoints (Platform Admin Only)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tenants | List all tenants |
| GET | /api/tenants/:id | Get tenant by ID |

### Organization Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/organizations | List organizations (filtered by tenant) |
| GET | /api/organizations/:id | Get organization by ID |
| POST | /api/organizations | Create organization |
| PATCH | /api/organizations/:id | Update organization |
| DELETE | /api/organizations/:id | Soft delete organization |

---

## Services to Create

1. **TenantService** — CRUD operations for tenants
2. **OrganizationService** — CRUD operations for organizations

---

## Implementation Tasks

1. Add Tenant model to Prisma schema
2. Add Organization model to Prisma schema
3. Update Workspace model with organizationId FK
4. Add @@index for foreign keys
5. Run Prisma migration
6. Generate TypeScript types
7. Create TenantService
8. Create OrganizationService
9. Create API routes for tenants
10. Create API routes for organizations
11. Add seed data for platform tenant
12. Write unit tests

---

## Canonical Refs

- `prisma/schema.prisma` — Current database schema
- `.planning/phases/57-shared-tenant-architecture/57-CONTEXT.md` — Architecture decisions
- `src/lib/types/` — Existing type definitions
- `src/lib/services/` — Existing service patterns
- `src/app/api/` — Existing API route patterns

---

## Auto-Resolved Decisions

[auto] [Database Technology] — Q: "Keep SQLite or switch to PostgreSQL?" → Selected: "Keep SQLite" (recommended default)
[auto] [Organization Model] — Q: "Organization = Company?" → Selected: "Yes, Organization = Company" (matches Phase 57 decision)
[auto] [Migration Strategy] — Q: "Incremental or big-bang migration?" → Selected: "Incremental per phase" (recommended default)

---

*Context created: 2026-06-14*
*Source: Phase 57 architecture decisions + auto-resolved gray areas*
