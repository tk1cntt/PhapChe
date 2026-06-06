---
phase: 16
slug: fix-14-failed-routes-discovered-by-validated-screenshot-capt
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-06
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for fixing the 14 failed routes from quick task `260606-pfi`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright via `@playwright/test` / Node script |
| **Config file** | none — use existing package dependency and phase-specific script derived from quick validation harness |
| **Quick run command** | `node .planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs --quick` |
| **Full suite command** | `node .planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick validation command for the route group touched by that task.
- **After every plan wave:** Run the full phase route validation command.
- **Before `/gsd-verify-work`:** Full route validation must be green for all 14 original failed routes.
- **Max feedback latency:** 120 seconds for full route validation.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | Validation harness covers original fail list | — | Does not bypass auth; uses role-correct sessions | e2e/script | `node .planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs --quick` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | Specialist/reviewer queue routes render | — | Keeps Prisma/session server-side | e2e/script | `node .planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs --group queues` | ❌ W0 | ⬜ pending |
| 16-03-01 | 03 | 2 | Ops/admin/dynamic routes render or intentionally deny | — | Preserves role/tenant authorization | e2e/script | `node .planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `validate-phase-16-routes.cjs` — phase-specific validation harness derived from quick task `validate-and-capture.cjs`.
- [ ] Role/session bootstrap for admin, specialist, reviewer, and customer validation scenarios.
- [ ] Valid dynamic ID discovery or minimal seed fixture setup for request/template/document-version routes.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual quality of screenshots | Screenshots captured only after validation PASS | Automated checks cannot fully judge visual design quality | Review generated screenshots in phase artifact directory after full validation passes. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-06
