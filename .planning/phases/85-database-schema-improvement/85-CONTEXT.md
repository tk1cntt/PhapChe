# Phase 85: Database Schema Improvement - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve database schema by fixing duplication, adding FK constraints, and implementing 2-tier vault architecture. The phase delivers:
1. All missing FK constraints added (Message, FileAccessLog, DocumentVersion)
2. CHECK constraints for enum fields added
3. SQLite NULL unique issues fixed
4. LegalRequest.matterTypeId added and backfilled
5. RequestAssignment.isCurrent/endedAt added and backfilled
6. VaultItem.fileId added (2-tier vault)
7. Old duplicate columns dropped
8. All tests pass with new schema

**Implementation approach:** 4-wave incremental migration (Safety → Expand → Backfill → Contract)

</domain>

<decisions>
## Implementation Decisions

### Assignment Source of Truth
- **D-01:** Use RequestAssignment as Source of Truth (Option B)
  - Add `isCurrent Boolean @default(true)` and `endedAt DateTime?`
  - Create partial unique index on (requestId, kind) WHERE isCurrent = true
  - Use `BEGIN EXCLUSIVE` transaction to prevent race conditions on concurrent assignment
  - Rationale: Industry standard pattern, history preservation, Prisma-friendly

### Vault/File Architecture
- **D-02:** Use File as storage layer, VaultItem as business layer (Option B + Simple)
  - Rename model VaultFile → VaultItem
  - Add `fileId TEXT FK → File.id`
  - Remove duplicate columns (workspaceId, requestId, filename, storageKey, size, contentType)
  - Keep `ON DELETE CASCADE` for orphan prevention
  - Rationale: Simplified two-tier, DRY principle, less complex than Option C

### Review FK Simplification
- **D-03:** Keep documentVersionId as primary FK (Option A)
  - Add FK constraint for documentVersionId → DocumentVersion.id
  - Keep workspaceId, requestId, documentId for query convenience
  - Rationale: Immutable audit, legal traceability requirement (cannot review a version that was deleted)

### MatterType Reference
- **D-04:** Use matterTypeId FK in LegalRequest (Option A)
  - Add `matterTypeId TEXT REFERENCES MatterType(id)`
  - Keep matterType text column during migration (backward compatible)
  - Drop matterType after verification (Phase 4)
  - Rationale: Type safety, query performance, future extensibility

### FK Addition Strategy
- **D-05:** Add FK constraints in Phase 1 (NON-BREAKING)
  - Message.senderId, recipientId → User.id
  - FileAccessLog.userId → User.id (ON DELETE SET NULL)
  - DocumentVersion.templateId → DocumentTemplate.id
  - VaultItem.organizationId → Organization.id
  - Rationale: Safe first step, no breaking changes

### CHECK Constraints
- **D-06:** Add CHECK constraints for enum fields
  - LegalRequest.status IN ('draft_intake', 'submitted', 'assigned', 'in_progress', 'pending_review', 'approved', 'rejected', 'cancelled', 'closed')
  - LegalRequest.priority IN ('low', 'medium', 'high', 'urgent')
  - WorkspaceMembership.role IN ('customer', 'specialist', 'reviewer', 'coordinator', 'admin')
  - Rationale: Data integrity enforcement at database level

### Migration Strategy
- **D-07:** Expand-Contract pattern with feature flag
  - Phase 1-3: NON-BREAKING, can rollback easily
  - Phase 4: BREAKING, requires feature flag toggle
  - Rationale: Safety first, ability to rollback if issues arise

### Unique Index Fixes
- **D-08:** Add partial unique indexes for NULL handling
  - MatterType: partial index for workspaceId IS NULL / IS NOT NULL
  - Folder: partial index for parentId IS NULL
  - Rationale: SQLite NULL uniqueness workaround

### Claude's Discretion
- Migration script naming convention: `YYYYMMDDHHMMSS_descriptive_name`
- Backfill scripts location: `scripts/backfill-*.ts`
- Test coverage target: 90%+ for migration scripts

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture Review (Already Completed)
- `prisma/DB_ARCHITECTURE_REVIEW.md` — Expert 4-step review with full analysis
- `prisma/DB_IMPROVEMENT_PLAN.md` — Detailed implementation plan with tasks

### Prior Phase Context
- `prisma/schema.prisma` — Current database schema
- `prisma/schema.sql` — SQL export of current schema
- `prisma/db_suggest.md` — Original analysis with issues identified

### Project Standards
- `.planning/codebase/STACK.md` — Technology stack (Prisma 6.x, SQLite dev, PostgreSQL prod)
- `.planning/codebase/ARCHITECTURE.md` — System architecture patterns
- `.planning/codebase/INTEGRATIONS.md` — Database and storage integrations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Prisma ORM:** Already configured with SQLite provider. Use `npx prisma migrate dev` for migrations.
- **Service Layer Pattern:** `src/lib/services/*.ts` - Business logic encapsulation
- **API Routes:** `src/app/api/` - Thin HTTP layer delegating to services

### Established Patterns
- **Repository Pattern:** Implemented in Phase 64 - use for data access
- **Migration Pattern:** From Phase 65 - `npx prisma migrate dev --name descriptive_name`
- **Seed Pattern:** `prisma/seed.ts` - Test data generation

### Integration Points
- **Schema Updates:** Need to update `prisma/schema.prisma` and re-export `prisma/schema.sql`
- **Service Updates:** 
  - `src/lib/services/request-service.ts` - Update matterTypeId usage
  - `src/lib/services/assignment-service.ts` - Update isCurrent logic
  - `src/lib/services/vault-service.ts` - Update VaultItem with fileId
- **API Updates:** `src/lib/api/requests.ts`, `src/lib/api/documents.ts`

</code_context>

<specifics>
## Specific Ideas

- **Race Condition Mitigation:** Use `BEGIN EXCLUSIVE` transaction when updating isCurrent flag
- **Orphan Prevention:** Add `ON DELETE CASCADE` for VaultItem → FileAsset relationship
- **Feature Flag:** Use `DB_MIGRATION_PHASE4` env var to toggle between old/new code paths during Phase 4

</specifics>

<deferred>
## Deferred Ideas

### Not in Scope (Phase 85)
- Translation table refactoring (replace label_vi/label_en columns)
- Event sourcing implementation
- PostgreSQL migration (future scale)
- Module-based migration file organization

### Future Phase Candidates
- **Phase 86 (potential):** Translation Table Refactoring - Replace multi-language columns with TranslationTable
- **Phase 87 (potential):** Full-text Search - Add MeiliSearch/Elasticsearch for matterType lookup

</deferred>

---

*Phase: 85-Database-Schema-Improvement*
*Context gathered: 2026-06-17*
*Auto-resolved from architecture review (DB_ARCHITECTURE_REVIEW.md)*
