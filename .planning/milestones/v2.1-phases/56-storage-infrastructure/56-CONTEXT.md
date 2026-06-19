# Phase 56: Storage Infrastructure — Context

**Phase:** 56
**Created:** 2026-06-14
**Mode:** --auto (user provided full architecture doc)

## Domain

**Storage Infrastructure** — Local-first storage abstraction with S3-ready architecture for the Legal-as-a-Service platform.

## Canonical Refs

- `docs/local_store_to_s3.md` — **PRIMARY** Storage architecture proposal (user-provided)
- `src/docs/SERVICE_LAYER.md` — Service layer patterns
- `src/lib/types/vault.ts` — Existing vault types
- `prisma/schema.prisma` — Database schema

## Decisions Locked

### 1. Architecture Pattern: Local-first, S3-ready

**Principle:** MVP uses local storage, S3-ready by configuration change only.

**Decision:** `STORAGE_DRIVER=local` for MVP, `STORAGE_DRIVER=s3` for production.

**Boundary:** Business logic never imports `fs` or `S3 SDK` directly — only `StorageService`.

### 2. StorageProvider Interface

```typescript
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

### 3. ObjectKey Convention

Format: `organizations/{orgId}/requests/{requestId}/uploads/{fileId}/{safeFileName}`

**Rule:** Same objectKey for local and S3 — enables migration by file copy.

### 4. File Categories

| Category | Purpose |
|----------|---------|
| `request_upload` | Customer uploads |
| `generated_document` | Contract/PDF generation |
| `vault_file` | Legal Vault files |
| `template` | Document templates |
| `ocr_output` | OCR results |
| `audit_export` | Audit exports |

### 5. Security Rules

- Files default to **private** (not in `/public`)
- Backend generates `objectKey` — never trust user input
- All download/upload/delete operations write `file_access_logs`
- MIME type validation required
- File size limit enforced

### 6. Local Storage Path

```
/data/storage/private
  /organizations
  /templates
  /system
```

**Rule:** No files in `public/` folder.

### 7. S3 Migration

**Command:** `pnpm storage:migrate --from=local --to=s3 --dry-run`

**Requirements:**
- Idempotent (re-run safe)
- Dry-run mode available
- Resume on interruption
- 7-30 day local retention after migration

### 8. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files` | Upload file |
| POST | `/api/files/upload-url` | Get signed upload URL |
| GET | `/api/files/:id` | Get file metadata |
| GET | `/api/files/:id/download` | Download file |
| DELETE | `/api/files/:id` | Delete file |
| GET | `/api/files/:id/access-logs` | Get access logs |

## Implementation Scope (MVP)

### Phase 1: Storage Abstraction
- [x] StorageProvider interface (in docs)
- [ ] StorageService implementation
- [ ] STORAGE_DRIVER config

### Phase 2: LocalStorageAdapter
- [ ] Upload implementation
- [ ] Download stream
- [ ] Delete implementation
- [ ] Exists check
- [ ] Checksum validation

### Phase 3: File API
- [ ] POST /api/files
- [ ] GET /api/files/:id/download
- [ ] DELETE /api/files/:id
- [ ] Access logging

### Phase 4: S3StorageAdapter (Future)
- [ ] S3 upload
- [ ] Signed URLs
- [ ] Migration command

## Boundaries

**In scope:**
- StorageProvider interface
- LocalStorageAdapter
- File API endpoints
- Audit logging

**Out of scope:**
- S3 implementation (Phase 56 future)
- OCR integration
- e-sign integration
- Backup automation (documented but not implemented)

## Deferred Ideas

- S3 implementation (after MVP validates local storage)
- Signed upload URLs for large files
- Virus scanning integration
- Backup automation scripts

---

*Context created: 2026-06-14*
*Source: docs/local_store_to_s3.md (user-provided architecture doc)*
