---
phase: "18"
plan: "02"
subsystem: e2e
tags: [playwright, specialist, reviewer, queue]
dependency_graph:
  requires: []
  provides: []
  affects: []
tech_stack:
  added: [playwright]
  patterns: []
key_files:
  created:
    - path: e2e/specialist.spec.ts
      provides: Playwright tests for specialist queue
    - path: e2e/reviewer.spec.ts
      provides: Playwright tests for reviewer queue
    - path: e2e/helpers.ts
      provides: Shared login helper for E2E tests
decisions: []
metrics:
  duration: null
  completed: "2026-06-07"
---

# Phase 18 Plan 02: Specialist and Reviewer Queue E2E Tests Summary

## One-liner

Playwright E2E tests for specialist and reviewer queue screens with 15 passing tests.

## Completed Tasks

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 18-02-01 | Create specialist queue tests | Complete | c4fb7ec |
| 18-02-02 | Create reviewer queue tests | Complete | c4fb7ec |
| 18-02-03 | Run specialist and reviewer tests | Complete | c4fb7ec |

## Test Coverage

### Specialist Queue (e2e/specialist.spec.ts)
- **renders specialist queue page**: Verifies page loads with "Yêu cầu được giao" title
- **shows queue list or empty state**: Verifies table or empty state is displayed
- **displays request items with correct columns**: Verifies column headers (Yêu cầu, Khách hàng, Trạng thái, Ngày gửi)
- **can click on request item to open detail**: Verifies navigation to detail page works
- **shows triage status for requests**: Verifies status tags are displayed
- **shows assigned requests filtered by specialist**: Verifies no errors on page
- **page loads with proper styling**: Verifies card layout is present

### Reviewer Queue (e2e/reviewer.spec.ts)
- **renders reviewer queue page**: Verifies page loads with "Hàng chờ duyet" title
- **shows queue list or empty state**: Verifies table or empty state is displayed
- **displays request items with correct columns**: Verifies column headers (Yêu cầu, Loại vụ việc, Chuyên viên, Phiên bản, Gửi lúc)
- **can click on request to open review form**: Verifies navigation to review page works
- **shows document versions**: Verifies version column (v1, v2, v3) or empty state
- **shows specialist name for each request**: Verifies specialist column header
- **page loads with proper styling**: Verifies card layout is present
- **handles notice query param**: Verifies ?notice=approved shows approval notice

## Test Results

```
Running 15 tests using 4 workers

  ok  1 [chromium] › e2e\reviewer.spec.ts:9:7 › Reviewer Queue › renders reviewer queue page (6.8s)
  ok  2 [chromium] › e2e\reviewer.spec.ts:22:7 › Reviewer Queue › shows queue list or empty state (7.2s)
  ok  3 [chromium] › e2e\reviewer.spec.ts:37:7 › Reviewer Queue › displays request items with correct columns (7.0s)
  ok  4 [chromium] › e2e\reviewer.spec.ts:55:7 › Reviewer Queue › can click on request to open review form (7.2s)
  ok  5 [chromium] › e2e\reviewer.spec.ts:79:7 › Reviewer Queue › shows document versions (5.5s)
  ok  6 [chromium] › e2e\reviewer.spec.ts:95:7 › Reviewer Queue › shows specialist name for each request (5.9s)
  ok  7 [chromium] › e2e\reviewer.spec.ts:109:7 › Reviewer Queue › page loads with proper styling (6.3s)
  ok  8 [chromium] › e2e\reviewer.spec.ts:123:7 › Reviewer Queue › handles notice query param (5.2s)
  ok  9 [chromium] › e2e\specialist.spec.ts:9:7 › Specialist Queue › renders specialist queue page (5.4s)
  ok 10 [chromium] › e2e\specialist.spec.ts:23:7 › Specialist Queue › shows queue list or empty state (5.6s)
  ok 11 [chromium] › e2e\specialist.spec.ts:38:7 › Specialist Queue › displays request items with correct columns (5.5s)
  ok 12 [chromium] › e2e\specialist.spec.ts:55:7 › Specialist Queue › can click on request item to open detail (8.0s)
  ok 13 [chromium] › e2e\specialist.spec.ts:89:7 › Specialist Queue › shows triage status for requests (5.4s)
  ok 14 [chromium] › e2e\specialist.spec.ts:103:7 › Specialist Queue › shows assigned requests filtered by specialist (5.4s)
  ok 15 [chromium] › e2e\specialist.spec.ts:112:7 › Specialist Queue › page loads with proper styling (6.3s)

  15 passed (26.2s)
```

## Deviations from Plan

None - plan executed exactly as written.

## Files Created

| File | Lines | Description |
|------|-------|-------------|
| e2e/helpers.ts | 68 | Login helper with demo credentials |
| e2e/specialist.spec.ts | 127 | 7 specialist queue tests |
| e2e/reviewer.spec.ts | 131 | 8 reviewer queue tests |

## Auth Notes

The tests use demo credentials from the seed data:
- specialist.demo@example.test / Demo@123456
- reviewer.demo@example.test / Demo@123456

The login helper clears cookies, fills credentials explicitly (not relying on pre-fill), and clicks the submit button for reliable authentication.
