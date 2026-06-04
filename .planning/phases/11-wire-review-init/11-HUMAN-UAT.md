---
status: partial
phase: 11-wire-review-init
source: [11-VERIFICATION.md]
started: '2026-06-04T15:15:00Z'
updated: '2026-06-04T15:15:00Z'
---

## Current Test

[awaiting human testing]

## Tests

### 1. Visual: "Bat dau duyet" button appearance
expected: Reviewer opens detail page for a document version with no review. Sees "Bat dau duyet" button inside a Card with instruction text. Old dead-end Card not shown.
result: [pending]

### 2. Flow: StartReview -> ReviewForm transition
expected: Clicking "Bat dau duyet" creates a Review record. Page re-renders split-view: document content left, QC-LEG-01 checklist right.
result: [pending]

### 3. Error handling display
expected: On invalid document version status, red Vietnamese error message appears below the button.
result: [pending]

### 4. Audit event verification
expected: review.started event appears in /admin/audit with docVersionId, reviewId, reviewerId metadata.
result: [pending]

### 5. End-to-end flow: startReview -> approve/reject
expected: After starting review, approve sets DocumentVersion to final and request to approved. Reject returns to draft with revision_required.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
