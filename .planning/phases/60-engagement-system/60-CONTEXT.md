# Phase 60: Engagement System — Context

**Phase:** 60
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Mode:** auto (from Phase 57 architecture)
**Source:** Phase 57 architecture decisions

## Domain

**Engagement System Implementation** — Create engagements, service_types, service_scopes for partner-organization relationships.

**Note:** This is a **backend-only phase** — database schema changes only. No UI components for this phase.

---

## Decisions Made (from Phase 57)

### Partner Access Model
**Decision:** Engagement-based + Direct Assignment (Hybrid)
- Partner sees data via: active engagement + service scope + request assignment
- Permission levels: case_assigned, service_wide, full_access

### Data Ownership
**Decision:** Organization owns all data
- Partner does NOT own data
- Partner accesses data via engagement + assignment

---

## Schema Changes

### New Models

```prisma
model ServiceType {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  engagements EngagementServiceScope[]
  
  @@map("service_types")
}

model Engagement {
  id             String   @id @default(cuid())
  partnerId     String
  organizationId String
  status        String   @default("active")  // active, inactive, pending
  startDate     DateTime?
  endDate       DateTime?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  partner       Partner       @relation(fields: [partnerId], references: [id])
  organization  Organization  @relation(fields: [organizationId], references: [id])
  serviceScopes EngagementServiceScope[]
  
  @@unique([partnerId, organizationId])
  @@index([partnerId])
  @@index([organizationId])
  @@map("engagements")
}

model EngagementServiceScope {
  id            String      @id @default(cuid())
  engagementId String
  serviceTypeId String
  permissionLevel String   @default("case_assigned")  // case_assigned, service_wide, full_access
  createdAt     DateTime    @default(now())
  
  engagement   Engagement   @relation(fields: [engagementId], references: [id])
  serviceType  ServiceType @relation(fields: [serviceTypeId], references: [id])
  
  @@unique([engagementId, serviceTypeId])
  @@index([engagementId])
  @@index([serviceTypeId])
  @@map("engagement_service_scopes")
}
```

---

## TypeScript Types

```typescript
// New types in src/lib/types/

interface ServiceType {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Engagement {
  id: string;
  partnerId: string;
  organizationId: string;
  status: EngagementStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EngagementServiceScope {
  id: string;
  engagementId: string;
  serviceTypeId: string;
  permissionLevel: PermissionLevel;
  createdAt: Date;
}

type EngagementStatus = 'active' | 'inactive' | 'pending';
type PermissionLevel = 'case_assigned' | 'service_wide' | 'full_access';
```

---

## Canonical Refs

- `prisma/schema.prisma` — Current database schema (Phase 59)
- `src/lib/types/` — Existing type definitions (Phase 59)
- `.planning/phases/57-shared-tenant-architecture/57-CONTEXT.md` — Architecture decisions
- `.planning/ROADMAP.md` — Phase 60 success criteria

---

## Auto-Resolved Decisions

[auto] [Partner Access] — Engagement-based + Direct Assignment (from Phase 57)
[auto] [Database] — Keep SQLite (from Phase 57)
[auto] [Migration] — Incremental per phase (from Phase 57)

---
