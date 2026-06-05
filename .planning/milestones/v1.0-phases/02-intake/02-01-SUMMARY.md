---
phase: 02-intake
plan: 01
subsystem: database
tags: [prisma, postgres, intake, workflow, audit, rbac]

requires:
  - phase: 01-foundation
    provides: LegalRequest, RequestStatus workflow, RBAC, audit trail, workspace isolation
provides:
  - Persisted MatterType catalog with seeded MVP legal services
  - Schema-versioned IntakeSubmission answers with labels and submittedAt
  - Intake service functions for draft creation, answer saving, submit, and unsupported triage
  - Prisma database schema pushed to local development database
affects: [intake-ui, uploads, customer-status, routing, documents-vault]

tech-stack:
  added: []
  patterns:
    - Prisma Json snapshots for schema-versioned intake answers
    - Backend-only workflow transitions for intake submission and triage
    - Audit metadata limited to ids, matter type keys, and counts

key-files:
  created:
    - prisma/seed.ts
    - src/lib/intake/catalog.ts
    - src/lib/intake/intake-service.ts
    - src/lib/intake/intake.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/audit/audit.ts

key-decisions:
  - "Persist MatterType rows while keeping catalog helpers as typed source for MVP seed data."
  - "Unsupported intake uses customer submit to intake_submitted, then coordinator workflow transition to triage; no direct status update."
  - "Audit summaries store matter type keys and answer counts only, not legal answer content."

patterns-established:
  - "Matter catalog helpers return copies to avoid mutation of schema source."
  - "IntakeSubmission stores answers and answerLabels as Json snapshots tied to schemaVersion."
  - "Status changes stay owned by transitionRequestStatus."

requirements-completed: [INT-01, INT-02, INT-03, INT-06]

duration: 50min
completed: 2026-05-27
---

# Phase 02 Plan 01: Structured Intake Domain Foundation Summary

**Prisma-backed legal intake catalog with schema-versioned answer snapshots, backend validation, audit-safe metadata, and workflow-owned unsupported triage**

## Performance

- **Duration:** 50 min
- **Started:** 2026-05-27T16:27:00Z
- **Completed:** 2026-05-27T17:17:45Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added `MatterType` and `IntakeSubmission` Prisma models with stable matter type keys, question schema Json, answers Json, answer label metadata, schema version, and submission timestamp.
- Seeded MVP matter catalog for agency contract, labor contract, trademark registration, and unsupported/other with Vietnamese labels.
- Added `createDraftIntake`, `saveIntakeAnswers`, and `submitIntake` with server-side matter key validation, question key validation, required answer blocking, RBAC guards, audit-safe summaries, and workflow-owned triage.
- Pushed Prisma schema to local development database and validated schema.

## Task Commits

1. **Task 1: Add persisted matter type and intake submission models** - `5fa38e5` (feat)
2. **Task 2: Build intake catalog and validation service** - `d608f1e` (feat)
3. **Task 3: Push Prisma schema to database** - `9f94aa4` (chore)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `prisma/schema.prisma` - Adds `MatterType`, `IntakeSubmission`, LegalRequest relation, Workspace relation, and audit target enum values.
- `prisma/seed.ts` - Seeds stable MVP matter types from intake catalog.
- `src/lib/intake/catalog.ts` - Defines MVP legal service catalog and question schema helpers `getMatterType` and `getMatterQuestions`.
- `src/lib/intake/intake-service.ts` - Adds draft creation, answer saving, submit validation, audit writes, and unsupported triage through workflow transition service.
- `src/lib/intake/intake.test.ts` - Verifies required seeded matter types, unsupported guidance, required agency question, duplicate keys, and immutable question snapshots.
- `src/lib/audit/audit.ts` - Adds audit target mappings for `matter_type` and `intake_submission`.

## Decisions Made

- Persisted `MatterType` while keeping typed catalog helpers as MVP seed source, so code and seed share stable keys and labels.
- Used Json snapshots for `answers` and `answerLabels` to preserve schema-versioned structured intake without over-normalizing Phase 2.
- Unsupported requests move through `transitionRequestStatus`: customer submits `draft_intake -> intake_submitted`, coordinator/system-safe actor moves `intake_submitted -> triage`.
- Audit metadata contains matter type keys, question counts, answer counts, and label counts only; no legal answer values.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Provided DATABASE_URL inline for Prisma commands**
- **Found during:** Task 1 and Task 3
- **Issue:** Worktree had no `.env`; Prisma validate/db push failed without `DATABASE_URL`.
- **Fix:** Used inline `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public"` for Prisma commands after user provided reachable URL.
- **Files modified:** None
- **Verification:** `npx prisma db push` and `npx prisma validate` passed with inline env.
- **Committed in:** `9f94aa4`

**2. [Rule 3 - Blocking] Regenerated Prisma client after schema changes**
- **Found during:** Task 2
- **Issue:** TypeScript did not know `matterType` and `intakeSubmission` delegates before client generation.
- **Fix:** Ran `npx prisma generate` with inline `DATABASE_URL`.
- **Files modified:** Generated client outside repository tracked files
- **Verification:** `npm run typecheck` passed.
- **Committed in:** `d608f1e`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to run planned verification. No scope creep.

## Issues Encountered

- Initial database push attempts failed while PostgreSQL port `5433` was not reachable. User made database reachable, then `db push` passed.
- Task 3 produced no tracked file changes by design because it applied schema to database. It was recorded with an empty chore commit to preserve per-task atomic commit history.

## Verification

- `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" npx prisma db push` — passed
- `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" npx prisma validate` — passed
- `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" npx tsx src/lib/intake/intake.test.ts` — passed
- `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" npm run typecheck` — passed

## Known Stubs

None.

## Threat Flags

None beyond plan threat model. New intake persistence and audit target surfaces are part of planned trust boundaries and mitigations.

## User Setup Required

None for this plan after local development database became reachable.

## Next Phase Readiness

- Intake domain foundation ready for customer UI, uploads, and status view plans.
- Future intake UI must call service functions rather than duplicating workflow/status logic in frontend.
- Upload plan can reuse request/workspace authorization pattern and audit-safe metadata summaries.

## Self-Check: PASSED

- Created files exist: `prisma/seed.ts`, `src/lib/intake/catalog.ts`, `src/lib/intake/intake-service.ts`, `src/lib/intake/intake.test.ts`.
- Modified files exist: `prisma/schema.prisma`, `src/lib/audit/audit.ts`.
- Commits exist: `5fa38e5`, `d608f1e`, `9f94aa4`.

---
*Phase: 02-intake*
*Completed: 2026-05-27*
