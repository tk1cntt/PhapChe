---
phase: 11-wire-review-init
reviewed: 2026-06-04T18:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts
  - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/start-review-button.tsx
  - src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-06-04T18:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed three files implementing the reviewer document review page: server actions (`actions.ts`), the client component to start a review (`start-review-button.tsx`), and the main page (`page.tsx`). The overall code is well-structured with proper RBAC checks, session validation, and IDOR protection. One warning was found regarding missing input validation for `revalidatePath` dependencies in approve/reject actions, and three informational items related to unused Prisma selections, fragile error-code matching, and inconsistent Vietnamese diacritics in user-facing messages.

## Warnings

### WR-01: Missing validation of requestId/documentVersionId in approveReviewAction and rejectReviewAction

**File:** `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts:66-67` (and similarly at lines 87-88)

**Issue:** In `approveReviewAction` and `rejectReviewAction`, the `requestId` and `documentVersionId` values are read from `formData` solely for use in `revalidatePath`, without any validation that they exist. `stringValue()` returns an empty string when the key is absent from form data, producing a malformed revalidation path like `/reviewer/requests//review/`. This means the review page cache is not properly invalidated if the calling form does not include these hidden fields.

The `startReviewAction` function (lines 96-111) correctly extracts and validates both values upfront, but `approveReviewAction` and `rejectReviewAction` do not follow the same pattern. This inconsistency risks silent cache staleness when a reviewer approves or rejects.

**Fix:** Extract and validate `requestId` and `documentVersionId` at the top of both functions (matching the `startReviewAction` pattern), then use the validated local variables in `revalidatePath`. For example:

```typescript
export async function approveReviewAction(formData: FormData): Promise<ReviewerActionResult> {
  const reviewId = stringValue(formData, 'reviewId');
  const requestId = stringValue(formData, 'requestId');
  const documentVersionId = stringValue(formData, 'documentVersionId');
  if (!reviewId) return { ok: false, message: 'Thiếu mã phiên duyệt.' };
  if (!requestId) return { ok: false, message: 'Thiếu mã yêu cầu.' };
  if (!documentVersionId) return { ok: false, message: 'Thiếu mã phiên bản tài liệu.' };
  const answers = parseAnswers(formData);
  const session = await requireAppSession();
  try {
    await approveReview({ session, reviewId, answers });
    revalidatePath('/reviewer/requests');
    revalidatePath(`/reviewer/requests/${requestId}/review/${documentVersionId}`);
  } catch (err) {
    return mapReviewError(err);
  }
  redirect('/reviewer/requests?notice=approved');
}
```

Apply the same pattern to `rejectReviewAction`.

## Info

### IN-01: Unused Prisma selections in page.tsx

**File:** `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx:24-25,30`

**Issue:** The Prisma query selects `templateId` (line 24), `templateVersion` (line 25), and `document.id` (line 30) but none of these fields are referenced anywhere in the component or passed to child components. They add unnecessary data transfer and should be removed unless they will be used in a future change.

**Fix:** Remove unused selections from the Prisma query:

```typescript
const docVersion = await prisma.documentVersion.findUnique({
  where: { id: documentVersionId },
  select: {
    id: true,
    // documentId: true,           -- keep only if needed
    // templateId: true,           -- REMOVE if unused
    // templateVersion: true,      -- REMOVE if unused
    status: true,
    generatedContent: true,
    createdAt: true,
    document: {
      select: {
        // id: true,               -- REMOVE if unused
        requestId: true,
        request: {
          select: {
            id: true,
            title: true,
            status: true,
            assignedReviewerId: true,
            assignedSpecialist: { select: { name: true, email: true } },
            intakeSubmission: { select: { matterTypeKey: true } },
          },
        },
      },
    },
  },
});
```

### IN-02: Fragile error code matching via err.message string

**File:** `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts:33`

**Issue:** The `mapReviewError` function (line 32-55) matches error codes by comparing against `err.message` directly: `const code = err instanceof Error ? err.message : 'UNKNOWN';`. This is fragile — if the service layer ever changes its error message format or throws a standard Error with a different message, the switch silently falls through to the generic default case. A dedicated error code property would be more maintainable.

**Fix:** Define a custom error class with a `code` property:

```typescript
class ReviewError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
    this.name = 'ReviewError';
  }
}
```

Then in `mapReviewError`:
```typescript
function mapReviewError(err: unknown): ReviewerActionResult {
  const code = err instanceof ReviewError ? err.code : 'UNKNOWN';
  // ... switch remains the same ...
}
```

This decouples the error code from the human-readable message, making the service layer free to change message wording without breaking the action layer.

### IN-03: Inconsistent Vietnamese diacritics in user-facing error messages

**File:** `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts:40,98,99`

**Issue:** Three user-facing error messages lack Vietnamese diacritics, while all other messages in the same file use correct diacritics:

- Line 40: `'Phien ban tai lieu khong o trang thai cho duyet.'` (should be: `'Phiên bản tài liệu không ở trạng thái chờ duyệt.'`)
- Line 98: `'Thieu ma phien ban tai lieu.'` (should be: `'Thiếu mã phiên bản tài liệu.'`)
- Line 99: `'Thieu ma yeu cau.'` (should be: `'Thiếu mã yêu cầu.'`)

This affects professionalism and readability for end users.

**Fix:** Add diacritics to match the convention used in the rest of the file:

```typescript
case 'INVALID_DOCUMENT_VERSION_STATUS':
  return { ok: false, message: 'Phiên bản tài liệu không ở trạng thái chờ duyệt.' };
// ...
if (!documentVersionId) return { ok: false, message: 'Thiếu mã phiên bản tài liệu.' };
if (!requestId) return { ok: false, message: 'Thiếu mã yêu cầu.' };
```

---

_Reviewed: 2026-06-04T18:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
