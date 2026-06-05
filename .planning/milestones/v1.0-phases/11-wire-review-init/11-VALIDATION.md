---
phase: 11
slug: wire-review-init
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-04
updated: 2026-06-04
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (Node.js built-in) |
| **Config file** | None — uses Node.js native `node:test` and `node:assert/strict` |
| **Quick run command** | `npx tsx --test src/lib/reviews/review-service.test.ts` |
| **Full suite command** | `npx tsx --test src/lib/reviews/review-service.test.ts` |
| **Estimated runtime** | ~17 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx --test src/lib/reviews/review-service.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-T1 | 01 | 1 | REV-02 | T-11-01, T-11-02, T-11-03, T-11-06 | `startReview` validates auth (requireAppSession), docVersion existence (Prisma lookup), docVersion status (must be submitted_for_review), RBAC (assignedReviewerId match or admin), audit event in transaction | integration | `npx tsx --test src/lib/reviews/review-service.test.ts` | ✅ | ✅ green |
| 11-01-T2 | 01 | 1 | REV-02 | T-11-04, T-11-05 | `startReviewAction` validates inputs (documentVersionId, requestId), maps service errors to Vietnamese messages, returns safe payload | integration | `npx tsx --test src/lib/reviews/review-service.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Detailed Test Coverage

### Gap 1 — `startReview` service function (5 tests)
| Test # | Name | Scenario | Verifies |
|--------|------|----------|----------|
| 7 | `startReview creates Review with in_progress status and emits review.started audit` | Happy path | Review created with correct workspaceId, requestId, documentId, reviewerId, documentVersionId, status=in_progress. Audit event review.started emitted with safe metadata (docVersionId, reviewId, reviewerId). |
| 8 | `startReview rejects DOCUMENT_VERSION_NOT_FOUND for non-existent documentVersionId` | Negative | Non-existent documentVersionId throws DOCUMENT_VERSION_NOT_FOUND |
| 9 | `startReview rejects INVALID_DOCUMENT_VERSION_STATUS when docVersion is not submitted_for_review` | Negative | DocumentVersion with status='draft' throws INVALID_DOCUMENT_VERSION_STATUS |
| 10 | `startReview rejects FORBIDDEN when caller is not the assigned reviewer` | Negative | Non-assigned user throws FORBIDDEN (T-11-06: Elevation mitigation) |
| 11 | `startReview returns existing review on second call (double-create guard)` | Edge case | Second call returns same reviewId, no duplicate Review record created (T-11-05: DoS acceptance) |

### Gap 2 — `startReviewAction` server action (4 tests)
| Test # | Name | Scenario | Verifies |
|--------|------|----------|----------|
| 12 | `startReviewAction calls startReview and creates review in database` | Happy path | Review record created in database (DB side-effect verification; Next.js redirect/revalidatePath not available in node:test runtime) |
| 13 | `startReviewAction returns Vietnamese error when documentVersionId is missing` | Validation | Returns `{ ok: false, message: 'Thieu ma phien ban tai lieu.' }` |
| 14 | `startReviewAction returns Vietnamese error when requestId is missing` | Validation | Returns `{ ok: false, message: 'Thieu ma yeu cau.' }` |
| 15 | `startReviewAction maps DOCUMENT_VERSION_NOT_FOUND to Vietnamese message` | Error mapping | Returns `{ ok: false, message: 'Không tìm thấy phiên bản tài liệu.' }` |

---

## Threat Coverage

| Threat ID | Category | Mitigation | Test Coverage |
|-----------|----------|------------|---------------|
| T-11-01 | Spoofing | `requireAppSession()` at actions.ts:101 | Test 12 (action executes within session context) |
| T-11-02 | Tampering | Prisma lookup + status check at review-service.ts:95-96 | Tests 8, 9 (non-existent ID, invalid status) |
| T-11-03 | Repudiation | `recordAuditEvent` inside `prisma.$transaction` at review-service.ts:123-135 | Test 7 (audit event verified) |
| T-11-04 | Info Disclosure | Returns only `{ reviewId, status }` | Test 7 (safe metadata only, no content leak) |
| T-11-05 | DoS | Single review guard at review-service.ts:105-108 | Test 11 (double-create returns existing review) |
| T-11-06 | Elevation | RBAC check at review-service.ts:98-100 | Test 10 (FORBIDDEN for non-assigned user) |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Bat dau duyet" button renders on reviewer detail page | REV-02 | Visual UI rendering — requires running browser | Open reviewer detail page for a docVersion without review → see button |
| Clicking button transitions to split-view ReviewForm | REV-02 | Dependent on auth session, Prisma, redirect | Click button → verify ReviewForm renders with document content left + QC checklist right |
| Error display in red for invalid status | REV-02 | Visual formatting — requires browser | Use docVersion not in submitted_for_review status → verify red error text appears |
| Audit event visible in /admin/audit | REV-02 | Requires running app and checking audit log | Start a review → check /admin/audit for review.started event |
| Full E2E: startReview → approve/reject | REV-06, REV-07, REV-08, REV-09 | End-to-end flow with running app | Complete review flow from start through approve or reject |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No Wave 0 setup needed.

- `node:test` (Node.js built-in) — no framework install required
- `npx tsx` — already configured for TypeScript execution
- Prisma e2e test pattern — existing `seedReviewTest`/`cleanupReviewTest`/`withReviewSeed` helpers

---

## Validation Sign-Off

- [x] All tasks have automated verify or manual-only classification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (single gap-closure plan)
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] All 9 new tests pass (15/15 total)
- [x] All 6 threats have test coverage

**Approval:** verified 2026-06-04
