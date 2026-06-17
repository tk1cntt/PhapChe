# Database Architecture Review - Independent Expert Analysis

**Document Type:** Architecture Review  
**Author:** Independent Systems Architect  
**Date:** 2026-06-17  
**Reference:** `prisma/DB_IMPROVEMENT_PLAN.md`  
**Status:** REVIEW IN PROGRESS

---

## Bước 1: Liệt kê và Phân rã (Neutral Listing)

### 1.1. Assignment Duplication Solutions

| Phương án | Mô tả kỹ thuật |
|-----------|-----------------|
| **Option A: Source of Truth = LegalRequest** | Giữ assignment columns trong LegalRequest. RequestAssignment trở thành bảng lịch sử thuần túy. Logic nghiệp vụ chỉ đọc từ LegalRequest. |
| **Option B: Source of Truth = RequestAssignment** | Xoá assignment columns từ LegalRequest. Thêm `isCurrent=1` flag và partial unique index. Logic đọc từ RequestAssignment với WHERE isCurrent=1. |
| **Option C: Hybrid CQRS** | Giữ cả 2 nhưng sync đồng bộ qua trigger hoặc application layer. Complex event sourcing nhẹ. |
| **Option D: Event Sourcing** | Bỏ cả 2, dùng Event Store riêng. Mỗi assignment là event. State được reconstruct từ event log. |

### 1.2. VaultFile vs File Consolidation

| Phương án | Mô tả kỹ thuật |
|-----------|-----------------|
| **Option A: Keep VaultFile, Drop File** | VaultFile giữ nguyên. File bị loại bỏ. Thêm các columns còn thiếu vào VaultFile (checksum, storageDriver). |
| **Option B: Keep File, Drop VaultFile** | File là bảng storage chính. VaultFile bị loại bỏ hoặc chỉ là view/reference. Thêm business columns vào File (fileKind, source). |
| **Option C: Two-Tier Architecture** | FileAsset (physical) → VaultItem (business). FileAsset chứa metadata vật lý. VaultItem chứa metadata nghiệp vụ, FK đến FileAsset. |
| **Option D: Single Unified Table** | Hợp nhất thành 1 bảng duy nhất. Tách ra bảng type/category nếu cần phân biệt vault vs upload. |

### 1.3. Review FK Chain Simplification

| Phương án | Mô tả kỹ thuật |
|-----------|-----------------|
| **Option A: documentVersionId as Primary FK** | Chỉ giữ documentVersionId là FK bắt buộc. workspaceId, requestId, documentId được query từ chain. |
| **Option B: Composite FK** | Giữ nhiều FK nhưng thêm composite constraint đảm bảo consistency. |
| **Option C: Denormalized for Performance** | Giữ tất cả FK, thêm computed/generated columns cho denormalized data. |
| **Option D: Separate Review Tables** | Tách Review thành RequestReview, DocumentReview riêng biệt theo domain. |

### 1.4. MatterType Reference

| Phương án | Mô tả kỹ thuật |
|-----------|-----------------|
| **Option A: matterTypeId FK** | LegalRequest có matterTypeId TEXT REFERENCES MatterType(id). Loại bỏ matterType text field. |
| **Option B: matterTypeKey with validation** | Giữ text key, thêm CHECK constraint hoặc trigger validation. Không cần FK. |
| **Option C: JSON Schema Reference** | Lưu matterType schema inline trong LegalRequest. Không cần MatterType table. |
| **Option D: Full JSON + Search Index** | Dùng FTS5 hoặc external search (MeiliSearch, Elasticsearch) cho matterType lookup. |

### 1.5. Database Change Execution Strategy

| Phương án | Mô tả kỹ thuật |
|-----------|-----------------|
| **Option A: Big Bang Migration** | Tất cả changes trong 1 migration lớn. Atomic, nhưng risky và khó rollback. |
| **Option B: Incremental Phased** | Nhiều small migrations theo dependency order. Safer, nhưng kéo dài timeline. |
| **Option C: Expand-Contract Pattern** | Thêm column mới → migrate data → switch code → drop old column. Mỗi step riêng biệt. |
| **Option D: Feature Flag + Shadow Tables** | Code check feature flag, shadow table chứa new schema. Flip switch khi ready. |

### 1.6. Missing FK Enforcement

| Phương án | Mô tả kỹ thuật |
|-----------|-----------------|
| **Option A: Add FK Constraints Now** | ALTER TABLE để thêm tất cả FK. Enforce integrity ngay lập tức. |
| **Option B: Soft Constraints via App Layer** | Không thêm FK, enforce trong application code. Linh hoạt hơn nhưng risk inconsistent data. |
| **Option C: Deferred Constraints** | Thêm FK với DEFERRABLE INITIALLY DEFERRED. Check cuối transaction. |
| **Option D: Hybrid** | Critical FKs thêm ngay (Message.senderId), less critical qua app layer. |

---

## Bước 2: Phân tích theo Tiêu chí (Attribute Mapping)

### 2.1. Criteria Weight Matrix

| Tiêu chí | Trọng số | Lý do |
|----------|-----------|-------|
| **Data Integrity** | 30% | Hệ thống pháp lý - sai data = rủi ro pháp lý |
| **Migration Safety** | 25% | Production data đang có - không thể mất |
| **Performance** | 20% | Dashboard và listing queries |
| **Maintainability** | 15% | Team phải understand và debug |
| **Future Scalability** | 10% | Cần hỗ trợ growth |

### 2.2. Assignment Solutions Analysis

| Criteria | Option A (LR is SOT) | Option B (RA is SOT) | Option C (Hybrid) | Option D (Event) |
|----------|---------------------|---------------------|-------------------|------------------|
| **Data Integrity** | ⚠️ Medium - 2 sources | ✅ High - 1 source | ⚠️ Medium - sync risk | ✅ High - immutable log |
| **Migration Safety** | ✅ High - simple | ⚠️ Medium - breaking | ❌ Low - complex | ❌ Very Low - major rewrite |
| **Performance** | ✅ High - direct read | ⚠️ Medium - filter | ⚠️ Medium - join | ❌ Low - reconstruct |
| **Maintainability** | ✅ High - simple | ✅ High - standard | ⚠️ Medium - 2 systems | ❌ Low - complex |
| **Scalability** | ⚠️ Medium | ✅ High - standard pattern | ⚠️ Medium | ✅ High - if needed |

**Winner by Criteria:**
- **Data Integrity:** Option D (Event) = Option B
- **Migration Safety:** Option A
- **Performance:** Option A
- **Maintainability:** Option A = Option B
- **Scalability:** Option B = Option D

### 2.3. VaultFile vs File Solutions Analysis

| Criteria | Option A (Keep VF) | Option B (Keep File) | Option C (Two-Tier) | Option D (Unified) |
|----------|---------------------|---------------------|---------------------|-------------------|
| **Data Integrity** | ⚠️ Medium - 1 table | ⚠️ Medium - 1 table | ✅ High - clear separation | ⚠️ Medium - 1 table |
| **Migration Safety** | ✅ High - keep VF | ⚠️ Medium - migrate VF→File | ❌ Low - restructure | ⚠️ Medium - merge |
| **Performance** | ✅ High - no join | ✅ High - optimized | ⚠️ Medium - 2 queries | ✅ High - no join |
| **Maintainability** | ⚠️ Medium - custom | ✅ High - standard | ⚠️ Medium - 2 tables | ✅ High - single |
| **Scalability** | ⚠️ Medium | ✅ High - standard | ✅ High - layered | ⚠️ Medium |

### 2.4. Trade-off Analysis

**Nếu chọn Option B (RA is SOT) cho Assignment:**
```
Mất: ✓ Simplicity - cần filter isCurrent=1 everywhere
Mất: ✓ Direct query - LegalRequest có sẵn, không cần join
Được: ✓ Single source of truth - không duplication
Được: ✓ History preserved - biết ai assigned khi nào
Được: ✓ Standard pattern - reviewer/dba quen thuộc
```

**Nếu chọn Option B (Keep File) cho Vault/File:**
```
Mất: ✓ Existing VaultFile business logic - phải rewrite
Mất: ✓ fileKind/source metadata - có trong VaultFile
Được: ✓ Single storage layer - DRY principle
Được: ✓ Consistent checksum/versioning - File có sẵn
Được: ✓ Standard blob storage pattern - có thể swap storage
```

---

## Bước 3: Đề xuất dựa trên Context (Contextual Recommendation)

### 3.1. Project Context Analysis

| Context Factor | Current State | Implication |
|---------------|---------------|-------------|
| **Database Size** | SQLite - small to medium | Không cần extreme optimization |
| **Team Experience** | TypeScript/Next.js focus | Familiar với ORM patterns, không quen event sourcing |
| **Timeline Pressure** | MVP phase - cần ship | Big bang risky, incremental safer |
| **Data Sensitivity** | Legal documents - HIGH | Integrity quan trọng hơn performance |
| **Multi-tenancy** | Shared tenant v2.1 | Workspace isolation critical |
| **Existing Tech** | Prisma ORM | Nên align với Prisma conventions |

### 3.2. Phương án được đề xuất

#### **Assignment: Option B (RequestAssignment is SOT)**

**Lý do:**
1. **Industry Standard:** Đây là pattern phổ biến trong ticket/issue tracking systems (Jira, Linear)
2. **History Preservation:** Legal context cần biết ai xử lý khi nào - không chỉ ai hiện tại
3. **Prisma-Friendly:** Prisma hỗ trợ tốt cho pattern này với `@default` và indexes
4. **Audit-Ready:** Tự động có audit trail cho mỗi assignment change

**Implementation Note:**
```sql
-- Partial unique index - Prisma supports this
model RequestAssignment {
  requestId String
  kind      String
  isCurrent Boolean @default(true)
  // ... other fields

  @@unique([requestId, kind], name: "uniq_current_assignment", map: "uniq_current_assignment")
}

-- Trong Prisma schema, dùng stored procedure hoặc pre-hook để:
-- 1. Khi insert assignment mới: SET isCurrent = false cho assignment cũ cùng requestId + kind
-- 2. Khi query: luôn filter isCurrent = true
```

#### **Vault/File: Option C (Two-Tier Architecture)**

**Lý do:**
1. **Separation of Concerns:** Physical storage ≠ Business vault metadata
2. **Storage Flexibility:** Có thể swap S3/GCS/Local mà không ảnh hưởng business logic
3. **Future-proof:** Khi cần versioning, có sẵn FileVersion table
4. **Audit Trail:** FileAccessLog đã có, chỉ cần link đúng

**Implementation Note:**
```
FileAsset (Physical Layer)
├── storageDriver, bucket, objectKey
├── originalName, mimeType, size, checksum
└── status, createdById, createdAt

VaultItem (Business Layer)
├── fileAssetId (FK → FileAsset)
├── workspaceId, requestId, organizationId
├── documentVersionId, fileKind, source
├── visibility, deletedAt
└── Có thể thêm: tags[], folders[]
```

#### **Review FK: Option A (documentVersionId as Primary)**

**Lý do:**
1. **Immutable Audit:** documentVersionId tồn tại sau khi document bị delete
2. **Traceability:** Review luôn gắn với version cụ thể - tránh "review bản này gửi bản khác"
3. **Legal Requirement:** Như đã note trong constraints - traceability là bắt buộc

#### **MatterType: Option A (matterTypeId FK)**

**Lý do:**
1. **Type Safety:** FK đảm bảo referential integrity
2. **Query Performance:** JOIN trên ID nhanh hơn text key
3. **Future Extensibility:** Có thể add metadata cho MatterType ( SLA, pricing, etc.)

### 3.3. Migration Strategy: Option C (Expand-Contract Pattern)

**Phase 1: Expand (Safe - backward compatible)**
```
1. Thêm matterTypeId vào LegalRequest
2. Thêm isCurrent, endedAt vào RequestAssignment
3. Thêm fileId vào VaultFile
4. Thêm FK constraints với DEFERRABLE
```

**Phase 2: Backfill (Data Migration)**
```
1. Backfill matterTypeId từ MatterType.key = LegalRequest.matterType
2. Backfill RequestAssignment.isCurrent (true cho bản ghi mới nhất)
3. Backfill VaultFile.fileId từ File.id matching
```

**Phase 3: Contract (Code changes + Drop old)**
```
1. Update code đọc từ new columns
2. Add constraint không cho phép NULL ở new columns
3. Drop old columns sau khi verify đầy đủ
```

---

## Bước 4: Chế độ Phản biện Nghịch đảo (Adversarial Mode)

### 4.1. Devil's Advocate Attack on Assignment Option B

**Giả định:** Chọn RequestAssignment làm Source of Truth

#### Kịch bản thất bại #1: Race Condition khi Concurrent Assignment

```
Timeline:
T0: Request A có assignment hiện tại (specialist: user_1, isCurrent: true)
T1: Admin B reassign cho user_2 (transaction 1)
T2: Admin C reassign cho user_3 (transaction 2) - chạy song song

Kết quả có thể:
- user_2 và user_3 đều nghĩ mình là specialist hiện tại
- Cả 2 đều nhận notification
- Cả 2 đều start working
```

**Rủi ro:** Race condition trên isCurrent flag nếu không có proper locking.

**Mitigation cần thiết:**
```sql
-- Dùng row-level locking hoặc:
ALTER TABLE RequestAssignment ADD COLUMN lockVersion Int @default(0);

-- Hoặc dùng transaction với SERIALIZABLE isolation:
PRAGMA isolation_level = SERIALIZABLE;
BEGIN EXCLUSIVE;
  UPDATE RequestAssignment SET isCurrent = 0 WHERE requestId = ? AND kind = ?;
  INSERT INTO RequestAssignment (...) VALUES (...);
COMMIT;
```

#### Kịch bản thất bại #2: Query Pattern Change Breaking Performance

```
Dashboard query cũ (Simple):
SELECT * FROM LegalRequest WHERE assignedSpecialistId = ?

Dashboard query mới (Complex):
SELECT lr.*, ra.userId 
FROM LegalRequest lr
JOIN RequestAssignment ra ON lr.id = ra.requestId AND ra.kind = 'specialist' AND ra.isCurrent = 1
WHERE ra.userId = ?
```

**Rủi ro:** JOIN có thể làm dashboard chậm hơn đáng kể với 100k+ requests.

**Mitigation cần thiết:**
- Index trên (requestId, kind, isCurrent)
- Có thể cần materialized view cho dashboard

#### Kịch bản thất bại #3: History Table Bloat

```
Nếu request được reassign 50 lần:
- RequestAssignment có 50 bản ghi cho 1 request
- 50% queries cần filter isCurrent = 1
- Index size grows linearly với assignment changes
```

**Rủi ro:** Table bloat, index performance degradation theo thời gian.

**Mitigation cần thiết:**
- Archive/purge old assignments sau X months
- Partitioning strategy nếu scale lớn

---

### 4.2. Devil's Advocate Attack on Two-Tier Vault Architecture

**Giả định:** Chọn Two-Tier (FileAsset + VaultItem)

#### Kịch bản thất bại #1: Orphan FileAssets

```
User uploads file:
1. FileAsset created (storageDriver: 's3', objectKey: 'uploads/abc123')
2. VaultItem created, linked to FileAsset
3. User deletes VaultItem (soft delete)

Sau 6 months:
- FileAsset vẫn tồn tại trên S3
- Storage cost tăng
- Không ai biết file này đã bị xóa
```

**Rủu ro:** Orphaned blobs, storage waste, compliance issue (GDPR).

**Mitigation cần thiết:**
```sql
-- Option 1: Cascade delete
ALTER TABLE VaultItem ADD FOREIGN KEY (fileAssetId) REFERENCES FileAsset(id) ON DELETE CASCADE;

-- Option 2: Background cleanup job
-- Query FileAsset không có VaultItem, xóa sau retention period
SELECT fa.* FROM FileAsset fa 
LEFT JOIN VaultItem vi ON fa.id = vi.fileAssetId 
WHERE vi.id IS NULL AND fa.createdAt < NOW() - INTERVAL '30 days';
```

#### Kịch bản thất bại #2: Double Storage Cost During Migration

```
Migration period:
- FileAsset chứa file vật lý
- VaultFile vẫn chứa backup/cached copy
- 2x storage bandwidth trong migration
```

**Rủi ro:** Temporary cost spike.

**Mitigation:** Migrate incrementally, clean up old data sau mỗi batch.

#### Kịch bản thất bại #3: Complexity cho Simple Uploads

```
Use case: User upload 1 file đơn giản

Trước đây:
INSERT INTO VaultFile (...) VALUES (...);

Bây giờ:
1. INSERT INTO FileAsset (...) VALUES (...);
2. INSERT INTO VaultItem (...) VALUES (...);
3. INSERT INTO FileAccessLog (...) VALUES (...);

Code complexity tăng 3x cho mỗi upload.
```

**Rủi ro:** Developer productivity down, bug chance up.

**Mitigation:**
```typescript
// Wrapper function trong service layer
async function uploadVaultFile(data: UploadData) {
  const fileAsset = await prisma.fileAsset.create({ data: { /* physical */ } });
  const vaultItem = await prisma.vaultItem.create({ data: { /* business */ } });
  await prisma.fileAccessLog.create({ data: { /* audit */ } });
  return vaultItem;
}
```

---

### 4.3. Hidden Architectural Risks (Thường bị bỏ qua)

#### Risk #1: Temporal Coupling

```
Current schema: LegalRequest → MatterType (via matterTypeId)
Future need: LegalRequest có thể thuộc nhiều MatterTypes

Nếu Option A được implement, sau này muốn multi-type phải:
1. Thêm junction table RequestMatterType
2. Update tất cả queries
3. Migration khó hơn vì đã có FK constraint
```

**Gợi ý:** Consider polymorphic relationship hoặc JSON array nếu multi-type là possibility.

#### Risk #2: Index Cardinality Explosion

```
RequestAssignment indexes:
- uniq(requestId, kind) WHERE isCurrent = 1
- idx(requestId) - for history queries
- idx(userId, kind) - for "my assignments"
- idx(createdAt) - for sorting

4 indexes cho 1 table = 4x write overhead.
```

**Gợi ý:** Monitor query patterns trước khi add indexes. SQLite write locks entire DB.

#### Risk #3: Migration Rollback Complexity

```
Phase 3 (Contract) - drop old columns
Nếu code deployment chưa complete:
- Old code đọc từ column đã drop
- 500 errors
- Rollback = recreate column + restore data

Total downtime: 2x migration time
```

**Gợi ý:** Feature flag để toggle giữa old/new code. Blue-green deployment.

---

## 4.4. Final Recommendation (Updated)

### Phương án được chọn sau khi Adversarial Review:

| Issue | Original Rec | Updated Rec | Reason for Change |
|-------|-------------|-------------|-------------------|
| Assignment | Option B | **Option B với Race Condition Handling** | Chấp nhận trade-off với proper locking |
| Vault/File | Option C | **Option B + VaultItem là lightweight** | Giảm complexity, Option C overkill cho MVP |
| Review FK | Option A | **Option A** | Không có objections |
| MatterType | Option A | **Option A** | Không có objections |

### Revised Two-Tier Architecture (Simplified):

```
FileAsset (unchanged from current File)
├── id
├── storageDriver, bucket, objectKey
├── originalName, mimeType, size, checksum
└── status, createdById, createdAt, updatedAt

VaultItem (tinh gọn từ VaultFile)
├── id
├── fileAssetId (FK → FileAsset) -- NEW, required
├── workspaceId, requestId, organizationId
├── fileKind, source, visibility
├── deletedAt
└── createdAt, updatedAt

-- Loại bỏ duplicate columns đã có trong FileAsset
```

### Migration Priority (Reordered):

1. **Phase 1:** Add missing FK constraints (NON-BREAKING)
   - Message.senderId, recipientId
   - FileAccessLog.userId
   
2. **Phase 2:** Add new columns (EXPAND)
   - LegalRequest.matterTypeId
   - RequestAssignment.isCurrent, endedAt
   - VaultItem.fileAssetId
   
3. **Phase 3:** Backfill data và verify
   
4. **Phase 4:** Update code đọc từ new columns

5. **Phase 5:** Add constraints, drop old columns (CONTRACT)

---

## 5. Summary: Recommendations vs Original Plan

| Issue | Original Plan | Expert Recommendation | Change? |
|-------|--------------|----------------------|---------|
| Assignment | Option B | Option B + Locking | ⚠️ Minor |
| Vault/File | Option C (complex) | Option B + Simple VaultItem | ✅ Changed |
| Review FK | Option A | Option A | - |
| MatterType | Option A | Option A | - |
| FK Addition | Batch all | Phase 1 safety | ✅ Changed |
| Migration | Big Bang | Expand-Contract | ✅ Changed |

---

**Document Status:** COMPLETE  
**Reviewer:** Independent Systems Architect  
**Approval Required:** User confirmation before implementation
