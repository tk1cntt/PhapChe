# Phase 58: Core Tables — Context

**Phase:** 58
**Created:** 2026-06-14
**Mode:** From Phase 57 discussion
**Source:** Phase 57 architecture decisions

## Domain

**Core Tables Implementation** — Create the foundational multi-tenant database tables: tenants, organizations, and update workspaces with organization_id.

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

---

## Schema Changes

### New Tables

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  type      String   @default("platform")
  settings  Json     @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  organizations Organization[]
}

model Organization {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  businessType String?
  registrationNumber String?
  address   String?
  contactEmail String?
  status    String   @default("active")  // active, inactive, pending
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  workspaces Workspace[]
  engagements PartnerOrganizationEngagement[]
}
```

### Modified Tables

```prisma
model Workspace {
  // ... existing fields ...
  
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
}
```

---

## Implementation Plan

1. Create `Tenant` model with seed data for platform
2. Create `Organization` model with `tenantId` FK
3. Add `organizationId` to `Workspace` model
4. Add `isDefault` to Organization
5. Create Prisma migration
6. Generate seed data

---

## API Changes

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tenants | List tenants (platform admin) |
| GET | /api/organizations | List organizations |
| GET | /api/organizations/:id | Get organization details |
| POST | /api/organizations | Create organization |
| PATCH | /api/organizations/:id | Update organization |

---

## Canonical Refs

- `prisma/schema.prisma` — Current database schema
- `Phase 57 CONTEXT.md` — Architecture decisions
- `src/lib/types/` — Existing type definitions

---

*Context created: 2026-06-14*
*Source: Phase 57 architecture decisions*
