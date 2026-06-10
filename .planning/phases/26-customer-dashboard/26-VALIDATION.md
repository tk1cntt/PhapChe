---
phase: 26
slug: customer-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-10
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright |
| **Config file** | playwright.config.ts |
| **Quick run command** | `npx playwright test tests/customer-dashboard.spec.ts --grep "stat"` |
| **Full suite command** | `npx playwright test tests/customer-dashboard.spec.ts` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick grep command for affected component
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | CUST-DASH-01 | T-26-01 | Workspace filter on stats | e2e | `npx playwright test -g "stat cards"` | ❌ W0 | ⬜ pending |
| 26-01-02 | 01 | 1 | CUST-DASH-02 | — | N/A | e2e | `npx playwright test -g "welcome"` | ❌ W0 | ⬜ pending |
| 26-01-03 | 01 | 1 | CUST-DASH-03 | T-26-01 | Workspace filter on case list | e2e | `npx playwright test -g "case list"` | ❌ W0 | ⬜ pending |
| 26-01-04 | 01 | 1 | CUST-DASH-04 | — | N/A | e2e | `npx playwright test -g "deadline"` | ❌ W0 | ⬜ pending |
| 26-01-05 | 01 | 1 | CUST-DASH-05 | T-26-01 | Workspace filter on vault files | e2e | `npx playwright test -g "documents"` | ❌ W0 | ⬜ pending |
| 26-01-06 | 01 | 1 | CUST-DASH-06 | T-26-01 | Workspace filter on audit events | e2e | `npx playwright test -g "activity"` | ❌ W0 | ⬜ pending |
| 26-01-07 | 01 | 1 | CUST-DASH-07 | T-26-01 | Workspace filter on requests | e2e | `npx playwright test -g "requests table"` | ❌ W0 | ⬜ pending |
| 26-01-08 | 01 | 1 | CUST-DASH-08 | T-26-01 | Prisma seed data alignment | e2e | `npx playwright test -g "sample rows"` | ❌ W0 | ⬜ pending |
| 26-01-09 | 01 | 1 | CUST-DASH-09 | T-26-02 | Search input sanitization | e2e | `npx playwright test -g "search"` | ❌ W0 | ⬜ pending |
| 26-01-10 | 01 | 1 | CUST-DASH-10 | — | N/A | e2e | `npx playwright test -g "floating chat"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/customer-dashboard.spec.ts` — E2E tests for all 10 requirements
- [ ] `tests/unit/StatCard.test.tsx` — Unit tests for StatCard component
- [ ] `tests/unit/WelcomeCard.test.tsx` — Unit tests for WelcomeCard
- [ ] `tests/unit/CaseListPanel.test.tsx` — Unit tests for CaseListPanel
- [ ] `tests/unit/DeadlinePanel.test.tsx` — Unit tests for DeadlinePanel
- [ ] `tests/unit/DocumentPanel.test.tsx` — Unit tests for DocumentPanel
- [ ] `tests/unit/ActivityTimeline.test.tsx` — Unit tests for ActivityTimeline
- [ ] `tests/unit/RequestsTable.test.tsx` — Unit tests for RequestsTable
- [ ] `tests/unit/FloatingChatButton.test.tsx` — Unit tests for FloatingChatButton
- [ ] `tests/integration/dashboard-stats.test.ts` — API integration tests
- [ ] `tests/integration/requests.test.ts` — Requests API tests
- [ ] `tests/integration/audit-events.test.ts` — Audit events API tests
- [ ] `tests/abnormal/empty-workspace.spec.ts` — Edge case: empty workspace state
- [ ] `tests/abnormal/no-requests.spec.ts` — Edge case: no requests state
- [ ] `tests/abnormal/no-activity.spec.ts` — Edge case: no activity state
- [ ] `tests/error/error-boundary.spec.ts` — Error boundary fallback UI
- [ ] `tests/error/loading-skeleton.spec.ts` — Loading skeleton visibility
- [ ] `prisma/seed-customer-dashboard.ts` — Phase 26 seed data matching template values

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Exact visual match to template CSS | CUST-DASH-01-10 | Pixel-perfect rendering verification | Open browser DevTools, compare CSS computed styles |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## Security Test Coverage

### Threat: IDOR on requests (T-26-01)
**Mitigation:** Workspace-scoped Prisma queries on all endpoints
**Test:** `tests/integration/workspace-isolation.spec.ts`
- Verify user A cannot see user B's requests
- Verify stat counts scoped to workspace

### Threat: Search injection (T-26-02)
**Mitigation:** Sanitize search input before Prisma query
**Test:** `tests/security/search-sanitization.spec.ts`
- Verify SQL injection attempts blocked
- Verify XSS in search input escaped

---

## Abnormal & Error Test Cases

### Abnormal: Empty Workspace
```
Given a new workspace with no data
When user navigates to /dashboard
Then show "Chua co yeu cau phap ly" empty state
And stats show 0 for all values
```

### Abnormal: No Activity
```
Given a workspace with requests but no audit events
When user navigates to /dashboard
Then show "Chua co hoat dong" empty timeline
```

### Error: Database connection failure
```
Given Prisma cannot connect to SQLite
When user navigates to /dashboard
Then show ErrorFallback component
And show "Da xay ra loi" message
And show "Thu lai" retry button
```

### Error: Long loading state
```
Given dashboard is fetching data
Then show PageSkeleton for entire page
And show CardSkeleton for stat cards
```
