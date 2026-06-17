# Database Improvement Plan

**Source:** `prisma/db_suggest.md`
**Date:** 2026-06-17
**Status:** Planning only - Chưa implement
**Priority:** High

---

## 1. Executive Summary

Schema hiện tại có **6 điểm duplication chính** và **nhiều missing FK**, cần ưu tiên giải quyết:

| Priority | Issue | Impact |
|----------|-------|--------|
| **P1** | `LegalRequest` vs `RequestAssignment` assignment duplication | Rất cao |
| **P1** | `VaultFile` vs `File` - 2 bảng cùng mô tả file storage | Rất cao |
| **P1** | `Review` có nhiều FK có thể suy ra từ nhau | Cao |
| **P2** | `matterType` text rải rác - nên dùng FK | Cao |
| **P2** | Missing FK cho Message, FileAccessLog, DocumentVersion | Trung bình |
| **P3** | Unique constraint với NULL trong SQLite | Trung bình |

---

## 2. Priority 1 - Cần làm sớm

### 2.1. Fix Assignment Duplication

**Current State:**
```sql
-- LegalRequest có:
assignedSpecialistId
assignedReviewerId
assignedPartnerId
engagementId

-- RequestAssignment cũng có:
userId, kind, partnerId, engagementId
```

**Risk:** 2 nơi cùng lưu assignment → có thể lệch nhau.

**Recommended Approach (Option B - Cleanest):**

```sql
-- 1. Thêm cột vào RequestAssignment
ALTER TABLE RequestAssignment ADD COLUMN isCurrent INTEGER DEFAULT 1;
ALTER TABLE RequestAssignment ADD COLUMN endedAt TEXT;

-- 2. Tạo partial unique index
CREATE UNIQUE INDEX uniq_current_assignment
ON RequestAssignment(requestId, kind)
WHERE isCurrent = 1;

-- 3. Xoá các cột assignment từ LegalRequest
ALTER TABLE LegalRequest DROP COLUMN assignedSpecialistId;
ALTER TABLE LegalRequest DROP COLUMN assignedReviewerId;
ALTER TABLE RequestAssignment DROP COLUMN assignedPartnerId; -- nếu có
ALTER TABLE LegalRequest DROP COLUMN engagementId; -- nếu có
```

**Tasks:**
- [ ] 2.1.1. Thêm `isCurrent` và `endedAt` vào `RequestAssignment`
- [ ] 2.1.2. Tạo partial unique index cho current assignment
- [ ] 2.1.3. Cập nhật code đọc assignment từ `RequestAssignment`
- [ ] 2.1.4. Xoá assignment columns từ `LegalRequest`
- [ ] 2.1.5. Update seed files và API endpoints
- [ ] 2.1.6. Viết migration script

---

### 2.2. Consolidate VaultFile và File

**Current State:**
- `VaultFile`: Business vault metadata
- `File`: Physical file storage
- **Cả 2 đều lưu**: workspaceId, requestId, filename, storageKey, size, contentType

**Recommended Approach:**

```sql
-- 1. Giữ File làm storage chính, thêm FK từ VaultFile
ALTER TABLE VaultFile ADD COLUMN fileId TEXT REFERENCES File(id);

-- 2. Loại bỏ duplicate columns từ VaultFile (phase 1)
ALTER TABLE VaultFile DROP COLUMN workspaceId; -- suy ra từ File
ALTER TABLE VaultFile DROP COLUMN requestId;    -- suy ra từ File
ALTER TABLE VaultFile DROP COLUMN filename;     -- có trong File.originalName
ALTER TABLE VaultFile DROP COLUMN storageKey;    -- suy ra từ File.objectKey
ALTER TABLE VaultFile DROP COLUMN size;          -- có trong File.size
ALTER TABLE VaultFile DROP COLUMN contentType;  -- có trong File.mimeType

-- 3. Hoặc drop VaultFile, dùng File làm vault
-- DROP TABLE VaultFile;
```

**Tasks:**
- [ ] 2.2.1. Thêm `fileId` vào `VaultFile`
- [ ] 2.2.2. Update code để join File khi query VaultFile
- [ ] 2.2.3. Loại bỏ duplicate columns từ VaultFile (phase 1)
- [ ] 2.2.4. Hoặc: Drop VaultFile, migrate to File-based vault

---

### 2.3. Simplify Review FK Chain

**Current State:**
```sql
Review:
  workspaceId
  requestId
  documentId
  documentVersionId
```

**Recommended:**
```sql
-- Chỉ giữ documentVersionId, suy ra các thứ khác từ đó
Review:
  documentVersionId NOT NULL  -- Primary FK
  reviewerId NOT NULL
  status
  decision
  generalComment
  completedAt
```

**Tasks:**
- [ ] 2.3.1. Thêm FK cho `documentVersionId`
- [ ] 2.3.2. Bỏ `workspaceId`, `requestId`, `documentId` (suy ra từ documentVersionId)
- [ ] 2.3.3. Update code query Review

---

## 3. Priority 2 - Nên làm

### 3.1. MatterType Reference - Dùng FK thay vì Text

**Current:**
```sql
LegalRequest.matterType TEXT  -- text key
IntakeSubmission.matterTypeKey TEXT NOT NULL  -- text key
```

**Recommended:**
```sql
-- LegalRequest
ALTER TABLE LegalRequest ADD COLUMN matterTypeId TEXT REFERENCES MatterType(id);
ALTER TABLE LegalRequest DROP COLUMN matterType;

-- IntakeSubmission - bỏ redundant columns vì suy ra từ requestId
ALTER TABLE IntakeSubmission DROP COLUMN workspaceId;
ALTER TABLE IntakeSubmission DROP COLUMN matterTypeKey;
```

**Tasks:**
- [ ] 3.1.1. Thêm `matterTypeId` vào `LegalRequest`
- [ ] 3.1.2. Update code để dùng `matterTypeId` thay vì `matterType`
- [ ] 3.1.3. Loại bỏ `matterTypeKey` khỏi `IntakeSubmission`

---

### 3.2. Add Missing Foreign Keys

```sql
-- Message
ALTER TABLE Message ADD FOREIGN KEY (senderId) REFERENCES "User"(id);
ALTER TABLE Message ADD FOREIGN KEY (recipientId) REFERENCES "User"(id);

-- FileAccessLog
ALTER TABLE FileAccessLog ADD FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE SET NULL;

-- DocumentVersion
ALTER TABLE DocumentVersion ADD FOREIGN KEY (templateId) REFERENCES "DocumentTemplate"(id);

-- VaultFile
ALTER TABLE VaultFile ADD FOREIGN KEY (organizationId) REFERENCES "Organization"(id);
```

**Tasks:**
- [ ] 3.2.1. Add FK cho Message.senderId, recipientId
- [ ] 3.2.2. Add FK cho FileAccessLog.userId
- [ ] 3.2.3. Add FK cho DocumentVersion.templateId
- [ ] 3.2.4. Add FK cho VaultFile.organizationId

---

### 3.3. Add CHECK Constraints cho Enum Fields

```sql
-- LegalRequest status
ALTER TABLE LegalRequest ADD CONSTRAINT chk_status
CHECK (status IN ('draft_intake', 'submitted', 'assigned', 'in_progress', 
                  'pending_review', 'approved', 'rejected', 'cancelled', 'closed'));

-- LegalRequest priority
ALTER TABLE LegalRequest ADD CONSTRAINT chk_priority
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- WorkspaceMembership role
ALTER TABLE WorkspaceMembership ADD CONSTRAINT chk_role
CHECK (role IN ('customer', 'specialist', 'reviewer', 'coordinator', 'admin'));
```

**Tasks:**
- [ ] 3.3.1. Add CHECK cho LegalRequest.status
- [ ] 3.3.2. Add CHECK cho LegalRequest.priority
- [ ] 3.3.3. Add CHECK cho WorkspaceMembership.role

---

### 3.4. Fix SQLite NULL Unique Issues

```sql
-- MatterType: workspaceId NULL allows duplicates
CREATE UNIQUE INDEX uniq_matterType_global_key
ON MatterType(key)
WHERE workspaceId IS NULL;

CREATE UNIQUE INDEX uniq_matterType_workspace_key
ON MatterType(workspaceId, key)
WHERE workspaceId IS NOT NULL;

-- Folder: parentId NULL allows duplicates
CREATE UNIQUE INDEX uniq_folder_root_name
ON Folder(workspaceId, name_vi)
WHERE parentId IS NULL;
```

**Tasks:**
- [ ] 3.4.1. Fix MatterType unique constraints
- [ ] 3.4.2. Fix Folder unique constraints

---

## 4. Priority 3 - Khi Scale Lớn Hơn

### 4.1. Translation Tables

Thay vì `label_vi`, `label_en`, `label_zh`, `label_ja`:

```sql
TranslationTable:
  id
  entityType TEXT
  entityId TEXT
  locale TEXT
  field TEXT
  value TEXT
  PRIMARY KEY (entityType, entityId, locale, field)
```

### 4.2. Module-based Migration Organization

```
prisma/migrations/
  01_identity/
  02_tenancy/
  03_partner/
  04_request/
  05_document/
  06_file_vault/
  07_audit_message/
```

---

## 5. Migration Execution Plan

### Phase 1: Safe Changes (No Breaking)
```sql
-- 5.1. Add FK constraints (backward compatible)
-- 5.2. Add CHECK constraints (backward compatible)
-- 5.3. Fix unique indexes (no data loss)
```

### Phase 2: Add New Columns
```sql
-- 5.4. Thêm matterTypeId vào LegalRequest
-- 5.5. Thêm isCurrent/endedAt vào RequestAssignment
-- 5.6. Thêm fileId vào VaultFile
```

### Phase 3: Data Migration
```sql
-- 5.7. Migrate data sang new columns
-- 5.8. Verify data consistency
```

### Phase 4: Remove Old Columns
```sql
-- 5.9. Drop redundant columns (breaking)
-- 5.10. Update all code references
```

---

## 6. Files Cần Update

### Database Schema
- [ ] `prisma/schema.prisma` - Update schema
- [ ] `prisma/schema.sql` - Re-export SQL

### Seed Files
- [ ] `prisma/seed.ts`
- [ ] `prisma/seed-customer-dashboard.ts`

### Source Code
- [ ] `src/lib/services/request-service.ts`
- [ ] `src/lib/services/assignment-service.ts`
- [ ] `src/lib/services/vault-service.ts`
- [ ] `src/lib/services/review-service.ts`
- [ ] `src/lib/api/requests.ts`
- [ ] `src/lib/api/documents.ts`

---

## 7. Estimated Effort

| Task | Effort | Risk |
|------|--------|------|
| Assignment deduplication | Medium | High (breaking) |
| VaultFile/File consolidation | High | High (breaking) |
| Review FK simplification | Low | Medium |
| MatterType FK | Medium | Medium |
| Missing FKs | Low | Low |
| CHECK constraints | Low | Low |

**Total:** ~2-3 days implementation + testing

---

## 8. Recommendations

1. **Backup trước khi migrate** - Các thay đổi P1 là breaking changes
2. **Chạy migration có thứ tự** - Phase 1 → 2 → 3 → 4
3. **Update tests trước** - Viết tests cho new schema trước khi migrate data
4. **Coordinate với team** - Vì có breaking changes, cần báo trước

---

## Status: CHƯA IMPLEMENT

Document này chỉ là planning. Cần user xác nhận trước khi bắt đầu implementation.
