# Review: `src/app/api/admin/requests/[id]/files/annotations/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🔴 Critical (2)

**🐛 Bug** · lines 45-49

Null pointer risk: `a.author.name` will throw a runtime TypeError if the `author` relation is null/undefined (e.g., if the author record was deleted). The `include` clause does not guarantee the relation exists. Add a null check or fallback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const mapped = annotations.map((a) => ({
      id: a.id,
      fileKey: a.fileKey,
      authorId: a.authorId,
      authorName: a.author?.name ?? 'Unknown',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const mapped = annotations.map((a) => ({
      id: a.id,
      fileKey: a.fileKey,
      authorId: a.authorId,
      authorName: a.author.name,
```
</details>

---

**🐛 Bug** · line 137

Null pointer risk in POST response: same issue as GET — `annotation.author.name` will throw if the author relation is not populated or null.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        authorName: annotation.author?.name ?? 'Unknown',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        authorName: annotation.author.name,
```
</details>


## 🟠 High (1)

**🔒 Security** · line 24

Unsafe type assertion `(session.roles as string[])` bypasses TypeScript checks. If `session.roles` is null/undefined/not an array at runtime, calling `.includes()` will throw a TypeError, potentially crashing the request. Use a runtime guard (e.g., `Array.isArray`) before calling `.includes`, or provide a safe default.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const roles: string[] = Array.isArray(session.roles) ? session.roles : [];
    const hasRole = ALLOWED_ROLES.some((r) => roles.includes(r));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 113-130

The `documentReviewStatus.upsert` unconditionally sets `status: 'has_issues'` in both `create` and `update`. If a file was previously marked as `'approved'`, creating a new annotation will silently demote it to `'has_issues'`. Consider whether the update should be conditional (e.g., only update if current status is not 'approved') or use a different status transition strategy.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    await prisma.documentReviewStatus.upsert({
      where: {
        requestId_fileKey_reviewerId: {
          requestId,
          fileKey,
          reviewerId: session.userId,
        },
      },
      create: {
        requestId,
        fileKey,
        reviewerId: session.userId,
        status: 'has_issues',
      },
      update: {
        status: 'has_issues',
      },
    });
    // NOTE: Consider whether 'approved' status should be preserved when adding new annotations.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    await prisma.documentReviewStatus.upsert({
      where: {
        requestId_fileKey_reviewerId: {
          requestId,
          fileKey,
          reviewerId: session.userId,
        },
      },
      create: {
        requestId,
        fileKey,
        reviewerId: session.userId,
        status: 'has_issues',
      },
      update: {
        status: 'has_issues',
      },
    });
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 66

The error response `detail: 'Internal server error'` is hardcoded and does not reflect the actual error message captured in `msg`. This makes debugging harder for developers. In production, consider logging the real error and returning a generic message; but the `detail` field could safely include the real message for authenticated admin users, or be removed to avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return NextResponse.json({ error: 'Internal server error', detail: 'Internal server error' }, { status: 500 });
```
</details>


