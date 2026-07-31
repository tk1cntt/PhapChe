# Review: `src/lib/reviews/review-service.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 9

---

## 🔴 Critical (2)

**🐛 Bug** · lines 194-210

Race condition: review status is checked outside the transaction (line 155) but never re-checked inside. Two concurrent approve/reject calls can both pass the `status !== 'in_progress'` guard, enter the transaction, and both execute the full update — resulting in double workflow transitions, overwritten status, and inconsistent state between the review record and the request.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');
  if (!review.documentVersionId) throw new Error('REVIEW_NOT_ACTIVE');

  // Validate that every required item is present and passed.
  const byItem = new Map(answers.map((a) => [a.checklistItemId, a]));
  for (const requiredId of REQUIRED_ITEM_IDS) {
    const a = byItem.get(requiredId);
    if (!a || a.passed !== true) {
      throw new Error('CHECKLIST_NOT_COMPLETE');
    }
  }

  const { passed, failed } = countAnswers(answers);
  const corr = correlationId ?? `review-approve-${reviewId}`;

  await prisma.$transaction(async (tx) => {
    // Re-check status inside transaction to prevent race conditions
    const currentReview = await tx.review.findUnique({
      where: { id: reviewId },
      select: { status: true },
    });
    if (!currentReview || currentReview.status !== 'in_progress') {
      throw new Error('REVIEW_NOT_ACTIVE');
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');
  if (!review.documentVersionId) throw new Error('REVIEW_NOT_ACTIVE');

  // Validate that every required item is present and passed.
  const byItem = new Map(answers.map((a) => [a.checklistItemId, a]));
  for (const requiredId of REQUIRED_ITEM_IDS) {
    const a = byItem.get(requiredId);
    if (!a || a.passed !== true) {
      throw new Error('CHECKLIST_NOT_COMPLETE');
    }
  }

  const { passed, failed } = countAnswers(answers);
  const corr = correlationId ?? `review-approve-${reviewId}`;

  await prisma.$transaction(async (tx) => {
```
</details>

---

**🐛 Bug** · lines 274-281

Race condition in rejectReview: same pattern as approveReview — status checked outside transaction (line 244) but not re-checked inside. Concurrent reject calls can both pass the guard and execute, causing double workflow transitions and inconsistent state.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');
  if (!review.documentVersionId) throw new Error('REVIEW_NOT_ACTIVE');

  const { passed, failed } = countAnswers(answers);
  const corr = correlationId ?? `review-reject-${reviewId}`;

  await prisma.$transaction(async (tx) => {
    // Re-check status inside transaction to prevent race conditions
    const currentReview = await tx.review.findUnique({
      where: { id: reviewId },
      select: { status: true },
    });
    if (!currentReview || currentReview.status !== 'in_progress') {
      throw new Error('REVIEW_NOT_ACTIVE');
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');
  if (!review.documentVersionId) throw new Error('REVIEW_NOT_ACTIVE');

  const { passed, failed } = countAnswers(answers);
  const corr = correlationId ?? `review-reject-${reviewId}`;

  await prisma.$transaction(async (tx) => {
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 98

Null pointer risk: `docVersion.document.request.assignedReviewerId` is accessed without checking if `request` is non-null. Since `include` is used, the `request` relation could be null if the document has no associated request, which would cause a TypeError at runtime.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const request = docVersion.document.request;
  if (!request) throw new Error('REQUEST_NOT_FOUND');
  const isAssignedReviewer = request.assignedReviewerId === session.userId;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const isAssignedReviewer = docVersion.document.request.assignedReviewerId === session.userId;
```
</details>

---

**🐛 Bug** · lines 253-262

Non-atomic workflow transition: `transitionRequestStatus` is called outside the `$transaction`, so if it fails, the review and document version updates are already committed. This creates a data inconsistency: the review is approved/rejected in the database, but the request status is never updated. The same issue exists in both `approveReview` (line 242) and `rejectReview` (line 284).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Workflow transition also runs inside the transaction.
  // If transitionRequestStatus cannot be passed a tx, consider using
  // a compensating action or saga pattern to handle partial failures.
  await transitionRequestStatus({
    requestId: review.requestId,
    actorId: session.userId,
    toStatus: 'approved',
    reason: 'Reviewer duyệt tài liệu',
    correlationId: corr,
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Workflow transition runs outside the $transaction (matches the
  // submitForReview pattern in draft-service.ts). transitionRequestStatus
  // has its own transaction + audit write.
  await transitionRequestStatus({
    requestId: review.requestId,
    actorId: session.userId,
    toStatus: 'approved',
    reason: 'Reviewer duyệt tài liệu',
    correlationId: corr,
  });
```
</details>


## 🟡 Medium (4)

**🔧 Maintainability** · lines 155-169

Duplicate code: the same checklist answer upsert loop is repeated verbatim in `answerChecklistItem` (lines 131-146), `approveReview` (lines 167-179), and `rejectReview` (lines 214-226). Extract into a shared helper function to reduce risk of inconsistencies and improve maintainability.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    await upsertChecklistAnswers(tx, reviewId, answers);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    for (const answer of answers) {
      await tx.reviewChecklistAnswer.upsert({
        where: { reviewId_checklistItemId: { reviewId, checklistItemId: answer.checklistItemId } },
        create: {
          reviewId,
          checklistItemId: answer.checklistItemId,
          passed: answer.passed,
          comment: answer.comment ?? null,
        },
        update: {
          passed: answer.passed,
          comment: answer.comment ?? null,
        },
      });
    }
```
</details>

---

**🐛 Bug** · lines 148-154

Race condition in `answerChecklistItem`: the review status is checked outside the transaction (line 118) but not re-checked inside. A concurrent approve/reject could change the status to non-'in_progress' between the check and the transaction execution, allowing answers to be written to an already-completed review.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');

  // Secondary guard: only the request's reviewer (or admin) can answer.
  if (!(await canAccessRequest(session, review.requestId))) throw new Error('FORBIDDEN');

  await prisma.$transaction(async (tx) => {
    // Re-check status inside transaction to prevent race conditions
    const currentReview = await tx.review.findUnique({
      where: { id: reviewId },
      select: { status: true },
    });
    if (!currentReview || currentReview.status !== 'in_progress') {
      throw new Error('REVIEW_NOT_ACTIVE');
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');

  // Secondary guard: only the request's reviewer (or admin) can answer.
  if (!(await canAccessRequest(session, review.requestId))) throw new Error('FORBIDDEN');

  await prisma.$transaction(async (tx) => {
```
</details>

---

**🐛 Bug** · lines 105-111

Idempotency gap in `startReview`: using `findFirst` + `create` within a transaction does not guarantee idempotency under concurrent calls. Two concurrent transactions can both read `existing = null` and both attempt `create`; the second will hit the unique constraint on `(documentVersionId, reviewerId)` and throw a raw database error instead of returning the existing review gracefully. Use `findFirst` + `create` with an `onConflict`/`ON CONFLICT DO NOTHING` pattern or catch the unique constraint error and retry the `findFirst`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Use upsert with a unique constraint to ensure true idempotency
    const review = await tx.review.upsert({
      where: {
        documentVersionId_reviewerId: {
          documentVersionId,
          reviewerId: session.userId,
        },
      },
      create: {
        workspaceId: docVersion.document.workspaceId,
        requestId: docVersion.document.requestId,
        documentId: docVersion.document.id,
        reviewerId: session.userId,
        documentVersionId,
        status: 'in_progress',
      },
      update: {},
      select: { id: true, status: true },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const existing = await tx.review.findFirst({
      where: { documentVersionId, reviewerId: session.userId },
      select: { id: true, status: true },
    });
    if (existing) return existing;

    const review = await tx.review.create({
```
</details>

---

**🐛 Bug** · lines 54-55

Null pointer risk in `loadReviewForActor`: `review.request.assignedReviewerId` (line 67) is accessed without verifying `review.request` is non-null. If the associated request was deleted or the relation is missing, this will throw a TypeError. Same issue in `startReview` with `docVersion.document.request` (line 87).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (!review.request) throw new Error('REQUEST_NOT_FOUND');
  const isAssignedReviewer =
    review.reviewerId === session.userId && review.request.assignedReviewerId === session.userId;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const isAssignedReviewer =
    review.reviewerId === session.userId && review.request.assignedReviewerId === session.userId;
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 260

Hardcoded business strings: `'Reviewer duyệt tài liệu'` (line 246) and `'Reviewer yêu cầu chỉnh sửa'` (line 288) are Vietnamese reason strings hardcoded into the workflow transition calls. Consider extracting these into a constants or i18n file to avoid duplication and make localization easier.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    reason: REVIEW_REJECT_REASON,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    reason: 'Reviewer duyệt tài liệu',
```
</details>


