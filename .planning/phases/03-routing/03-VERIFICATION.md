---
phase: 03-routing
verified: 2026-05-29T00:00:00Z
status: gaps_found
score: 19/20 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 19/20
  gaps_closed: []
  gaps_remaining:
    - "Database schema is pushed after Prisma schema changes."
  regressions: []
gaps:
  - truth: "Database schema is pushed after Prisma schema changes."
    status: failed
    reason: "`npx prisma db push` still fails with Prisma P1012 because `DATABASE_URL` is not visible to verifier environment. Live database schema sync remains unverified."
    artifacts:
      - path: "prisma/schema.prisma"
        issue: "RoutingCapability schema exists, but target database sync not proven."
      - path: ".planning/phases/03-routing/03-05-SUMMARY.md"
        issue: "Earlier summary records same db push blocker. User note says DB env is in `.env`, but verifier command still cannot see DATABASE_URL."
    missing:
      - "Expose DATABASE_URL to command environment used by verifier/GSD, then run `npx prisma db push` successfully."
      - "Run `npx prisma generate` after DLL lock clears; current generate fails with Windows EPERM rename."
human_verification:
  - test: "Open `/admin/routing` as coordinator/admin and submit assignment/reassignment from UI."
    expected: "Assignment persists, reason is required, history/audit written, and page refresh shows assignee."
    why_human: "Needs authenticated browser session and runtime database state."
  - test: "Open `/specialist/requests` and `/specialist/requests/[requestId]` as assigned specialist."
    expected: "Only assigned requests appear; detail shows intake summary and file metadata only."
    why_human: "Needs authenticated specialist session and seeded/runtime data."
---

# Phase 3: routing Verification Report

**Phase Goal:** routing — request routing with matter types, specialist/reviewer capability matrix, manual assignment, and specialist queue/detail.
**Verified:** 2026-05-29T00:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — previous gap remains.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can define active matter types for routing. | VERIFIED | `src/lib/routing/routing-service.ts` exports `upsertMatterType`; `/admin/routing` renders matter type form/table and posts to `saveMatterTypeAction`. |
| 2 | Admin can define specialist/reviewer capabilities by workspace, user, matter type, and kind. | VERIFIED | `prisma/schema.prisma` has `RoutingCapability` with workspace/user/matter/kind unique tuple; service validates active user and matching membership; UI has capability form/table. |
| 3 | System returns separate eligible specialist and reviewer suggestions with Vietnamese reason text. | VERIFIED | `getRoutingSuggestions` reads `IntakeSubmission.matterTypeKey`, filters active `routingCapability`, active user, active workspace membership, and returns `{ specialists, reviewers }` with `Phù hợp vai trò và năng lực với loại vụ việc này.` |
| 4 | Coordinator/admin can assign or reassign specialist and reviewer with required reason. | VERIFIED | `assignRequest` requires reason, validates routing admin, assignee membership/capability, writes assignee field, appends `RequestAssignment`, writes audit metadata in one transaction. |
| 5 | Assignment status changes use backend workflow transitions only. | VERIFIED | `assignRequest` uses `getAllowedTransitions`; writes `WorkflowTransition` and guarded status updates inside Prisma transaction. |
| 6 | Audit events record routing metadata without sensitive intake content. | VERIFIED | `metadataSummary` includes kind/assignee/request/matter/reason flag/short reason only; no intake answers/labels read into audit path. |
| 7 | Coordinator/admin sees routing queue for submitted/triage/assigned requests. | VERIFIED | `/admin/routing` queries `legalRequest.findMany` with `status: { in: ['intake_submitted', 'triage', 'assigned'] }`. |
| 8 | Coordinator/admin can manage matter types and capabilities with Vietnamese labels. | VERIFIED | `/admin/routing` renders sections `Loại vụ việc` and `Năng lực xử lý`; forms use Vietnamese labels and existing admin UI primitives. |
| 9 | Coordinator/admin sees specialist and reviewer suggestions separately. | VERIFIED | Routing table has `Gợi ý chuyên viên` and `Gợi ý reviewer`; separate `SuggestionList` calls use service output arrays. |
| 10 | Coordinator/admin must enter reason before assignment/reassignment. | VERIFIED | UI textarea `name="reason" required`; server action returns `Nhập lý do phân công trước khi lưu.` before service call. |
| 11 | Specialist sees only requests assigned to them. | VERIFIED | `/specialist/requests` server query filters `workspaceId: session.activeWorkspaceId ?? ''` and `assignedSpecialistId: session.userId`. |
| 12 | Specialist can open assigned request detail. | VERIFIED | Queue links to `/specialist/requests/${request.id}`; detail route exists. |
| 13 | Detail shows intake summary and supporting file metadata only. | VERIFIED | Detail renders `answerLabels`/`answers` rows and file `filename`/created date only; no download/preview/draft controls found. |
| 14 | Seed data demonstrates at least one eligible specialist and reviewer for a seeded matter type. | VERIFIED | `prisma/seed.ts` upserts specialist and reviewer users, active memberships, and two `routingCapability` rows for `labor_contract`. |
| 15 | Phase routing passes typecheck and routing tests. | VERIFIED | `npm run typecheck` passed; `npx tsx src/lib/routing/routing-service.test.ts` passed. |
| 16 | Database schema is pushed after Prisma schema changes. | FAILED | `npx prisma db push` failed during verification with P1012: `Environment variable not found: DATABASE_URL`; live DB sync not verified. |

**Score:** 19/20 must-haves verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `prisma/schema.prisma` | `RoutingCapability` model and relations | VERIFIED | Model exists with `@@unique([workspaceId, userId, matterTypeKey, kind])` and indexes. |
| `src/lib/routing/routing-service.ts` | Matter type, capability, suggestion, assignment service | VERIFIED | Exports required functions; substantive Prisma/service logic present. |
| `src/lib/routing/routing-service.test.ts` | Routing domain/assignment tests | VERIFIED | Spot-check test command passed. |
| `src/app/admin/routing/actions.ts` | Server actions for routing forms | VERIFIED | Starts `'use server';`; calls session + routing service; validates reason/assignee. |
| `src/app/admin/routing/page.tsx` | Coordinator/admin routing UI | VERIFIED | Queue, matter types, capabilities, suggestions, forms present and wired to actions. |
| `src/app/specialist/requests/page.tsx` | Assigned specialist queue | VERIFIED | Server-side scoped query by workspace/current specialist. |
| `src/app/specialist/requests/[requestId]/page.tsx` | Assigned request detail | VERIFIED | Uses `canAccessRequest(session, requestId)` before detail read. |
| `prisma/seed.ts` | Seed routing capabilities | VERIFIED | Seeds active specialist/reviewer capabilities and memberships. |
| `package.json` | Seed/db/typecheck scripts | VERIFIED | `seed`, `prisma:generate`, `db:push`, `typecheck` scripts exist. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `routing-service.ts` | `prisma.routingCapability` | capability CRUD and suggestion query | WIRED | `upsert`, `findMany`, `findFirst` used. |
| `routing-service.ts` | `IntakeSubmission.matterTypeKey` | suggestion lookup | WIRED | `getRoutingSuggestions` selects `matterTypeKey`. |
| `assignRequest` | `LegalRequest.assignedSpecialistId/assignedReviewerId` | transaction update | WIRED | Assignment field selected by kind and written in transaction. |
| `assignRequest` | `RequestAssignment` | append-only create | WIRED | `tx.requestAssignment.create` writes each assignment. |
| `assignRequest` | `WorkflowTransition` | backend transition path | WIRED | Guarded path and `tx.workflowTransition.create` present. |
| `admin/routing/actions.ts` | `routing-service.ts` | server actions call service functions | WIRED | Calls `upsertMatterType`, `upsertRoutingCapability`, `assignRequest`. |
| `admin/routing/page.tsx` | `admin/components/ui.tsx` | reused admin components | WIRED | Uses `AdminShell`, `PageHeader`, `Card`, `Table`, `Button`, `Badge`. |
| `specialist/requests/page.tsx` | `LegalRequest.assignedSpecialistId` | server-side Prisma where clause | WIRED | Exact assigned specialist filter present. |
| `specialist/requests/[requestId]/page.tsx` | `canAccessRequest` | detail authorization | WIRED | Authorization check runs before DB detail read. |
| `prisma/schema.prisma` | database | `npx prisma db push` | NOT_WIRED | Command failed with missing `DATABASE_URL`; DB push not verified. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `src/app/admin/routing/page.tsx` | `requests`, `matterTypes`, `capabilities`, `members`, `suggestionRows` | Prisma queries + routing service | Yes | FLOWING |
| `src/app/specialist/requests/page.tsx` | `requests` | `prisma.legalRequest.findMany` scoped to session | Yes | FLOWING |
| `src/app/specialist/requests/[requestId]/page.tsx` | `request`, `summaryRows`, `vaultFiles` | `canAccessRequest` then Prisma detail query | Yes | FLOWING |
| `prisma/seed.ts` | seeded users/memberships/capabilities | Prisma upserts | Yes when DB env works | FLOWING_CODE_ONLY |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| TypeScript project compiles | `npm run typecheck` | Passed | PASS |
| Routing service contract tests pass | `npx tsx src/lib/routing/routing-service.test.ts` | Passed | PASS |
| Prisma schema pushed | `npx prisma db push` | Failed: P1012 `Environment variable not found: DATABASE_URL` | FAIL |
| Prisma client generated | `npx prisma generate` | Failed: `EPERM` rename of `query_engine-windows.dll.node` | FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| RTE-01 | 03-01, 03-03, 03-05 | Admin can define matter types. | SATISFIED | Service + admin routing UI matter type form/table exist. |
| RTE-02 | 03-01, 03-03, 03-05 | Admin can define specialist and reviewer capabilities. | SATISFIED | `RoutingCapability`, service validation, and capability UI exist. |
| RTE-03 | 03-01, 03-03, 03-05 | System suggests eligible specialists and reviewers from capability matrix. | SATISFIED | `getRoutingSuggestions` and UI render separate suggestions. |
| RTE-04 | 03-02, 03-03, 03-05 | Coordinator can assign or reassign requests with audit reason. | SATISFIED | `assignRequest` transaction and admin assignment forms/actions exist. |
| RTE-05 | 03-04, 03-05 | Specialist can see assigned queue and request details. | SATISFIED | Specialist queue/detail pages scoped and guarded server-side. |

No orphaned Phase 3 requirements found. `REQUIREMENTS.md` maps RTE-01 through RTE-05 to Phase 3; all appear in PLAN frontmatter and have code evidence.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `src/app/admin/routing/page.tsx` | 45 | empty suggestions fallback | Info | Acceptable fallback for no eligible users or per-row lookup failure; not blocking. |
| `src/app/admin/routing/page.tsx` | 75 | `defaultValue=""` | Info | Intentional explicit assignee selection; no auto-select. |
| `src/app/admin/routing/actions.ts` | 44 | `questionSchema: []` | Info | Routing taxonomy admin only; intake question authoring outside Phase 3 scope. |

### Human Verification Required

1. Admin routing UI smoke

**Test:** Open `/admin/routing` as coordinator/admin; create/update matter type/capability; assign and reassign specialist/reviewer with reason.
**Expected:** Assignment persists; missing reason/assignee blocks save; history and audit rows created; page shows assignees.
**Why human:** Needs real session, DB, and browser form flow.

2. Specialist access smoke

**Test:** Open `/specialist/requests` as assigned specialist, then open assigned request detail.
**Expected:** Only assigned requests show; detail shows intake summary and file metadata only; no download/drafting/review controls.
**Why human:** Needs authenticated specialist session and runtime data.

### Gaps Summary

Routing code goal mostly achieved: matter types, capabilities, suggestions, assignment transaction, admin UI, specialist queue/detail, seed capability data all exist and are wired.

Blocking gap remains: database schema push must-have not achieved. Verifier command `npx prisma db push` still cannot see `DATABASE_URL`, despite user note that DB env is in `.env`. `npx prisma generate` also fails due Windows Prisma DLL lock. Until DB push succeeds, live schema sync is unproven.

---

_Verified: 2026-05-29T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
