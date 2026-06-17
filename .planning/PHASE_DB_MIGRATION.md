# Phase XX: Database Schema Improvement & Migration

**Phase Type:** Infrastructure / Data Engineering  
**Priority:** High  
**Status:** PLANNING  
**Reference:** `prisma/DB_IMPROVEMENT_PLAN.md`, `prisma/DB_ARCHITECTURE_REVIEW.md`

---

## 1. Phase Overview

### 1.1 Objective

Thực hiện database schema improvement theo 4-phase approach đã được recommend trong architecture review:

1. **Phase 1:** Safety First (NON-BREAKING) - Add FK constraints, CHECK constraints
2. **Phase 2:** Expand - Add new columns (backward compatible)
3. **Phase 3:** Backfill - Migrate data, verify consistency
4. **Phase 4:** Contract - Update code, drop old columns (BREAKING)

### 1.2 Success Criteria

- [ ] Tất cả FK constraints đã được thêm (Message, FileAccessLog, DocumentVersion)
- [ ] CHECK constraints cho enum fields đã được thêm
- [ ] SQLite NULL unique issues đã được fix
- [ ] LegalRequest.matterTypeId đã được thêm và backfill
- [ ] RequestAssignment.isCurrent/endedAt đã được thêm và backfill
- [ ] VaultFile.fileId đã được thêm và backfill
- [ ] Tất cả code references đã được update
- [ ] Old columns đã được drop
- [ ] Tests pass với new schema
- [ ] Data integrity verified

### 1.3 Non-Goals (Out of Scope)

- Translation table refactoring (P3)
- Event sourcing implementation
- PostgreSQL migration
- Module-based migration file organization

---

## 2. Technical Decisions (Locked)

### 2.1 Assignment Source of Truth
- **Decision:** Option B - RequestAssignment is Source of Truth
- **Rationale:** Industry standard, history preservation, Prisma-friendly
- **Mitigation:** Use `BEGIN EXCLUSIVE` transaction để tránh race condition

### 2.2 Vault/File Architecture
- **Decision:** Option B - File là storage chính, VaultItem là business layer
- **Rationale:** Simplified two-tier, DRY principle
- **Migration:** Rename VaultFile → VaultItem, add fileId FK

### 2.3 Review FK Simplification
- **Decision:** Option A - documentVersionId as Primary FK
- **Rationale:** Immutable audit, legal traceability requirement

### 2.4 MatterType Reference
- **Decision:** Option A - matterTypeId FK
- **Rationale:** Type safety, query performance

---

## 3. Implementation Plan

### 3.1 Phase Structure

```
Phase XX: Database Schema Improvement
├── Wave 1: Safety First (NON-BREAKING)
│   ├── Task 1.1: Add FK constraints
│   ├── Task 1.2: Add CHECK constraints
│   └── Task 1.3: Fix SQLite NULL unique issues
│
├── Wave 2: Expand - New Columns
│   ├── Task 2.1: Add LegalRequest.matterTypeId
│   ├── Task 2.2: Add RequestAssignment.isCurrent, endedAt
│   ├── Task 2.3: Add VaultItem.fileId (rename from VaultFile)
│   └── Task 2.4: Update Prisma schema
│
├── Wave 3: Backfill & Verify
│   ├── Task 3.1: Backfill matterTypeId data
│   ├── Task 3.2: Backfill RequestAssignment.isCurrent
│   ├── Task 3.3: Backfill VaultItem.fileId
│   └── Task 3.4: Verify data consistency
│
└── Wave 4: Contract (BREAKING - Feature Flag Required)
    ├── Task 4.1: Update code to read from new columns
    ├── Task 4.2: Add NOT NULL constraints
    ├── Task 4.3: Drop old columns
    └── Task 4.4: Run full test suite
```

### 3.2 Detailed Tasks

#### Wave 1: Safety First

**Task 1.1: Add Missing FK Constraints**
```
Files:
- prisma/schema.prisma
- prisma/schema.sql

Actions:
1. Add FK for Message.senderId → User.id
2. Add FK for Message.recipientId → User.id
3. Add FK for FileAccessLog.userId → User.id (ON DELETE SET NULL)
4. Add FK for DocumentVersion.templateId → DocumentTemplate.id
5. Add FK for VaultItem.organizationId → Organization.id
6. Generate migration script
7. Apply migration with --dry-run first
8. Apply migration
9. Verify with SELECT queries
```

**Task 1.2: Add CHECK Constraints**
```
Files:
- prisma/schema.prisma
- prisma/schema.sql

Actions:
1. Add CHECK for LegalRequest.status values
2. Add CHECK for LegalRequest.priority values
3. Add CHECK for WorkspaceMembership.role values
4. Add CHECK for File.status values
5. Generate migration script
6. Apply migration
7. Verify invalid data caught
```

**Task 1.3: Fix SQLite NULL Unique Issues**
```
Files:
- prisma/schema.prisma
- prisma/schema.sql

Actions:
1. Add partial unique index for MatterType (workspaceId IS NULL)
2. Add partial unique index for MatterType (workspaceId IS NOT NULL)
3. Add partial unique index for Folder root names
4. Generate migration script
5. Apply migration
6. Verify duplicate prevention works
```

#### Wave 2: Expand

**Task 2.1: Add LegalRequest.matterTypeId**
```
Files:
- prisma/schema.prisma
- src/lib/services/request-service.ts
- src/lib/api/requests.ts

Actions:
1. Add matterTypeId TEXT column to LegalRequest
2. Add @relation for MatterType
3. Generate migration script (non-breaking)
4. Apply migration
5. Update code to populate matterTypeId on create
6. Keep matterType column for backward compatibility
```

**Task 2.2: Add RequestAssignment Flags**
```
Files:
- prisma/schema.prisma
- src/lib/services/assignment-service.ts

Actions:
1. Add isCurrent Boolean @default(true)
2. Add endedAt DateTime?
3. Add partial unique index (requestId, kind) WHERE isCurrent = true
4. Generate migration script
5. Apply migration
6. Update assignment logic to set isCurrent = false on reassign
7. Use transaction with BEGIN EXCLUSIVE for race safety
```

**Task 2.3: Add VaultItem.fileId**
```
Files:
- prisma/schema.prisma (rename VaultFile → VaultItem)
- src/lib/services/vault-service.ts

Actions:
1. Rename model VaultFile → VaultItem
2. Add fileId TEXT FK → File.id
3. Remove duplicate columns (workspaceId, requestId, etc - they'll be in File)
4. Generate migration script
5. Apply migration
6. Update code to join File for metadata
7. Update code to set fileId on upload
```

#### Wave 3: Backfill & Verify

**Task 3.1-3.3: Backfill Data**
```
Scripts:
- scripts/backfill-matter-type-id.ts
- scripts/backfill-request-assignment-current.ts
- scripts/backfill-vault-item-file-id.ts

Actions for each:
1. Write backfill script with dry-run option
2. Test on small dataset first
3. Run full backfill
4. Verify row counts match
5. Generate report
```

**Task 3.4: Verify Data Consistency**
```
Scripts:
- scripts/verify-data-consistency.ts

Actions:
1. Check no orphan records
2. Check all required FKs valid
3. Check matterTypeId matches MatterType.id
4. Check RequestAssignment.isCurrent flags correct
5. Check VaultItem.fileId points to existing File
6. Generate verification report
```

#### Wave 4: Contract

**Task 4.1: Update Code References**
```
Files to update:
- src/lib/services/request-service.ts
- src/lib/services/assignment-service.ts
- src/lib/services/vault-service.ts
- src/lib/api/requests.ts
- src/components/**/* (any UI reading these fields)

Actions:
1. Update all queries to use new columns
2. Add feature flag: DB_MIGRATION_PHASE4
3. Update seed files
4. Update test fixtures
```

**Task 4.2: Add NOT NULL Constraints**
```
Actions:
1. Verify no NULL in new columns
2. Add NOT NULL constraints
3. Generate migration script
4. Apply migration
```

**Task 4.3: Drop Old Columns**
```
Actions:
1. Feature flag ON
2. Drop LegalRequest.matterType
3. Drop LegalRequest.assignedSpecialistId, assignedReviewerId, assignedPartnerId, engagementId
4. Drop IntakeSubmission.workspaceId, matterTypeKey
5. Generate migration script
6. Apply migration
7. Update Prisma schema to remove old fields
```

**Task 4.4: Run Full Test Suite**
```
Actions:
1. Run unit tests
2. Run integration tests
3. Run E2E tests
4. Manual smoke test
5. Performance regression check
```

---

## 4. Risk Mitigation

### 4.1 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition on assignment | Medium | High | BEGIN EXCLUSIVE transaction |
| Query performance regression | Medium | Medium | Index optimization, materialized views |
| Data loss during migration | Low | Critical | Full backup before Phase 1 |
| Rollback complexity | Medium | High | Feature flag, blue-green |
| Orphan FileAssets | Low | Medium | ON DELETE CASCADE |

### 4.2 Rollback Plan

1. **Before Phase 1:** Full database backup
2. **After Phase 2:** Point-in-time recovery capability
3. **Feature Flag:** Toggle between old/new code paths
4. **Shadow Mode:** Run new code alongside old, compare outputs

---

## 5. Testing Strategy

### 5.1 Test Types

1. **Unit Tests:** Service layer functions
2. **Integration Tests:** API endpoints with test DB
3. **Data Migration Tests:** Backfill scripts correctness
4. **E2E Tests:** Full user flows
5. **Performance Tests:** Query timing benchmarks

### 5.2 Test Coverage Targets

- New FK constraints: 100%
- New columns: 100%
- Data migration: 100%
- API compatibility: 100%

---

## 6. Files to Create/Modify

### Database
- `prisma/schema.prisma` - Schema updates
- `prisma/schema.sql` - Re-export SQL

### Migrations
- `prisma/migrations/YYYYMMDDHHMMSS_add_fk_constraints/` - FK migrations
- `prisma/migrations/YYYYMMDDHHMMSS_add_check_constraints/` - CHECK migrations
- `prisma/migrations/YYYYMMDDHHMMSS_fix_unique_indexes/` - Index fixes
- `prisma/migrations/YYYYMMDDHHMMSS_expand_columns/` - New columns
- `prisma/migrations/YYYYMMDDHHMMSS_contract/` - Drop old columns

### Scripts
- `scripts/backfill-matter-type-id.ts`
- `scripts/backfill-request-assignment-current.ts`
- `scripts/backfill-vault-item-file-id.ts`
- `scripts/verify-data-consistency.ts`
- `scripts/backup-database.ts`

### Services
- `src/lib/services/request-service.ts` - Update matterTypeId usage
- `src/lib/services/assignment-service.ts` - Update isCurrent logic
- `src/lib/services/vault-service.ts` - Update VaultItem with fileId

### API
- `src/lib/api/requests.ts` - Update endpoints
- `src/lib/api/documents.ts` - Update endpoints

### Tests
- `src/__tests__/services/assignment-service.test.ts`
- `src/__tests__/services/vault-service.test.ts`
- `src/__tests__/migrations/backfill.test.ts`

---

## 7. Timeline Estimate

| Wave | Tasks | Effort | Risk |
|------|-------|--------|------|
| Wave 1 | 3 | 4h | Low |
| Wave 2 | 4 | 6h | Medium |
| Wave 3 | 4 | 4h | Medium |
| Wave 4 | 4 | 8h | High |
| **Total** | **15** | **22h** | - |

**Estimated:** 3-4 days for full implementation + testing

---

## 8. Execution Workflow

### Standard GSD Flow:
```
/gsd-discuss-phase {phase_num}
    ↓
/gsd-plan-phase {phase_num}
    ↓
/gsd-execute-phase {phase_num}
    ↓
/gsd-verify-work
    ↓
/gsd-complete-milestone (when milestone done)
```

### For Database Migration (Recommended):
1. **Discuss Phase:** Lock technical decisions
2. **Plan Phase:** Create detailed task breakdown
3. **Execute Wave 1:** Safety first (low risk)
4. **Verify Wave 1:** Ensure no breaking changes
5. **Execute Wave 2:** Expand
6. **Execute Wave 3:** Backfill & verify
7. **Execute Wave 4:** Contract (coordinate with team)
8. **Verify:** Full test suite

---

## 9. Dependencies

- Phase 58 (Core Tables) - Schema baseline
- Phase 65 (Data Migration) - Previous migration patterns
- Backup infrastructure - Database backup capability

---

## 10. Status

- [ ] Discuss Phase completed
- [ ] Plan Phase completed
- [ ] Wave 1: Safety First - Pending
- [ ] Wave 2: Expand - Pending
- [ ] Wave 3: Backfill - Pending
- [ ] Wave 4: Contract - Pending
- [ ] Full verification - Pending
