# Phase 16: Failed Route Repair - Research

**Date:** 2026-06-06
**Status:** Ready for planning

## Research Goal

Plan how to fix the 14 routes that failed validated screenshot capture in quick task `260606-pfi`, without broadening scope into unrelated UI/typecheck cleanup.

## Evidence Sources

- `.planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/16-CONTEXT.md`
- `.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/260606-pfi-SUMMARY.md`
- `.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/validation-results.json`
- Failing route files under `src/app/**/page.tsx`

## Failure Categories

### 1. AntD Table render functions crossing Server/Client boundary

Affected routes:

- `/specialist/requests`
- `/reviewer/requests`

Evidence:

- Validation error: `Functions cannot be passed directly to Client Components... render: function render`.
- Source files define `columns` arrays with `render` functions inside async Server Components and pass them directly to AntD `Table`.

Recommended planning approach:

- Keep Prisma queries and `requireAppSession()` in Server Components.
- Move table rendering into small `'use client'` components that receive serializable row DTOs.
- Convert `Date` values to strings before crossing the boundary.
- Avoid marking whole route pages as client components because they use Prisma/server session helpers.

### 2. `Element type is invalid` in ops pages

Affected routes:

- `/admin/ops`
- `/admin/ops/[requestId]`

Evidence:

- Validation reports React runtime error in `OpsPage` and `OpsRequestTimelinePage`.
- Source uses AntD components imported from `antd` and server-rendered tables/cards.
- Likely causes to verify during execution: AntD component export mismatch under installed version, server/client boundary around components with render functions, or invalid component imported/used in page.

Recommended planning approach:

- Reproduce both pages in isolation.
- Identify exact undefined component or boundary causing invalid element.
- Apply minimal page-specific fix: client table component or import correction.
- Preserve ops service/data logic and safe audit metadata display.

### 3. Role mismatch / protected-route validation

Affected route:

- `/admin/routing`

Evidence:

- Validation used specialist demo user; route failed with `FORBIDDEN` from `requireRoutingAdmin`.

Recommended planning approach:

- Do not weaken authorization.
- Add/use coordinator_admin or super_admin demo session for admin route validation.
- If route intentionally denies specialist users, that behavior is correct but validation should exercise the route with an authorized role.

### 4. 404s on dynamic/admin routes

Affected routes:

- `/admin/templates`
- `/admin/templates/[templateId]`
- `/admin/templates/new`
- `/admin/users`
- `/admin/vault`
- `/customer/requests/[requestId]`
- `/requests/[requestId]`
- `/reviewer/requests/[requestId]/review/[documentVersionId]`
- `/specialist/requests/[requestId]`

Evidence:

- Validation discovered route files but browser got visible 404.
- Some 404s may be caused by role/session redirects/notFound behavior with the wrong user.
- Dynamic route IDs came from generic DB first rows, not necessarily owned/assigned to the current role.

Recommended planning approach:

- First distinguish real file-system/routing bug from intentional `notFound()` due to permissions/data ownership.
- Build role-aware validation fixture discovery:
  - admin user for admin pages
  - specialist user assigned to selected request
  - reviewer user assigned to selected review/document version
  - customer user owning selected request
- If minimal fixtures are missing, extend seed data or validation setup using existing Prisma schema.
- For valid seeded scenarios, routes must render page content/empty state; accidental raw 404 should be fixed.

## Existing Patterns

### Protected session pattern

Routes use `requireAppSession()` from `src/lib/security/session` and enforce role/workspace checks in server code. Phase 16 must preserve this pattern.

### App Router pattern

Pages live under `src/app/**/page.tsx`. Dynamic segments use params such as `[requestId]`, `[templateId]`, `[documentVersionId]`.

### Data access pattern

Server Components query Prisma directly or through `src/lib/**` services. This should remain server-side.

### UI pattern

Phase 14 migrated UI to Ant Design. Failing pages should continue using AntD, not revert to custom UI.

## Suggested Plan Breakdown

1. **Validation harness and fixtures**
   - Adapt the quick validation script for role-specific login/session and valid dynamic IDs.
   - Ensure each original failed route has a concrete validation scenario.

2. **Server/client table boundary fixes**
   - Fix `/specialist/requests`, `/reviewer/requests`, and likely ops table uses by moving table render functions into client components with serializable DTO props.

3. **Admin/dynamic route repairs**
   - Fix remaining 404/500 routes using role-correct fixtures and surgical page/service fixes.
   - Preserve authorization; do not bypass permissions for screenshots.

4. **Verification and screenshots**
   - Re-run validated capture.
   - Only save screenshots after PASS.
   - Update summary with before/after route statuses.

## Validation Architecture

Phase 16 verification should use the same principle as quick task `260606-pfi`: validate first, screenshot second.

Required validation dimensions:

1. **Route coverage:** Every route from the original 14-route fail list is visited.
2. **Role correctness:** Each route is visited with an appropriate seeded role/session.
3. **No accidental failures:** No HTTP 500, blank body, Next runtime overlay, or raw unexpected 404 for valid seeded scenarios.
4. **Intentional denied/empty states:** Access denied/empty/not-found states are acceptable only when deliberate, visible, and not a runtime/server error.
5. **Screenshot evidence:** Screenshots are captured only for routes that pass validation.
6. **Regression guard:** Previously passing routes from quick task can be spot-checked if touched by shared changes, but they are not the primary scope.

## Pitfalls

- Marking whole server pages as `'use client'` will break Prisma/session access.
- Using a single demo user will misclassify role-protected pages as broken.
- Placeholder dynamic IDs will produce false 404s.
- Broad typecheck cleanup can explode scope; only fix type errors that block route rendering.
- Do not weaken backend authorization just to make screenshots pass.

## Research Complete

File: `.planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/16-RESEARCH.md`
