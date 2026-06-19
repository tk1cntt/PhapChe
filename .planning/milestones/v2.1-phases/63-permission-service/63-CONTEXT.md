# Phase 63: Permission Service — Context

**Phase:** 63
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Mode:** auto (from Phase 57 architecture)
**Source:** Phase 57 architecture decisions

## Domain

**Permission Service Implementation** — Implement permission checking functions for resource access control based on multi-tenant context.

**Note:** This is a **backend-only phase** — permission service only. No UI components for this phase.

---

## Decisions Made (from Phase 57)

### Permission Model
**Decision:** PermissionService with canRead/canWrite methods
- Check platform role (super_admin)
- Check organization role
- Check partner permission level
- Check request assignment

### Partner Permission Levels
**Decision:** Three permission levels:
- `case_assigned` - Can only access specific assigned cases
- `service_wide` - Can access all cases for a specific service type
- `full_access` - Can access all cases under the engagement

---

## Permission Service API

```typescript
class PermissionService {
  // Check if user can read a request
  canReadRequest(ctx: RequestContext, requestId: string): Promise<boolean>
  
  // Check if user can write (update) a request
  canWriteRequest(ctx: RequestContext, requestId: string): Promise<boolean>
  
  // Check if user can access workspace
  canAccessWorkspace(ctx: RequestContext, workspaceId: string): Promise<boolean>
  
  // Check if user can manage organization
  canManageOrganization(ctx: RequestContext, organizationId: string): Promise<boolean>
  
  // Check if user is platform admin
  isPlatformAdmin(ctx: RequestContext): boolean
  
  // Check if user is organization admin
  isOrganizationAdmin(ctx: RequestContext, organizationId: string): Promise<boolean>
}
```

---

## Canonical Refs

- `src/lib/services/request-context-builder.ts` — Context builder (Phase 62)
- `src/lib/types/request-context.ts` — Context types (Phase 62)
- `.planning/phases/57-shared-tenant-architecture/57-CONTEXT.md` — Architecture decisions
- `.planning/ROADMAP.md` — Phase 63 success criteria

---

## Auto-Resolved Decisions

[auto] [Permission Model] — canRead/canWrite methods (from Phase 57)
[auto] [Permission Levels] — case_assigned, service_wide, full_access (from Phase 57)

---
