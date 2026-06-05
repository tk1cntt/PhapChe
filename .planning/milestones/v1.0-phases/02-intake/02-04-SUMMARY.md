---
phase: 02-intake
plan: 04
subsystem: intake
tags: [nextjs, server-actions, prisma, rbac, session, review]

requires:
  - phase: 02-intake
    provides: Structured intake persistence, customer intake UI, upload service, status route
provides:
  - Dev-safe APP_SESSION_USER_ID server session boundary backed by active DB user and workspace membership
  - Request-scoped /intake flow where draft id carries through answer, upload, review, and submit forms
  - Review summary rendered from current IntakeSubmission answers, answerLabels, and VaultFile filenames
affects: [intake-ui, auth-session, uploads, customer-status]

tech-stack:
  added: []
  patterns:
    - Server session actor comes from APP_SESSION_USER_ID and database membership, not inline demo constants
    - /intake searchParams requestId is authorized server-side before loading sensitive review data
    - Review data maps persisted answerLabels to persisted answers and VaultFile metadata only

key-files:
  created:
    - .planning/phases/02-intake/02-04-SUMMARY.md
  modified:
    - src/lib/security/session.ts
    - src/app/intake/actions.ts
    - src/app/intake/page.tsx
    - src/app/intake/actions.test.ts

key-decisions:
  - "Kept Phase 2 auth boundary explicit and dev-safe through APP_SESSION_USER_ID plus active DB membership lookup; no login UI or auth provider added."
  - "Treated /intake?requestId as untrusted input and checked canAccessRequest before loading intakeSubmission or vaultFiles."
  - "Used VaultFile filename with size 0 fallback because schema has no persisted size field and plan forbids invented metadata."

patterns-established:
  - "Draft creation redirects to /intake?requestId=<id> so later server action forms share one current request id."
  - "Review summary reads stored answerLabels and answers rather than catalog placeholders."

requirements-completed: [INT-01, INT-03, INT-04, INT-05]

duration: 23min
completed: 2026-05-28
---

# Phase 02 Plan 04: Intake Gap Closure Summary

**Request-scoped intake flow with env-backed server session and real persisted review data**

## Performance

- **Duration:** 23 min
- **Started:** 2026-05-28T12:33:08Z
- **Completed:** 2026-05-28T12:56:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Replaced hard-coded demo session query with `APP_SESSION_USER_ID` plus active Prisma user and workspace membership lookup.
- Changed draft creation to redirect back to `/intake?requestId=<created id>`.
- Changed `/intake` to authorize current `requestId`, load current `intakeSubmission` and `vaultFiles`, and use `request.id` in answer/upload/submit forms.
- Populated review summary from saved answers, answer labels, and real uploaded filenames for current request.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hard-coded demo session with dev-safe server session boundary** - `360488d` (fix)
2. **Task 2: Carry draft request id through /intake forms** - `2061c5c` (fix)
3. **Task 3: Populate review from saved answers and uploaded files for current request** - `39be746` (test)

**Plan metadata:** pending final docs commit

_Note: TDD tasks used existing static assertion file; Task 3 implementation was already completed in Task 2 while wiring current request data, then Task 3 added explicit review-gap assertions._

## Files Created/Modified

- `src/lib/security/session.ts` - Uses `process.env.APP_SESSION_USER_ID?.trim()`, rejects missing env with `UNAUTHENTICATED`, and returns active DB membership workspace/role.
- `src/app/intake/actions.ts` - Redirects draft creation to request-scoped `/intake?requestId=${draft.id}`.
- `src/app/intake/page.tsx` - Reads `searchParams`, authorizes request access, loads current request intake data/files, and uses `request.id` hidden inputs.
- `src/app/intake/actions.test.ts` - Adds static assertions for env session boundary, draft redirect, no demo request id, and real review data sources.

## Decisions Made

- Kept explicit env-selected server actor instead of adding login UI/provider because plan defines this as accepted Phase 2 boundary.
- Returned 404 via `notFound()` when request access or intake submission is missing, avoiding data disclosure for guessed request ids.
- Used size `0` for uploaded file review entries because current `VaultFile` schema persists filename but not size.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 3 implementation overlapped with Task 2 because loading current request for hidden ids also required loading persisted answers/files. Explicit Task 3 static assertions were still added and committed separately.

## Verification

- `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" APP_SESSION_USER_ID="demo-customer" npm run typecheck` — passed
- `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" APP_SESSION_USER_ID="demo-customer" npx tsx src/app/intake/actions.test.ts` — passed
- `node -e "const fs=require('fs'); const page=fs.readFileSync('src/app/intake/page.tsx','utf8'); const session=fs.readFileSync('src/lib/security/session.ts','utf8'); for (const bad of ['demo-request','ho-so-mau.pdf','Sẽ được lưu từ câu trả lời của khách hàng']) if(page.includes(bad)) throw new Error('static intake gap remains: '+bad); if(session.includes(\"id: 'demo-customer'\")||session.includes('\\\"demo-customer\\\"')) throw new Error('demo session remains'); if(!session.includes('APP_SESSION_USER_ID')) throw new Error('env session boundary missing');"` — passed

## Known Stubs

None.

## Threat Flags

None beyond plan threat model. New route-param, session, and review-data surfaces match planned mitigations.

## User Setup Required

- Set `APP_SESSION_USER_ID` for dev/server runs, e.g. `demo-customer` with seeded database.

## Next Phase Readiness

- Phase 2 intake now satisfies gap-closure data flow: current request id, session actor, and review summary are wired to stored data.
- Later auth work can replace `APP_SESSION_USER_ID` with real session provider without changing downstream `AppSession` contract.

## Self-Check: PASSED

- Created files exist: `.planning/phases/02-intake/02-04-SUMMARY.md`.
- Modified files exist: `src/lib/security/session.ts`, `src/app/intake/actions.ts`, `src/app/intake/page.tsx`, `src/app/intake/actions.test.ts`.
- Commits exist: `360488d`, `2061c5c`, `39be746`.

---
*Phase: 02-intake*
*Completed: 2026-05-28*
