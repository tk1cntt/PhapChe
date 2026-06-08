---
phase: 19
slug: customer-dashboard
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-08
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright E2E + Next.js/TypeScript project checks |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test e2e/customer-dashboard.spec.ts` |
| **Full suite command** | `npx playwright test e2e/customer-dashboard.spec.ts e2e/request-status.spec.ts e2e/intake-flow.spec.ts` |
| **Estimated runtime** | ~60-180 seconds depending on dev server/startup |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test e2e/customer-dashboard.spec.ts`
- **After every plan wave:** Run `npx playwright test e2e/customer-dashboard.spec.ts e2e/request-status.spec.ts e2e/intake-flow.spec.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | D-01..D-17 | T-19-01/T-19-02/T-19-04/T-19-05 | Dashboard query is server-side and scoped by `workspaceId` + `createdById`; UI exposes only customer-safe fields | static + e2e | `npx playwright test e2e/customer-dashboard.spec.ts` | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | D-08..D-11 | T-19-03 | Status CTA works for every request; delivery CTA appears only for `delivered`/`closed`; status page links back to dashboard | e2e | `npx playwright test e2e/customer-dashboard.spec.ts e2e/request-status.spec.ts` | ❌ W0 | ⬜ pending |
| 19-01-03 | 01 | 1 | D-18..D-20 | T-19-01/T-19-03 | E2E proves intake-created customer request is visible and non-delivered request has no final-document action | e2e | `npx playwright test e2e/customer-dashboard.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/customer-dashboard.spec.ts` — Playwright testcase for `/customer/requests` dashboard and navigation.
- [ ] Existing `e2e/helpers.ts` login helper remains usable.

---

## Manual-Only Verifications

All phase behaviors have automated verification. Manual review may still inspect screenshots if Playwright captures route rendering failures.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
