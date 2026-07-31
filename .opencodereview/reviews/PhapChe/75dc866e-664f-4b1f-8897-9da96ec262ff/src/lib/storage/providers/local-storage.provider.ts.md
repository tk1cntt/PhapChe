# Review: `src/lib/storage/providers/local-storage.provider.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 7

---

## 🟠 High (1)

**⚡ Performance** · lines 183-194

`moveObject` implements move as copy + delete, which is inefficient for local filesystem storage. On the same filesystem/device, a simple rename would be O(1) instead of O(n) for large files. Consider using `fs/promises.rename` first, and falling back to copy+delete only if rename fails (e.g., cross-device).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async moveObject(input: MoveObjectInput): Promise<StoredObject> {
    const sourcePath = this.getFullPath(input.sourceKey);
    const destPath = this.getFullPath(input.destinationKey);

    if (!existsSync(sourcePath)) {
      throw new FileNotFoundError(input.sourceKey);
    }

    await this.ensureDirectory(destPath);

    try {
      await rename(sourcePath, destPath);
    } catch {
      // Fallback for cross-device moves
      await copyFile(sourcePath, destPath);
      await unlink(sourcePath);
    }

    const stats = await stat(destPath);
    const buffer = await readFile(destPath);
    const checksum = computeChecksum(buffer, 'sha256');

    return {
      objectKey: input.destinationKey,
      size: stats.size,
      mimeType: 'application/octet-stream',
      checksum,
      storageDriver: 'local' as StorageDriver,
    };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async moveObject(input: MoveObjectInput): Promise<StoredObject> {
    // Copy to new location
    const copied = await this.copyObject({
      sourceKey: input.sourceKey,
      destinationKey: input.destinationKey,
    });

    // Delete source
    await this.deleteObject({ objectKey: input.sourceKey });

    return copied;
  }
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · line 8

Dead code: `mkdir as mkdirSync` is imported from `fs/promises` but never used anywhere in the file. Additionally, the name `mkdirSync` is misleading — it's actually the async `mkdir` from `fs/promises`, not a synchronous version. Remove this unused import.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import { mkdir, readFile, writeFile, unlink, stat, copyFile } from 'fs/promises';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import { mkdir, readFile, writeFile, unlink, stat, copyFile, mkdir as mkdirSync } from 'fs/promises';
```
</details>

---

**🐛 Bug** · lines 96-104

Type mismatch: `getObject`'s return type is `Promise<Buffer | ReadableStream>`, but the implementation only ever returns `Buffer` (from `readFile`). The `ReadableStream` branch is never fulfilled. Either remove `ReadableStream` from the return type or implement streaming support.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async getObject(input: GetObjectInput): Promise<Buffer> {
    const fullPath = this.getFullPath(input.objectKey);

    if (!existsSync(fullPath)) {
      throw new FileNotFoundError(input.objectKey);
    }

    return readFile(fullPath);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async getObject(input: GetObjectInput): Promise<Buffer | ReadableStream> {
    const fullPath = this.getFullPath(input.objectKey);

    if (!existsSync(fullPath)) {
      throw new FileNotFoundError(input.objectKey);
    }

    return readFile(fullPath);
  }
```
</details>

---

**⚡ Performance** · lines 167-169

`copyObject` reads the entire copied file into memory (`await readFile(destPath)`) solely to compute a checksum. For large files this can cause memory pressure. Consider computing the checksum from the source buffer before copying, or using a streaming hash (e.g., `crypto.createHash` piped from a read stream).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Compute checksum from source file to avoid extra read
    const sourceBuffer = await readFile(sourcePath);
    const checksum = computeChecksum(sourceBuffer, 'sha256');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Read buffer to compute checksum
    const buffer = await readFile(destPath);
    const checksum = computeChecksum(buffer, 'sha256');
```
</details>

---

**🔧 Maintainability** · lines 121-122

Hardcoded business URL path: `'/api/files/download?key='` is embedded directly in the provider. This couples the storage layer to API routing details. Extract this to a configuration constant or environment variable to improve maintainability and testability.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL || '';
    const downloadPath = process.env.STORAGE_DOWNLOAD_PATH || '/api/files/download';
    return `${publicBaseUrl}${downloadPath}?key=${encodeURIComponent(input.objectKey)}`;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL || '';
    return `${publicBaseUrl}/api/files/download?key=${encodeURIComponent(input.objectKey)}`;
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 201-206

Hardcoded subdirectory names (`'organizations'`, `'templates'`, `'system'`) in `initialize()`. Consider extracting these to a configuration constant or making them configurable to avoid coupling the provider to a specific directory layout.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const defaultSubdirs = ['organizations', 'templates', 'system'];
    const directories = [
      this.rootPath,
      ...defaultSubdirs.map((d) => `${this.rootPath}/${d}`),
    ];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const directories = [
      this.rootPath,
      `${this.rootPath}/organizations`,
      `${this.rootPath}/templates`,
      `${this.rootPath}/system`,
    ];
```
</details>

---

**🔧 Maintainability** · line 174

Hardcoded fallback mimeType `'application/octet-stream'` in `copyObject` with a TODO comment acknowledging it should be detected. This means copied files lose their original mimeType metadata. Consider detecting the mimeType from the file extension or reading it from the source object's metadata.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      mimeType: input.mimeType || 'application/octet-stream',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      mimeType: 'application/octet-stream', // Default, could be detected
```
</details>


