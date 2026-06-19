# Phase 59: Partner Model — Context

**Phase:** 59
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Mode:** auto (from Phase 57 architecture)
**Source:** Phase 57 architecture decisions

## Domain

**Partner Model Implementation** — Create partners and partner_members tables for partner organization management.

**Note:** This is a **backend-only phase** — database schema changes and services only. No UI components for this phase.

---

## Decisions Made (from Phase 57)

### Partner Model
**Decision:** Partner không có workspace riêng
- Partner chỉ có member list
- Partner làm việc trong workspace của organization khi được assign
- Partner có dashboard riêng để quản lý engagements và requests được assign

### Data Ownership
**Decision:** Organization owns all data
- Partner does NOT own data
- Partner accesses data via engagement + assignment

---

## Schema Changes

### New Models

```prisma
model Partner {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  type        String   @default("law_firm")  // law_firm, consultancy, individual
  contactEmail String?
  phone       String?
  address     String?
  status      String   @default("active")  // active, inactive, pending
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     PartnerMember[]
  
  @@map("partners")
}

model PartnerMember {
  id         String   @id @default(cuid())
  partnerId  String
  userId     String
  role       String   @default("member")  // admin, member
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  partner    Partner  @relation(fields: [partnerId], references: [id])
  user       User    @relation(fields: [userId], references: [id])
  
  @@unique([partnerId, userId])
  @@index([partnerId])
  @@index([userId])
  @@map("partner_members")
}
```

---

## TypeScript Types

```typescript
// New types in src/lib/types/

interface Partner {
  id: string;
  name: string;
  slug: string;
  type: PartnerType;
  contactEmail?: string;
  phone?: string;
  address?: string;
  status: PartnerStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface PartnerMember {
  id: string;
  partnerId: string;
  userId: string;
  role: PartnerMemberRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Canonical Refs

- `prisma/schema.prisma` — Current database schema (Phase 58)
- `src/lib/types/` — Existing type definitions (Phase 58)
- `.planning/phases/57-shared-tenant-architecture/57-CONTEXT.md` — Architecture decisions
- `.planning/ROADMAP.md` — Phase 59 success criteria

---

## Auto-Resolved Decisions

[auto] [Partner Model] — Partner không có workspace riêng (from Phase 57)
[auto] [Database] — Keep SQLite (from Phase 57)
[auto] [Migration] — Incremental per phase (from Phase 57)

---
