# Review: `src/lib/services/vault-service.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 7

---

## 🔴 Critical (1)

**🐛 Bug** · lines 78-93

File buffer is never persisted to any storage backend. The function computes the checksum and generates an objectKey, and creates both File and VaultFile database records, but the actual buffer content is never written to disk, S3, or any other storage driver. This means every download attempt will fail — the file metadata exists but the content is missing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const objectKey = generateObjectKey(file.originalname);
      const checksum = await calculateChecksum(file.buffer);

      // Persist the file buffer to the storage driver
      // TODO: Replace with actual storage driver call (e.g., S3.putObject, fs.writeFile)
      await writeFileToStorage(objectKey, file.buffer, file.mimetype);

      const fileRecord = await tx.file.create({
        data: {
          workspaceId: metadata.workspaceId,
          requestId: metadata.requestId,
          storageDriver: 'local',
          objectKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          checksum,
          category: 'vault_file',
          visibility: 'private',
          status: 'uploaded',
          createdById: metadata.actorId,
        },
      });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const fileRecord = await tx.file.create({
        data: {
          workspaceId: metadata.workspaceId,
          requestId: metadata.requestId,
          storageDriver: 'local',
          objectKey: generateObjectKey(file.originalname),
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          checksum: await calculateChecksum(file.buffer),
          category: 'vault_file',
          visibility: 'private',
          status: 'uploaded',
          createdById: metadata.actorId,
        },
      });
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 320-337

Race condition: the check-then-insert pattern (findMany → filter → createMany) is not atomic. Two concurrent requests can both read the same set of existing tags, both determine the same tagIds are new, and both insert them, creating duplicate VaultFileTag records. The comment acknowledges SQLite doesn't support skipDuplicates, but the current code also lacks a database-level unique constraint or a transaction to prevent this.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Use a transaction to prevent race conditions when inserting tags
  return prisma.$transaction(async (tx) => {
    const existingTags = await tx.vaultFileTag.findMany({
      where: { vaultFileId },
      select: { tagId: true },
    });
    const existingTagIds = new Set(existingTags.map((t) => t.tagId));
    const newTagIds = tagIds.filter((id) => !existingTagIds.has(id));

    if (newTagIds.length === 0) return { count: 0 };

    const tagConnections = newTagIds.map((tagId) => ({
      vaultFileId,
      tagId,
    }));

    return tx.vaultFileTag.createMany({
      data: tagConnections,
    });
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Filter out existing tags first
  const existingTags = await prisma.vaultFileTag.findMany({
    where: { vaultFileId },
    select: { tagId: true },
  });
  const existingTagIds = new Set(existingTags.map((t) => t.tagId));
  const newTagIds = tagIds.filter((id) => !existingTagIds.has(id));

  if (newTagIds.length === 0) return { count: 0 };

  const tagConnections = newTagIds.map((tagId) => ({
    vaultFileId,
    tagId,
  }));

  return prisma.vaultFileTag.createMany({
    data: tagConnections,
  });
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 158-165

The `workspaceId` filter from `VaultFileFilters` is accepted by the function signature but never applied to the Prisma `where` clause. The `VaultFileFilters` interface defines `workspaceId?: string`, but the `getVaultItems` function ignores it, making the filter silently ineffective and potentially returning files from all workspaces when the caller expects filtering.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const where: Record<string, unknown> = {
    deletedAt: null, // Exclude soft-deleted
    requestId,
  };

  if (filters.workspaceId) where.workspaceId = filters.workspaceId;
  if (filters.fileKind) where.fileKind = filters.fileKind;
  if (filters.source) where.source = filters.source;
  if (filters.documentVersionId) where.documentVersionId = filters.documentVersionId;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const where: Record<string, unknown> = {
    deletedAt: null, // Exclude soft-deleted
    requestId,
  };

  if (filters.fileKind) where.fileKind = filters.fileKind;
  if (filters.source) where.source = filters.source;
  if (filters.documentVersionId) where.documentVersionId = filters.documentVersionId;
```
</details>

---

**🔧 Maintainability** · lines 247-256

Hardcoded API URL paths (`/api/files/${vf.file.id}/download` and `/api/files/download?key=${vf.storageKey}`) are embedded in the service layer. These should be extracted into constants or a configuration module to avoid duplication and simplify future route changes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (vf.file?.objectKey) {
      return `${FILE_DOWNLOAD_API}/${vf.file.id}/download`;
    }
    return null;
  }

  // Old: Use VaultFile.storageKey directly
  const vf = vaultFile as { storageKey?: string | null };
  if (vf.storageKey) {
    return `${FILE_DOWNLOAD_API}/download?key=${vf.storageKey}`;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (vf.file?.objectKey) {
      return `/api/files/${vf.file.id}/download`;
    }
    return null;
  }

  // Old: Use VaultFile.storageKey directly
  const vf = vaultFile as { storageKey?: string | null };
  if (vf.storageKey) {
    return `/api/files/download?key=${vf.storageKey}`;
```
</details>

---

**🔒 Security** · lines 255-257

The old code path exposes the raw `storageKey` as a URL query parameter (`/api/files/download?key=...`). Storage keys are typically internal identifiers that should not be exposed in URLs, as they can be logged in server access logs, browser history, and referrer headers. Consider using a signed or opaque token instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (vf.storageKey) {
    // Use a signed, time-limited download token instead of exposing the raw storage key
    return `/api/files/download?key=${vf.storageKey}`;
    // TODO: Replace with signed token approach
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (vf.storageKey) {
    return `/api/files/download?key=${vf.storageKey}`;
  }
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 55-57

`calculateChecksum` is declared `async` but uses only synchronous `crypto` operations. The `async` keyword is unnecessary and creates a misleading API — callers are forced to `await` a function that never actually yields. Either remove `async` and return the string directly, or keep it if future async hashing is planned.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
async function calculateChecksum(buffer: Buffer): Promise<string> {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
```
</details>

---

**🔧 Maintainability** · line 246

The `getVaultFileMetadata` and `getVaultFileDownloadUrl` functions use broad `as` type assertions to cast the Prisma return type, which bypasses TypeScript's type checking. If the Prisma schema changes (e.g., `file` relation is renamed), these casts will silently produce runtime `undefined` values instead of compile-time errors. Consider using proper type guards or narrowing instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Use a type guard or narrow the type based on the feature flag
    if (!('file' in vaultFile)) return null;
    const vf = vaultFile as { file?: { id: string; objectKey: string } | null };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const vf = vaultFile as Awaited<ReturnType<typeof getVaultFileById>> & { file?: { id: string; objectKey: string } | null };
```
</details>


