# Review: `src/lib/intake/actions.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 7

---

## 🔴 Critical (3)

**🔒 Security** · lines 36-50

Missing authorization check: This action does not verify that the session user owns or has access to `requestId`. An authenticated user can modify or save answers to any other user's intake by providing an arbitrary `requestId`. Compare with `deleteDraftIntakeAction` which calls `canAccessRequest()` and verifies ownership.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function saveIntakeAnswersAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');

  if (!(await canAccessRequest(session, requestId))) {
    throw new Error('FORBIDDEN');
  }

  const answers = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => key.startsWith('answer.') && typeof value === 'string')
      .map(([key, value]) => [key.slice('answer.'.length), String(value)]),
  );

  return saveIntakeAnswers({
    session,
    requestId,
    answers,
    correlationId: correlationId(),
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function saveIntakeAnswersAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');
  const answers = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => key.startsWith('answer.') && typeof value === 'string')
      .map(([key, value]) => [key.slice('answer.'.length), String(value)]),
  );

  return saveIntakeAnswers({
    session,
    requestId,
    answers,
    correlationId: correlationId(),
  });
```
</details>

---

**🔒 Security** · lines 53-64

Missing authorization check: This action does not verify that the session user owns or has access to `requestId`. An authenticated user can attach files to any other user's intake by providing an arbitrary `requestId`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function attachIntakeFileAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('FILE_REQUIRED');

  if (!(await canAccessRequest(session, requestId))) {
    throw new Error('FORBIDDEN');
  }

  try {
    const uploaded = await attachIntakeFile({
      session,
      requestId,
      file,
      correlationId: correlationId(),
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function attachIntakeFileAction(formData: FormData) {
  const session = await requireAppSession();
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('FILE_REQUIRED');

  try {
    const uploaded = await attachIntakeFile({
      session,
      requestId: stringValue(formData, 'requestId'),
      file,
      correlationId: correlationId(),
    });
```
</details>

---

**🔒 Security** · lines 75-88

Missing authorization check: This action does not verify that the session user owns or has access to `requestId`. An authenticated user can submit any other user's intake by providing an arbitrary `requestId`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function submitIntakeAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');

  if (!requestId) {
    throw new Error('Yêu cầu không hợp lệ. Vui lòng bắt đầu lại.');
  }

  if (!(await canAccessRequest(session, requestId))) {
    throw new Error('FORBIDDEN');
  }

  try {
    const submitted = await submitIntake({
      session,
      requestId,
      correlationId: correlationId(),
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function submitIntakeAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');

  if (!requestId) {
    throw new Error('Yêu cầu không hợp lệ. Vui lòng bắt đầu lại.');
  }

  try {
    const submitted = await submitIntake({
      session,
      requestId,
      correlationId: correlationId(),
    });
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 108-121

Race condition: The request's status is read outside the transaction (line 93), then a check is performed (line 97), and finally deletions happen inside a transaction (lines 99-103). A concurrent request could change the status between the read and the delete, causing a non-draft request to be deleted. Move the status check into the transaction or use an atomic conditional delete.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  await prisma.$transaction(async (tx) => {
    const request = await tx.legalRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, createdById: true },
    });

    if (!request) throw new Error('REQUEST_NOT_FOUND');
    if (request.status !== 'draft_intake') throw new Error('NOT_DRAFT');
    if (request.createdById !== session.userId) throw new Error('FORBIDDEN');

    await tx.intakeSubmission.deleteMany({ where: { requestId } });
    await tx.vaultFile.deleteMany({ where: { requestId } });
    await tx.legalRequest.delete({ where: { id: requestId } });
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, createdById: true },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');
  if (request.status !== 'draft_intake') throw new Error('NOT_DRAFT');
  if (request.createdById !== session.userId) throw new Error('FORBIDDEN');

  await prisma.$transaction([
    prisma.intakeSubmission.deleteMany({ where: { requestId } }),
    prisma.vaultFile.deleteMany({ where: { requestId } }),
    prisma.legalRequest.delete({ where: { id: requestId } }),
  ]);
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 117-121

Orphaned files: Deleting `vaultFile` records from the database without also deleting the corresponding files from the storage service (e.g., S3, local filesystem) will leave orphaned files, wasting storage and potentially leaking sensitive documents. The file keys/paths should be fetched before deletion and the storage service should be called to remove the actual files.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Fetch file keys before deletion so they can be cleaned up from storage
  const vaultFiles = await prisma.vaultFile.findMany({
    where: { requestId },
    select: { storageKey: true },
  });

  await prisma.$transaction([
    prisma.intakeSubmission.deleteMany({ where: { requestId } }),
    prisma.vaultFile.deleteMany({ where: { requestId } }),
    prisma.legalRequest.delete({ where: { id: requestId } }),
  ]);

  // Delete actual files from storage (fire-and-forget or await based on requirements)
  await Promise.allSettled(
    vaultFiles.map((f) => deleteFileFromStorage(f.storageKey)),
  );
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  await prisma.$transaction([
    prisma.intakeSubmission.deleteMany({ where: { requestId } }),
    prisma.vaultFile.deleteMany({ where: { requestId } }),
    prisma.legalRequest.delete({ where: { id: requestId } }),
  ]);
```
</details>

---

**🐛 Bug** · lines 58-72

Mismatched correlation ID in error log: `correlationId()` is called again inside the catch block, generating a new, different ID from the one passed to `attachIntakeFile()`. This makes it impossible to correlate the error log with the service call. Capture the ID once in a variable and reuse it.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const cid = correlationId();
  try {
    const uploaded = await attachIntakeFile({
      session,
      requestId: stringValue(formData, 'requestId'),
      file,
      correlationId: cid,
    });
    return { filename: uploaded.filename, size: uploaded.size };
  } catch (error) {
    if (error instanceof Error && error.message === 'UPLOAD_STORAGE_NOT_CONFIGURED') {
      throw error;
    }
    console.error(`Attach file failed [${cid}]:`, error);
    throw new Error('Không thể tải tệp lên. Vui lòng thử lại sau.');
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  try {
    const uploaded = await attachIntakeFile({
      session,
      requestId: stringValue(formData, 'requestId'),
      file,
      correlationId: correlationId(),
    });
    return { filename: uploaded.filename, size: uploaded.size };
  } catch (error) {
    if (error instanceof Error && error.message === 'UPLOAD_STORAGE_NOT_CONFIGURED') {
      throw error;
    }
    console.error(`Attach file failed [${correlationId()}]:`, error);
    throw new Error('Không thể tải tệp lên. Vui lòng thử lại sau.');
  }
```
</details>

---

**🐛 Bug** · lines 83-93

Mismatched correlation ID in error log: Same issue as `attachIntakeFileAction` — `correlationId()` is called again inside the catch block, producing a different ID than the one passed to `submitIntake()`. Capture the ID once in a variable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const cid = correlationId();
  try {
    const submitted = await submitIntake({
      session,
      requestId,
      correlationId: cid,
    });
    redirect(`/requests/${submitted.id}`);
  } catch (error) {
    console.error(`Submit intake failed [${cid}]:`, error);
    throw new Error('Không thể gửi yêu cầu. Vui lòng thử lại sau.');
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  try {
    const submitted = await submitIntake({
      session,
      requestId,
      correlationId: correlationId(),
    });
    redirect(`/requests/${submitted.id}`);
  } catch (error) {
    console.error(`Submit intake failed [${correlationId()}]:`, error);
    throw new Error('Không thể gửi yêu cầu. Vui lòng thử lại sau.');
  }
```
</details>


