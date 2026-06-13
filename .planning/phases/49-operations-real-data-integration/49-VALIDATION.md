---
phase: 49
slug: operations-real-data-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 49 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest for React/component tests; Node/Vitest service tests; Playwright for E2E |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` if present, package scripts |
| **Quick run command** | `npx vitest run tests/admin-operations src/lib/ops/ops-service.test.ts` |
| **Full suite command** | `npm run typecheck && npx vitest run --coverage && npm run test:e2e -- operations` |
| **Estimated runtime** | ~120-300 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/admin-operations src/lib/ops/ops-service.test.ts`
- **After every plan wave:** Run `npm run typecheck && npx vitest run --coverage && npm run test:e2e -- operations`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 300 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 49-01-01 | 01 | 1 | ADMIN-OPS-REAL-01..04 | T-49-01 | DB-seeded Operations data is exposed only through authorized admin service/API | blackbox + error | `npx vitest run src/lib/ops/ops-service.test.ts` | ❌ W0 | ⬜ pending |
| 49-01-02 | 01 | 1 | ADMIN-OPS-REAL-01..04 | T-49-02 | `/api/admin/operations` rejects non-admins and returns scoped aggregate data | blackbox + error | `npx vitest run tests/admin-operations/admin-operations-api.spec.ts` | ❌ W0 | ⬜ pending |
| 49-01-03 | 01 | 1 | ADMIN-OPS-REAL-01..04 | — | Components render stats/workload/timeline/table and fallback/empty/error states from props | whitebox + abnormal + error | `npx vitest run tests/admin-operations` | ❌ W0 | ⬜ pending |
| 49-01-04 | 01 | 1 | ADMIN-OPS-REAL-01..04 | T-49-03 | E2E verifies DB→API→UI, filters, and SLA colors/fallback under admin login | e2e | `npm run test:e2e -- operations` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/ops/ops-service.test.ts` — DB-backed service tests for stats, workload, global timeline, filters, SLA derivation, forbidden/non-admin behavior.
- [ ] `tests/admin-operations/admin-operations-api.spec.ts` — API route success/forbidden/error behavior if route test harness is available.
- [ ] `tests/admin-operations/admin-operations.spec.tsx` — whitebox component tests for client/children render states.
- [ ] `tests/admin-operations/admin-operations-table.spec.tsx` — abnormal/error/fallback tests for SLA levels and empty data.
- [ ] `tests/e2e/admin-operations.spec.ts` — E2E admin login, `/vi/admin/operations`, DB-backed stats/workload/timeline/table, filters, SLA colors/fallback.

---

## Manual-Only Verifications

All phase behaviors have automated verification. Visual parity should be checked through component/E2E assertions and optionally a human screenshot review, but it must not replace automated tests.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter after Wave 0 test files exist and pass

**Approval:** pending
