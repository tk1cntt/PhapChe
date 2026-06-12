# Phase 40: v2 Route Scaffold — Specification

**Created:** 2026-06-13
**Ambiguity score:** 0.08
**Requirements:** 2 locked

## Goal

Create page.tsx skeletons for all 13 v2 routes (6 user + 7 admin) to establish the routing foundation before individual page implementations.

## Background

Phase 39 created src/v2/ structure with directories for all routes. Phase 40 now scaffolds page.tsx files so routes are accessible. Later phases will implement functionality in each page.

**Current state:**
- Route directories exist at src/v2/app/[locale]/ for all 13 routes
- All directories are empty (no page.tsx files)
- UserLayout and AdminLayout exist in src/components/

**Routes to scaffold:**

User Portal (6 routes):
1. `/[locale]/dashboard/page.tsx` - Customer dashboard
2. `/[locale]/create/page.tsx` - Create request wizard
3. `/[locale]/cases/page.tsx` - My cases list
4. `/[locale]/messages/page.tsx` - Messages/chat
5. `/[locale]/workspace/page.tsx` - Workspace settings
6. `/[locale]/settings/page.tsx` - User settings

Admin Portal (7 routes):
1. `/[locale]/admin/dashboard/page.tsx` - Admin dashboard
2. `/[locale]/admin/users/page.tsx` - User management
3. `/[locale]/admin/requests/page.tsx` - Request management
4. `/[locale]/admin/vault/page.tsx` - Document vault
5. `/[locale]/admin/audit/page.tsx` - Audit log
6. `/[locale]/admin/workspace/page.tsx` - Workspace management
7. `/[locale]/admin/operations/page.tsx` - Operations

## Requirements

1. **User Portal pages**: Create page.tsx skeletons importing UserLayout wrapper
2. **Admin Portal pages**: Create page.tsx skeletons importing AdminLayout wrapper

## Boundaries

**In scope:**
- Basic page.tsx files with layout wrappers
- Empty content (placeholder for now)
- Consistent structure across all routes

**Out of scope:**
- Page functionality
- API connections
- State management
- Styling details

## Acceptance Criteria

- [ ] All 13 routes have page.tsx
- [ ] User pages use UserLayout wrapper
- [ ] Admin pages use AdminLayout wrapper
- [ ] Pages are navigable without errors

## Ambiguity Report

| Dimension          | Score | Min  | Status |
|--------------------|-------|------|--------|
| Goal Clarity       | 1.0 | 0.75 | ✓      |
| Boundary Clarity  | 1.0 | 0.70 | ✓      |
| Constraint Clarity | 0.9 | 0.65 | ✓      |
| Acceptance Criteria| 1.0 | 0.70 | ✓      |
| **Ambiguity**      | 0.08 | ≤0.20| ✓      |

---

*Phase: 40-scaffold-v2-routes*
*Next step: /gsd-plan-phase 40*
