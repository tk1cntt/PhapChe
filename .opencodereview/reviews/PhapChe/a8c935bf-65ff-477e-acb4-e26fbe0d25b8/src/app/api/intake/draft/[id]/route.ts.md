# Review: `src/app/api/intake/draft/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · lines 135-161

**Missing status check before soft-delete.** The `status` field is selected from the database but never validated. This allows deletion of drafts in any state (e.g., 'submitted', 'deleted', 'archived'), potentially corrupting workflow state. A submitted draft could be silently marked as 'deleted', losing its submission status. Add a check similar to the GET handler: only allow soft-delete when `draft.status === 'draft'`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // 3. Query draft from database
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      select: { id: true, userId: true, status: true },
    });

    // 4. Check if draft exists
    if (!draft) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Draft not found' },
        { status: 404 }
      );
    }

    // 5. Ownership validation (prevent IDOR)
    if (draft.userId !== userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', detail: 'You do not have permission to delete this draft' },
        { status: 403 }
      );
    }

    // 6. Check draft status (only allow deletion of 'draft' status)
    if (draft.status !== 'draft') {
      return NextResponse.json(
        { error: 'CONFLICT', detail: 'Only drafts in draft status can be deleted' },
        { status: 409 }
      );
    }

    // 7. Soft-delete draft (set status = 'deleted')
    await prisma.draft.update({
      where: { id: draftId },
      data: { status: 'deleted' },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // 3. Query draft from database
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      select: { id: true, userId: true, status: true },
    });

    // 4. Check if draft exists
    if (!draft) {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Draft not found' },
        { status: 404 }
      );
    }

    // 5. Ownership validation (prevent IDOR)
    if (draft.userId !== userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', detail: 'You do not have permission to delete this draft' },
        { status: 403 }
      );
    }

    // 6. Soft-delete draft (set status = 'deleted')
    await prisma.draft.update({
      where: { id: draftId },
      data: { status: 'deleted' },
    });
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 157-161

**Race condition (TOCTOU): read-then-update without atomic guard.** The status check and the update are not atomic: the draft's status could change between the `findUnique` query and the `update` call (e.g., a concurrent request submits the draft). Consider using a conditional update to make this atomic: `where: { id: draftId, status: 'draft' }`. Then check the result count to determine if the update succeeded.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // 6. Soft-delete draft atomically (only if still in 'draft' status)
    const result = await prisma.draft.updateMany({
      where: { id: draftId, status: 'draft' },
      data: { status: 'deleted' },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'CONFLICT', detail: 'Draft status has changed; cannot delete' },
        { status: 409 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // 6. Soft-delete draft (set status = 'deleted')
    await prisma.draft.update({
      where: { id: draftId },
      data: { status: 'deleted' },
    });
```
</details>

---

**🔧 Maintainability** · lines 70-76

**Misleading HTTP status code for non-draft status.** Returning 404 when the draft exists but has a different status (e.g., 'submitted', 'deleted') is semantically incorrect. The resource does exist — it's just in a non-retrievable state. This can confuse API consumers and hide legitimate state transitions. Consider returning 410 Gone (if deleted) or 409 Conflict (if submitted/processed) with a more descriptive error message.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // 6. Check draft status (only load 'draft' status)
    if (draft.status !== 'draft') {
      const statusCode = draft.status === 'deleted' ? 410 : 409;
      return NextResponse.json(
        { error: 'STATE_CONFLICT', detail: `Draft is in '${draft.status}' status and cannot be loaded` },
        { status: statusCode }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // 6. Check draft status (only load 'draft' status)
    if (draft.status !== 'draft') {
      return NextResponse.json(
        { error: 'NOT_FOUND', detail: 'Draft not found or has been deleted' },
        { status: 404 }
      );
    }
```
</details>

---

**🔧 Maintainability** · lines 91-106

**Fragile error discrimination via string matching.** Checking `message === 'UNAUTHENTICATED'` couples the error handler to the exact error message string thrown by `requireAppSession`. If the message changes (e.g., to 'Unauthenticated' or 'UNAUTHORIZED'), the 401 handling silently breaks and falls through to a generic 500. Consider using a custom error class (e.g., `class AuthenticationError extends Error`) and checking with `instanceof` instead. This pattern is duplicated in both GET and DELETE handlers.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', detail: 'Please login to continue' },
        { status: 401 }
      );
    }

    console.error('Draft load failed:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Failed to load draft' },
      { status: 500 }
    );
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', detail: 'Please login to continue' },
        { status: 401 }
      );
    }

    console.error('Draft load failed:', message);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Failed to load draft' },
      { status: 500 }
    );
  }
```
</details>


