# Phase 61: Request Enhancement — Context

**Phase:** 61
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Mode:** auto (from Phase 57 architecture)
**Source:** Phase 57 architecture decisions

## Domain

**Request Enhancement Implementation** — Add engagement_id, assigned_partner_id to requests and create request_assignments for partner assignment tracking.

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

### Modified Models

```prisma
model LegalRequest {
  // ... existing fields ...
  
  engagementId       String?   // FK to Engagement
  assignedPartnerId  String?   // FK to Partner (direct assignment)
  
  engagement        Engagement? @relation(fields: [engagementId], references: [id])
  assignedPartner   Partner?    @relation(fields: [assignedPartnerId], references: [id])
}
```

### New Models

```prisma
model RequestAssignment {
  // Extended from existing RequestAssignment model
  // This phase enhances with partner assignment tracking
  
  partnerId         String?   // FK to Partner
  engagementId     String?   // FK to Engagement
  
  partner          Partner?   @relation(fields: [partnerId], references: [id])
  engagement       Engagement? @relation(fields: [engagementId], references: [id])
}
```

---

## TypeScript Types

```typescript
// Enhanced types in src/lib/types/request.ts

interface LegalRequest {
  // ... existing fields ...
  engagementId?: string;
  assignedPartnerId?: string;
}

interface RequestAssignment {
  // ... existing fields ...
  partnerId?: string;
  engagementId?: string;
}
```

---

## Canonical Refs

- `prisma/schema.prisma` — Current database schema (Phase 60)
- `src/lib/types/request.ts` — Existing request types (to be enhanced)
- `.planning/phases/57-shared-tenant-architecture/57-CONTEXT.md` — Architecture decisions
- `.planning/ROADMAP.md` — Phase 61 success criteria

---

## Auto-Resolved Decisions

[auto] [Partner Access] — Engagement-based + Direct Assignment (from Phase 57)
[auto] [Database] — Keep SQLite (from Phase 57)
[auto] [Migration] — Incremental per phase (from Phase 57)

---
