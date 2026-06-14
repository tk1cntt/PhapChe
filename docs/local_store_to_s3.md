Dưới đây là bản proposal có thể đưa trực tiếp cho AI Agent hoặc dùng làm tài liệu chốt kiến trúc storage.

# Proposal: Local-first Storage Architecture, S3-ready by Configuration

## 1. Mục tiêu

Xây dựng hệ thống lưu trữ file cho MVP theo hướng:

```txt
Giai đoạn đầu:
  Lưu file trên local storage của VPS để tiết kiệm chi phí.

Giai đoạn sau:
  Chuyển sang S3 hoặc S3-compatible storage chỉ bằng cách thay đổi setting/env config.

Yêu cầu quan trọng:
  Không sửa business logic khi đổi từ local sang S3.
```

Hệ thống cần hỗ trợ các loại file:

* File upload từ khách hàng
* Ảnh scan/OCR
* File hợp đồng DOCX/PDF được generate
* File trong Legal Vault
* File template hợp đồng
* File export/audit/backup

---

## 2. Nguyên tắc kiến trúc

### 2.1. Database là nguồn sự thật

File vật lý có thể nằm ở local hoặc S3, nhưng metadata luôn lưu trong database.

Không được dùng folder/file path làm nguồn dữ liệu nghiệp vụ.

Ví dụ không được làm:

```ts
const status = filePath.includes("/approved/");
```

Phải lưu status trong DB:

```ts
file.status = "approved";
```

---

### 2.2. Không hardcode storage provider

Không gọi trực tiếp local filesystem hoặc S3 SDK trong business logic.

Không viết:

```ts
fs.writeFileSync("/uploads/file.pdf", buffer);
```

Không viết trực tiếp:

```ts
s3Client.putObject(...);
```

Thay vào đó, toàn bộ hệ thống chỉ gọi qua `StorageService`.

```ts
await storageService.upload(file);
await storageService.getDownloadUrl(fileId);
await storageService.delete(fileId);
```

---

### 2.3. Local và S3 dùng chung objectKey

Object key phải được thiết kế giống nhau cho cả local và S3.

Ví dụ:

```txt
organizations/org_001/requests/req_001/uploads/file_001/original.pdf
```

Khi dùng local:

```txt
/data/storage/private/organizations/org_001/requests/req_001/uploads/file_001/original.pdf
```

Khi dùng S3:

```txt
s3://legal-platform-prod/organizations/org_001/requests/req_001/uploads/file_001/original.pdf
```

Như vậy khi migrate sang S3, chỉ cần copy file theo cùng objectKey.

---

## 3. Kiến trúc tổng thể

```txt
Frontend
  |
  | Upload / Download request
  v
Backend API
  |
  | Check permission
  | Validate file
  | Create file metadata
  v
StorageService
  |
  |-----------------------------|
  |                             |
LocalStorageAdapter        S3StorageAdapter
  |                             |
Local VPS Disk             S3 Bucket
```

Business modules không được biết file đang lưu ở đâu.

```txt
LegalRequestModule
DocumentGeneratorModule
VaultModule
OCRModule
TemplateModule
```

Các module này chỉ được phụ thuộc vào:

```txt
StorageService
```

---

## 4. Environment configuration

Dùng biến môi trường để chọn storage provider.

### Local mode

```env
STORAGE_DRIVER=local
STORAGE_LOCAL_ROOT=/data/storage/private
STORAGE_PUBLIC_BASE_URL=
```

### S3 mode

```env
STORAGE_DRIVER=s3
S3_BUCKET=legal-platform-prod
S3_REGION=ap-southeast-1
S3_ENDPOINT=
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_FORCE_PATH_STYLE=false
S3_PUBLIC_BASE_URL=
S3_SIGNED_URL_EXPIRES_IN=900
```

### S3-compatible mode

Để sau này có thể dùng MinIO, Cloudflare R2, Backblaze B2 hoặc các dịch vụ S3-compatible:

```env
STORAGE_DRIVER=s3
S3_BUCKET=legal-platform-prod
S3_REGION=auto
S3_ENDPOINT=https://example-s3-compatible-endpoint.com
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_FORCE_PATH_STYLE=true
S3_SIGNED_URL_EXPIRES_IN=900
```

---

## 5. Storage interface bắt buộc

Tạo interface chung:

```ts
export interface StorageProvider {
  upload(input: UploadFileInput): Promise<StoredObject>;
  getObject(input: GetObjectInput): Promise<ReadableStream | Buffer>;
  getDownloadUrl(input: GetDownloadUrlInput): Promise<string>;
  deleteObject(input: DeleteObjectInput): Promise<void>;
  exists(input: ExistsObjectInput): Promise<boolean>;
  copyObject(input: CopyObjectInput): Promise<StoredObject>;
  moveObject(input: MoveObjectInput): Promise<StoredObject>;
}
```

Ví dụ input/output:

```ts
export type UploadFileInput = {
  objectKey: string;
  buffer?: Buffer;
  stream?: ReadableStream;
  mimeType: string;
  originalName: string;
  metadata?: Record<string, string>;
};

export type StoredObject = {
  objectKey: string;
  size: number;
  mimeType: string;
  checksum?: string;
  storageDriver: "local" | "s3";
};
```

---

## 6. Database schema đề xuất

### Bảng `files`

```ts
type FileRecord = {
  id: string;
  organizationId: string;
  requestId?: string;

  storageDriver: "local" | "s3";
  bucket?: string;
  objectKey: string;

  originalName: string;
  mimeType: string;
  size: number;
  checksum?: string;

  category:
    | "request_upload"
    | "generated_document"
    | "vault_file"
    | "template"
    | "ocr_output"
    | "audit_export";

  visibility: "private" | "customer_visible" | "restricted";

  status:
    | "pending"
    | "uploaded"
    | "processing"
    | "ready"
    | "failed"
    | "deleted";

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};
```

---

### Bảng `file_versions`

Dùng cho hợp đồng/tài liệu có nhiều phiên bản.

```ts
type FileVersion = {
  id: string;
  fileId: string;
  versionNumber: number;

  storageDriver: "local" | "s3";
  bucket?: string;
  objectKey: string;

  size: number;
  checksum?: string;

  createdBy: string;
  createdAt: Date;
};
```

---

### Bảng `file_access_logs`

Dùng để audit upload/download/view/delete.

```ts
type FileAccessLog = {
  id: string;
  fileId: string;
  userId: string;
  action: "upload" | "download" | "view" | "delete" | "share";
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
};
```

---

## 7. Object key convention

Tất cả objectKey phải được tạo theo format thống nhất.

### Request upload

```txt
organizations/{organizationId}/requests/{requestId}/uploads/{fileId}/{safeFileName}
```

### Generated document

```txt
organizations/{organizationId}/requests/{requestId}/generated-documents/{documentId}/{fileName}
```

### Legal Vault

```txt
organizations/{organizationId}/vault/{fileId}/{fileName}
```

### Document templates

```txt
templates/{templateType}/{templateId}/v{version}/{fileName}
```

### OCR output

```txt
organizations/{organizationId}/requests/{requestId}/ocr/{fileId}/result.json
```

### Audit export

```txt
organizations/{organizationId}/audit-exports/{exportId}/{fileName}
```

---

## 8. Local storage implementation

Local storage sẽ lưu file trong thư mục private của server.

Ví dụ:

```txt
/data/storage/private
  /organizations
  /templates
  /system
```

Yêu cầu:

* Không lưu file pháp lý trong thư mục `public`
* Không cho frontend truy cập trực tiếp file qua static URL
* Mọi download phải đi qua backend API
* Backend kiểm tra quyền trước khi trả file
* File name phải được sanitize
* Nên dùng UUID làm fileId
* Không tin tưởng original file name từ user

Download flow:

```txt
GET /api/files/:fileId/download

Backend:
  1. Check authentication
  2. Check organization permission
  3. Check file visibility
  4. Read file từ local disk
  5. Stream file về client
  6. Ghi file_access_logs
```

---

## 9. S3 storage implementation

Khi chuyển sang S3, backend không stream file trực tiếp nếu không cần thiết.

Download flow:

```txt
GET /api/files/:fileId/download

Backend:
  1. Check authentication
  2. Check organization permission
  3. Check file visibility
  4. Generate signed URL
  5. Ghi file_access_logs
  6. Trả signed URL cho frontend
```

Upload flow:

```txt
POST /api/files/upload-url

Backend:
  1. Check permission
  2. Create pending file record
  3. Generate objectKey
  4. Generate signed upload URL
  5. Return upload URL

Frontend:
  6. Upload file trực tiếp lên S3

Backend:
  7. Confirm upload
  8. Update file status
```

Trong giai đoạn đầu có thể upload qua backend trước để đơn giản. Sau này khi file lớn hơn, chuyển sang signed upload URL.

---

## 10. Backup strategy cho local stage

Khi còn dùng local storage, bắt buộc có backup.

### Daily backup

```txt
- Dump PostgreSQL
- Compress changed files
- Upload backup sang Google Drive hoặc remote storage
```

Ví dụ thư mục backup:

```txt
/data/backups
  /daily
  /weekly
  /monthly
```

File backup:

```txt
legal-platform-db-2026-06-14.sql.gz
legal-platform-storage-2026-06-14.tar.gz
```

### Retention đề xuất

```txt
Daily backup:
  giữ 7 ngày

Weekly backup:
  giữ 4 tuần

Monthly backup:
  giữ 6 tháng
```

---

## 11. Migration từ local sang S3

Cần chuẩn bị sẵn command migration.

Ví dụ:

```bash
pnpm storage:migrate --from=local --to=s3 --dry-run
```

Sau khi kiểm tra:

```bash
pnpm storage:migrate --from=local --to=s3
```

Migration process:

```txt
1. Đọc danh sách files trong DB
2. Với mỗi file:
   - Tìm local path từ objectKey
   - Upload lên S3 cùng objectKey
   - Verify checksum/size
   - Update storageDriver = "s3"
   - Update bucket = S3_BUCKET
3. Ghi migration log
4. Không xóa file local ngay
5. Sau 7-30 ngày kiểm tra ổn định mới cleanup local
```

Yêu cầu quan trọng:

* Migration phải idempotent
* Chạy lại không tạo duplicate
* Có dry-run mode
* Có log lỗi từng file
* Có thể resume nếu bị gián đoạn

---

## 12. API endpoints đề xuất

```txt
POST   /api/files
POST   /api/files/upload-url
POST   /api/files/:id/confirm-upload
GET    /api/files/:id
GET    /api/files/:id/download
DELETE /api/files/:id
GET    /api/files/:id/versions
POST   /api/files/:id/versions
GET    /api/files/:id/access-logs
```

Response format thống nhất:

```ts
type ApiResponse<T> = {
  success: true;
  data: T;
};
```

Error format:

```ts
type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

---

## 13. Security rules

### Bắt buộc

* File pháp lý mặc định là private
* Không public folder upload
* Không dùng original file name làm đường dẫn chính
* Không cho user truyền objectKey trực tiếp
* Backend tự generate objectKey
* Mọi download phải check permission
* Mọi upload/download/delete phải ghi audit log
* Validate mime type
* Giới hạn dung lượng file upload
* Có virus scan hoặc placeholder interface cho virus scan sau này

### Không được làm

```txt
Không lưu file trong /public
Không trả absolute local path cho frontend
Không expose S3 credential cho frontend
Không tạo public S3 bucket
Không dùng "anyone with link" mặc định
Không hardcode local path trong component/service nghiệp vụ
```

---

## 14. Folder structure backend đề xuất

```txt
src
  /modules
    /files
      files.controller.ts
      files.service.ts
      files.repository.ts
      files.types.ts

    /storage
      storage.module.ts
      storage.service.ts
      storage.types.ts

      /providers
        local-storage.provider.ts
        s3-storage.provider.ts

      /utils
        object-key.util.ts
        file-name.util.ts
        checksum.util.ts

    /audit
      audit.service.ts
```

Business modules khác chỉ import:

```ts
StorageService
```

Không import:

```ts
LocalStorageProvider
S3StorageProvider
fs
S3Client
```

---

## 15. Development phases

### Phase 1: Storage abstraction

* Tạo `StorageProvider` interface
* Tạo `StorageService`
* Tạo config `STORAGE_DRIVER`
* Tạo objectKey convention
* Tạo file metadata schema

### Phase 2: LocalStorageAdapter

* Implement upload
* Implement download stream
* Implement delete
* Implement exists
* Implement checksum
* Lưu file trong `/data/storage/private`

### Phase 3: File API

* Upload file
* Download file
* Delete file
* List file
* Audit log
* Permission check

### Phase 4: Backup local

* PostgreSQL dump
* Storage archive
* Upload backup sang Google Drive hoặc remote server
* Retention policy

### Phase 5: S3StorageAdapter

* Implement S3 upload
* Implement signed download URL
* Implement signed upload URL
* Implement delete
* Implement exists
* Thêm config S3 qua env

### Phase 6: Migration command

* Dry-run migration
* Local to S3 migration
* Checksum verification
* Migration logs
* Resume migration

---

## 16. Acceptance criteria

Hệ thống được coi là đạt yêu cầu khi:

```txt
1. Local storage chạy ổn trên VPS.
2. File không nằm trong public folder.
3. Frontend không biết file lưu ở local hay S3.
4. Business service không import fs hoặc S3 SDK.
5. Tất cả metadata file nằm trong DB.
6. objectKey dùng chung cho local và S3.
7. Đổi STORAGE_DRIVER=local sang STORAGE_DRIVER=s3 không cần sửa business logic.
8. Có migration command từ local sang S3.
9. Có audit log cho upload/download/delete.
10. Có backup strategy khi dùng local.
```

---

## 17. Decision cuối cùng

Chọn phương pháp:

```txt
Local-first, S3-ready Storage Architecture
```

Triển khai ban đầu:

```txt
STORAGE_DRIVER=local
```

Khi cần mở rộng:

```txt
STORAGE_DRIVER=s3
```

Điều kiện quan trọng:

```txt
Không được thiết kế storage kiểu tạm bợ.
Local chỉ là provider đầu tiên.
StorageService mới là kiến trúc chính.
```

Mục tiêu là tiết kiệm chi phí ở MVP nhưng không phải refactor lớn khi chuyển sang S3 trong tương lai.
