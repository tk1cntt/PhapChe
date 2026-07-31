# Review: `src/lib/types/vault.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 5

---

## 🟠 High (1)

**🐛 Bug** · lines 8-22

**Missing `workspaceId` on `VaultFile` (multi-tenancy risk).** `VaultFolder` and `VaultTag` both carry `workspaceId`, but `VaultFile` does not. If a file has no `folderId` (or the folder is deleted), it becomes impossible to scope the file to a workspace, breaking multi-tenant isolation and potentially leaking files across workspaces.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface VaultFile {
  id: string;
  workspaceId: string;
  requestId?: string;
  folderId?: string;
  name: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageProvider: 'local' | 's3';
  uploadedBy: string;
  uploadedByName?: string;
  tags?: VaultTag[];
  createdAt: Date;
  updatedAt: Date;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface VaultFile {
  id: string;
  requestId?: string;
  folderId?: string;
  name: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageProvider: 'local' | 's3';
  uploadedBy: string;
  uploadedByName?: string;
  tags?: VaultTag[];
  createdAt: Date;
  updatedAt: Date;
}
```
</details>


## 🟡 Medium (3)

**🔧 Maintainability** · lines 72-77

**Browser-only `File` type in shared definition.** `UploadFileInput.file` uses the browser `File` API, which is unavailable in Node.js/server environments. If this types file is shared (likely, given the `lib/` path), server-side code that imports this type will fail to compile or require DOM lib inclusion, which is fragile.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface UploadFileInput {
  file: File | Blob;
  fileName: string;
  mimeType?: string;
  folderId?: string;
  requestId?: string;
  tags?: string[];
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface UploadFileInput {
  file: File;
  folderId?: string;
  requestId?: string;
  tags?: string[];
}
```
</details>

---

**🔧 Maintainability** · lines 59-67

**`Date` types in `VaultFilters` are not JSON-serializable.** `dateFrom` and `dateTo` are typed as `Date`, but when these filters are sent over HTTP (e.g., as query params or a JSON body), `Date` objects will not serialize correctly. Consider using `string` (ISO 8601) for transport and converting at the boundary.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface VaultFilters {
  folderId?: string;
  tagIds?: string[];
  search?: string;
  mimeTypes?: string[];
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface VaultFilters {
  folderId?: string;
  tagIds?: string[];
  search?: string;
  mimeTypes?: string[];
  uploadedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
```
</details>

---

**🔧 Maintainability** · lines 51-54

**`downloadUrlExpiresAt` typed as `Date` — same serialization concern.** The signed URL with expiration is likely returned from an API as a JSON response. `Date` will not survive JSON serialization/deserialization without manual conversion. Consider `string` (ISO 8601) instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface VaultFileWithUrl extends VaultFile {
  downloadUrl: string;
  downloadUrlExpiresAt: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface VaultFileWithUrl extends VaultFile {
  downloadUrl: string;
  downloadUrlExpiresAt: Date;
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 16

**`storageProvider` literal union is duplicated across `VaultFile` and `StorageConfig`.** Both define `'local' | 's3'` independently. If a new provider is added, both must be updated, risking drift. Extract to a shared type alias.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export type StorageProvider = 'local' | 's3';

// In VaultFile:
  storageProvider: StorageProvider;

// In StorageConfig:
  provider: StorageProvider;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  storageProvider: 'local' | 's3';
```
</details>


