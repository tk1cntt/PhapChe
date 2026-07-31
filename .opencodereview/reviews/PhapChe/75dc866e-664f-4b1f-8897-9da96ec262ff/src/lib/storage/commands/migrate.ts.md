# Review: `src/lib/storage/commands/migrate.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 8

---

## 🔴 Critical (1)

**🐛 Bug** · lines 200-218

**Missing S3 upload — data integrity risk.** The migration reads the local file into a buffer via `localProvider.getObject()` but never uploads it to S3. It only updates the database record's `storageDriver` to `'s3'`. If local storage is subsequently removed or cleaned up, the files will be permanently lost. The actual S3 upload step must be implemented before this migration can be safely used in production.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // 1. Read file from local storage
          const buffer = await localProvider.getObject({
            objectKey: file.objectKey,
          });

          // 2. Upload to S3
          const s3Provider = getS3Provider();
          await s3Provider.putObject({
            bucket: process.env.S3_BUCKET || 'legal-platform-storage',
            objectKey: file.objectKey,
            body: buffer,
          });

          console.log(`  MIGRATE: ${file.objectKey}`);

          // 3. Update database record
          await prisma.file.update({
            where: { id: file.id },
            data: {
              storageDriver: 's3',
              bucket: process.env.S3_BUCKET || 'legal-platform-storage',
            },
          });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          // 1. Read file from local storage
          const buffer = await localProvider.getObject({
            objectKey: file.objectKey,
          });

          // 2. TODO: Upload to S3 (S3StorageProvider not implemented yet)
          // For now, we simulate the migration by updating the database

          console.log(`  MIGRATE: ${file.objectKey}`);

          // 3. Update database record
          await prisma.file.update({
            where: { id: file.id },
            data: {
              storageDriver: 's3',
              bucket: process.env.S3_BUCKET || 'legal-platform-storage',
              // objectKey stays the same for seamless migration
            },
          });
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 240-244

**`stopOnError` only breaks the inner batch loop, not the outer loop.** When `stopOnError` is true, the `break` statement on line 197 only exits `for (const file of batch)`, but the outer `for (let i = 0; i < files.length; i += batchSize)` loop continues to the next batch. Use a labeled break or a sentinel flag to stop the outer loop as well.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // Stop on error if configured
        if (options.stopOnError) {
          console.log('\nStopping due to --stop-on-error flag');
          await saveMigrationLog(log);
          return result;
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        // Stop on error if configured
        if (options.stopOnError) {
          console.log('\nStopping due to --stop-on-error flag');
          break;
        }
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · lines 190-197

**Dead code: `dryRun` branch inside `migrate()` is unreachable.** The `main()` function only calls `migrate()` when `!options.dryRun` is true (line 271), so the `if (options.dryRun)` block inside `migrate()` (lines 169-175) can never execute. This is confusing and misleading. Remove this dead branch or refactor so that `migrate()` handles both modes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        if (options.dryRun) {
          // Dry run - just log
          const s3Bucket = process.env.S3_BUCKET || 'legal-platform-storage';
          console.log(
            `[DRY-RUN] Would migrate: ${file.objectKey} -> s3://${s3Bucket}/${file.objectKey}`
          );
          result.totalSize += file.size;
        } else {
```
</details>

---

**🐛 Bug** · lines 247-250

**Migration log save frequency uses wrong variable.** The condition `i % 100 === 0` uses the batch index `i` (outer loop), not the file index. This means the log is saved only every 100 *batches* (e.g., every 10,000 files with default batch size of 100), rather than every 100 files as likely intended. Additionally, since the log is already saved after each batch (line 207), this periodic save inside the inner loop is redundant and misleading. Consider removing it or fixing the counter to use a file-level index.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Note: log is saved after each batch below; no need for periodic save here
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Save log periodically
      if (i % 100 === 0) {
        await saveMigrationLog(log);
      }
```
</details>

---

**🐛 Bug** · lines 65-67

**Corrupted migration log silently resets all progress.** The `catch` block in `loadMigrationLog()` returns a fresh, empty log when `JSON.parse` fails. If the log file becomes corrupted (e.g., due to partial write on crash), all migration progress is silently lost, and previously migrated files will be re-processed. Consider logging a warning and/or backing up the corrupted file before resetting.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    console.warn('Migration log corrupted or unreadable — starting fresh:', error instanceof Error ? error.message : String(error));
    return { lastRun: new Date().toISOString(), completed: [], failed: [] };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch {
    return { lastRun: new Date().toISOString(), completed: [], failed: [] };
  }
```
</details>

---

**⚡ Performance** · lines 103-113

**`getFilesToMigrate` loads all files into memory without pagination.** Using `prisma.file.findMany` without `take`/`skip` could load hundreds of thousands of file records into memory, potentially causing OOM. Consider using cursor-based pagination to stream files in batches from the database.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  return prisma.file.findMany({
    where,
    select: {
      id: true,
      objectKey: true,
      originalName: true,
      size: true,
      storageDriver: true,
    },
    orderBy: { createdAt: 'asc' },
    // Consider adding pagination (take/skip) for large datasets
    take: options.batchSize ? options.batchSize * 10 : 1000,
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return prisma.file.findMany({
    where,
    select: {
      id: true,
      objectKey: true,
      originalName: true,
      size: true,
      storageDriver: true,
    },
    orderBy: { createdAt: 'asc' },
  });
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 81-82

**Hardcoded magic strings for default values.** The default S3 bucket name `'legal-platform-storage'` and local root path `'/data/storage/private'` appear multiple times in the code. Consider extracting them into named constants at the top of the file to avoid drift and make them easier to change.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const DEFAULT_LOCAL_ROOT = '/data/storage/private';
const DEFAULT_S3_BUCKET = 'legal-platform-storage';

function getLocalProvider(): LocalStorageProvider {
  const rootPath = process.env.STORAGE_LOCAL_ROOT || DEFAULT_LOCAL_ROOT;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function getLocalProvider(): LocalStorageProvider {
  const rootPath = process.env.STORAGE_LOCAL_ROOT || '/data/storage/private';
```
</details>

---

**🐛 Bug** · lines 73-76

**`saveMigrationLog` has no error handling.** `writeFileSync` can throw (e.g., disk full, permission denied), which would crash the migration mid-run and lose in-memory progress. Consider wrapping the write in a try/catch and logging the error without crashing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
async function saveMigrationLog(log: MigrationLog): Promise<void> {
  try {
    const { writeFileSync } = await import('fs');
    writeFileSync(MIGRATION_LOG_FILE, JSON.stringify(log, null, 2));
  } catch (error) {
    console.error('Failed to save migration log:', error instanceof Error ? error.message : String(error));
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
async function saveMigrationLog(log: MigrationLog): Promise<void> {
  const { writeFileSync } = await import('fs');
  writeFileSync(MIGRATION_LOG_FILE, JSON.stringify(log, null, 2));
}
```
</details>


