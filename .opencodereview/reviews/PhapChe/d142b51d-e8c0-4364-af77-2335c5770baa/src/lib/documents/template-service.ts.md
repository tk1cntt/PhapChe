# Review: `src/lib/documents/template-service.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 11

---

## 🔴 Critical (1)

**🐛 Bug** · lines 7-9

Missing optional chaining on `.includes()` — when `session` is `null` or `undefined`, `session?.roles` evaluates to `undefined`, and calling `.includes()` on `undefined` throws a TypeError. Add `?.` before `.includes()` (i.e., `session?.roles?.includes(...)`) so the function safely returns `false` for unauthenticated sessions.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function isAdmin(session: AppSession | null | undefined) {
  return session?.roles?.includes('coordinator_admin') || session?.roles?.includes('super_admin') || false;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function isAdmin(session: AppSession | null | undefined) {
  return session?.roles.includes('coordinator_admin') || session?.roles.includes('super_admin') || false;
}
```
</details>


## 🟠 High (3)

**🐛 Bug** · lines 235-236

Falsy checks on `label` and `description` cause empty strings to be silently replaced with the previous template's value. If a caller intentionally passes `label: ''` or `description: ''`, the ternary `input?.label ? input.label : template.label` falls back to `template.label`. Use explicit `undefined` checks (e.g., `input?.label !== undefined ? input.label : template.label`) to preserve empty-string intent.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        label: input?.label !== undefined ? input.label : template.label,
        description: input?.description !== undefined ? input.description : template.description,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        label: (input?.label ? input.label : template.label) as string | null,
        description: (input?.description ? input.description : template.description) as string | null,
```
</details>

---

**🐛 Bug** · lines 65-77

Concurrency hazard: `version` is computed inside a `$transaction` as `existingCount + 1`, but the default Prisma transaction isolation level (e.g., PostgreSQL READ COMMITTED) does not prevent two concurrent transactions from reading the same count and creating duplicate versions. Use a database-level unique constraint on `(workspaceId, matterTypeKey, version)` or use `SELECT ... FOR UPDATE` lock, or use `$queryRaw` to atomically increment the version.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Consider using a raw query with atomic increment or a unique constraint
    // to prevent duplicate version numbers under concurrency.
    const existingCount = await tx.documentTemplate.count({
      where: { workspaceId: input.workspaceId, matterTypeKey: input.matterTypeKey },
    });

    return tx.documentTemplate.create({
      data: {
        workspaceId: input.workspaceId,
        matterTypeKey: input.matterTypeKey,
        label: input.label,
        description: input.description || null,
        variableSchema: input.variableSchema ?? [],
        content: input.content,
        version: existingCount + 1,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const existingCount = await tx.documentTemplate.count({
      where: { workspaceId: input.workspaceId, matterTypeKey: input.matterTypeKey },
    });

    return tx.documentTemplate.create({
      data: {
        workspaceId: input.workspaceId,
        matterTypeKey: input.matterTypeKey,
        label: input.label,
        description: input.description || null,
        variableSchema: input.variableSchema ?? [],
        content: input.content,
        version: existingCount + 1,
```
</details>

---

**🐛 Bug** · lines 223-227

Same concurrency issue as `createTemplate`: `maxVersion._max.version` is read and then incremented within the same transaction, but without a lock or serializable isolation, two concurrent calls can produce the same `newVersion`, leading to duplicate versions. Use a unique constraint or atomic increment.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // FIX: use a database-level unique constraint or atomic increment to avoid duplicate versions
    const maxVersion = await tx.documentTemplate.aggregate({
      where: { workspaceId: template.workspaceId, matterTypeKey: template.matterTypeKey },
      _max: { version: true },
    });
    const newVersion = (maxVersion._max.version ?? template.version) + 1;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const maxVersion = await tx.documentTemplate.aggregate({
      where: { workspaceId: template.workspaceId, matterTypeKey: template.matterTypeKey },
      _max: { version: true },
    });
    const newVersion = (maxVersion._max.version ?? template.version) + 1;
```
</details>


## 🟡 Medium (6)

**🔧 Maintainability** · line 237

`as object[]` type assertions on `variableSchema` lose type information and bypass TypeScript safety. The field is typed as `TemplateVariable[]`; casting to `object[]` hides mismatches. Remove the assertions or replace with a proper type guard that validates the shape at runtime.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        variableSchema: input?.variableSchema ?? template.variableSchema,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        variableSchema: (input?.variableSchema as object[]) ?? (template.variableSchema as object[]),
```
</details>

---

**🔧 Maintainability** · lines 124-130

The pattern of fetching a template by ID, checking if it exists, then validating its status is repeated verbatim across `approveTemplate`, `publishTemplate`, `deprecateTemplate`, and `createNewVersion`. Extract into a shared helper (e.g., `getTemplateOrThrow(id, allowedStatuses?)`) to reduce duplication and centralize error handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider extracting a shared helper, e.g.:
  // const template = await getTemplateOrThrow(templateId, ['draft']);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, status: true, workspaceId: true, matterTypeKey: true, version: true },
  });

  if (!template) throw new Error('TEMPLATE_NOT_FOUND');
  if (template.status !== 'draft') throw new Error('INVALID_TEMPLATE_STATUS');
```
</details>

---

**🐛 Bug** · line 160

`publishTemplate` allows publishing a `draft` template directly (skipping the `approved` state), which contradicts the workflow implied by `approveTemplate`. Consider adding a check that `template.status === 'approved'` to enforce the intended `draft → approved → published` lifecycle.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (template.status !== 'approved') throw new Error('TEMPLATE_MUST_BE_APPROVED');
  if (template.status === 'published' || template.status === 'deprecated') throw new Error('TEMPLATE_ALREADY_PUBLISHED');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (template.status === 'published' || template.status === 'deprecated') throw new Error('TEMPLATE_ALREADY_PUBLISHED');
```
</details>

---

**🐛 Bug** · line 220

`createNewVersion` error message says 'CREATE_VERSION_FROM_PUBLISHED_ONLY' but the code only rejects `draft`, allowing both `approved` and `published` templates. Either update the error message to reflect the actual allowed statuses, or restrict the check to only `published` templates.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (template.status === 'draft') throw new Error('CANNOT_CREATE_VERSION_FROM_DRAFT');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (template.status === 'draft') throw new Error('CREATE_VERSION_FROM_PUBLISHED_ONLY');
```
</details>

---

**🐛 Bug** · line 190

`deprecateTemplate` only checks for already-deprecated status but allows deprecating `draft` templates. If the intended workflow is `draft → approved → published → deprecated`, add a guard: `if (template.status !== 'published') throw new Error('ONLY_PUBLISHED_CAN_BE_DEPRECATED')`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (template.status !== 'published') throw new Error('ONLY_PUBLISHED_CAN_BE_DEPRECATED');
  if (template.status === 'deprecated') throw new Error('TEMPLATE_ALREADY_DEPRECATED');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (template.status === 'deprecated') throw new Error('TEMPLATE_ALREADY_DEPRECATED');
```
</details>

---

**🔧 Maintainability** · lines 101-110

`updateTemplate` performs a read-then-write for the status check without a transaction or optimistic lock. Between the `findUnique` and `update`, the template could be published/deprecated by another request, allowing an update on an immutable template. Use a single `update` with a `where` clause that includes `status: 'draft'` or use a transaction with a row lock.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Use a conditional update to avoid TOCTOU race
  try {
    return await prisma.documentTemplate.update({
      where: { id: templateId, status: 'draft' },
      data: {
        ...(input.label != null ? { label: input.label } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
        ...(input.variableSchema != null ? { variableSchema: input.variableSchema } : {}),
        ...(input.content != null ? { content: input.content } : {}),
      },
    });
  } catch (e) {
    throw new Error('TEMPLATE_NOT_FOUND_OR_IMMUTABLE');
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, status: true, workspaceId: true },
  });

  if (!template) throw new Error('TEMPLATE_NOT_FOUND');
  if (template.status === 'published' || template.status === 'deprecated') throw new Error('TEMPLATE_IMMUTABLE');

  return prisma.documentTemplate.update({
    where: { id: templateId },
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 91

Audit metadata hardcodes `version=1` but the actual version is `existingCount + 1`, which may not be 1 for subsequent templates of the same matterType. Use the computed `template.version` in the metadata summary to avoid misleading audit trails.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    metadataSummary: `matterType=${input.matterTypeKey}; version=${template.version}; status=draft`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    metadataSummary: `matterType=${input.matterTypeKey}; version=1; status=draft`,
```
</details>


