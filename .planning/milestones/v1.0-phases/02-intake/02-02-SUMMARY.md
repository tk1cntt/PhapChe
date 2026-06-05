---
phase: 02-intake
plan: 02
subsystem: ui
tags: [nextjs, server-actions, intake, upload, rbac, status]

requires:
  - phase: 02-intake
    provides: Structured intake catalog, persistence service, RBAC-guarded submit workflow
provides:
  - Customer `/intake` route with service selection, questions, upload, review, and submit forms
  - Server actions for draft creation, answer save, file attach, and submit redirect
  - Private upload metadata service returning filename and size only
  - Read-only `/requests/[requestId]` customer status route with Vietnamese labels
  - TDD smoke coverage for action wiring and no public URL return

affects: [routing, customer-status, uploads, legal-vault]

tech-stack:
  added: []
  patterns:
    - Next.js Server Actions receiving FormData and delegating to intake services
    - Customer UI mirrors admin Button/Card/PageHeader primitives without new component library
    - Upload service derives workspace from authorized request and returns filename/size only

key-files:
  created:
    - src/app/intake/actions.test.ts
    - src/app/intake/actions.ts
    - src/lib/intake/upload-service.ts
    - src/app/intake/page.tsx
    - src/app/intake/components.tsx
    - src/app/requests/[requestId]/page.tsx
  modified: []

key-decisions:
  - "Kept upload action return shape limited to filename and size so customer UI cannot expose public file URLs."
  - "Used existing admin UI primitives for customer intake layout to match Phase 2 visual contract with minimal code."
  - "Status route performs server-side canAccessRequest before loading and renders no mutation controls."

patterns-established:
  - "Server actions parse only requestId/file/answer fields from FormData; workspace stays server-derived."
  - "Customer status copy maps every RequestStatus to Vietnamese label and guidance, never raw enum text."

requirements-completed: [INT-01, INT-02, INT-03, INT-04, INT-05, INT-06]

duration: 5min
completed: 2026-05-27
---

# Phase 02 Plan 02: Customer Intake UI and Status Summary

**Vietnamese customer intake flow with server-action mutations, private upload metadata, review submit, and RBAC-guarded read-only status page**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-27T17:20:50Z
- **Completed:** 2026-05-27T17:25:21Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added intake server actions for draft creation, answer save, upload attach, and submit redirect to `/requests/[requestId]`.
- Added private upload service that authorizes request access, derives workspace server-side, writes `VaultFile`, audits metadata, and returns filename/size only.
- Built `/intake` customer flow with Vietnamese copy, 4-step progress, service cards, guided questions, upload privacy note, review summary, and submit CTA.
- Added `/requests/[requestId]` read-only status route guarded by `canAccessRequest` with Vietnamese status labels and triage guidance.

## Task Commits

1. **Task 1 RED: Create server actions for intake mutations and upload wiring** - `7469518` (test)
2. **Task 1 GREEN: Create server actions for intake mutations and upload wiring** - `b07e613` (feat)
3. **Task 2: Build /intake flow with progress, upload, and review display** - `147a01a` (feat)
4. **Task 3: Move read-only customer status route into Plan 02** - `c2f7cbc` (feat)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `src/app/intake/actions.test.ts` - Static TDD coverage for action exports, upload service call, no client workspaceId, no public URL return, and submit redirect.
- `src/app/intake/actions.ts` - Server actions for draft, answers, file attach, and submit redirect.
- `src/lib/intake/upload-service.ts` - RBAC-guarded private upload metadata service with audit event.
- `src/app/intake/page.tsx` - Customer `/intake` route composing service, questions, upload, and review forms.
- `src/app/intake/components.tsx` - Customer intake UI components using existing primitives and Vietnamese copy.
- `src/app/requests/[requestId]/page.tsx` - Read-only customer status route with RBAC guard and file metadata list.

## Decisions Made

- Returned only `{ filename, size }` from `attachIntakeFileAction`; no URL field exists in action response.
- Kept workspace ownership out of FormData parsing; upload service loads request and uses `request.workspaceId`.
- Mapped status copy in the route for all `RequestStatus` values to prevent raw enum display.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing upload service required by action wiring**
- **Found during:** Task 1 (Create server actions for intake mutations and upload wiring)
- **Issue:** Plan required `attachIntakeFileAction` to call `attachIntakeFile`, but `src/lib/intake/upload-service.ts` did not exist in this worktree.
- **Fix:** Added `attachIntakeFile` with request RBAC, server-derived workspace, private storage key, `VaultFile` row, and audit summary.
- **Files modified:** `src/lib/intake/upload-service.ts`
- **Verification:** `npm run typecheck` passed.
- **Committed in:** `b07e613`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for planned upload action. No extra product scope added.

## Issues Encountered

- TypeScript rejected server actions returning objects when passed directly to `<form action>`. Added small page-local wrappers returning `Promise<void>` for form usage while preserving exported action return shapes.

## Verification

- `npx tsx src/app/intake/actions.test.ts` — passed
- `npm run typecheck` — passed after each task and final verification

## Known Stubs

- `src/app/intake/actions.ts` uses `demoSession` pending real authentication provider integration; current code still enforces service-layer RBAC when matching demo data exists.
- `src/app/intake/page.tsx` uses demo `requestId`, sample review answers, and sample uploaded filename for static MVP route composition; real progressive request state wiring remains future auth/session work.
- `src/app/requests/[requestId]/page.tsx` uses `demoSession` pending real authentication provider integration; RBAC check exists but session source is not production auth yet.
- `src/app/requests/[requestId]/page.tsx` can show filename but not size because current `VaultFile` schema has no persisted size field.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth-session | `src/app/intake/actions.ts` | Server actions use demo session until auth provider exists. |
| threat_flag: auth-session | `src/app/requests/[requestId]/page.tsx` | Status route uses demo session until auth provider exists. |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 can replace demo session source with real auth/session boundary when available.
- Vault hardening should add persisted file size or metadata if status page must show size from database rather than upload action return.

## Self-Check: PASSED

- Created files exist: `src/app/intake/actions.test.ts`, `src/app/intake/actions.ts`, `src/lib/intake/upload-service.ts`, `src/app/intake/page.tsx`, `src/app/intake/components.tsx`, `src/app/requests/[requestId]/page.tsx`.
- Commits exist: `7469518`, `b07e613`, `147a01a`, `c2f7cbc`.

---
*Phase: 02-intake*
*Completed: 2026-05-27*
