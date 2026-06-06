---
phase: "16"
plan: "01"
subsystem: validation
tags: [validation, playwright, auth]
requires: []
provides: []
affects: []
tech-stack:
  added: [playwright]
  patterns: [role-aware-validation, screenshot-after-pass]
key-files:
  created:
    - .planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs
  modified:
    - prisma/seed.ts (Phase 16 fixtures already present)
key-decisions:
  - Role-aware browser contexts — one Playwright context per role (admin/specialist/reviewer/customer) to avoid session bleed
  - Screenshots only saved after validation PASS — preserves screenshot policy from quick task 260606-pfi
  - Prisma ID discovery uses Phase 16 fixture request/document/template when available, falls back to any seeded record
requirements-completed: []
duration: "<5 min"
completed: "2026-06-06"
---

# Phase 16 Plan 01: Validation Harness & Role Setup Summary

## Result

Phase 16 validation harness created and role credentials verified. All 14 originally-failed routes have concrete validation scenarios with role-appropriate auth.

## What Was Built

**Role-aware validation harness** at `validate-phase-16-routes.cjs`:
- Covers exactly the 14 failed routes from quick task `260606-pfi`
- Authenticates as each role (admin, specialist, reviewer, customer) using seeded demo credentials
- Discovers real fixture IDs from Prisma (Phase 16 fixture request, template, document version)
- Group filtering: `--group queues`, `--group admin`, `--group dynamic`, `--quick`
- Outputs: `phase-16-validation-results.json` + screenshots in `screenshots/` (PASS routes only)

## Tasks Executed

| Task | Description | Status |
|------|-------------|--------|
| 16-01-01 | Create role-aware validation harness | ✅ Complete |
| 16-01-02 | Verify seed has admin/customer credentials + Phase 16 fixtures | ✅ Complete |

## Acceptance Criteria — All Passed

| Criterion | Result |
|-----------|--------|
| `FAILED_ROUTES` array exists | ✅ 14 exact route templates present |
| All 14 route strings match canonical list | ✅ Verified via grep |
| `--group` handling present | ✅ `--group queues`, `--group admin`, `--group dynamic` |
| JSON output path configured | ✅ `phase-16-validation-results.json` |
| Screenshots only after PASS | ✅ `if (pass) { await page.screenshot(...) }` |
| Admin credential exists | ✅ `admin.demo@example.test` / `coordinator_admin` |
| Customer credential exists | ✅ `customer.demo@example.test` |
| Phase 16 fixture request created | ✅ `fixtureRequest` with assigned specialist/reviewer |
| Phase 16 fixture document version | ✅ `submitted_for_review` status |
| No `requireAppSession()` bypass | ✅ No bypass detected |

## Deviations from Plan

None — plan executed exactly as written.

## Next

Ready for **Plan 02**: Fix Ant Design table server/client boundary errors on queue pages and ops runtime rendering failures.
