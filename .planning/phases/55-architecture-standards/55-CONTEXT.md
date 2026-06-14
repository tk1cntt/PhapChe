# Phase 55: Architecture & Standards — Context

**Phase:** 55
**Created:** 2026-06-14
**Domain:** Foundation — Development patterns, standards, shared components

## Goal

Establish consistent development patterns across the codebase: shared component registry, API standards, service layer separation, type safety, and code conventions that prevent ad-hoc implementation.

---

## Spec Lock

Requirements locked from `55-SPEC.md` (7 requirements). This context captures **implementation decisions only** — not requirements.

---

## Decisions

### 1. StatCard Extraction

**Decision:** Unify into single `src/components/ui/StatCard.tsx`

**Rationale:** 
- Single component reduces duplication
- Support 5 variants (blue/green/orange/purple/red)
- `i18n` prop optional — use `titleKey` for i18n, `title` for static strings
- Maintain backward compatibility with existing usage

### 2. Type Unification Structure

**Decision:** Organize by entity in `src/lib/types/`

**Structure:**
```
src/lib/types/
├── index.ts          # Re-exports all types
├── user.ts           # User, AppSession, notification preferences
├── workspace.ts      # Workspace, Membership, role mappings
├── request.ts        # LegalRequest, IntakeSubmission, Assignment
├── audit.ts          # AuditEvent, AuditTargetType
├── vault.ts          # VaultFile, DocumentVersion
└── review.ts         # Review, ChecklistAnswer
```

### 3. Component Registry Format

**Decision:** Markdown format

**Rationale:**
- Easy to read and maintain
- Auto-renders in GitHub/GitLab
- No build step needed
- 20+ components with props interface and usage examples

### 4. API Response Format

**Decision:** Envelope pattern with `{data, meta}` structure

**Standard response:**
```typescript
// Success
{
  data: T | T[],  // Response payload
  meta?: {         // Optional metadata
    page?: number,
    pageSize?: number,
    total?: number,
    cursor?: string
  }
}

// Error
{
  error: string,   // Error code (e.g., "FORBIDDEN", "NOT_FOUND")
  detail?: string  // Optional details for debugging
}
```

---

## Canonical Refs

- `src/lib/types.ts` — Current types file (will be migrated to `src/lib/types/`)
- `src/components/admin/AdminStatCard.tsx` — Admin variant to be unified
- `src/components/my-cases/StatCard.tsx` — User variant to be unified
- `src/components/ui/` — UI components directory (target for shared components)
- `src/lib/workflow/`, `src/lib/intake/`, `src/lib/documents/` — Existing service layers

---

## Code Context

### Existing Components in `src/components/ui/`
- `PageSkeleton.tsx` — Loading skeleton for pages
- `CardSkeleton.tsx` — Loading skeleton for cards
- `ErrorFallback.tsx` — Error boundary component
- `Paging.tsx` — Pagination component

### Existing Type Constants
- `REQUEST_STATUS` — Request workflow states
- `ROLE` — User roles (customer, specialist, reviewer, coordinator_admin, super_admin)
- `AUDIT_TARGET_TYPE` — Audit event target types
- `TEMPLATE_STATUS` — Template lifecycle states

### Service Layer Pattern
Services in `src/lib/[domain]/` with `index.ts` barrel exports:
- `workflow/request-workflow.ts` — State machine
- `intake/intake-service.ts` — Intake form handling
- `documents/vault-service.ts` — Vault operations
- `security/rbac.ts` — Access control

---

## Boundaries (from SPEC.md)

**In scope:**
- Documentation files (`src/docs/*.md`)
- Component registry (`src/components/COMPONENT_REGISTRY.md`)
- Shared component extraction (StatCard)
- Type unification in `src/lib/types/`
- Standards enforcement in new code

**Out of scope:**
- Retroactively fixing all existing components
- Creating new features
- Database schema changes
- Performance optimization
- Test coverage improvement

---

## Deferred Ideas

None captured — all gray areas resolved.

---

*Context captured: 2026-06-14*
*Next step: /gsd-plan-phase 55*
