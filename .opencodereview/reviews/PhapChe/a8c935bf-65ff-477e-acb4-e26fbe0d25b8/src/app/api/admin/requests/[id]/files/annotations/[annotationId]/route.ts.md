# Review: `src/app/api/admin/requests/[id]/files/annotations/[annotationId]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 8

---

## 🟠 High (3)

**🐛 Bug** · lines 10-12

Redirect detection is unreliable. Next.js uses `digest` property (not `message`) to identify internal redirect errors. The current check `e.message === 'NEXT_REDIRECT'` may fail in some Next.js versions, causing redirects to be swallowed and return a 500 error instead of propagating the redirect.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function isRedirectErr(e: unknown): boolean {
  return e instanceof Error && 'digest' in e && (e as { digest: string }).digest === 'NEXT_REDIRECT';
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function isRedirectErr(e: unknown): boolean {
  return e instanceof Error && 'NEXT_REDIRECT' === e.message;
}
```
</details>

---

**🐛 Bug** · lines 61-70

Race condition: the annotation update (line 62) runs outside the transaction, while the review status recalculation is inside. If the transaction fails or a concurrent request modifies the same annotation between the update and the transaction, the review status can become inconsistent with the actual annotation state. Move the `prisma.documentAnnotation.update` call inside the transaction.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Update annotation and review status within a single transaction
    const annotation = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentAnnotation.update({
        where: { id: annotationId },
        data: updateData,
        include: {
          author: { select: { id: true, name: true } },
        },
      });

      const openCount = await tx.documentAnnotation.count({
        where: { requestId, fileKey: existing.fileKey, status: 'open' },
      });

      await tx.documentReviewStatus.upsert({
        where: {
          requestId_fileKey_reviewerId: {
            requestId,
            fileKey: existing.fileKey,
            reviewerId: session.userId,
          },
        },
        create: {
          requestId,
          fileKey: existing.fileKey,
          reviewerId: session.userId,
          status: openCount > 0 ? 'has_issues' : 'reviewed',
        },
        update: {
          status: openCount > 0 ? 'has_issues' : 'reviewed',
        },
      });

      return updated;
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const annotation = await prisma.documentAnnotation.update({
      where: { id: annotationId },
      data: updateData,
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Update review status within transaction to avoid count-then-upsert race
    await prisma.$transaction(async (tx) => {
```
</details>

---

**🐛 Bug** · lines 141-158

Race condition in DELETE: the `count` query and `updateMany` call are not atomic. A concurrent request could insert a new 'open' annotation between the count and the update, causing the review status to be incorrectly set to 'reviewed' while open annotations still exist. Wrap the delete and recalculation in a transaction.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    await prisma.$transaction(async (tx) => {
      await tx.documentAnnotation.delete({ where: { id: annotationId } });

      const openCount = await tx.documentAnnotation.count({
        where: { requestId, fileKey: existing.fileKey, status: 'open' },
      });

      if (openCount === 0) {
        await tx.documentReviewStatus.updateMany({
          where: {
            requestId,
            fileKey: existing.fileKey,
            reviewerId: session.userId,
            status: 'has_issues',
          },
          data: { status: 'reviewed', reviewedAt: new Date() },
        });
      }
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    await prisma.documentAnnotation.delete({ where: { id: annotationId } });

    // Recalculate review status
    const openCount = await prisma.documentAnnotation.count({
      where: { requestId, fileKey: existing.fileKey, status: 'open' },
    });

    if (openCount === 0) {
      await prisma.documentReviewStatus.updateMany({
        where: {
          requestId,
          fileKey: existing.fileKey,
          reviewerId: session.userId,
          status: 'has_issues',
        },
        data: { status: 'reviewed', reviewedAt: new Date() },
      });
    }
```
</details>


## 🟡 Medium (4)

**🔒 Security** · lines 32-37

Missing ownership authorization: any user with an allowed role can update or delete any annotation without verifying they are the author or have a relevant relationship to the annotation. Consider adding an ownership check (e.g., `existing.authorId === session.userId`) or an admin-level override.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const existing = await prisma.documentAnnotation.findFirst({
      where: { id: annotationId, requestId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'ANNOTATION_NOT_FOUND' }, { status: 404 });
    }

    // Only the author or an admin can modify this annotation
    const isAdmin = (session.roles as string[]).includes('super_admin') || (session.roles as string[]).includes('coordinator_admin');
    if (existing.authorId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const existing = await prisma.documentAnnotation.findFirst({
      where: { id: annotationId, requestId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'ANNOTATION_NOT_FOUND' }, { status: 404 });
    }
```
</details>

---

**🐛 Bug** · line 59

The `position` field is accepted without any validation, allowing arbitrary JSON structures (e.g., deeply nested objects, unexpected types) that may not conform to expected annotation coordinates. Add validation to ensure the structure matches the expected format (e.g., page number, bounding box coordinates).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (body.position !== undefined) {
      // Validate position structure (e.g., must have pageNumber and bounding box)
      if (typeof body.position !== 'object' || body.position === null) {
        return NextResponse.json({ error: 'VALIDATION: invalid position format' }, { status: 400 });
      }
      updateData.position = body.position;
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (body.position !== undefined) updateData.position = body.position;
```
</details>

---

**🐛 Bug** · lines 89-91

Inconsistency: when the PATCH handler transitions review status to 'reviewed' (openCount === 0), it does not set `reviewedAt`. The DELETE handler does set `reviewedAt: new Date()`. This means `reviewedAt` is only populated via the DELETE path, leading to missing timestamps when all annotations are resolved via PATCH.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        update: {
          status: openCount > 0 ? 'has_issues' : 'reviewed',
          ...(openCount === 0 ? { reviewedAt: new Date() } : {}),
        },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        update: {
          status: openCount > 0 ? 'has_issues' : 'reviewed',
        },
```
</details>

---

**🐛 Bug** · line 40

The `content` field is not type-checked before calling `.trim()`. If `body.content` is a non-string value (e.g., a number, object, or array), `body.content?.trim()` will throw a TypeError since `trim` is not defined on those types. Add a type check to ensure only strings are trimmed.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (body.content !== undefined) {
      if (typeof body.content !== 'string') {
        return NextResponse.json({ error: 'VALIDATION: content must be a string' }, { status: 400 });
      }
      updateData.content = body.content.trim();
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (body.content !== undefined) updateData.content = body.content?.trim();
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 18-19

The `_request` parameter is prefixed with an underscore (convention for unused variables), but it is actually used via `_request.json()` in the PATCH handler. This is misleading. Rename to `request` for clarity.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function PATCH(
  request: NextRequest,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function PATCH(
  _request: NextRequest,
```
</details>


