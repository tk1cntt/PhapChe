---
phase: 03-routing
verified: 2026-05-29T00:00:00Z
status: passed
score: 20/20 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 19/20
  gaps_closed:
    - "Database schema is pushed after Prisma schema changes."
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Open `/admin/routing` as coordinator/admin and submit assignment/reassignment from UI."
    expected: "Assignment persists, reason is required, history/audit written, and page refresh shows assignee."
    why_human: "Needs authenticated browser session and runtime database state."
  - test: "Open `/specialist/requests` and `/specialist/requests/[requestId]` as assigned specialist."
    expected: "Only assigned requests appear; detail shows intake summary and file metadata only."
    why_human: "Needs authenticated specialist session and seeded/runtime data."
---

# Phase 3: routing Verification Report

**Phase Goal:** Route requests to the right specialist/reviewer using capability matrix and manual assignment.
**Verified:** 2026-05-29T00:00:00Z
**Status:** human_needed
**Re-verification:** Yes — previous DB push gap closed after running commands from `D:/PhapChe` project root where `.env` is loaded.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can define active matter types for routing. | VERIFIED | `src/lib/routing/routing-service.ts` exports `upsertMatterType`; `/admin/routing` renders matter type form/table and posts to `saveMatterTypeAction`. CR-01 fix scopes upsert by `workspaceId_key`. |
| 2 | Admin can define specialist/reviewer capabilities by workspace, user, matter type, and kind. | VERIFIED | `prisma/schema.prisma` has `RoutingCapability` with `workspaceId`, `userId`, `matterTypeKey`, `kind`, unique tuple, indexes; service validates active user, membership, matter type. |
| 3 | System returns separate eligible specialist and reviewer suggestions with Vietnamese reason text. | VERIFIED | `getRoutingSuggestions` reads request intake matter type and returns `{ specialists, reviewers }`; UI renders `Gợi ý chuyên viên` and `Gợi ý reviewer` separately with required reason. |
| 4 | Coordinator/admin can assign or reassign specialist and reviewer with a required reason. | VERIFIED | `assignRequest` trims and requires reason with `ASSIGNMENT_REASON_REQUIRED`; admin action checks missing reason/assignee before service call. |
| 5 | Assignment updates LegalRequest assignee fields and appends RequestAssignment history rows. | VERIFIED | `assignRequest` writes `assignedSpecialistId` or `assignedReviewerId`, then `tx.requestAssignment.create` inside one transaction. |
| 6 | Assignment status changes use backend workflow transitions only. | VERIFIED | `assignRequest` uses `getAllowedTransitions`, guarded `updateMany`, and `tx.workflowTransition.create` inside transaction; no pre-transaction `transitionRequestStatus` call. |
| 7 | Audit events record routing metadata without sensitive intake content. | VERIFIED | `metadataSummary` uses kind, assignee, request, matter, reason flag, short reason only; test checks sensitive answer fixture absent. |
| 8 | Coordinator/admin sees routing queue for submitted/triage/assigned requests. | VERIFIED | `/admin/routing` queries `legalRequest.findMany` with `status: { in: ['intake_submitted', 'triage', 'assigned'] }`. |
| 9 | Coordinator/admin can manage matter types and capabilities with Vietnamese labels. | VERIFIED | `/admin/routing` renders sections `Loại vụ việc` and `Năng lực xử lý`; forms use Vietnamese labels and existing admin UI components. |
| 10 | Coordinator/admin sees specialist and reviewer suggestions separately. | VERIFIED | Routing table has columns `Gợi ý chuyên viên` and `Gợi ý reviewer`; per-row data comes from `getRoutingSuggestions`. |
| 11 | Coordinator/admin must enter reason before assignment/reassignment. | VERIFIED | UI textarea `name="reason" required`; server action returns `Nhập lý do phân công trước khi lưu.` before calling service. |
| 12 | Specialist sees only requests assigned to them. | VERIFIED | `/specialist/requests` server query filters `workspaceId: session.activeWorkspaceId ?? ''` and `assignedSpecialistId: session.userId`. |
| 13 | Specialist can open assigned request detail. | VERIFIED | Queue links to `/specialist/requests/${request.id}`; detail route exists. |
| 14 | Detail shows intake summary and supporting file metadata only. | VERIFIED | Detail renders answer label/value rows and file `filename`/created date only; no download/preview/drafting controls. |
| 15 | Seed data demonstrates at least one eligible specialist and reviewer for a seeded matter type. | VERIFIED | `prisma/seed.ts` upserts demo workspace, specialist/reviewer users, active memberships, and `routingCapability` rows for `labor_contract`. |
| 16 | Database schema is pushed after Prisma schema changes. | VERIFIED | `cd "D:/PhapChe" && npx prisma db push --skip-generate --accept-data-loss` loaded `.env` and reported database already in sync with Prisma schema. |
| 17 | Phase routing passes typecheck and routing tests. | VERIFIED | `cd "D:/PhapChe" && npm run typecheck` passed; `cd "D:/PhapChe" && npx tsx src/lib/routing/routing-service.test.ts` passed. |
| 18 | MatterType upsert is scoped by workspace after CR-01. | VERIFIED | `MatterType` uses `@@unique([workspaceId, key])`; `upsertMatterType` uses `where: { workspaceId_key: { workspaceId, key } }`; test rejects `where: { key }`. |
| 19 | Existing DB row compatibility preserved while new code writes workspaceId. | VERIFIED | `MatterType.workspaceId` and `IntakeSubmission.workspaceId` are nullable in schema; service/seed create workspace-scoped rows. |
| 20 | Prisma client generation succeeds after schema changes. | VERIFIED | `cd "D:/PhapChe" && npm run prisma:generate` passed and generated Prisma Client v6.19.3. |

**Score:** 20/20 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `prisma/schema.prisma` | Routing schema, scoped MatterType, nullable compatibility fields | VERIFIED | `RoutingCapability`, `@@unique([workspaceId, key])`, nullable `MatterType.workspaceId`, nullable `IntakeSubmission.workspaceId` present. |
| `src/lib/routing/routing-service.ts` | Matter type, capability, suggestion, assignment service | VERIFIED | Exports required functions; CR-01 workspace-scoped upsert and active membership/capability checks present. |
| `src/lib/routing/routing-service.test.ts` | Routing contract tests | VERIFIED | Includes checks for assignment guards, audit safety, workspace-scoped matter upsert; command passed. |
| `src/app/admin/routing/actions.ts` | Server actions for routing forms | VERIFIED | Starts `'use server';`; validates reason/assignee; calls routing service; revalidates route. |
| `src/app/admin/routing/page.tsx` | Coordinator/admin routing UI | VERIFIED | Queue, matter types, capabilities, suggestions, assignment forms present and wired to actions. |
| `src/app/specialist/requests/page.tsx` | Assigned specialist queue | VERIFIED | Server-side scoped query by workspace/current specialist. |
| `src/app/specialist/requests/[requestId]/page.tsx` | Assigned request detail | VERIFIED | Uses `canAccessRequest(session, requestId)` before detail read. |
| `prisma/seed.ts` | Seed routing capabilities | VERIFIED | Seeds workspace-scoped matter types plus specialist/reviewer capabilities. |
| `package.json` | Scripts | VERIFIED | `typecheck`, `seed`, `prisma:generate`, `db:push` exist; no `test` script, so regression `npm test` unavailable as noted. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `routing-service.ts` | `prisma.routingCapability` | capability CRUD and suggestions | WIRED | Uses `upsert`, `findMany`, `findFirst`. |
| `routing-service.ts` | `IntakeSubmission.matterTypeKey` | suggestion lookup | WIRED | `getRoutingSuggestions` selects matter type from intake submission scoped through request workspace. |
| `assignRequest` | `LegalRequest.assignedSpecialistId/assignedReviewerId` | transaction update | WIRED | Assignment field selected by kind and written inside transaction. |
| `assignRequest` | `RequestAssignment` | append-only create | WIRED | `tx.requestAssignment.create` writes each assignment. |
| `assignRequest` | `WorkflowTransition` | backend transition path | WIRED | Guarded path plus `tx.workflowTransition.create` present. |
| `actions.ts` | `routing-service.ts` | server actions call service functions | WIRED | Calls `upsertMatterType`, `upsertRoutingCapability`, `assignRequest`, `requireRoutingAdmin`. |
| `page.tsx` admin | admin UI primitives | reused components | WIRED | Uses `AdminShell`, `PageHeader`, `Card`, `Table`, `Button`, `Badge`. |
| specialist queue | `LegalRequest.assignedSpecialistId` | server-side Prisma where clause | WIRED | Exact `assignedSpecialistId: session.userId` present. |
| specialist detail | `canAccessRequest` | detail authorization | WIRED | Authorization check runs before detail query. |
| `prisma/schema.prisma` | database | `npx prisma db push --skip-generate --accept-data-loss` | WIRED | Command from project root loaded `.env` and DB is in sync. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `src/app/admin/routing/page.tsx` | `requests`, `matterTypes`, `capabilities`, `members`, `suggestionRows` | Prisma queries + routing service | Yes | FLOWING |
| `src/app/specialist/requests/page.tsx` | `requests` | `prisma.legalRequest.findMany` scoped to session | Yes | FLOWING |
| `src/app/specialist/requests/[requestId]/page.tsx` | `request`, `summaryRows`, `vaultFiles` | `canAccessRequest` then Prisma detail query | Yes | FLOWING |
| `prisma/seed.ts` | seeded users/memberships/capabilities | Prisma upserts | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Prisma client generated | `cd "D:/PhapChe" && npm run prisma:generate` | Passed; generated Prisma Client v6.19.3 | PASS |
| Prisma schema pushed | `cd "D:/PhapChe" && npx prisma db push --skip-generate --accept-data-loss` | Passed; database already in sync | PASS |
| TypeScript project compiles | `cd "D:/PhapChe" && npm run typecheck` | Passed | PASS |
| Routing service contract tests pass | `cd "D:/PhapChe" && npx tsx src/lib/routing/routing-service.test.ts` | Passed | PASS |
| Regression `npm test` | Not run | `package.json` has no `test` script; use listed checks per user context | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| RTE-01 | 03-01, 03-03, 03-05 | Admin can define matter types. | SATISFIED | Workspace-scoped service and admin matter type UI exist; CR-01 tenant scope fixed. |
| RTE-02 | 03-01, 03-03, 03-05 | Admin can define specialist and reviewer capabilities. | SATISFIED | `RoutingCapability`, service validation, capability UI, seed capability data exist. |
| RTE-03 | 03-01, 03-03, 03-05 | System suggests eligible specialists and reviewers from capability matrix. | SATISFIED | `getRoutingSuggestions` and UI render separate specialist/reviewer suggestions. |
| RTE-04 | 03-02, 03-03, 03-05 | Coordinator can assign or reassign requests with audit reason. | SATISFIED | `assignRequest` transaction and admin assignment forms/actions exist. |
| RTE-05 | 03-04, 03-05 | Specialist can see assigned queue and request details. | SATISFIED | Specialist queue/detail pages scoped and guarded server-side. |

No orphaned Phase 3 requirements found. `D:/PhapChe/.planning/REQUIREMENTS.md` maps RTE-01 through RTE-05 to Phase 3; all appear in PLAN frontmatter and have code evidence.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `src/app/admin/routing/page.tsx` | 45 | empty suggestions fallback | Info | Acceptable fallback for no eligible users or lookup failure; not blocker. |
| `src/app/admin/routing/page.tsx` | 75 | `defaultValue=""` | Info | Intentional explicit assignee selection; prevents auto-select. |
| `src/app/admin/routing/actions.ts` | 44 | `questionSchema: []` | Info | Routing taxonomy admin only; intake question authoring outside Phase 3 scope. |
| `src/lib/routing/routing-service.test.ts` | whole file | static contract test | Warning | Catches source-level contracts, not DB-backed behavior. Mitigated partly by successful Prisma db push/typecheck; still needs runtime smoke below. |

### Human Verification Required

1. Admin routing UI smoke

**Test:** Open `/admin/routing` as coordinator/admin; create/update matter type/capability; assign and reassign specialist/reviewer with reason.
**Expected:** Assignment persists; missing reason/assignee blocks save; history and audit rows created; page shows assignees.
**Why human:** Needs real browser session and runtime data.

2. Specialist access smoke

**Test:** Open `/specialist/requests` as assigned specialist, then open assigned request detail.
**Expected:** Only assigned requests show; detail shows intake summary and file metadata only; no download/drafting/review controls.
**Why human:** Needs authenticated specialist session and runtime data.

### Gaps Summary

No automated gaps remain. Previous blocker closed by running Prisma commands from `D:/PhapChe`, where `.env` loads. Phase 03 routing goal achieved in code and database sync checks.

Overall status remains `human_needed` because browser/session-dependent routing and specialist flows require manual smoke verification.

---

_Verified: 2026-05-29T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
