# Review: `src/app/api/admin/partner/requests/[id]/documents/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 9

---

## 🔴 Critical (2)

**🐛 Bug** · lines 86-97

The `VaultFile` model does not have `category` or `visibility` fields. These fields exist on the `File` model but not on `VaultFile`. Selecting them in a Prisma query against `vaultFile` will cause a TypeScript compilation error and/or a runtime Prisma error.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Get vault files for this request
    const files = await prisma.vaultFile.findMany({
      where: { requestId: id },
      select: {
        id: true,
        filename: true,
        contentType: true,
        size: true,
        fileKind: true,
        source: true,
        createdAt: true,
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get vault files for this request
    const files = await prisma.vaultFile.findMany({
      where: { requestId: id },
      select: {
        id: true,
        filename: true,
        contentType: true,
        size: true,
        category: true,
        visibility: true,
        createdAt: true,
      },
```
</details>

---

**🐛 Bug** · lines 173-185

The actual file content (bytes) from the uploaded file is never read or stored. Only metadata is saved to `VaultFile`, but the `storageKey` field is never populated. The file upload is essentially a no-op — the file content is silently discarded.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Read file bytes and store to storage (e.g., S3, local filesystem)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const storageKey = await uploadToStorage(buffer, file.name, file.type);

    // Store file metadata in vault file
    const vaultFile = await prisma.vaultFile.create({
      data: {
        workspaceId: requestExists.workspaceId,
        requestId: id,
        actorId: userId,
        filename: file.name,
        storageKey,
        contentType: file.type,
        size: file.size,
        fileKind: 'upload',
        source: 'admin_upload',
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Store file metadata in vault file
    const vaultFile = await prisma.vaultFile.create({
      data: {
        workspaceId: requestExists.workspaceId,
        requestId: id,
        actorId: userId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        fileKind: 'upload',
        source: 'admin_upload',
      },
    });
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 146-148

The `description` field from formData is read but never persisted to the database. The `VaultFile` model has a `reason` field that could store this, but it is not populated. The description is only used in the immediate response and will be lost on subsequent GET requests.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;
```
</details>

---

**🐛 Bug** · lines 146-185

The `POST` handler reads the `description` field from formData but never persists it to the database. Meanwhile, the `VaultFile` model has a `reason` field that could be used for this purpose. As a result, the description is only returned in the immediate 201 response and is lost on subsequent GET requests.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG' },
        { status: 400 }
      );
    }

    // Store file metadata in vault file
    const vaultFile = await prisma.vaultFile.create({
      data: {
        workspaceId: requestExists.workspaceId,
        requestId: id,
        actorId: userId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        fileKind: 'upload',
        source: 'admin_upload',
        reason: description,
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG' },
        { status: 400 }
      );
    }

    // Store file metadata in vault file
    const vaultFile = await prisma.vaultFile.create({
      data: {
        workspaceId: requestExists.workspaceId,
        requestId: id,
        actorId: userId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        fileKind: 'upload',
        source: 'admin_upload',
      },
    });
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 87-88

The `VaultFile` model supports soft deletion via `deletedAt`, but the GET query does not filter out soft-deleted records. Files that have been soft-deleted will still appear in the response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const files = await prisma.vaultFile.findMany({
      where: { requestId: id, deletedAt: null },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const files = await prisma.vaultFile.findMany({
      where: { requestId: id },
```
</details>

---

**🐛 Bug** · lines 101-109

The GET handler's `description` mapping references `f.category` which does not exist on `VaultFile`. Combined with the missing `category`/`visibility` fields, this will result in a runtime error even if the Prisma query is fixed.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Transform to document format
    const documents = files.map((f) => ({
      id: f.id,
      filename: f.filename,
      mimeType: f.contentType,
      size: f.size,
      description: f.fileKind || f.filename,
      createdAt: f.createdAt,
    }));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Transform to document format
    const documents = files.map((f) => ({
      id: f.id,
      filename: f.filename,
      mimeType: f.contentType,
      size: f.size,
      description: f.category || f.filename,
      createdAt: f.createdAt,
    }));
```
</details>

---

**🔒 Security** · lines 165-166

Only MIME type is validated (based on the `Content-Type` header from the client). There is no magic-byte verification or server-side content inspection. A malicious file could be uploaded with a spoofed MIME type to bypass the allowlist.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Validate MIME type (client-provided, not trusted alone)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: 'File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG' },
        { status: 400 }
      );
    }

    // Verify magic bytes for additional security
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!isAllowedFileType(buffer)) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 64-69

The `userId` variable is destructured from `requireAdminSession()` but never used in the GET handler. This is dead code and also means the admin check is the only reason for the call — but the variable is misleading.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAdminSession();
```
</details>

---

**🔧 Maintainability** · lines 124-129

The `session` variable is destructured from `requireAdminSession()` but never used in the POST handler. Only `userId` is used downstream.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAdminSession();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, userId } = await requireAdminSession();
```
</details>


