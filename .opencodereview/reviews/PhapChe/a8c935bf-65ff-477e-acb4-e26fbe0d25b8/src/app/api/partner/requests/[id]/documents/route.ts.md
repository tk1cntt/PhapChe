# Review: `src/app/api/partner/requests/[id]/documents/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🔴 Critical (1)

**🐛 Bug** · lines 128-140

**Critical: Uploaded file content is never stored.** The POST handler creates a `VaultFile` metadata record but never reads the binary content of the uploaded file (e.g., via `file.arrayBuffer()`, `file.stream()`, or writing to storage). Users will receive a 201 success response, but the file itself is unrecoverable — only the filename and metadata are persisted. This is a data integrity/loss bug.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Read file content before creating DB records
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // Create vault file record
  const vaultFile = await prisma.vaultFile.create({
    data: {
      workspaceId: currentRequest.workspaceId,
      requestId: id,
      actorId: session.user.id,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      fileKind: 'upload',
      source: 'partner_upload',
      // Store the binary content (adjust field name to match your schema, e.g., 'data', 'content', 'blob')
      data: fileBuffer,
    },
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Create vault file record
  const vaultFile = await prisma.vaultFile.create({
    data: {
      workspaceId: currentRequest.workspaceId,
      requestId: id,
      actorId: session.user.id,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      fileKind: 'upload',
      source: 'partner_upload',
    },
  });
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 128-158

**Missing transactional consistency between vaultFile and auditEvent creation.** If `auditEvent.create` fails (e.g., network error, constraint violation), the `vaultFile` record is already committed and becomes orphaned with no audit trail. These two writes should be wrapped in an interactive Prisma transaction (`prisma.$transaction`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Read file content before creating DB records
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // Create vault file and audit event in a transaction
  const [vaultFile] = await prisma.$transaction([
    prisma.vaultFile.create({
      data: {
        workspaceId: currentRequest.workspaceId,
        requestId: id,
        actorId: session.user.id,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        fileKind: 'upload',
        source: 'partner_upload',
        data: fileBuffer,
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: session.user.id,
        workspaceId: currentRequest.workspaceId,
        action: 'request.document_uploaded',
        targetType: 'request',
        targetId: id,
        requestId: id,
        metadataSummary: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      },
    }),
  ]);

  // Patch documentId into audit metadata after transaction (vaultFile.id now available)
  await prisma.auditEvent.update({
    where: { id: vaultFile.id }, // Adjust to actual auditEvent ID from transaction
    data: {
      metadataSummary: JSON.stringify({
        documentId: vaultFile.id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    },
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Create vault file record
  const vaultFile = await prisma.vaultFile.create({
    data: {
      workspaceId: currentRequest.workspaceId,
      requestId: id,
      actorId: session.user.id,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      fileKind: 'upload',
      source: 'partner_upload',
    },
  });

  // Create audit event
  await prisma.auditEvent.create({
    data: {
      actorId: session.user.id,
      workspaceId: currentRequest.workspaceId,
      action: 'request.document_uploaded',
      targetType: 'request',
      targetId: id,
      requestId: id,
      metadataSummary: JSON.stringify({
        documentId: vaultFile.id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    },
  });
```
</details>

---

**🐛 Bug** · lines 128-129

**Unhandled database errors — no try-catch around Prisma operations.** If any Prisma call throws (e.g., connection timeout, unique constraint violation), the error propagates as an unhandled 500 response, potentially leaking internal stack traces or schema details to the client. Wrap the database operations in a try-catch and return a sanitized error response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
    // Create vault file record
    const vaultFile = await prisma.vaultFile.create({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Create vault file record
  const vaultFile = await prisma.vaultFile.create({
```
</details>


## 🟡 Medium (2)

**🔒 Security** · lines 116-117

**MIME type validation relies on client-provided `file.type`.** The `file.type` property is set by the browser based on the file extension or content sniffing and can be trivially spoofed by an attacker. A malicious client could upload an executable with a forged `image/png` MIME type. Consider server-side content-type detection (e.g., using `file-type` or magic-byte inspection) for security-sensitive scenarios.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Validate MIME type (note: file.type is client-provided and can be spoofed;
  // consider server-side magic-byte detection for production hardening)
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
```
</details>

---

**🔧 Maintainability** · lines 68-82

**Duplicate authentication and access-check logic in POST and GET handlers.** Both handlers independently call `auth.api.getSession()` and `checkPartnerAccess()` with the same pattern. Consider extracting a shared `authenticatePartnerRequest` helper or middleware to reduce duplication and ensure consistent behavior.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider extracting this pattern into a shared helper:
  // async function authenticateRequest(req, requestId) { ... }
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  const access = await checkPartnerAccess(id, session.user.id);
  if (access.error || !access.request) {
    return NextResponse.json(
      { error: access.error || 'Access denied', detail: access.detail || 'Access denied' },
      { status: access.status || 403 }
    );
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', detail: 'Authentication required' },
      { status: 401 }
    );
  }

  const access = await checkPartnerAccess(id, session.user.id);
  if (access.error || !access.request) {
    return NextResponse.json(
      { error: access.error || 'Access denied', detail: access.detail || 'Access denied' },
      { status: access.status || 403 }
    );
  }
```
</details>


## 🔵 Low (1)

**⚡ Performance** · line 29

**File buffer is loaded entirely into memory before storage.** For large files (up to 10MB), reading the entire file into a `Buffer` via `arrayBuffer()` is acceptable. However, if the file size limit is ever increased or if this pattern is reused for larger uploads, consider streaming the file content directly to the storage backend (e.g., S3, database) to avoid memory pressure.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — if increased, consider streaming instead of buffering
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```
</details>


