---
phase: 01-foundation
plan: 04
subsystem: ui
tags: [nextjs, react, tailwind, prisma, audit, workflow]
requires:
  - phase: 01-foundation
    provides: RBAC roles, append-only audit writer, backend request workflow transitions
provides:
  - Manual Tailwind admin shell with Vietnamese navigation
  - Users and Workspaces admin UI foundation
  - Requests UI constrained to backend allowed transitions
  - Audit timeline UI without raw legal content
  - Audited admin user management service
affects: [intake, routing, documents-vault, review, delivery, ops]
tech-stack:
  added: []
  patterns:
    - Manual Tailwind primitives instead of shadcn
    - Transactional audit via recordAuditEvent(input, tx)
key-files:
  created:
    - src/app/page.tsx
    - src/app/admin/components/admin-shell.tsx
    - src/app/admin/components/ui.tsx
    - src/lib/admin/users.ts
    - src/lib/admin/users.test.ts
    - src/app/admin/users/page.tsx
    - src/app/admin/workspaces/page.tsx
    - src/app/admin/requests/page.tsx
    - src/app/admin/audit/page.tsx
  modified: []
key-decisions:
  - "Use static safe sample rows for Phase 1 UI scaffold; no legal content included."
  - "Keep status mutation UI to buttons from getAllowedTransitions; no arbitrary dropdown."
patterns-established:
  - "Admin pages use AdminShell plus minimal Button, Badge, Card, Table primitives."
  - "Admin user mutations require coordinator_admin or super_admin and audit inside Prisma transaction."
requirements-completed: [FND-01, FND-02, FND-03, FND-04, FND-05]
duration: 30min
completed: 2026-05-26
---

# Phase 01 Plan 04: Admin UI Foundation Summary

**Vietnamese admin shell, user/workspace/request/audit pages, and audited admin user mutation service with backend workflow-safe controls**

## Performance

- **Duration:** 30 min
- **Started:** 2026-05-26T13:59:00Z
- **Completed:** 2026-05-26T14:29:50Z
- **Tasks:** 5
- **Files modified:** 9

## Accomplishments

- Created manual Tailwind admin shell and UI primitives without shadcn or third-party registry blocks.
- Added audited admin user management service for create, role update, deactivate, and workspace membership assignment.
- Added Users and Workspaces pages with Vietnamese copy, exact role labels, workspace visibility, and generic permission denied copy.
- Added Requests page using `getAllowedTransitions(sampleStatus)` buttons only, plus reason textarea and no status dropdown.
- Added Audit page showing timestamp, actor, workspace, action, target, correlation id, and metadata summary without raw legal content.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create admin shell and UI primitives** - `bf2c010` (feat)
2. **Task 2 RED: Create audited admin user management service tests** - `dc777a5` (test)
3. **Task 2 GREEN: Create audited admin user management service** - `dc1de51` (feat)
4. **Task 3: Create Users and Workspaces pages wired to backend contract** - `720923a` (feat)
5. **Task 4: Create Requests and Audit pages with workflow-safe controls** - `d2469ee` (feat)

_Note: Task 2 was TDD and has separate RED/GREEN commits._

## Files Created/Modified

- `src/app/page.tsx` - Root page linking to admin user management.
- `src/app/admin/components/admin-shell.tsx` - Admin header, responsive nav, desktop sidebar, D-07 server enforcement note.
- `src/app/admin/components/ui.tsx` - Minimal Button, Badge, Card, Table, PageHeader primitives.
- `src/lib/admin/users.ts` - Admin-only user/role/membership mutations with transactional audit.
- `src/lib/admin/users.test.ts` - Node test coverage for guard, role allowlist, audit transaction, and deactivate behavior.
- `src/app/admin/users/page.tsx` - Vietnamese Users UI with five role badges and backend service contract copy.
- `src/app/admin/workspaces/page.tsx` - Workspace visibility UI with exact permission denied copy.
- `src/app/admin/requests/page.tsx` - Workflow-safe request status UI using allowed transition buttons.
- `src/app/admin/audit/page.tsx` - Audit event table with safe metadata summary only.

## Decisions Made

- Used static safe sample rows for UI scaffold because plan requires UI foundation only and forbids deferred feature build-out.
- Kept Requests status changes as buttons from `getAllowedTransitions(sampleStatus)` to preserve backend-owned workflow rule.
- Used Node built-in test imports for TDD file to avoid adding test framework dependency outside plan scope.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- Initial RED test used Vitest, but project had no Vitest dependency. Replaced with Node built-in test API to keep dependency surface unchanged.
- TypeScript strictness required typed mock call extraction in `src/lib/admin/users.test.ts`.

## Auth Gates

None.

## Known Stubs

- `src/app/admin/users/page.tsx` - Static safe user rows are intentional UI scaffold samples from plan; no legal content.
- `src/app/admin/workspaces/page.tsx` - Static safe workspace rows are intentional UI scaffold samples from plan; no legal content.
- `src/app/admin/requests/page.tsx` - Static safe request rows and `sampleStatus` are intentional UI scaffold samples from plan; no legal content.
- `src/app/admin/audit/page.tsx` - Static safe audit rows are intentional UI scaffold samples from plan; metadata has identifiers/status summaries only.

## Threat Flags

None.

## Verification

- `npm run typecheck` passed after each implementation task.
- Acceptance greps passed for task 1 through task 4.
- Human-verify checkpoint auto-approved with `approved` after automated typecheck passed per auto-mode instruction.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin UI foundation visible for Phase 1 foundations.
- Later phases can wire real data/actions into existing pages while preserving backend RBAC, audit, and workflow boundaries.

## Self-Check: PASSED

- Created files exist.
- Task commits exist: `bf2c010`, `dc777a5`, `dc1de51`, `720923a`, `d2469ee`.
- No unexpected tracked deletions found in task commits.

---
*Phase: 01-foundation*
*Completed: 2026-05-26*
