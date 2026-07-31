# Review: `src/lib/storage/storage.service.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 6

---

## 🟠 High (1)

**🐛 Bug** · lines 245-255

In `deleteFile`, the file is deleted from storage BEFORE the database record is updated. If `prisma.file.update` fails (e.g., network error), the file is already gone from storage but the database still shows it as active. This creates a data consistency issue. The DB update should happen first, or use a compensating action. The safest approach: update DB status first, then delete from storage, and if storage deletion fails, revert the DB status.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Update database record first (soft delete)
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'deleted' },
    });

    // Delete from storage (best-effort; if this fails, the file is already marked deleted)
    try {
      await this.provider.deleteObject({
        objectKey: fileRecord.objectKey,
        bucket: fileRecord.bucket || undefined,
      });
    } catch (err) {
      // Log the failure but don't fail the operation — the DB record is already updated
      console.error(`Failed to delete object from storage: ${fileRecord.objectKey}`, err);
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Delete from storage
    await this.provider.deleteObject({
      objectKey: fileRecord.objectKey,
      bucket: fileRecord.bucket || undefined,
    });

    // Update database record (soft delete)
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'deleted' },
    });
```
</details>


## 🟡 Medium (3)

**🔧 Maintainability** · lines 311-312

The import of `FileNotFoundError` is placed at line 312 (bottom of file) instead of being grouped with the other imports from `./types` at line 14. While ES module imports are hoisted, this is confusing and breaks the convention of having all imports at the top of the file. Move it to line 14 alongside the existing `./types` import.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// (Remove this import block and add FileNotFoundError to the existing import at line 14)
import { isAllowedMimeType, FilePermissionError, FileValidationError, FileNotFoundError } from './types';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
// Import FileNotFoundError
import { FileNotFoundError } from './types';
```
</details>

---

**🐛 Bug** · lines 146-151

`recordFileAccessLog` calls (lines 161, 194, 220, 252) are not wrapped in try-catch. If the audit logging service fails, the entire operation throws an error — even when the primary operation (upload, get, delete) succeeded. For example, in `uploadFile`, if `recordFileAccessLog` fails after the file was created in storage and DB, the user sees an error but the file already exists. Consider wrapping audit log calls in try-catch or using fire-and-forget with error logging.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Log access (best-effort — don't fail the upload if logging fails)
    try {
      await recordFileAccessLog({
        fileId,
        action: 'upload',
        actorId: input.createdBy,
      });
    } catch (err) {
      console.error('Failed to record file access log', err);
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Log access
    await recordFileAccessLog({
      fileId,
      action: 'upload',
      actorId: input.createdBy,
    });
```
</details>

---

**🔧 Maintainability** · line 153

The `as unknown as FileRecord` double-cast (lines 186, 200, 300) bypasses TypeScript type checking entirely. This is effectively using `any` and masks potential mismatches between the Prisma return type and the `FileRecord` interface (e.g., nullable fields, Date serialization). Consider creating a mapper function that explicitly transforms the Prisma model to the domain `FileRecord` type with proper field-level validation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    return toFileRecord(fileRecord); // Create a mapper function that explicitly maps Prisma fields to FileRecord
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return fileRecord as unknown as FileRecord;
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 321

`createStorageService` uses `require()` (CommonJS) at line 316 instead of a static `import`. This is inconsistent with the ES module `import` style used throughout the rest of the file and prevents tree-shaking. Use a dynamic `import()` or a static import with lazy loading pattern instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { LocalStorageProvider } = await import('./providers/local-storage.provider');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { LocalStorageProvider } = require('./providers/local-storage.provider');
```
</details>

---

**🔧 Maintainability** · line 317

`createStorageService` does not read `maxFileSize` from environment configuration (e.g., `STORAGE_MAX_FILE_SIZE`), always falling back to the default 50MB. The `StorageConfig` interface (types.ts line 145) defines `maxFileSize` as configurable, so this factory should respect it for consistency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function createStorageService(): StorageService {
  const driver = process.env.STORAGE_DRIVER || 'local';
  const maxFileSize = process.env.STORAGE_MAX_FILE_SIZE
    ? parseInt(process.env.STORAGE_MAX_FILE_SIZE, 10)
    : undefined;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function createStorageService(): StorageService {
```
</details>


