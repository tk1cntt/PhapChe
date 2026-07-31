# Review: `src/app/api/intake/submit/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 10

---

## 🔴 Critical (1)

**🐛 Bug** · lines 192-194

File upload failures are silently ignored, and the response reports `filesStored: uploadedFiles.length` even when some files failed to upload. The client receives misleading confirmation that all files were stored, but the request may be missing critical attachments. Track actual success/failure counts and return the true number of successfully stored files.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        } catch (err) {
          console.error('Failed to store intake file:', entry.name, err);
          // Track failed files to report accurately
          failedFiles.push(entry.name);
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        } catch (err) {
          console.error('Failed to store intake file:', entry.name, err);
        }
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 177-178

`prisma.vaultFile.create` (lines 119-128) runs outside the transaction. If `storageService.uploadFile` succeeds but `vaultFile.create` fails (e.g., DB error), the file is already stored in S3/storage but the vaultFile linkage is missing, creating an orphaned file record with no way for the dashboard to discover it. Consider wrapping both in a compensating transaction or moving vaultFile creation into storageService.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // Create VaultFile record for dashboard query compatibility
          // NOTE: If this fails, the file is already uploaded to storage but lacks DB linkage.
          // Consider a compensating cleanup or wrapping in an idempotent retry.
          await prisma.vaultFile.create({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          // Create VaultFile record for dashboard query compatibility
          await prisma.vaultFile.create({
```
</details>

---

**🐛 Bug** · lines 198-199

`transitionRequestStatus` (line 130) runs after the transaction and file uploads. If this call throws, the LegalRequest is created and files are uploaded, but the request remains in its initial status (likely 'draft') instead of 'triage'. This creates a stuck submission — the user sees success but the request never enters the triage queue. Wrap this in a retry or handle the failure explicitly with a compensating action.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Transition to triage (v2.3: customer submit goes straight to triage)
    // If this fails, the request remains in initial status — consider retry or alerting
    try {
      await transitionRequestStatus({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Transition to triage (v2.3: customer submit goes straight to triage)
    await transitionRequestStatus({
```
</details>


## 🟡 Medium (5)

**🐛 Bug** · lines 85-86

If `serviceType` is not a key in `SEED_MATTER_TYPES`, `seedMatter` is `undefined`, `questions` becomes `[]`, and the matter type upsert proceeds with an empty question schema. The user receives no validation error, and a malformed matter type is silently created. Validate that `serviceType` exists in the seed catalog before proceeding.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Get matter type from seed catalog
    const seedMatter = SEED_MATTER_TYPES[serviceType as keyof typeof SEED_MATTER_TYPES];
    if (!seedMatter) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', detail: `Unknown service type: ${serviceType}` },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get matter type from seed catalog
    const seedMatter = SEED_MATTER_TYPES[serviceType as keyof typeof SEED_MATTER_TYPES];
```
</details>

---

**🐛 Bug** · lines 208-210

Draft deletion (line 140) uses `prisma.draft.delete({ where: { id: draftId } })` without verifying that the draft belongs to the current user. A malicious user could delete another user's drafts by guessing draft IDs. Add a workspaceId/userId filter to the delete query.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (draftId) {
      try {
        await prisma.draft.delete({ where: { id: draftId, workspaceId, createdById: session.userId } });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (draftId) {
      try {
        await prisma.draft.delete({ where: { id: draftId } });
```
</details>

---

**🔧 Maintainability** · lines 81-83

SLA durations (24 hours for urgent, 72 hours for normal) are hardcoded business values. If these need to change, they must be updated in code. Extract them to a configuration constant or environment variable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const SLA_HOURS = { urgent: 24, normal: 72 } as const;
    const slaDeadline = new Date(now.getTime() + SLA_HOURS[priority] * 60 * 60 * 1000);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const slaDeadline = priority === 'urgent'
      ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 72 * 60 * 60 * 1000);
```
</details>

---

**⚡ Performance** · lines 159-166

File uploads inside the `for...of` loop execute sequentially. Since each upload is independent (no shared state), they can be parallelized with `Promise.allSettled` to reduce total upload time, especially for multi-file submissions.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const uploadResults = await Promise.allSettled(uploadedFiles
        .filter((e): e is File => e instanceof File)
        .map(async (entry) => {
          const buffer = Buffer.from(await entry.arrayBuffer());
          const fileRecord = await storageService.uploadFile({
            organizationId: workspaceId,
            requestId: result.id,
            file: buffer,
            originalName: entry.name,
            mimeType: entry.type || 'application/octet-stream',
            category: FileCategory.REQUEST_UPLOAD,
            visibility: FileVisibility.PRIVATE,
            createdBy: session.userId,
          });
          await prisma.vaultFile.create({
            data: {
              requestId: result.id,
              workspaceId,
              actorId: session.userId,
              fileId: fileRecord.id,
              filename: entry.name,
              storageKey: fileRecord.objectKey,
              fileKind: 'intake_upload',
              source: 'customer_upload',
              size: entry.size,
              contentType: entry.type || 'application/octet-stream',
            },
          });
          return entry.name;
        }));
      const failedFiles = uploadResults
        .filter((r) => r.status === 'rejected')
        .map((_, i) => (uploadedFiles[i] as File).name);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      for (const entry of uploadedFiles) {
        if (!(entry instanceof File)) continue;
        try {
          const buffer = Buffer.from(await entry.arrayBuffer());

          // StorageService handles: MIME validation, object key generation,
          // checksum, upload to provider, File record creation, audit logging
          const fileRecord = await storageService.uploadFile({
```
</details>

---

**🐛 Bug** · line 77

The `correlationId` uses `Date.now()` which can produce collisions if two requests arrive in the same millisecond. Use `crypto.randomUUID()` for a guaranteed-unique correlation ID.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const correlationId = `v2-submit-${crypto.randomUUID()}`;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const correlationId = `v2-submit-${Date.now()}`;
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 17-21

The `files` field in `submitDataSchema` (lines 21-26) is validated via Zod but never used — the actual file list comes from `formData.getAll('files')`. The validated `files` array from `validationResult.data` is dead code. Either remove it from the schema or use the validated data instead of `formData.getAll()`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // NOTE: files are extracted from FormData directly; this field is unused and should be removed
  // files: z.array(...).optional().default([]),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  files: z.array(z.object({
    vaultFileId: z.string(),
    filename: z.string(),
    size: z.number(),
  })).optional().default([]),
```
</details>

---

**🔧 Maintainability** · line 6

The constant name `SEED_MATTER_TYPES` contains a likely typo — the module is `seed-multilingual` (seed data), but the constant uses "SEED" instead of "SEED". This appears to be a spelling error.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider renaming to SEED_MATTER_TYPES if it's meant to be "seed" data
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';
```
</details>


