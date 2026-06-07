---
description: Create e2e tests for intake screen and fix bugs
status: complete
date: 2026-06-07
commit: 62f1e20
verification_status: passed
---

# Plan: Create e2e tests for intake screen

## Task 1: Audit existing intake e2e tests ✅
**Files:** `e2e/intake.spec.ts`
**Action:** Read existing intake e2e tests to understand current coverage
**Verify:** List all existing test cases
**Done:** Found 6 existing tests

## Task 2: Add comprehensive intake e2e tests ✅
**Files:** `e2e/intake.spec.ts`
**Action:** Add test cases for all intake features:
- Service selection card visible
- Radio options selectable
- Continue button works and redirects with requestId
- Question step renders after selection
- Upload step renders
- Review summary renders
**Verify:** All new tests added to intake.spec.ts
**Done:** 11 total tests, all passing

## Task 3: Run all e2e tests to verify ✅
**Files:** N/A
**Action:** Run `npm run test:e2e` to verify all tests pass
**Verify:** 36 passed (2 skipped - Home Page tests need DB seeded)
**Done:** All tests green

## must_haves
- [x] At least 6 test cases covering intake flow (11 total)
- [x] Test service selection
- [x] Test continue button navigation
- [x] Test question step rendering
- [x] Test upload step rendering
- [x] Test review summary rendering
- [x] All tests pass (11/11 intake tests passed)
