# Review: `src/app/api/admin/requests/[id]/files/review-status/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (3)

**🐛 Bug** · lines 10-12

Fragile redirect detection: checking `e.message === 'NEXT_REDIRECT'` depends on an internal Next.js implementation detail. If Next.js changes the error shape in a future version, redirect errors will be silently caught and returned as 500 responses, breaking navigation flows. Use the canonical `isRedirectError()` from `next/navigation` instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import { isRedirectError } from 'next/dist/client/components/redirect';

function isRedirectErr(e: unknown): boolean {
  return isRedirectError(e);
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

**🐛 Bug** · lines 31-34

Scope mismatch: the endpoint description says it returns review statuses of "tất cả files" (all files), but the query filters by `reviewerId: session.userId`, returning only the current user's own statuses. If the admin UI expects a complete review picture across all reviewers, this is a correctness bug. Either update the comment to reflect the actual behavior, or remove the `reviewerId` filter if the intent is truly all files.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Returns only the current reviewer's own statuses per file
    const statuses = await prisma.documentReviewStatus.findMany({
      where: { requestId, reviewerId: session.userId },
      select: { fileKey: true, status: true },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const statuses = await prisma.documentReviewStatus.findMany({
      where: { requestId, reviewerId: session.userId },
      select: { fileKey: true, status: true },
    });
```
</details>

---

**🐛 Bug** · lines 63-74

Missing request existence check: the PUT handler performs an upsert without verifying the requestId exists. If the request is deleted, orphaned `DocumentReviewStatus` records can be created. Add a lookup (e.g., `prisma.request.findUnique`) before the upsert and return a 404 if the request is not found. Additionally, no validation ensures `fileKey` actually belongs to this `requestId`, which could allow a user to create bogus review status entries for arbitrary keys.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { id: requestId } = await params;

    // Verify the request exists
    const requestExists = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true },
    });
    if (!requestExists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const body = await _request.json();
    const { fileKey, status } = body;

    if (!fileKey || !status) {
      return NextResponse.json({ error: 'VALIDATION: fileKey and status are required' }, { status: 400 });
    }
    if (!['pending', 'reviewed', 'has_issues'].includes(status)) {
      return NextResponse.json({ error: 'VALIDATION: status must be pending, reviewed, or has_issues' }, { status: 400 });
    }

    const reviewStatus = await prisma.documentReviewStatus.upsert({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { id: requestId } = await params;
    const body = await _request.json();
    const { fileKey, status } = body;

    if (!fileKey || !status) {
      return NextResponse.json({ error: 'VALIDATION: fileKey and status are required' }, { status: 400 });
    }
    if (!['pending', 'reviewed', 'has_issues'].includes(status)) {
      return NextResponse.json({ error: 'VALIDATION: status must be pending, reviewed, or has_issues' }, { status: 400 });
    }

    const reviewStatus = await prisma.documentReviewStatus.upsert({
```
</details>


