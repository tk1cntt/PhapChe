# Review: `src/app/api/intake/create-draft/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟠 High (1)

**🐛 Bug** · lines 10-20

**Missing input validation**: `title` and `answers` are destructured directly from the request body and passed to the database without any validation or sanitization.

- `title`: No length check, no type enforcement (could be a number, array, or extremely long string). The schema field is `String` which could reject non-string values at the Prisma level, but the error would be cryptic.
- `answers`: No structural validation. The Prisma schema expects `Json`, but if the client sends a non-object (e.g., a plain string), it will be stored as-is, potentially corrupting downstream consumers that expect an object shape.

**Suggestion**: Add validation for both fields — e.g., ensure `title` is a non-empty string with a reasonable max length, and ensure `answers` is a plain object (or at least not a primitive).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { matterTypeKey, title, answers } = body;

    const workspaceId = session.activeWorkspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WORKSPACE_REQUIRED', detail: 'No active workspace' },
        { status: 400 }
      );
    }

    // Validate title
    if (typeof title !== 'string' || title.trim().length === 0 || title.length > 500) {
      return NextResponse.json(
        { error: 'INVALID_TITLE', detail: 'Title must be a non-empty string up to 500 characters' },
        { status: 400 }
      );
    }

    // Validate answers
    if (answers !== undefined && (typeof answers !== 'object' || answers === null || Array.isArray(answers))) {
      return NextResponse.json(
        { error: 'INVALID_ANSWERS', detail: 'Answers must be a JSON object' },
        { status: 400 }
      );
    }

    const resolvedMatterType = matterTypeKey || 'general';
    const resolvedAnswers = answers || {};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { matterTypeKey, title, answers } = body;

    const workspaceId = session.activeWorkspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'WORKSPACE_REQUIRED', detail: 'No active workspace' },
        { status: 400 }
      );
    }
    const resolvedMatterType = matterTypeKey || 'general';
    const resolvedAnswers = answers || {};
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 96-100

**Error handling contradicts the comment**: The comment on line 85 says "Return actual error for debugging", but the code returns a hardcoded generic message `'DRAFT_CREATION_FAILED'`. The actual error is only logged to `console.error` and never reaches the client.

This means:
- The client cannot distinguish between different failure causes (e.g., Prisma unique constraint violation, network error, schema mismatch).
- Debugging in production requires log access, which may not be readily available.

**Suggestion**: Either update the comment to match the behavior (i.e., acknowledge that errors are intentionally hidden), or include a sanitized error detail in the response for non-production environments.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Return sanitized error to avoid leaking internal details in production
    const detail = process.env.NODE_ENV === 'development' ? message : 'Failed to create draft';
    return NextResponse.json(
      { error: 'DRAFT_CREATION_FAILED', detail },
      { status: 500 }
    );
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Return actual error for debugging
    return NextResponse.json(
      { error: 'DRAFT_CREATION_FAILED', detail: 'Failed to create draft' },
      { status: 500 }
    );
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 44-53

**Implicit reliance on SQL NULL ordering for `orderBy`**: The `findFirst` query uses `orderBy: { workspaceId: 'desc' }` to prefer workspace-specific `MatterType` records (non-null `workspaceId`) over global ones (null `workspaceId`).

This relies on SQL engines treating NULL as the lowest value in descending order, which is not guaranteed across all database providers. While SQLite does follow this convention, PostgreSQL's default behavior is `NULLS LAST` for ascending and `NULLS FIRST` for descending — which would invert the intended preference.

**Suggestion**: Use a more explicit approach, such as fetching both and preferring the workspace-specific one in application code, or using `orderBy: [{ workspaceId: { sort: 'asc', nulls: 'last' } }]` if your Prisma version supports it. Alternatively, add a comment acknowledging this behavior depends on SQLite's NULL ordering.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Fetch both workspace-specific and global, prefer workspace-specific
      const matterType = await prisma.matterType.findFirst({
        where: { key: resolvedMatterType, workspaceId },
      }) ?? await prisma.matterType.findFirst({
        where: { key: resolvedMatterType, workspaceId: null },
      });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const matterType = await prisma.matterType.findFirst({
        where: {
          key: resolvedMatterType,
          OR: [
            { workspaceId },
            { workspaceId: null }, // Global matter types
          ],
        },
        orderBy: { workspaceId: 'desc' }, // Prefer workspace-specific over global
      });
```
</details>


