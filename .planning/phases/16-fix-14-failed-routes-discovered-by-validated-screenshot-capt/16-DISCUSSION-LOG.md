# Phase 16: Fix 14 Failed Routes Discovered By Validated Screenshot Capture - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 16-fix-14-failed-routes-discovered-by-validated-screenshot-capt
**Mode:** auto
**Areas discussed:** Failure Scope, Auth And Role Coverage, Server/Client Component Boundaries, Route And Data Handling, Verification

---

## Failure Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Use quick validation report as canonical | Fix exactly the 14 routes from `validation-results.json` / SUMMARY; avoid unrelated cleanup. | ✓ |
| Re-audit all routes from scratch | Broader but risks expanding scope beyond the user's immediate complaint. | |
| Full app hardening | Too broad for this phase; belongs in a larger milestone. | |

**Auto choice:** Use quick validation report as canonical.
**Notes:** This aligns with the user's request to fix the routes found above.

---

## Auth And Role Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Role-appropriate validation | Validate admin/reviewer/specialist/customer pages with matching users/sessions. | ✓ |
| Single demo user only | Simpler but caused false failures like admin pages checked with specialist user. | |
| Bypass auth for screenshots | Invalid for security-sensitive legal app; would hide permission bugs. | |

**Auto choice:** Role-appropriate validation.
**Notes:** Maintains tenant/request permission constraints.

---

## Server/Client Component Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Server fetch + small Client Table components | Keeps data access on server while allowing AntD render functions safely in client components. | ✓ |
| Mark whole page as client | Too broad; would disrupt Prisma/server data access. | |
| Remove AntD tables | Unnecessary and conflicts with Phase 14 Ant Design migration. | |

**Auto choice:** Server fetch + small Client Table components.
**Notes:** Targets known `Functions cannot be passed directly to Client Components` failures.

---

## Route And Data Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Use valid DB-derived IDs / minimal fixtures | Dynamic routes are tested with real request/template/document IDs and ownership. | ✓ |
| Use placeholder IDs | Produced accidental 404s and does not prove page health. | |
| Treat all 404s as acceptable | Would repeat the original screenshot-validation problem. | |

**Auto choice:** Use valid DB-derived IDs / minimal fixtures.
**Notes:** Some routes can intentionally render not-found/access-denied only when the scenario is actually invalid.

---

## Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Re-run validated capture harness | Same evidence standard as the quick task: validate first, screenshot second. | ✓ |
| Manual browser spot-check only | Useful but insufficient as the sole evidence. | |
| Typecheck only | Typecheck is helpful but current project has unrelated known failures. | |

**Auto choice:** Re-run validated capture harness.
**Notes:** `npm run typecheck` should be diagnostic, with unrelated failures documented.

---

## Claude's Discretion

- Exact client component filenames and fixture shape are left to planner/executor.
- Planner should keep changes surgical and avoid broad refactors.

## Deferred Ideas

- Full visual regression framework.
- Broad unrelated TypeScript debt cleanup.
- New product features for templates/vault/review/routing.
