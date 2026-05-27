---
phase: quick-260527-gig
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/foundation.e2e.test.ts
autonomous: true
requirements:
  - FND-01
  - FND-02
  - FND-03
  - FND-04
  - FND-05
must_haves:
  truths:
    - "Phase 1 foundation E2E coverage is split into focused node:test test(...) blocks, not one broad scenario."
    - "Every focused test uses real Prisma/database behavior from DATABASE_URL, not mocks."
    - "Each test uses unique scoped seed data or explicit non-concurrent execution so tests cannot collide."
    - "Cleanup is scoped to seeded identifiers/prefix/correlation ids only and is safe to repeat."
    - "Real DB E2E command passes with WSL/local DATABASE_URL without committing secrets."
  artifacts:
    - path: "src/lib/foundation.e2e.test.ts"
      provides: "Focused Phase 1 foundation E2E test suite"
      contains: "test("
  key_links:
    - from: "src/lib/foundation.e2e.test.ts"
      to: "DATABASE_URL"
      via: "safe real database guard"
      pattern: "process\.env\.DATABASE_URL"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "Prisma foundation models"
      via: "seed/assert/cleanup using real prisma client"
      pattern: "prisma\."
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/security/rbac.ts"
      via: "RBAC allow/deny assertions"
      pattern: "canAccess"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/audit/audit.ts"
      via: "audit writer validation assertions"
      pattern: "recordAuditEvent"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/workflow/request-workflow.ts"
      via: "workflow transition allow/deny/persistence assertions"
      pattern: "transitionRequestStatus|getAllowedTransitions"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/admin/users.ts"
      via: "admin user management service assertions"
      pattern: "createAdminUser|updateAdminUserRole|assignUserToWorkspace|deactivateAdminUser"
---

<objective>
Tách `src/lib/foundation.e2e.test.ts` từ một E2E test rộng thành nhiều focused E2E tests cho toàn bộ tính năng Phase 1.

Purpose: Phase 1 có nhiều service/contract quan trọng; một broad testcase che mờ lỗi từng vùng. Focused tests giúp verifier thấy schema, RBAC, audit, workflow, admin service, cleanup đều có coverage riêng.
Output: Một file E2E test dùng real DB, safe URL guard, unique seed, scoped cleanup, nhiều `test(...)` blocks.
</objective>

<execution_context>
@D:/Tradingview/.claude/get-shit-done/workflows/execute-plan.md
@D:/Tradingview/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@D:/PhapChe/CLAUDE.md
@D:/PhapChe/.planning/STATE.md
@D:/PhapChe/.planning/ROADMAP.md
@D:/PhapChe/.planning/phases/01-foundation/01-01-SUMMARY.md
@D:/PhapChe/.planning/phases/01-foundation/01-02-SUMMARY.md
@D:/PhapChe/.planning/phases/01-foundation/01-03-SUMMARY.md
@D:/PhapChe/.planning/phases/01-foundation/01-04-SUMMARY.md
@D:/PhapChe/.planning/quick/260527-aqj-b-sung-e2e-test-t-t-c-c-c-t-nh-n-ng-c-a-/260527-aqj-SUMMARY.md
@D:/PhapChe/.planning/quick/260527-aqj-b-sung-e2e-test-t-t-c-c-c-t-nh-n-ng-c-a-/260527-aqj-VERIFICATION.md
@D:/PhapChe/src/lib/foundation.e2e.test.ts

Assumptions:
- Existing `src/lib/foundation.e2e.test.ts` already has real DB guard, unique seed helpers, scoped cleanup helpers, and broad Phase 1 assertions from quick 260527-aqj.
- Keep changes surgical: modify only `src/lib/foundation.e2e.test.ts` unless package script becomes strictly necessary.
- Do not commit or hardcode `postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public`; use only as command environment value.

Phase 1 coverage targets:
- FND-01: admin user service create/update/deactivate/workspace assignment with audit.
- FND-02: tenant/workspace/request/document/review/vault schema and relations.
- FND-03: audit writer validates metadata summary string only and rejects unsafe payloads.
- FND-04: RBAC allow/deny for workspace, request, document, review, vault file.
- FND-05: backend workflow transition map and persisted transition/audit rows.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Refactor foundation E2E seed lifecycle for focused tests</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <behavior>
    - Each focused `test(...)` can create its own unique seed or run with explicit non-concurrent isolation.
    - Cleanup only deletes rows tied to seeded ids, prefix, workspace id, request id, or correlation id.
    - Cleanup can run multiple times without deleting non-test data or throwing because rows are already gone.
  </behavior>
  <action>Refactor existing broad-test helpers so focused tests can call a shared `withFoundationSeed`-style wrapper or equivalent per-test seed/finally cleanup. Preserve safe DATABASE_URL guard. Preserve unique suffix/prefix/correlation strategy. Do not add shared mutable seed used by concurrent tests. If using Node test options, mark tests non-concurrent explicitly; otherwise make every test seed independent. No unscoped `deleteMany({})`, raw SQL truncation, or cleanup by broad model-wide criteria.</action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <done>`src/lib/foundation.e2e.test.ts` has reusable scoped seed/cleanup path suitable for multiple focused tests, and typecheck passes.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Split broad Phase 1 assertions into focused E2E test blocks</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <behavior>
    - Test block 1 verifies DB schema/relations: workspace, users, memberships, legal request, assignments, document, review, vault file persist with expected relations.
    - Test block 2 verifies RBAC allow/deny: allowed session can access tenant-scoped resources, denied/inactive/wrong workspace cases return false.
    - Test block 3 verifies audit writer validations: valid audit persists, object metadata is rejected, summary longer than 500 chars is rejected.
    - Test block 4 verifies workflow transitions allow/deny/persistence: allowed transition changes request status and creates workflow/audit rows; disallowed transition rejects and does not persist invalid status.
    - Test block 5 verifies admin user management service: create user, update role, assign workspace, deactivate user, and audit events persist.
    - Test block 6 verifies cleanup safety/repeatability: seeded rows are removed by scoped cleanup and second cleanup remains safe.
  </behavior>
  <action>Replace single broad `test(...)` with separate focused Node `test(...)` blocks for exactly these areas: DB schema/relations, RBAC allow/deny, audit writer validations, workflow transitions allow/deny/persistence, admin user management service, cleanup safety/repeatability. Reuse existing production services: `canAccessWorkspace`, `canAccessRequest`, `canAccessDocument`, `canAccessReview`, `canAccessVaultFile`, `recordAuditEvent`, `getAllowedTransitions`, `transitionRequestStatus`, `createAdminUser`, `updateAdminUserRole`, `assignUserToWorkspace`, `deactivateAdminUser`. Keep assertions specific to each block so failure names identify feature area. Do not mock Prisma or services. Do not broaden production code scope.</action>
  <verify>
    <automated>DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" node --test --import tsx src/lib/foundation.e2e.test.ts</automated>
  </verify>
  <done>File contains separate focused `test(...)` blocks covering all six requested areas, and real DB E2E command passes.</done>
</task>

<task type="auto">
  <name>Task 3: Verify no unsafe cleanup or secret persistence</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <action>Inspect final test file for safety constraints: no hardcoded database URL, no committed secret value, no `deleteMany({})`, no raw truncate/delete SQL, no shared mutable seed across concurrent tests, no mock Prisma usage. If any violation exists, fix inside `src/lib/foundation.e2e.test.ts` only. Keep final verification output in summary; do not create extra docs beyond required GSD summary.</action>
  <verify>
    <automated>npm run typecheck && DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" node --test --import tsx src/lib/foundation.e2e.test.ts</automated>
  </verify>
  <done>Typecheck and real DB E2E pass; source contains no hardcoded DB URL/secret, no unscoped cleanup, no Prisma mocks, and cleanup is repeatable.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Test process -> local dev database | Test writes real rows through Prisma using `DATABASE_URL`; unsafe URL or cleanup could damage non-test data. |
| Test seed -> production service helpers | Seeded session/resource ids cross into RBAC, audit, workflow, and admin services as real service inputs. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-260527-gig-01 | Tampering | `cleanupFoundationE2E` / cleanup helpers | mitigate | Keep every delete scoped by seeded ids, workspace id, request id, prefix, or correlation id; forbid `deleteMany({})` and raw truncate/delete SQL. |
| T-260527-gig-02 | Information Disclosure | `src/lib/foundation.e2e.test.ts` | mitigate | Do not hardcode or commit DATABASE_URL; pass local URL only via shell env during verification. |
| T-260527-gig-03 | Denial of Service | concurrent E2E tests | mitigate | Use per-test unique seed or explicit non-concurrent Node test option so tests do not race over shared mutable rows. |
| T-260527-gig-04 | Repudiation | audit/workflow assertions | mitigate | Assert audit events and workflow transition rows persist for relevant service calls using seeded correlation/action values. |
</threat_model>

<verification>
Run:

1. `npm run typecheck`
2. `DATABASE_URL="postgresql://aureus:aureus_password@localhost:5433/legal_service_dev?schema=public" node --test --import tsx src/lib/foundation.e2e.test.ts`

Expected: typecheck passes; E2E output shows multiple focused tests passing, not one broad test.
</verification>

<success_criteria>
- `src/lib/foundation.e2e.test.ts` is only production/test file changed.
- Separate `test(...)` blocks exist for DB schema/relations, RBAC allow/deny, audit writer validations, workflow transitions allow/deny/persistence, admin user management service, cleanup safety/repeatability.
- Tests use real database from `DATABASE_URL`; no mocks.
- Tests avoid parallel collisions via independent per-test seeds or explicit non-concurrent execution.
- Cleanup remains scoped and repeatable; no unscoped cleanup.
- No database URL secret committed into code.
</success_criteria>

<source_audit>
| Source | Item | Coverage |
|--------|------|----------|
| GOAL | Expand Phase 1 E2E from one broad testcase into multiple focused tests | Task 2 |
| REQ FND-01 | Admin user management service | Task 2 test block 5 |
| REQ FND-02 | Tenant schema/relations and workspace isolation foundation | Task 2 test block 1 |
| REQ FND-03 | Append-only audit writer validations | Task 2 test block 3 |
| REQ FND-04 | RBAC helpers allow/deny | Task 2 test block 2 |
| REQ FND-05 | Workflow transitions allow/deny/persistence | Task 2 test block 4 |
| CONTEXT | Keep real DB, safe URL guard, unique seed, scoped cleanup | Tasks 1-3 |
| CONTEXT | Use WSL/local DATABASE_URL for verification but do not commit secrets | Tasks 2-3 |
| CONSTRAINT | Modify only `src/lib/foundation.e2e.test.ts` unless package script needed | All tasks |
| CONSTRAINT | Avoid parallel collision | Tasks 1-2 |
| CONSTRAINT | No unscoped cleanup | Tasks 1 and 3 |
</source_audit>

<output>
After completion, create `D:/PhapChe/.planning/quick/260527-gig-phase-1-c-r-t-nhi-u-func-v-t-nh-n-ng-c-n/260527-gig-SUMMARY.md`.
</output>
