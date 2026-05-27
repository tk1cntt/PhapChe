---
phase: quick-260527-kby
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
    - "E2E Phase 1 chạy với DB thật và có khoảng 25-40 test(...) focused thay vì 6 test rộng."
    - "10 model foundation đều có coverage insert/update/delete cleanup hoặc lifecycle đúng schema: User, Workspace, WorkspaceMembership, LegalRequest, RequestAssignment, Document, Review, VaultFile, WorkflowTransition, AuditEvent."
    - "Service/function hiện có vẫn được kiểm chứng qua DB thật: RBAC helpers, audit writer, workflow transitions, admin user service."
    - "Cleanup vẫn scoped theo seeded ids/prefix/correlation, không có unscoped deleteMany({}), không raw truncate/delete SQL, không mock, không DB URL trong source."
  artifacts:
    - path: "src/lib/foundation.e2e.test.ts"
      provides: "Detailed model-level real DB E2E coverage for Phase 1 foundation"
      contains: "FOUNDATION_E2E_PREFIX"
  key_links:
    - from: "src/lib/foundation.e2e.test.ts"
      to: "prisma/schema.prisma"
      via: "tests use actual Prisma model fields only"
      pattern: "prisma\.(user|workspace|workspaceMembership|legalRequest|requestAssignment|document|review|vaultFile|workflowTransition|auditEvent)"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/workflow/request-workflow.ts"
      via: "transitionRequestStatus and getAllowedTransitions service calls"
      pattern: "transitionRequestStatus|getAllowedTransitions"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/security/rbac.ts"
      via: "RBAC helper service calls"
      pattern: "canAccess(Workspace|Request|Document|Review|VaultFile)"
---

<objective>
Mở rộng `src/lib/foundation.e2e.test.ts` thành coverage E2E chi tiết theo từng database model và service Phase 1.

Purpose: user yêu cầu test DB thật theo model/lifecycle, không gom 10 model vào 6 testcase rộng.
Output: một file E2E có nhiều `test(...)` focused, dùng schema Prisma hiện có, cleanup an toàn.
</objective>

<execution_context>
@D:/Tradingview/.claude/get-shit-done/workflows/execute-plan.md
@D:/Tradingview/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-01-SUMMARY.md
@.planning/phases/01-foundation/01-02-SUMMARY.md
@.planning/phases/01-foundation/01-03-SUMMARY.md
@.planning/phases/01-foundation/01-04-SUMMARY.md
@.planning/quick/260527-gig-phase-1-c-r-t-nhi-u-func-v-t-nh-n-ng-c-n/260527-gig-SUMMARY.md
@src/lib/foundation.e2e.test.ts
@prisma/schema.prisma
@CLAUDE.md

<interfaces>
Prisma schema fields available now:
- User: id, email, name, isActive, createdAt, updatedAt.
- Workspace: id, name, slug, isActive, createdAt, updatedAt.
- WorkspaceMembership: id, userId, workspaceId, role, isActive, createdAt, updatedAt, unique(userId, workspaceId, role).
- LegalRequest: id, workspaceId, title, status, createdById, assignedSpecialistId?, assignedReviewerId?, createdAt, updatedAt.
- RequestAssignment: id, requestId, userId, kind, reason?, createdAt, createdById. No updatedAt.
- Document: id, workspaceId, requestId, title, createdAt, updatedAt. No version field.
- Review: id, workspaceId, requestId, documentId, reviewerId, createdAt, updatedAt. No status/comment field.
- VaultFile: id, workspaceId, requestId, storageKey, filename, createdAt, updatedAt. No metadata field.
- WorkflowTransition: id, requestId, actorId, fromStatus, toStatus, reason?, createdAt. No updatedAt.
- AuditEvent: id, actorId?, workspaceId, action, targetType, targetId, requestId?, correlationId?, metadataSummary?, createdAt. No updatedAt.

Existing helper patterns:
- `withFoundationSeed` seeds DB thật and always calls scoped cleanup.
- Cleanup must remain scoped; current cleanup uses seeded ids, workspace id, email prefix, correlation prefix.
- Verification command must pass DATABASE_URL from shell env only, never source code.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Split database model lifecycle into focused real-DB tests</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <behavior>
    - Test User insert via seed, update name, deactivate via isActive=false, cleanup deletion via scoped cleanup assertion.
    - Test Workspace insert via seed, update name/slug-safe field if needed, deactivate via isActive=false, cleanup deletion.
    - Test WorkspaceMembership insert via seed, update role/isActive by creating/updating allowed unique row, cleanup deletion.
    - Test LegalRequest insert via seed, update title/status through direct Prisma only where lifecycle test needs raw model behavior, cleanup deletion.
    - Test RequestAssignment insert specialist/reviewer rows, update nullable reason if possible by delete/create if no updatedAt expectation, cleanup deletion.
    - Test Document insert/update title/delete cleanup using actual fields only; do not invent version fields.
    - Test Review insert/delete cleanup using actual fields only; do not invent status/comment fields.
    - Test VaultFile insert/update storageKey/filename/delete cleanup using actual fields only; do not invent metadata fields.
    - Test WorkflowTransition insert via `transitionRequestStatus`, raw relation read/count, cleanup deletion.
    - Test AuditEvent insert validation through `recordAuditEvent`, safe metadataSummary, no raw object metadata, cleanup deletion.
  </behavior>
  <action>
    Refactor existing six broad tests into many focused `test(...)` blocks in the same file only. Target roughly 25-40 `test(...)` blocks total. Keep existing imports unless needed by new tests. Use `withFoundationSeed` for isolated DB setup per test. Add helper assertions only if they reduce repeated code without hiding model-specific expectations. Preserve `assertSafeDatabaseUrl`, `FOUNDATION_E2E_PREFIX`, scoped seed cleanup, and no hardcoded DB URL. Do not modify Prisma schema, service code, package files, or app code.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    <automated>node --test --import tsx src/lib/foundation.e2e.test.ts</automated>
  </verify>
  <done>`src/lib/foundation.e2e.test.ts` has focused model-level tests for all 10 listed models, total test count roughly 25-40, all pass against real DB.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Preserve service/function behavior coverage with detailed assertions</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <behavior>
    - RBAC helpers return true for allowed workspace/request/document/review/vault access and false for unrelated/inactive user or membership cases.
    - Audit writer persists safe summaries, rejects object metadataSummary, rejects summaries longer than 500 chars, and creates append-only rows rather than updating existing audit events.
    - Workflow helpers expose allowed transitions, reject invalid jumps, persist legalRequest status, workflowTransition row, and audit row in one service path.
    - Admin user service creates user, updates role/membership, assigns workspace membership, deactivates user, and writes expected audit events.
  </behavior>
  <action>
    Keep service behavior tests as separate focused `test(...)` blocks, not one giant service test. Reuse existing service imports: `canAccessWorkspace`, `canAccessRequest`, `canAccessDocument`, `canAccessReview`, `canAccessVaultFile`, `recordAuditEvent`, `getAllowedTransitions`, `transitionRequestStatus`, `createAdminUser`, `updateAdminUserRole`, `assignUserToWorkspace`, `deactivateAdminUser`. Track any admin-created user id in `seed.userIds` before assertions can fail so cleanup removes it. Do not add mocks. Do not add DB URL string to source.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    <automated>node --test --import tsx src/lib/foundation.e2e.test.ts</automated>
  </verify>
  <done>Existing Phase 1 services/functions have real DB E2E assertions split into focused tests and still pass with scoped cleanup.</done>
</task>

<task type="auto">
  <name>Task 3: Audit cleanup and safety constraints</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <action>
    Review final file for safety constraints. Ensure no `deleteMany({})`, no `$executeRaw`, no `$queryRaw`, no `TRUNCATE`, no unscoped SQL delete, no mock/stub replacement, and no committed database URL. Ensure cleanup covers any new ids introduced by new tests: extra users get pushed to `seed.userIds`; extra model rows either use seeded request/workspace ids or are explicitly deleted by scoped cleanup. Ensure tests use actual schema fields only: no Document version, no Review status/comment, no VaultFile metadata, no WorkflowTransition updatedAt, no AuditEvent updatedAt.
  </action>
  <verify>
    <automated>npm run typecheck</automated>
    <automated>node --test --import tsx src/lib/foundation.e2e.test.ts</automated>
    <automated>node -e "const fs=require('fs');const s=fs.readFileSync('src/lib/foundation.e2e.test.ts','utf8'); if(/deleteMany\s*\(\s*\{\s*\}\s*\)/.test(s)||/\$executeRaw|\$queryRaw|TRUNCATE|postgresql:\/\//i.test(s)||/mock/i.test(s)) process.exit(1);"</automated>
  </verify>
  <done>Safety grep passes, E2E passes, cleanup remains scoped and repeatable.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| test runner -> dev database | Test process mutates real PostgreSQL dev/test database through Prisma. |
| service helpers -> Prisma | RBAC, audit, workflow, admin services enforce backend rules before DB writes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|---|---|---|---|---|
| T-kby-01 | Tampering | `cleanupFoundationE2E` | mitigate | Keep cleanup scoped to seeded ids, workspace id, email prefix, correlation prefix; forbid `deleteMany({})` and raw delete/truncate SQL. |
| T-kby-02 | Information Disclosure | `AuditEvent.metadataSummary` tests | mitigate | Assert audit writer rejects object metadata and >500 char summaries; do not store raw legal content. |
| T-kby-03 | Elevation of Privilege | RBAC/admin service tests | mitigate | Assert inactive/unrelated access denied and admin mutations require coordinator/super admin service path. |
| T-kby-04 | Repudiation | workflow/admin/audit service tests | mitigate | Assert workflow/admin actions write expected `AuditEvent` rows with correlation ids. |
</threat_model>

<verification>
Run:
1. `npm run typecheck`
2. `node --test --import tsx src/lib/foundation.e2e.test.ts` with safe local/dev/test `DATABASE_URL` already set in shell env.
3. Safety grep command from Task 3.

DATABASE_URL only shell env. Do not write URL into source or planning artifacts.
</verification>

<success_criteria>
- Single modified source file: `src/lib/foundation.e2e.test.ts`.
- Roughly 25-40 focused `test(...)` blocks.
- All 10 requested models have insert/update/delete cleanup or lifecycle coverage based on actual schema fields.
- RBAC, audit writer, workflow transition, admin user service behavior covered against real DB.
- No unscoped cleanup, raw destructive SQL, mocks, or DB URL in source.
</success_criteria>

<output>
After completion, create `.planning/quick/260527-kby-m-r-ng-e2e-phase-1-th-nh-coverage-chi-ti/260527-kby-SUMMARY.md`.
</output>
