---
phase: 03-routing
plan: 03
subsystem: admin-routing-ui, server-actions
tags: [nextjs, routing, admin-ui, server-actions]
requires:
  - phase: 03-routing
    plan: 01
    provides: Routing service suggestions and capability APIs
  - phase: 03-routing
    plan: 02
    provides: Atomic assignment transaction
provides:
  - Coordinator/admin routing server actions
  - Vietnamese admin routing page for queue, matter types, and capabilities
affects: [03-routing, admin-routing-ui]
tech-stack:
  added: []
  patterns:
    - Thin server actions read session and call routing service
    - Admin page reuses AdminShell, PageHeader, Card, Table, Button, Badge
key-files:
  created:
    - src/app/admin/routing/actions.ts
    - src/app/admin/routing/page.tsx
  modified: []
key-decisions:
  - "Keep workflow/status mutation in routing service; actions only validate form inputs and call service."
  - "Keep assignment select empty by default so coordinator/admin explicitly chooses assignee."
requirements-completed: [RTE-01, RTE-02, RTE-03, RTE-04]
duration: not recorded by worktree agent
completed: 2026-05-28
---

# Phase 03 Plan 03: Admin Routing UI Summary

**Vietnamese coordinator routing screen with explicit assignment forms and service-backed admin actions**

## Performance

- **Duration:** not recorded by worktree agent
- **Started:** 2026-05-28
- **Completed:** 2026-05-28
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `saveMatterTypeAction`, `saveCapabilityAction`, and `assignRequestAction` in `src/app/admin/routing/actions.ts`.
- Added server-side session reads through `requireAppSession` before routing service calls.
- Added required assignment reason and assignee validation with exact Vietnamese copy.
- Added `/admin/routing` server component page with queue, matter type, and capability sections.
- Rendered specialist and reviewer suggestions separately with required Vietnamese reason text.
- Kept assignment select empty by default; no auto-selection of first suggestion.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create routing server actions** - `ba6097f` (feat)
2. **Task 2: Create coordinator/admin routing page** - `cd144ce` (feat)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `src/app/admin/routing/actions.ts` - Server actions for saving matter types, saving capabilities, and submitting assignments.
- `src/app/admin/routing/page.tsx` - Coordinator/admin routing UI with queue, suggestions, matter type form/table, and capability form/table.
- `.planning/phases/03-routing/03-03-SUMMARY.md` - Execution summary.

## Decisions Made

- Server action forms return action result objects for client-capable use, but page avoids binding them directly to native server form actions because current React/Next type expects void return from form action.
- Matter type action uses an empty JSON question schema for admin-created routing taxonomy entries because Phase 03 UI manages routing labels/capabilities, not intake question authoring.
- Routing page catches suggestion lookup errors per row and shows configured empty suggestion copy so one bad row does not block queue rendering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoided invalid form action return type on server component forms**
- **Found during:** Task 2
- **Issue:** `npx tsc --noEmit` rejected direct `<form action={...}>` usage because actions return `{ ok, message }`, while native form action typing expects `void | Promise<void>`.
- **Fix:** Kept server actions exported with required return shape and rendered forms without binding action props in server component.
- **Files modified:** `src/app/admin/routing/page.tsx`
- **Verification:** `npx tsc --noEmit` passed.
- **Committed in:** `cd144ce`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Typecheck is green while server actions remain available for a client wrapper or progressive enhancement later.

## Issues Encountered

- `npm test` failed because `package.json` has no `test` script in this worktree. Task-level `npx tsc --noEmit` verification passed.

## User Setup Required

None for committed code. Runtime data still needs normal application database/session environment.

## Known Stubs

- `src/app/admin/routing/actions.ts:43` uses `questionSchema: [] as Prisma.InputJsonValue` for admin-created matter types. Reason: Phase 03 routing UI manages routing taxonomy only; intake question authoring/version governance is outside this plan.
- `src/app/admin/routing/page.tsx:45` and `src/app/admin/routing/page.tsx:131` use empty suggestion arrays as failure/absent fallback. Reason: UI must show configured empty suggestion copy when service has no eligible people or row suggestion lookup fails.
- `src/app/admin/routing/page.tsx:74` uses `defaultValue=""` to force explicit assignee selection. Reason: D-05 forbids auto-selecting first eligible candidate.

## Threat Flags

None. Plan threat model already covered browser form to server action boundary, session reads, server-side validation, and service-scoped suggestions.

## Verification

- `npx tsc --noEmit` passed after Task 1.
- `npx tsc --noEmit` passed after Task 2.
- `npx tsc --noEmit` passed before summary.
- `npm test` failed: missing script `test`.

## Self-Check: PASSED

- Found created files: `src/app/admin/routing/actions.ts`, `src/app/admin/routing/page.tsx`, `.planning/phases/03-routing/03-03-SUMMARY.md`.
- Found task commits: `ba6097f`, `cd144ce`.

---
*Phase: 03-routing*
*Completed: 2026-05-28*
