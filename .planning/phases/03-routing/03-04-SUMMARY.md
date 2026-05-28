---
phase: 03-routing
plan: 04
subsystem: routing, specialist-ui, authorization
tags: [routing, specialist, nextjs, prisma, rbac]
requires:
  - phase: 03-routing
    plan: 01
    provides: RoutingCapability and routing service foundation
  - phase: 03-routing
    plan: 02
    provides: Atomic coordinator assignment writes LegalRequest assigned users
provides:
  - Specialist assigned request queue scoped by workspace and assignedSpecialistId
  - Specialist request detail guarded by canAccessRequest
  - Intake summary and supporting file metadata display without download or drafting controls
affects: [03-routing, specialist-queue, documents-vault]
tech-stack:
  added: []
  patterns:
    - Next.js server components query Prisma with session-scoped authorization
    - Specialist detail performs RBAC check before reading sensitive request data
key-files:
  created:
    - src/app/specialist/requests/page.tsx
    - src/app/specialist/requests/[requestId]/page.tsx
    - .planning/phases/03-routing/03-04-SUMMARY.md
  modified: []
key-decisions:
  - "Specialist queue uses direct server-side Prisma filtering by workspaceId and assignedSpecialistId."
  - "Specialist detail reuses canAccessRequest before fetching/rendering sensitive intake and file metadata."
patterns-established:
  - "Specialist pages keep Phase 3 scope to queue/detail only; no drafting, review, download, preview, or delivery controls."
requirements-completed: [RTE-05]
duration: not recorded by worktree agent
completed: 2026-05-28
---

# Phase 03 Plan 04: Specialist Queue and Detail Summary

**Server-authorized specialist work entry with assigned queue, intake summary, and file metadata only**

## Performance

- **Duration:** not recorded by worktree agent
- **Started:** 2026-05-28
- **Completed:** 2026-05-28
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `/specialist/requests` server component with exact Vietnamese title and description.
- Scoped specialist queue using `workspaceId: session.activeWorkspaceId` and `assignedSpecialistId: session.userId` in Prisma `where` clause.
- Rendered required columns: `Yêu cầu`, `Khách hàng`, `Loại vụ việc`, `Trạng thái`, `Ngày gửi`, `Hành động`.
- Created `/specialist/requests/[requestId]` detail page with `canAccessRequest(session, requestId)` guard before reading request detail.
- Rendered intake answer label/value rows and vault file metadata (`filename`, `storageKey`, `createdAt`) without download or preview links.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create specialist assigned queue** - `22b6a19` (feat)
2. **Task 2: Create specialist request detail** - `5622267` (feat)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `src/app/specialist/requests/page.tsx` - Assigned specialist queue filtered server-side by workspace and current user.
- `src/app/specialist/requests/[requestId]/page.tsx` - Authorized request detail with intake summary and supporting file metadata only.
- `.planning/phases/03-routing/03-04-SUMMARY.md` - Captures plan execution result.

## Decisions Made

- Used existing admin UI primitives directly instead of creating a specialist shell because plan only required two pages and existing components matched Phase 3 UI contract.
- Displayed `storageKey` as metadata because plan asked for metadata only and schema exposes no file size/type fields.
- Kept file list free of download/preview links because existing read files did not include an authorized file access pattern.

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed
**Impact on plan:** None.

## Issues Encountered

- `npm test` failed because `package.json` has no `test` script. Per-plan `npx tsc --noEmit` verification passed.

## User Setup Required

None - no external service configuration required for committed code.

## Known Stubs

None.

## Threat Flags

None. Plan threat model already covered specialist queue scoping, request detail authorization, route param access, and file metadata disclosure.

## Verification

- `npx tsc --noEmit` passed after Task 1.
- `npx tsc --noEmit` passed after Task 2.
- Final `npx tsc --noEmit` passed.
- `npm test` attempted for wave verification and failed because no `test` script exists.

## Self-Check: PASSED

- Found created files: `src/app/specialist/requests/page.tsx`, `src/app/specialist/requests/[requestId]/page.tsx`, `.planning/phases/03-routing/03-04-SUMMARY.md`.
- Found task commits: `22b6a19`, `5622267`.

---
*Phase: 03-routing*
*Completed: 2026-05-28*
