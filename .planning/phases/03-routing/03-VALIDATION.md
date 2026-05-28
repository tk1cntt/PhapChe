---
phase: 03
slug: routing
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-28
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript scripts via `tsx` |
| **Config file** | `package.json` scripts |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 03-01 | 1 | RTE-01, RTE-02 | T-03-01 | Capability rows scoped by workspace/user/matter/kind; inactive users not eligible | unit/schema | `npx prisma validate && npm run typecheck` | ✅ W0 | ⬜ pending |
| 03-01-02 | 03-01 | 1 | RTE-03 | T-03-02 | Suggestions filter by active membership and split specialist/reviewer | unit | `npm test` | ✅ W0 | ⬜ pending |
| 03-02-01 | 03-02 | 2 | RTE-04 | T-03-03 | Assignment requires coordinator/admin authorization and non-empty reason | unit | `npm test` | ✅ W0 | ⬜ pending |
| 03-02-02 | 03-02 | 2 | RTE-04 | T-03-04 | Failed workflow transition leaves no partial assignment/history/audit state | unit | `npm test` | ✅ W0 | ⬜ pending |
| 03-03-01 | 03-03 | 3 | RTE-01, RTE-02, RTE-03 | T-03-05 | Coordinator UI actions call server actions; no client-side status writes | type/static | `npm run typecheck` | ✅ W0 | ⬜ pending |
| 03-03-02 | 03-03 | 3 | RTE-04 | T-03-06 | Assignment/reassignment form requires reason and uses Vietnamese copy | type/static | `npm run typecheck` | ✅ W0 | ⬜ pending |
| 03-04-01 | 03-04 | 3 | RTE-05 | T-03-07 | Specialist queue filters by `assignedSpecialistId=session.userId` | unit/type | `npm test` | ✅ W0 | ⬜ pending |
| 03-04-02 | 03-04 | 3 | RTE-05 | T-03-08 | Request detail uses `canAccessRequest` before showing intake/file metadata | unit/type | `npm test` | ✅ W0 | ⬜ pending |
| 03-05-01 | 03-05 | 4 | RTE-01, RTE-02, RTE-03, RTE-04, RTE-05 | T-03-09 | Seed data demonstrates routing without leaking sensitive content | integration | `npm test` | ✅ W0 | ⬜ pending |
| 03-05-02 | 03-05 | 4 | RTE-01, RTE-02, RTE-03, RTE-04, RTE-05 | T-03-10 | Prisma schema pushed before final verification | db/integration | `npx prisma db push && npm test` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- `package.json` — existing `test` and `typecheck` scripts.
- `src/lib/intake/intake.test.ts` — service test pattern.
- `src/lib/workflow/request-workflow.test.ts` — workflow transition test pattern.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-28
