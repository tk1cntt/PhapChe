---
phase: 85-database-schema-improvement
plan: "02"
subsystem: database
tags: [prisma, sqlite, schema, foreign-key, migration]

# Dependency graph
requires:
  - phase: 85-01
    provides: Database improvement plan with decisions D-01 to D-08
provides:
  - LegalRequest.matterTypeId FK to MatterType.id
  - RequestAssignment.isCurrent and endedAt for source of truth pattern
  - VaultItem model (renamed from VaultFile) with fileId FK
  - VaultItemFolder model (renamed from VaultFileFolder)
  - VaultItemTag model (renamed from VaultFileTag)
affects: [85-03, 85-04, request-service, assignment-service, vault-service]

# Tech tracking
tech-stack:
  added: []
  patterns: [2-tier vault architecture, source-of-truth assignment pattern, nullable FK migration]

key-files:
  created: []
  modified:
    - prisma/schema.prisma
    - prisma/schema.sql

key-decisions:
  - "Used matterTypeRef as relation name to avoid conflict with existing matterType String field"
  - "Kept existing columns (matterType, filename, storageKey, etc.) for backward compatibility during migration"
  - "All model renames preserve existing data structure"

patterns-established:
  - "Backward-compatible schema expansion with nullable new columns"
  - "Model rename preserving all existing fields"

requirements-completed: [DB-06, DB-07, DB-08, DB-09]

# Metrics
duration: 15min
completed: 2026-06-17
---

# Phase 85 Plan 02: Database Schema Expansion Summary

**Schema expanded with matterTypeId FK, isCurrent/endedAt for assignments, and VaultItem with fileId for 2-tier vault architecture**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-17T17:25:18Z
- **Completed:** 2026-06-17T17:40:00Z
- **Tasks:** 5
- **Files modified:** 2

## Accomplishments
- Added matterTypeId String? FK to LegalRequest with relation to MatterType
- Added isCurrent Boolean @default(true) and endedAt DateTime? to RequestAssignment
- Renamed VaultFile to VaultItem and added fileId FK to File
- Renamed VaultFileFolder to VaultItemFolder
- Renamed VaultFileTag to VaultItemTag
- Updated all inverse relations across models
- Updated prisma/schema.sql to match schema changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add matterTypeId FK to LegalRequest** - `59eb8a3` (feat)
2. **Task 2: Add isCurrent and endedAt to RequestAssignment** - `1cd8b42` (feat)
3. **Task 3-4: Rename VaultFile to VaultItem and update relations** - `f7a848f` (feat)
4. **Task 5: Update schema.sql** - `a718009` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added matterTypeId FK, isCurrent/endedAt, renamed VaultFile to VaultItem
- `prisma/schema.sql` - Updated SQL export to match schema.prisma changes

## Decisions Made

- Used `matterTypeRef` as relation field name to avoid conflict with existing `matterType String?` field
- Kept all existing columns for backward compatibility during migration phase
- Added indexes on new FK fields for query performance

## Deviations from Plan

**None - plan executed exactly as written.**

## Issues Encountered

- **Relation naming conflict:** `matterType` field already existed on LegalRequest, so used `matterTypeRef` instead
- All validation passed after fixing the naming conflict

## Next Phase Readiness

- Schema ready for Phase 03 (backfill data)
- Partial unique index for RequestAssignment (isCurrent = true) needs raw SQL migration
- All new columns are nullable for backward compatibility

---
*Phase: 85-database-schema-improvement*
*Completed: 2026-06-17*
