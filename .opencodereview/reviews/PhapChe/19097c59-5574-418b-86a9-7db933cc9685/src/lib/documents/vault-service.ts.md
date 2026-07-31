# Review: `src/lib/documents/vault-service.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 5

---

## 🔴 Critical (1)

**🔒 Security** · lines 73-107

`getVaultFileDownloadPayload` includes `storageKey` in its Prisma select and returns it in the result. This function is exported, so any caller (not just `requestVaultFileAccess`) receives the raw storage key. Since `requestVaultFileAccess` already narrows the return to `{ accessUrl, expiresAt, filename, contentType }`, the `storageKey` should be excluded from the select, or the function should strip it before returning so that no caller can accidentally leak it.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function getVaultFileDownloadPayload(session: AppSession, vaultFileId: string) {
  if (!(await canAccessVaultFile(session, vaultFileId))) throw new Error('FORBIDDEN');

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: {
      id: true,
      requestId: true,
      workspaceId: true,
      filename: true,
      storageKey: true,
      contentType: true,
      documentVersionId: true,
      request: { select: { createdById: true, status: true } },
    },
  });

  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  if (isCustomerSession(session)) {
    if (!session.activeWorkspaceId || vaultFile.workspaceId !== session.activeWorkspaceId) throw new Error('FORBIDDEN');
    if (vaultFile.request.createdById !== session.userId) throw new Error('FORBIDDEN');
    if (!['delivered', 'closed'].includes(vaultFile.request.status)) throw new Error('FORBIDDEN');
    if (!vaultFile.documentVersionId) throw new Error('FORBIDDEN');

    const finalVersion = await prisma.documentVersion.findFirst({
      where: { id: vaultFile.documentVersionId, status: 'final', document: { requestId: vaultFile.requestId } },
      select: { id: true },
    });

    if (!finalVersion) throw new Error('FORBIDDEN');
  }

  // Strip storageKey from the returned payload — callers should use requestVaultFileAccess for downloads
  const { storageKey: _storageKey, ...safePayload } = vaultFile;
  return safePayload;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function getVaultFileDownloadPayload(session: AppSession, vaultFileId: string) {
  if (!(await canAccessVaultFile(session, vaultFileId))) throw new Error('FORBIDDEN');

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: {
      id: true,
      requestId: true,
      workspaceId: true,
      filename: true,
      storageKey: true,
      contentType: true,
      documentVersionId: true,
      request: { select: { createdById: true, status: true } },
    },
  });

  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  if (isCustomerSession(session)) {
    if (!session.activeWorkspaceId || vaultFile.workspaceId !== session.activeWorkspaceId) throw new Error('FORBIDDEN');
    if (vaultFile.request.createdById !== session.userId) throw new Error('FORBIDDEN');
    if (!['delivered', 'closed'].includes(vaultFile.request.status)) throw new Error('FORBIDDEN');
    if (!vaultFile.documentVersionId) throw new Error('FORBIDDEN');

    const finalVersion = await prisma.documentVersion.findFirst({
      where: { id: vaultFile.documentVersionId, status: 'final', document: { requestId: vaultFile.requestId } },
      select: { id: true },
    });

    if (!finalVersion) throw new Error('FORBIDDEN');
  }

  return vaultFile;
}
```
</details>


## 🟠 High (1)

**🔒 Security** · lines 57-67

`verifyVaultFileAccessSignature` validates the HMAC signature but never checks whether the `expires` timestamp has passed. A caller that forgets to independently validate the expiry will accept indefinitely-valid download tokens. Consider adding an expiry check inside this function so the verification is self-contained.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function verifyVaultFileAccessSignature(input: { vaultFileId: string; userId: string; expires: string; signature: string }) {
  try {
    // Reject expired tokens
    if (Number(input.expires) <= Date.now()) return false;
    if (!/^[0-9a-f]+$/i.test(input.signature)) return false;
    const expected = Buffer.from(signVaultFileAccess(input.vaultFileId, input.userId, input.expires), 'hex');
    const actual = Buffer.from(input.signature, 'hex');
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function verifyVaultFileAccessSignature(input: { vaultFileId: string; userId: string; expires: string; signature: string }) {
  try {
    if (!/^[0-9a-f]+$/i.test(input.signature)) return false;
    const expected = Buffer.from(signVaultFileAccess(input.vaultFileId, input.userId, input.expires), 'hex');
    const actual = Buffer.from(input.signature, 'hex');
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
```
</details>


## 🟡 Medium (2)

**🔒 Security** · lines 46-51

`vaultDownloadSecret()` falls back to `NEXTAUTH_SECRET` (an unrelated secret with a different purpose) and then to a hardcoded string in dev/test. In production, this means if `VAULT_DOWNLOAD_SECRET` is missing, the HMAC key silently becomes the NextAuth secret — which weakens the security boundary between the two systems. Consider requiring `VAULT_DOWNLOAD_SECRET` in all environments and removing the `NEXTAUTH_SECRET` fallback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function vaultDownloadSecret() {
  const secret = process.env.VAULT_DOWNLOAD_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') return 'dev-vault-download-secret';
  throw new Error('VAULT_DOWNLOAD_SECRET_REQUIRED');
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function vaultDownloadSecret() {
  const secret = process.env.VAULT_DOWNLOAD_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') return 'dev-vault-download-secret';
  throw new Error('VAULT_DOWNLOAD_SECRET_REQUIRED');
}
```
</details>

---

**🔧 Maintainability** · lines 136-145

`listVaultFiles` and `getVaultFileMetadata` contain nearly identical mapping logic to convert Prisma results into `VaultFileMetadata`. Consider extracting a shared helper (e.g. `toVaultFileMetadata`) to avoid drift and reduce duplication.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function toVaultFileMetadata(f: {
  id: string;
  filename: string | null;
  fileKind: string | null;
  source: string | null;
  documentVersionId: string | null;
  createdAt: Date;
  size?: number | null;
  contentType?: string | null;
}): VaultFileMetadata {
  return {
    id: f.id,
    filename: f.filename,
    fileKind: f.fileKind,
    source: f.source,
    documentVersionId: f.documentVersionId,
    createdAt: f.createdAt,
    size: f.size ?? undefined,
    contentType: f.contentType ?? undefined,
  };
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return vaultFiles.map((f) => ({
    id: f.id,
    filename: f.filename,
    fileKind: f.fileKind,
    source: f.source,
    documentVersionId: f.documentVersionId,
    createdAt: f.createdAt,
    size: f.size ?? undefined,
    contentType: f.contentType ?? undefined,
  }));
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 299

`deleteVaultFile` overloads the `fileKind` field with a magic string `'_deleted'` to implement soft-delete. This conflates the file-kind domain with lifecycle state. Future queries filtering by `fileKind` may inadvertently include or exclude deleted files. Consider using a dedicated `deletedAt` timestamp or `status` field instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      data: { fileKind: '_deleted' }, // TODO: consider a dedicated 'deletedAt' or 'status' field for soft-delete
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      data: { fileKind: '_deleted' },
```
</details>


