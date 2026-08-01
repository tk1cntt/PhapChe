# Review: `src/lib/documents/draft-service.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 10

---

## 🟠 High (1)

**🐛 Bug** · lines 78-80

`generateDraft` does not verify that the template belongs to the same workspace as the request. The query for `prisma.documentTemplate.findFirst` only checks `id` and `status`, but does not filter on `workspaceId`. This could allow a specialist to use a template from a different workspace, potentially exposing sensitive template content across workspace boundaries.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const template = await prisma.documentTemplate.findFirst({
    where: { id: templateId, workspaceId: request.workspaceId, status: { in: ['approved', 'published'] } },
    select: {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const template = await prisma.documentTemplate.findFirst({
    where: { id: templateId, status: { in: ['approved', 'published'] } },
    select: {
```
</details>


## 🟡 Medium (6)

**🐛 Bug** · lines 75-78

Dead code: `getTemplatesForGeneration` is called and awaited but its result `templates` is never used anywhere in the function. This is an unnecessary database call that wastes resources and adds latency. The actual template lookup happens on the next line with `prisma.documentTemplate.findFirst`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Load template - must be approved or published
  const template = await prisma.documentTemplate.findFirst({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Load template - must be approved or published
  const templates = await getTemplatesForGeneration(session, request.workspaceId, '');

  const template = await prisma.documentTemplate.findFirst({
```
</details>

---

**🔧 Maintainability** · line 287

Hardcoded business-related string in Vietnamese: the default reason `'Gửi phiên bản ${documentVersionId} để kiểm tra'` is hardcoded. Business-related strings should be externalized (e.g., using i18n or constants) to support localization and maintainability.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const transitionReason = reason ?? `Submit version ${documentVersionId} for review`;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const transitionReason = reason ?? `Gửi phiên bản ${documentVersionId} để kiểm tra`;
```
</details>

---

**⚡ Performance** · lines 208-215

Each version returned by `listDocumentVersions` includes a nested `document` field that contains ALL document versions (`documentVersions`). If there are N versions, this returns N copies of the full version list, creating significant redundant data transfer. The nested `document.documentVersions` appears unused in the return value, and the `inputSnapshot` override only applies at the top level, not inside the nested structure. Consider removing the nested `document` include or restructuring the query.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Remove the nested document include to avoid redundant data; if needed, fetch separately
      document: {
        select: { id: true, requestId: true },
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      document: {
        include: {
          documentVersions: {
            select: { id: true, templateVersion: true, status: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
```
</details>

---

**🐛 Bug** · lines 288-294

`transitionRequestStatus` is called inside the Prisma transaction callback. If this function performs operations outside of the transaction context (e.g., using a separate `prisma` instance instead of `tx`, or making external API calls), those operations will not be rolled back if the transaction fails. This can lead to inconsistent state. Verify that `transitionRequestStatus` accepts and uses the transaction client, or move it outside the transaction with compensating logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Ensure transitionRequestStatus uses the transaction client 'tx' to maintain atomicity.
    // If it cannot, consider moving it outside the transaction with compensating error handling.
    await transitionRequestStatus({
      requestId: docVersion.document.requestId,
      actorId: session.userId,
      toStatus: 'pending_review',
      reason: transitionReason,
      correlationId: correlationId ?? `submit-review-${documentVersionId}`,
    }, tx);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    await transitionRequestStatus({
      requestId: docVersion.document.requestId,
      actorId: session.userId,
      toStatus: 'pending_review',
      reason: transitionReason,
      correlationId: correlationId ?? `submit-review-${documentVersionId}`,
    });
```
</details>

---

**🐛 Bug** · line 42

The `replacePlaceholders` function uses `JSON.stringify(value)` when `typeof value === 'object'`. This will throw a `TypeError` if the value contains circular references. Additionally, `JSON.stringify` may silently fail (return `undefined`) for certain types like `BigInt`, `Symbol`, or `undefined` values within objects. Consider wrapping in a try-catch or using a safer serialization approach.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Complex Object]';
      }
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (typeof value === 'object') return JSON.stringify(value);
```
</details>

---

**🐛 Bug** · lines 148-172

Calling `storeVaultFile` and `recordAuditEvent` inside the Prisma transaction may cause the transaction to remain open for an extended duration if these functions perform external I/O (e.g., cloud storage uploads, HTTP calls to an audit service). Long-running transactions can cause connection pool exhaustion and deadlocks. If these operations are not purely database writes through `tx`, consider moving them outside the transaction, or use a saga/compensating pattern for non-database side effects.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Consider the implications: if storeVaultFile or recordAuditEvent make external calls,
    // they should not be inside the DB transaction. If they only use `tx` for DB writes,
    // this is acceptable but should be documented.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    await storeVaultFile({
      session,
      requestId,
      storageKey,
      filename,
      fileKind: 'generated_draft',
      source: 'template_generation',
      documentVersionId: created.id,
      correlationId: correlationId ?? `draft-store-${created.id}`,
    }, tx);

    // Record audit event
    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: request.workspaceId,
        action: 'document.draft_generated',
        targetType: 'DOCUMENT',
        targetId: created.id,
        requestId,
        correlationId: correlationId ?? `draft-generate-${created.id}`,
        metadataSummary: `docVersionId=${created.id}; templateId=${templateId}; templateVersion=${template.version}; matterTypeKey=${template.matterTypeKey}`,
      },
      tx,
    );
```
</details>


## 🔵 Low (3)

**🐛 Bug** · line 95

Unsafe type assertion: `template.variableSchema as TemplateVariable[]` assumes the JSON field stored in the database always conforms to `TemplateVariable[]`. If the stored data is malformed or has a different shape, this will cause runtime errors later in `validateRequiredVariables` or `replacePlaceholders`. Consider using a runtime validation (e.g., zod) or at least a defensive check.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const schema = template.variableSchema as TemplateVariable[];
  // Consider adding runtime validation: if (!Array.isArray(schema)) throw new Error('INVALID_TEMPLATE_SCHEMA');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const schema = template.variableSchema as TemplateVariable[];
```
</details>

---

**🔧 Maintainability** · lines 230-235

The `inputSnapshot: undefined` override in the map return spreads `...v` (which includes the real `inputSnapshot`) and then explicitly sets it to `undefined`. While the intent is to prevent exposing raw data in list views, the property still exists in the returned type with value `undefined`, which is misleading for consumers. Consider using destructuring to truly exclude it: `const { inputSnapshot, ...rest } = v; return { ...rest, templateLabel, matterTypeKey };`

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { inputSnapshot: _, ...rest } = v;
    return {
      ...rest,
      templateLabel: template?.label ?? 'Unknown',
      matterTypeKey: template?.matterTypeKey ?? 'unknown',
    };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return {
      ...v,
      templateLabel: template?.label ?? 'Unknown',
      matterTypeKey: template?.matterTypeKey ?? 'unknown',
      inputSnapshot: undefined, // Don't expose raw snapshot in list
    };
```
</details>

---

**🔧 Maintainability** · lines 70-73

The authorization check pattern (`isAssignedSpecialist` + `isAdmin` check) is duplicated in `generateDraft` and `submitForReview`. Consider extracting this into a shared helper function to reduce duplication and ensure consistent authorization logic across the service.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider extracting to a shared helper, e.g.:
  // if (!canEditDraft(session, request.assignedSpecialistId)) throw new Error('FORBIDDEN');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const isAssignedSpecialist = request.assignedSpecialistId === session.userId;
  const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');

  if (!isAssignedSpecialist && !isAdmin) throw new Error('FORBIDDEN');
```
</details>


