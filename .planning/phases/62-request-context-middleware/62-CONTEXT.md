# Phase 62: RequestContext & Middleware — Context

**Phase:** 62
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Mode:** auto (from Phase 57 architecture)
**Source:** Phase 57 architecture decisions

## Domain

**RequestContext & Middleware Implementation** — Create tenant-aware RequestContext and middleware for permission context building.

**Note:** This is a **backend-only phase** — middleware and context services only. No UI components for this phase.

---

## Decisions Made (from Phase 57)

### Multi-Tenant Context
**Decision:** Every API request needs context about:
- Current user (from session)
- Current workspace
- Current organization
- Current tenant (platform)
- Partner context (if user is a partner member)

### Permission Context
**Decision:** PermissionService needs context to check:
- Is user a platform admin?
- Is user an organization admin?
- Is user a workspace member?
- Is user a partner with access to this resource?

---

## Schema Changes

### New Types

```typescript
interface RequestContext {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
  workspace?: {
    id: string;
    slug: string;
    organizationId?: string;
  };
  organization?: {
    id: string;
    tenantId: string;
  };
  tenant?: {
    id: string;
    type: string;
  };
  partner?: {
    id: string;
    role: string;
    engagements: string[];
  };
}
```

### New Middleware

```typescript
// Tenant middleware - extracts tenant context
// Auth middleware - validates session and user
// Organization context middleware - extracts org from workspace
// Partner context middleware - extracts partner from user membership
```

---

## Services to Create

1. **RequestContextBuilder** — Builds permission context from request
2. **TenantMiddleware** — Extracts and validates tenant context
3. **AuthMiddleware** — Validates user session
4. **OrganizationContextMiddleware** — Extracts organization context
5. **PartnerContextMiddleware** — Extracts partner context

---

## Canonical Refs

- `src/app/api/` — Existing API routes
- `src/lib/types/` — Type definitions (Phases 58-61)
- `.planning/phases/57-shared-tenant-architecture/57-CONTEXT.md` — Architecture decisions
- `.planning/ROADMAP.md` — Phase 62 success criteria

---

## Auto-Resolved Decisions

[auto] [Context Model] — Centralized RequestContext (from Phase 57)
[auto] [Middleware Chain] — Sequential middleware (from Phase 57)
[auto] [Database] — Keep SQLite (from Phase 57)

---
