# Phase 65: Data Migration — Context

**Phase:** 65
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Mode:** auto (from Phase 57 architecture)
**Source:** Phase 57 architecture decisions

## Domain

**Data Migration Implementation** — Migrate existing data to new multi-tenant model, linking workspaces to organizations and ensuring data consistency.

**Note:** This is a **migration phase** — data transformation script only. No UI components for this phase.

---

## Decisions Made (from Phase 57)

### Migration Strategy
**Decision:** Incremental migration per phase
- Each phase implements its feature and migrates data gradually
- No big-bang migration

### Data Ownership
**Decision:** Organization owns all data
- Existing workspaces need to be linked to organizations
- tenant_id backfill required

---

## Migration Tasks

1. **Link existing workspaces to default organization**
   - All existing workspaces → Default Organization (`platform-default-org`)

2. **Backfill tenant_id for organizations**
   - All organizations → Platform Tenant (`platform-tenant`)

3. **Validate migration**
   - Count checks before/after
   - Foreign key integrity

---

## Migration Scripts

```typescript
// prisma/migrate-to-multi-tenant.ts

async function migrateToMultiTenant() {
  // 1. Get platform tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: 'platform-tenant' }
  });

  // 2. Get default organization
  let org = await prisma.organization.findUnique({
    where: { id: 'platform-default-org' }
  });

  // 3. Create default org if not exists
  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: 'platform-default-org',
        tenantId: tenant.id,
        name: 'Default Organization',
        businessType: 'platform_internal',
        status: 'active',
        isDefault: true,
      }
    });
  }

  // 4. Link all workspaces to default organization
  const workspaces = await prisma.workspace.findMany({
    where: { organizationId: null }
  });

  for (const ws of workspaces) {
    await prisma.workspace.update({
      where: { id: ws.id },
      data: { organizationId: org.id }
    });
  }

  console.log(`Linked ${workspaces.length} workspaces to organization`);
}
```

---

## Canonical Refs

- `prisma/schema.prisma` — Current database schema (Phase 64)
- `.planning/phases/57-shared-tenant-architecture/57-CONTEXT.md` — Architecture decisions
- `.planning/ROADMAP.md` — Phase 65 success criteria

---

## Auto-Resolved Decisions

[auto] [Migration Strategy] — Incremental per phase (from Phase 57)
[auto] [Default Organization] — Use existing default org (from Phase 58)

---
