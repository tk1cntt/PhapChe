Mình đã đọc schema trong `schema.sql`. Nhìn tổng thể DB đang mô hình hoá một **Legal Service Platform đa workspace / organization / partner**, có đủ các khối chính: user, tenant, organization, partner, engagement, legal request, intake, document, review, vault/file, workflow, audit, auth và message.

Đánh giá nhanh: **schema khá đầy đủ về nghiệp vụ**, nhưng đang có vài điểm dễ gây **trùng dữ liệu, lệch dữ liệu giữa bảng, thiếu ràng buộc FK, và phân mảnh file/document/vault**.

---

## 1. Tổng quan cấu trúc hiện tại

Các nhóm bảng chính:

### Nhóm identity / auth

* `User`
* `UserPreferences`
* `Account`
* `Session`
* `Verification`

Nhóm này ổn, khá tách bạch giữa user nghiệp vụ và auth provider.

### Nhóm tenant / organization / workspace

* `Tenant`
* `Organization`
* `Workspace`
* `WorkspaceMembership`

Cấu trúc hiện tại là:

```text
Tenant
  └── Organization
        └── Workspace
              └── WorkspaceMembership
```

Mô hình này hợp lý nếu hệ thống hỗ trợ nhiều organization trong một tenant.

### Nhóm partner / engagement

* `Partner`
* `PartnerMember`
* `Engagement`
* `EngagementServiceScope`
* `ServiceType`

Đây là phần mô tả quan hệ giữa tổ chức khách hàng và đối tác pháp lý.

### Nhóm legal request / intake / routing

* `LegalRequest`
* `MatterType`
* `IntakeSubmission`
* `RoutingCapability`
* `RequestAssignment`
* `WorkflowTransition`

Đây là lõi nghiệp vụ xử lý request.

### Nhóm document / review / vault / file

* `Document`
* `DocumentVersion`
* `DocumentTemplate`
* `Review`
* `ReviewChecklistAnswer`
* `VaultFile`
* `Folder`
* `Tag`
* `VaultFileFolder`
* `VaultFileTag`
* `File`
* `FileVersion`
* `FileAccessLog`

Đây là khu vực đang có nhiều điểm nên cải thiện nhất.

---

# 2. Các điểm đang bị duplicate hoặc dễ lệch dữ liệu

## 2.1. `LegalRequest` đang lưu assignment hiện tại, nhưng cũng có `RequestAssignment`

Hiện tại `LegalRequest` có:

```sql
assignedSpecialistId TEXT,
assignedReviewerId TEXT,
assignedPartnerId TEXT,
engagementId TEXT
```

Trong khi `RequestAssignment` cũng có:

```sql
requestId TEXT NOT NULL,
userId TEXT NOT NULL,
kind TEXT DEFAULT 'specialist' NOT NULL,
partnerId TEXT,
engagementId TEXT
```

Đây là duplication rõ nhất.

Vấn đề là có 2 nơi cùng mô tả assignment:

```text
LegalRequest.assignedSpecialistId
LegalRequest.assignedReviewerId
LegalRequest.assignedPartnerId
LegalRequest.engagementId

và

RequestAssignment.userId / kind / partnerId / engagementId
```

### Rủi ro

Ví dụ request A:

```text
LegalRequest.assignedSpecialistId = user_1
```

Nhưng bảng `RequestAssignment` lại có bản ghi mới nhất:

```text
requestId = A
kind = specialist
userId = user_2
```

Khi đó hệ thống không biết ai là specialist thật sự.

### Nên cải thiện

Có 2 hướng:

#### Hướng A — `LegalRequest` giữ trạng thái hiện tại, `RequestAssignment` là lịch sử

Giữ các cột `assignedSpecialistId`, `assignedReviewerId`, `assignedPartnerId`, `engagementId` trong `LegalRequest`.

Đổi `RequestAssignment` thành bảng lịch sử rõ ràng hơn:

```sql
RequestAssignmentHistory
- id
- requestId
- assigneeUserId
- kind
- partnerId
- engagementId
- action -- assigned / reassigned / unassigned
- reason
- createdById
- createdAt
```

Khi assign mới, update `LegalRequest`, đồng thời insert history.

#### Hướng B — bỏ assignment khỏi `LegalRequest`, dùng `RequestAssignment` làm source of truth

Thêm các cột:

```sql
isCurrent INTEGER DEFAULT 1
endedAt TEXT
```

và unique partial index kiểu:

```sql
UNIQUE(requestId, kind) WHERE isCurrent = 1
```

SQLite hỗ trợ partial index:

```sql
CREATE UNIQUE INDEX uniq_current_assignment
ON RequestAssignment(requestId, kind)
WHERE isCurrent = 1;
```

Theo mình, với hệ thống pháp lý có lịch sử assign/reassign, **hướng B sạch hơn**.

---

## 2.2. `LegalRequest.matterType` duplicate với `IntakeSubmission.matterTypeKey`

`LegalRequest` có:

```sql
matterType TEXT
```

`IntakeSubmission` lại có:

```sql
matterTypeKey TEXT NOT NULL
schemaVersion TEXT NOT NULL
```

Trong khi `MatterType` có:

```sql
workspaceId
key
schemaVersion
questionSchema
```

### Rủi ro

Request có thể có:

```text
LegalRequest.matterType = contract_review
IntakeSubmission.matterTypeKey = nda_review
```

Không có constraint nào đảm bảo 2 giá trị này giống nhau.

### Nên cải thiện

Nên chọn một source of truth.

Khuyến nghị:

```sql
LegalRequest.matterTypeId TEXT
```

thay vì `matterType TEXT`.

Hoặc nếu vẫn muốn dùng key:

```sql
LegalRequest.matterTypeKey TEXT NOT NULL
LegalRequest.matterTypeSchemaVersion TEXT
```

và `IntakeSubmission` không cần lưu lại `workspaceId`, `matterTypeKey` nữa nếu đã suy ra được qua `requestId`.

Thiết kế sạch hơn:

```text
LegalRequest
- id
- workspaceId
- matterTypeId
- ...

IntakeSubmission
- id
- requestId
- schemaVersion
- answers
- answerLabels
```

---

## 2.3. `Document.workspaceId` duplicate với `LegalRequest.workspaceId`

`Document` có:

```sql
workspaceId TEXT NOT NULL,
requestId TEXT NOT NULL
```

Nhưng `requestId` đã trỏ tới `LegalRequest`, mà `LegalRequest` đã có `workspaceId`.

### Rủi ro

Document có thể bị lưu sai workspace:

```text
LegalRequest.id = req_1
LegalRequest.workspaceId = ws_A

Document.requestId = req_1
Document.workspaceId = ws_B
```

DB hiện tại không chặn được case này.

### Nên cải thiện

Nếu document luôn thuộc về request, thì bỏ `Document.workspaceId`.

```sql
Document
- id
- requestId
- title
- deletedAt
```

Nếu vẫn muốn giữ để query nhanh, cần constraint composite:

```sql
LegalRequest(id, workspaceId)
Document(requestId, workspaceId) REFERENCES LegalRequest(id, workspaceId)
```

Nhưng SQLite cần `UNIQUE(id, workspaceId)` ở bảng cha.

---

## 2.4. `Review.workspaceId`, `Review.requestId`, `Review.documentId`, `Review.documentVersionId` dễ lệch nhau

`Review` hiện có:

```sql
workspaceId TEXT NOT NULL,
requestId TEXT NOT NULL,
documentId TEXT NOT NULL,
documentVersionId TEXT,
reviewerId TEXT NOT NULL
```

Nhưng:

```text
documentVersionId -> DocumentVersion -> Document -> LegalRequest
documentId -> Document -> LegalRequest
requestId -> LegalRequest
workspaceId -> Workspace
```

Tức là `Review` đang lưu cùng lúc nhiều khóa có thể suy ra từ nhau.

### Rủi ro

Có thể có review như sau:

```text
Review.requestId = req_A
Review.documentId = doc_B thuộc req_B
Review.documentVersionId = version_C thuộc doc_C
```

DB hiện tại không enforce quan hệ này.

### Nên cải thiện

Nên để `Review` phụ thuộc vào `documentVersionId` là chính.

Thiết kế gọn hơn:

```sql
Review
- id
- documentVersionId NOT NULL
- reviewerId NOT NULL
- status
- decision
- generalComment
- completedAt
- createdAt
- updatedAt
```

Từ `documentVersionId` suy ra document, request, workspace.

Nếu cần query nhanh theo `requestId`, có thể giữ `requestId` nhưng phải enforce bằng logic app hoặc composite FK.

---

## 2.5. `VaultFile` và `File` đang bị chồng vai trò

Hiện tại có cả:

```text
VaultFile
File
FileVersion
FileAccessLog
```

`VaultFile` có:

```sql
requestId
workspaceId
organizationId
actorId
filename
storageKey
fileKind
source
documentVersionId
size
contentType
```

`File` có:

```sql
workspaceId
requestId
storageDriver
bucket
objectKey
originalName
mimeType
size
checksum
category
visibility
status
createdById
```

Hai bảng này đều đang mô tả file vật lý / metadata file.

### Đây là điểm phân mảnh lớn nhất

`VaultFile` giống như bảng nghiệp vụ vault.
`File` giống như bảng storage chuẩn hơn.

Nhưng cả hai cùng lưu:

```text
workspaceId
requestId
filename/originalName
storageKey/objectKey
size
contentType/mimeType
actorId/createdById
```

### Rủi ro

Một file upload có thể tồn tại ở `File`, nhưng không có trong `VaultFile`, hoặc ngược lại.

File bị đổi status trong `File`, nhưng `VaultFile` vẫn active.

File có `checksum` trong `File`, nhưng `VaultFile` không có.

### Nên cải thiện mạnh

Nên tách thành 2 tầng:

#### Tầng storage vật lý

```sql
FileAsset
- id
- storageDriver
- bucket
- objectKey
- originalName
- mimeType
- size
- checksum
- status
- createdById
- createdAt
- updatedAt
```

#### Tầng nghiệp vụ gắn file vào request/vault/document

```sql
VaultItem
- id
- fileAssetId
- workspaceId
- requestId
- organizationId
- documentVersionId
- fileKind
- source
- visibility
- deletedAt
- createdAt
```

#### Version file

```sql
FileVersion
- id
- fileAssetId hoặc vaultItemId
- versionNumber
- objectKey
- checksum
- size
- createdById
- createdAt
```

Hiện tại nên chọn **File làm bảng storage chính**, rồi sửa `VaultFile` thành bảng tham chiếu tới `File.id`:

```sql
ALTER TABLE VaultFile ADD COLUMN fileId TEXT REFERENCES File(id);
```

Sau đó dần bỏ các cột trùng:

```text
filename
storageKey
size
contentType
```

---

## 2.6. `VaultFile.organizationId`, `AuditEvent.organizationId`, `Message.organizationId` không có FK

Các bảng này có `organizationId`, nhưng không khai báo foreign key đến `Organization`.

Ví dụ:

```sql
VaultFile.organizationId TEXT
AuditEvent.organizationId TEXT
Message.organizationId TEXT
```

nhưng không có:

```sql
FOREIGN KEY (organizationId) REFERENCES Organization(id)
```

### Rủi ro

Dữ liệu orphan:

```text
organizationId = org_deleted_or_wrong
```

vẫn được insert bình thường.

### Nên cải thiện

Thêm FK:

```sql
FOREIGN KEY (organizationId) REFERENCES "Organization"(id)
```

Với audit event, nếu muốn giữ log kể cả org bị xoá, có thể dùng `ON DELETE SET NULL`.

```sql
FOREIGN KEY (organizationId) REFERENCES "Organization"(id) ON DELETE SET NULL
```

---

## 2.7. `Message.senderId` và `Message.recipientId` không có FK

`Message` có:

```sql
senderId TEXT NOT NULL,
recipientId TEXT NOT NULL
```

nhưng không tham chiếu `User(id)`.

### Rủi ro

Tin nhắn có sender hoặc recipient không tồn tại.

### Nên cải thiện

Thêm:

```sql
FOREIGN KEY (senderId) REFERENCES "User"(id),
FOREIGN KEY (recipientId) REFERENCES "User"(id)
```

Nếu muốn giữ message khi user bị deactivate, không nên xoá user vật lý. Nên soft delete user bằng `isActive = 0`.

---

## 2.8. `FileAccessLog.userId` không có FK

`FileAccessLog` có:

```sql
userId TEXT
```

nhưng chỉ FK tới `File`, không FK tới `User`.

Nên thêm:

```sql
FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE SET NULL
```

Vì access log nên được giữ lại kể cả user bị xoá/mất quyền.

---

## 2.9. `DocumentVersion.templateId` không FK tới `DocumentTemplate`

`DocumentVersion` có:

```sql
templateId TEXT NOT NULL
templateVersion INTEGER NOT NULL
```

nhưng chỉ có FK:

```sql
FOREIGN KEY (documentId) REFERENCES "Document" (id)
```

Không có FK tới `DocumentTemplate`.

### Rủi ro

DocumentVersion có thể trỏ tới template không tồn tại.

### Nên cải thiện

Nếu muốn snapshot template tại thời điểm generate, có 2 lựa chọn:

#### Cách 1 — lưu FK tới template version cụ thể

```sql
templateId TEXT NOT NULL REFERENCES DocumentTemplate(id)
```

Lúc này `templateVersion` có thể không cần, vì bản thân `DocumentTemplate.id` đã là version cụ thể.

#### Cách 2 — không FK, nhưng đổi tên rõ là snapshot

```sql
templateKey TEXT
templateVersion INTEGER
templateSnapshot TEXT
```

Nếu không FK thì nên coi nó là historical snapshot, không nên đặt tên là `templateId`.

---

## 2.10. `ReviewChecklistAnswer.checklistItemId` không có bảng cha

Có:

```sql
checklistItemId TEXT NOT NULL
```

nhưng không thấy bảng `ReviewChecklistItem`.

### Rủi ro

Checklist answer không biết trả lời cho item nào, hoặc item đã bị xoá.

### Nên bổ sung

```sql
ReviewChecklistItem
- id
- workspaceId
- matterTypeKey hoặc matterTypeId
- key
- label_vi
- label_en
- description
- sortOrder
- isActive
```

Sau đó:

```sql
FOREIGN KEY (checklistItemId) REFERENCES ReviewChecklistItem(id)
```

---

# 3. Các vấn đề về unique constraint và nullable

## 3.1. `MatterType` unique `(workspaceId, key)` có vấn đề với `workspaceId NULL`

`MatterType` có:

```sql
workspaceId TEXT,
key TEXT NOT NULL,
UNIQUE (workspaceId, key)
```

Trong SQLite, `NULL` trong unique không được coi là bằng nhau. Nghĩa là bạn có thể insert nhiều dòng:

```text
workspaceId = NULL
key = contract
```

nhiều lần.

### Nên cải thiện

Nếu có global matter type, nên tách rõ:

```sql
scope TEXT NOT NULL DEFAULT 'workspace'
workspaceId TEXT
```

Và tạo index riêng:

```sql
CREATE UNIQUE INDEX uniq_matterType_workspace_key
ON MatterType(workspaceId, key)
WHERE workspaceId IS NOT NULL;

CREATE UNIQUE INDEX uniq_matterType_global_key
ON MatterType(key)
WHERE workspaceId IS NULL;
```

---

## 3.2. `Folder` unique `(workspaceId, parentId, name_vi)` cũng có vấn đề với `parentId NULL`

`Folder` có:

```sql
UNIQUE (workspaceId, parentId, name_vi)
```

Nhưng với root folder, `parentId = NULL`, SQLite cho phép nhiều folder root cùng tên.

### Nên cải thiện

Tạo partial unique index:

```sql
CREATE UNIQUE INDEX uniq_folder_root_name
ON Folder(workspaceId, name_vi)
WHERE parentId IS NULL;

CREATE UNIQUE INDEX uniq_folder_child_name
ON Folder(workspaceId, parentId, name_vi)
WHERE parentId IS NOT NULL;
```

Ngoài ra chỉ unique theo `name_vi` là chưa đủ nếu app đa ngôn ngữ. Nên có thêm `key` hoặc `slug`.

---

## 3.3. `Workspace.slug` và `Partner.slug` đang unique global

Hiện tại:

```sql
Workspace.slug TEXT NOT NULL UNIQUE
Partner.slug TEXT NOT NULL UNIQUE
```

Nếu hệ thống multi-tenant, slug global có thể gây hạn chế.

Ví dụ tenant A có workspace `legal`, tenant B cũng muốn `legal` thì không được.

### Nên cải thiện

Nếu slug chỉ cần unique trong organization hoặc tenant:

```sql
UNIQUE(organizationId, slug)
```

hoặc:

```sql
UNIQUE(tenantId, slug)
```

Nhưng hiện `Workspace` không có `tenantId` trực tiếp, chỉ có `organizationId`. Có thể dùng `UNIQUE(organizationId, slug)`.

---

# 4. Các vấn đề về enum / status chưa được kiểm soát

Nhiều cột dạng enum đang là `TEXT`, ví dụ:

```text
User.accountType
Organization.status
Partner.type
Partner.status
WorkspaceMembership.role
LegalRequest.status
LegalRequest.priority
RequestAssignment.kind
Review.status
Review.decision
DocumentTemplate.status
File.status
File.category
Message.isRead
```

SQLite không có enum thật, nhưng nên có `CHECK`.

Ví dụ:

```sql
status TEXT NOT NULL CHECK (
  status IN ('draft_intake', 'submitted', 'assigned', 'in_review', 'completed', 'cancelled')
)
```

Hoặc tạo bảng lookup:

```sql
RequestStatus
Role
Priority
AssignmentKind
```

Với app đang phát triển nhanh, dùng `CHECK` là đủ. Khi cần dynamic config mới tách bảng lookup.

---

# 5. Các vấn đề về soft delete

Một số bảng có `deletedAt`:

```text
LegalRequest
Document
VaultFile
```

Nhưng nhiều bảng khác không có:

```text
File
FileVersion
Message
Review
DocumentVersion
Folder
Tag
WorkspaceMembership
PartnerMember
```

### Rủi ro

Dữ liệu liên quan có thể bị “active” dù object cha đã bị soft delete.

Ví dụ:

```text
Document.deletedAt IS NOT NULL
DocumentVersion vẫn status = draft
Review vẫn in_progress
VaultFile vẫn active
```

### Nên cải thiện

Cần thống nhất chiến lược:

#### Option A — hard delete bằng FK cascade

Dùng cho bảng phụ như:

```text
UserPreferences
Session
ReviewChecklistAnswer
FileVersion
VaultFileTag
VaultFileFolder
```

#### Option B — soft delete cho entity nghiệp vụ

Nên có `deletedAt` cho:

```text
LegalRequest
Document
File/VaultItem
Folder
Tag
Message nếu cần
```

Và query luôn filter:

```sql
WHERE deletedAt IS NULL
```

Đồng thời tạo index partial:

```sql
CREATE INDEX idx_document_active_request
ON Document(requestId)
WHERE deletedAt IS NULL;
```

---

# 6. Các vấn đề về audit / workflow

## 6.1. Có cả `WorkflowTransition` và `AuditEvent`

Hai bảng này không trùng hoàn toàn, nhưng có overlap.

`WorkflowTransition` lưu:

```text
requestId
fromStatus
toStatus
actorId
reason
metadata
createdAt
```

`AuditEvent` lưu:

```text
actorId
workspaceId
organizationId
action
targetType
targetId
requestId
correlationId
metadataSummary
createdAt
```

### Đánh giá

Không nhất thiết phải bỏ một bảng. Nhưng nên định nghĩa rõ:

```text
WorkflowTransition = event nghiệp vụ riêng cho đổi trạng thái request
AuditEvent = event audit tổng quát toàn hệ thống
```

Khi request đổi status, nên ghi cả 2 nhưng dùng cùng `correlationId`.

Hiện `WorkflowTransition` chưa có `correlationId`.

### Nên thêm

```sql
ALTER TABLE WorkflowTransition ADD COLUMN correlationId TEXT;
CREATE INDEX idx_workflowTransition_correlationId ON WorkflowTransition(correlationId);
```

---

## 6.2. `AuditEvent.targetId` là polymorphic, không thể FK

Cặp:

```sql
targetType TEXT NOT NULL,
targetId TEXT NOT NULL
```

là polymorphic reference. Đây là thiết kế phổ biến cho audit, nhưng không có FK được.

### Nên cải thiện

Thêm các cột context cụ thể nếu hay query:

```text
requestId
documentId
fileId
organizationId
workspaceId
```

Hiện đã có `requestId`, `workspaceId`, `organizationId`. Có thể thêm `documentId`, `fileId` nếu audit file/document nhiều.

---

# 7. Các vấn đề về index

Schema có khá nhiều index, đây là điểm tốt. Nhưng có vài index dư hoặc thiếu.

## 7.1. Index dư do unique đã tự tạo index

Ví dụ:

```sql
User.email TEXT NOT NULL UNIQUE
CREATE INDEX idx_user_email ON "User" (email);
```

`UNIQUE(email)` đã tạo index rồi. `idx_user_email` có thể dư.

Tương tự:

```text
Session.token UNIQUE + idx_session_token
Workspace.slug UNIQUE + idx_workspace_slug
```

Không phải lỗi nghiêm trọng, nhưng làm tăng chi phí ghi.

### Nên kiểm tra và bỏ index dư

Có thể bỏ:

```sql
idx_user_email
idx_session_token
idx_workspace_slug
```

nếu unique index đã đủ.

---

## 7.2. Thiếu index cho các query phổ biến

### LegalRequest

Nên có index cho danh sách request theo workspace, status, sort mới nhất:

```sql
CREATE INDEX idx_legalRequest_workspace_status_createdAt
ON LegalRequest(workspaceId, status, createdAt DESC)
WHERE deletedAt IS NULL;
```

Nếu có dashboard của specialist:

```sql
CREATE INDEX idx_legalRequest_specialist_status_deadline
ON LegalRequest(assignedSpecialistId, status, slaDeadline)
WHERE deletedAt IS NULL;
```

### Message

Query inbox thường là:

```sql
WHERE recipientId = ? AND isRead = 0
ORDER BY createdAt DESC
```

Nên có:

```sql
CREATE INDEX idx_message_recipient_read_createdAt
ON Message(recipientId, isRead, createdAt DESC);
```

Query thread theo request:

```sql
CREATE INDEX idx_message_request_createdAt
ON Message(legalRequestId, createdAt ASC);
```

### AuditEvent

Đã có index tốt theo actor và organization, nhưng nên thêm:

```sql
CREATE INDEX idx_auditEvent_workspace_createdAt
ON AuditEvent(workspaceId, createdAt DESC);
```

### File

Nên có:

```sql
CREATE INDEX idx_file_workspace_category_status
ON File(workspaceId, category, status);
```

---

# 8. Vấn đề về multi-language columns

Nhiều bảng có:

```text
label_vi
label_en
label_zh
label_ja
description_vi
description_en
description_zh
description_ja
```

Ví dụ:

```text
MatterType
DocumentTemplate
Folder
Tag
```

Cách này đơn giản và chạy nhanh nếu chỉ hỗ trợ cố định 4 ngôn ngữ.

### Nhưng nhược điểm

Mỗi lần thêm ngôn ngữ phải sửa schema.

Các query/search đa ngôn ngữ khó mở rộng.

### Nên cải thiện nếu app sẽ mở rộng

Tách bảng translation:

```sql
MatterTypeTranslation
- matterTypeId
- locale
- label
- description
- PRIMARY KEY(matterTypeId, locale)
```

Tương tự:

```text
DocumentTemplateTranslation
FolderTranslation
TagTranslation
```

Nếu app chỉ chắc chắn có 4 ngôn ngữ, giữ như hiện tại vẫn chấp nhận được.

---

# 9. Vấn đề về JSON TEXT

Một số cột lưu JSON:

```text
Tenant.settings
MatterType.questionSchema
IntakeSubmission.answers
IntakeSubmission.answerLabels
DocumentVersion.inputSnapshot
DocumentVersion.generatedContent
DocumentTemplate.variableSchema
WorkflowTransition.metadata
AuditEvent.metadataSummary
```

SQLite lưu JSON bằng `TEXT` là bình thường. Nhưng nên chú ý:

### Nên dùng CHECK json_valid

Nếu SQLite build có JSON1:

```sql
CHECK (json_valid(settings))
CHECK (json_valid(questionSchema))
CHECK (json_valid(answers))
```

Ví dụ:

```sql
settings TEXT DEFAULT '{}' NOT NULL CHECK (json_valid(settings))
```

### Với field hay query, không nên chôn trong JSON

Ví dụ nếu trong `answers` có các field hay filter như:

```text
contractValue
jurisdiction
deadline
counterparty
```

nên extract ra bảng phụ hoặc generated column.

---

# 10. Vấn đề timestamp `updatedAt`

Các bảng có:

```sql
updatedAt TEXT DEFAULT (datetime('now')) NOT NULL
```

Nhưng SQLite không tự update `updatedAt` khi update record.

### Nên thêm trigger

Ví dụ:

```sql
CREATE TRIGGER update_user_updatedAt
AFTER UPDATE ON "User"
FOR EACH ROW
BEGIN
  UPDATE "User" SET updatedAt = datetime('now') WHERE id = OLD.id;
END;
```

Hoặc xử lý ở application layer. Nếu dùng Prisma, thường app layer lo được, nhưng nếu có raw SQL thì dễ quên.

---

# 11. Các quan hệ nên bổ sung FK

Nên bổ sung FK cho các cột sau:

```text
IntakeSubmission.workspaceId -> Workspace(id)
DocumentVersion.templateId -> DocumentTemplate(id)
Review.documentVersionId -> DocumentVersion(id)
ReviewChecklistAnswer.checklistItemId -> ReviewChecklistItem(id)
VaultFile.organizationId -> Organization(id)
VaultFile.documentVersionId -> DocumentVersion(id)
AuditEvent.organizationId -> Organization(id)
FileAccessLog.userId -> User(id)
Message.organizationId -> Organization(id)
Message.senderId -> User(id)
Message.recipientId -> User(id)
```

Trong đó quan trọng nhất:

```text
Message.senderId / recipientId
DocumentVersion.templateId
Review.documentVersionId
VaultFile.documentVersionId
FileAccessLog.userId
```

---

# 12. Đề xuất tổ chức lại schema theo module

Hiện schema đang hơi “phẳng”, tất cả bảng ở cùng một file. Về tổ chức code/db migration, nên chia theo bounded context:

```text
01_identity
- User
- UserPreferences
- Account
- Session
- Verification

02_tenancy
- Tenant
- Organization
- Workspace
- WorkspaceMembership

03_partner
- Partner
- PartnerMember
- Engagement
- EngagementServiceScope
- ServiceType

04_request
- LegalRequest
- MatterType
- IntakeSubmission
- RoutingCapability
- RequestAssignment
- WorkflowTransition

05_document
- Document
- DocumentVersion
- DocumentTemplate
- Review
- ReviewChecklistItem
- ReviewChecklistAnswer

06_file_vault
- FileAsset/File
- FileVersion
- VaultItem/VaultFile
- Folder
- Tag
- VaultFileFolder
- VaultFileTag
- FileAccessLog

07_audit_message
- AuditEvent
- Message
```

Nếu dùng Prisma, có thể tách schema theo nhiều file nếu project setup hỗ trợ, hoặc ít nhất tách migration theo module.

---

# 13. Ưu tiên cải thiện

## Priority 1 — Cần làm sớm

1. Giải quyết duplication giữa `LegalRequest` và `RequestAssignment`.
2. Hợp nhất hoặc phân vai rõ giữa `VaultFile` và `File`.
3. Thêm FK còn thiếu cho `Message`, `FileAccessLog`, `DocumentVersion`, `Review`, `VaultFile`.
4. Sửa `MatterType.workspaceId NULL` unique issue.
5. Sửa `Folder.parentId NULL` unique issue.
6. Thêm `CHECK` cho status/role/type quan trọng.

## Priority 2 — Nên làm

1. Chuẩn hoá `matterType`: dùng `matterTypeId` thay vì text key rải rác.
2. Giảm duplicate `workspaceId`, `requestId`, `organizationId` ở các bảng có thể suy ra từ cha.
3. Thêm index composite cho dashboard/listing.
4. Thêm trigger hoặc convention update `updatedAt`.
5. Thêm `correlationId` cho `WorkflowTransition`.

## Priority 3 — Khi scale lớn hơn

1. Tách bảng translation thay vì `label_vi`, `label_en`, `label_zh`, `label_ja`.
2. Tách JSON field thành bảng con hoặc generated columns nếu cần query/report.
3. Chuẩn hoá audit event theo event sourcing nhẹ.
4. Xem xét chuyển từ SQLite sang PostgreSQL nếu cần multi-tenant, concurrent write, full-text search, row-level security.

---

# 14. Kết luận ngắn gọn

Có duplication đáng chú ý ở các chỗ sau:

| Khu vực                                                       |          Mức độ | Vấn đề                                 |
| ------------------------------------------------------------- | --------------: | -------------------------------------- |
| `LegalRequest` vs `RequestAssignment`                         |             Cao | Cùng lưu assignment                    |
| `LegalRequest.matterType` vs `IntakeSubmission.matterTypeKey` |             Cao | Có thể lệch loại hồ sơ                 |
| `Document.workspaceId` vs `LegalRequest.workspaceId`          |      Trung bình | Workspace có thể lệch                  |
| `Review.workspaceId/requestId/documentId/documentVersionId`   |             Cao | Nhiều khóa suy ra từ nhau              |
| `VaultFile` vs `File`                                         |         Rất cao | Hai bảng cùng mô tả file storage       |
| `organizationId` rải ở nhiều bảng                             |      Trung bình | Nhiều chỗ không FK, dễ orphan          |
| Multi-language columns                                        | Thấp/trung bình | Không duplicate sai, nhưng khó mở rộng |

Khuyến nghị lớn nhất của mình: **làm rõ source of truth** cho 3 mảng: assignment, matter type, và file/vault. Chỉ cần xử lý 3 mảng này, schema sẽ sạch hơn rất nhiều và giảm rủi ro dữ liệu lệch khi hệ thống bắt đầu có nhiều user thật.
