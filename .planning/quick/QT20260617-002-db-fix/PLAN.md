---
slug: db-fix
quick_id: QT20260617-002
mode: quick
status: in_progress
date: 2026-06-17
commit: TBD
must_haves:
  - "Add userType field to User model"
  - "Add organizationId to AuditEvent, VaultFile, Message"
  - "Add soft delete (deletedAt) to LegalRequest, VaultFile, Document"
  - "Add composite indexes for performance"
  - "Update Prisma schema and generate migration"
  - "Update related APIs and code"
  - "Run tests to verify changes"
---

# Quick Task: Database Schema Fixes

## Tasks

### Task 1: Add userType field to User model
**Files:** `prisma/schema.prisma`

1. Add `userType` field to User model:
   ```prisma
   userType String @default("customer") // "staff" or "customer"
   ```

2. Generate migration:
   ```bash
   npx prisma migrate dev --name add_user_type
   ```

3. Create script to populate userType from memberships:
   ```typescript
   // prisma/seed-user-type.ts
   // - Find users with role != 'customer' → userType = 'staff'
   // - Others → userType = 'customer'
   ```

4. Update API checks:
   - `src/app/api/admin/users/*` - Check userType
   - `src/lib/auth/*` - Use userType for role checks

### Task 2: Add organizationId to audit tables
**Files:** `prisma/schema.prisma`

1. Add organizationId fields:
   ```prisma
   model AuditEvent {
     organizationId String?
   }
   model VaultFile {
     organizationId String?
   }
   model Message {
     organizationId String?
   }
   ```

2. Generate migration:
   ```bash
   npx prisma migrate dev --name add_organization_id
   ```

3. Create migration script:
   ```typescript
   // prisma/migrate-org-id.ts
   // - For each AuditEvent: workspace.orgId → organizationId
   // - For each VaultFile: workspace.orgId → organizationId
   // - For each Message: workspace.orgId → organizationId
   ```

4. Update indexes for organizationId

### Task 3: Add soft delete fields
**Files:** `prisma/schema.prisma`

1. Add deletedAt fields:
   ```prisma
   model LegalRequest {
     deletedAt DateTime?
   }
   model VaultFile {
     deletedAt DateTime?
   }
   model Document {
     deletedAt DateTime?
   }
   ```

2. Generate migration:
   ```bash
   npx prisma migrate dev --name add_soft_delete
   ```

3. Update queries to exclude soft-deleted:
   - Add `where: { deletedAt: null }` to common queries

### Task 4: Add composite indexes
**Files:** `prisma/schema.prisma`

1. Add indexes:
   ```prisma
   model RequestAssignment {
     @@index([userId, kind])
   }
   model AuditEvent {
     @@index([actorId, createdAt(sort: Desc)])
   }
   model LegalRequest {
     @@index([workspaceId, status, createdAt(sort: Desc)])
   }
   ```

2. Generate migration:
   ```bash
   npx prisma migrate dev --name add_composite_indexes
   ```

### Task 5: Verify build and tests
**Verify:**
1. Run `npm run build` - ensure no errors
2. Run `npx prisma generate` - ensure types updated
3. Run API tests

## Execution Order
1. Task 1 → 2 → 3 → 4 → 5 (sequential, each needs previous migration)

## Notes
- Use SQLite for dev (prisma/schema.prisma already configured)
- Commit after each task with working state
- Test data preserved after migrations
