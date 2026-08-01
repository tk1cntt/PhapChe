# Review: `src/lib/intake/upload-service.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 40-50

**File content is never uploaded to storage.** The `storeVaultFile` function only creates a database record (VaultFile) with metadata — it does not accept or store the actual file bytes. The `input.file.arrayBuffer()` method is never called anywhere in this function, so the file content is silently discarded while a database record is created pointing to a storage key where nothing exists. This means subsequent downloads via `requestVaultFileAccess` will fail or return empty content.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Upload file content to storage before creating the database record
    const buffer = await input.file.arrayBuffer();
    const vaultFile = await storeVaultFile({
      session: input.session!,
      requestId: request.id,
      storageKey: `private/intake/${request.workspaceId}/${request.id}/${randomUUID()}-${safeFilename}`,
      filename,
      fileKind: 'intake_upload',
      source: 'customer_upload',
      size: input.file.size,
      contentType: input.file.type ?? 'application/octet-stream',
      correlationId: input.correlationId ?? `intake-upload-${randomUUID()}`,
      body: Buffer.from(buffer),
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const vaultFile = await storeVaultFile({
      session: input.session!,
      requestId: request.id,
      storageKey: `private/intake/${request.workspaceId}/${request.id}/${randomUUID()}-${safeFilename}`,
      filename,
      fileKind: 'intake_upload',
      source: 'customer_upload',
      size: input.file.size,
      contentType: input.file.type ?? 'application/octet-stream',
      correlationId: input.correlationId ?? `intake-upload-${randomUUID()}`,
    });
```
</details>


## 🟠 High (2)

**🔒 Security** · line 22

**Missing maximum file size validation.** Only `input.file.size < 1` (empty file) is checked. An attacker can upload arbitrarily large files, leading to storage exhaustion, denial of service, and excessive cloud costs. Add a reasonable upper bound (e.g., 100MB for intake uploads).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const MAX_INTAKE_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  if (!input.file || input.file.size < 1) throw new Error('FILE_REQUIRED');
  if (input.file.size > MAX_INTAKE_FILE_SIZE) throw new Error('FILE_TOO_LARGE');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (!input.file || input.file.size < 1) throw new Error('FILE_REQUIRED');
```
</details>

---

**🐛 Bug** · lines 59-67

**Error handling masks real storage errors with a misleading message.** The catch block matches on error message substrings including `'upload'`, which is so broad it will match almost any upload-related error (network timeout, quota exceeded, permission denied, etc.). All of these are misreported as `UPLOAD_STORAGE_NOT_CONFIGURED`, making debugging nearly impossible and potentially hiding security-relevant failures (e.g., permission errors that should be surfaced as FORBIDDEN). Additionally, non-Error throws (e.g., `throw 'string'`) are always caught and reported as `UPLOAD_STORAGE_NOT_CONFIGURED`, which is also misleading.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    // Only re-wrap known storage configuration errors; let other errors propagate
    if (error instanceof Error) {
      if (error.message === 'STORAGE_NOT_CONFIGURED' || error.message === 'S3_CLIENT_NOT_INITIALIZED') {
        throw new Error('UPLOAD_STORAGE_NOT_CONFIGURED');
      }
      throw error;
    }
    throw error;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('STORAGE') || error.message.includes('S3') || error.message.includes('OSS') || error.message.includes('upload')) {
        throw new Error('UPLOAD_STORAGE_NOT_CONFIGURED');
      }
      throw error;
    }
    throw new Error('UPLOAD_STORAGE_NOT_CONFIGURED');
  }
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · line 41

**Unsafe non-null assertion `input.session!` is fragile.** While `canAccessRequest` currently returns `false` for null/undefined sessions (via `hasActiveUser`), the TypeScript compiler cannot prove this, and the `!` bypasses type safety. If `canAccessRequest` is ever refactored to allow null sessions through, this will cause a runtime crash in `storeVaultFile` (which accesses `session.userId`). Use a type guard or explicit null check instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      session: input.session as AppSession,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      session: input.session!,
```
</details>


## 🔵 Low (1)

**⚡ Performance** · lines 23-30

**Redundant RBAC check.** `attachIntakeFile` calls `canAccessRequest` on line 19, and then `storeVaultFile` (when called without `externalTx`) calls `canAccessRequest` again on line 224 of vault-service.ts. This results in two identical database queries for the same authorization check. Consider passing the already-fetched request object or a flag to skip the duplicate check.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // canAccessRequest already validates the request exists and the session has access.
  // We still need workspaceId, so fetch it; skip the redundant RBAC check in storeVaultFile.
  if (!(await canAccessRequest(input.session, input.requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findUniqueOrThrow({
    where: { id: input.requestId },
    select: { id: true, workspaceId: true },
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (!(await canAccessRequest(input.session, input.requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, workspaceId: true },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');
```
</details>


