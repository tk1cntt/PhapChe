---
phase: quick-260527-aqj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/foundation.e2e.test.ts
autonomous: true
requirements: [FND-01, FND-02, FND-03, FND-04, FND-05]
must_haves:
  truths:
    - "E2E test chạy trên database thật từ DATABASE_URL, không dùng mock Prisma."
    - "Test tự seed dữ liệu duy nhất cho tenant, users, request, document, review, vault file trước khi assert."
    - "Test cover Phase 1: Prisma tenant models, RBAC helpers, audit writer, workflow transitions, admin user service."
    - "Test cleanup đúng dữ liệu test theo prefix/correlation id trong finally/after hook, không wipe dữ liệu khác."
  artifacts:
    - path: "src/lib/foundation.e2e.test.ts"
      provides: "Node test e2e suite for Phase 1 foundation with real Prisma database"
      contains: "FOUNDATION_E2E_PREFIX"
      exports: []
  key_links:
    - from: "src/lib/foundation.e2e.test.ts"
      to: "DATABASE_URL"
      via: "Prisma client uses real env database"
      pattern: "process\.env\.DATABASE_URL"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/security/rbac.ts"
      via: "real seeded users/workspace/request/document/review/vault file"
      pattern: "canAccess(Request|Document|Review|VaultFile|Workspace)"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/workflow/request-workflow.ts"
      via: "transitionRequestStatus persists request, workflow row, audit row"
      pattern: "transitionRequestStatus"
    - from: "src/lib/foundation.e2e.test.ts"
      to: "src/lib/admin/users.ts"
      via: "create/update/deactivate/assign admin mutations with audit"
      pattern: "createAdminUser|updateAdminUserRole|deactivateAdminUser|assignUserToWorkspace"
---

<objective>
Tạo một e2e test suite nhỏ cho toàn bộ Phase 1 foundation, chạy bằng Node test + tsx trên database thật từ DATABASE_URL.

Purpose: Xác minh foundation không chỉ typecheck/mock-pass mà hoạt động với Prisma schema thật, transaction thật, audit row thật, RBAC row thật, workflow row thật.
Output: `src/lib/foundation.e2e.test.ts` có seed dữ liệu unique, assert Phase 1 capabilities, cleanup scoped trong finally/after hook.
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
@CLAUDE.md
@package.json
@prisma/schema.prisma
@src/lib/prisma.ts
@src/lib/security/session.ts
@src/lib/security/rbac.ts
@src/lib/audit/audit.ts
@src/lib/workflow/request-workflow.ts
@src/lib/admin/users.ts

<interfaces>
Phase 1 contracts executor must use directly:

From `src/lib/security/session.ts`:
```ts
export type AppRole = Role;
export type AppSession = {
  userId: string;
  activeWorkspaceId: string | null;
  roles: AppRole[];
};
```

From `src/lib/security/rbac.ts`:
```ts
export async function canAccessWorkspace(session: AppSession | null | undefined, workspaceId: string)
export async function canAccessRequest(session: AppSession | null | undefined, requestId: string): Promise<boolean>
export async function canAccessDocument(session: AppSession | null | undefined, documentId: string)
export async function canAccessReview(session: AppSession | null | undefined, reviewId: string)
export async function canAccessVaultFile(session: AppSession | null | undefined, vaultFileId: string)
```

From `src/lib/audit/audit.ts`:
```ts
export async function recordAuditEvent(input: {
  actorId?: string | null;
  workspaceId: string;
  action: string;
  targetType: 'USER' | 'WORKSPACE' | 'MEMBERSHIP' | 'REQUEST' | 'ASSIGNMENT' | 'DOCUMENT' | 'REVIEW' | 'VAULT_FILE' | 'WORKFLOW_TRANSITION';
  targetId: string;
  requestId?: string | null;
  correlationId: string;
  metadataSummary?: string | null;
}, db = prisma)
```

From `src/lib/workflow/request-workflow.ts`:
```ts
export function getAllowedTransitions(status: RequestStatus): RequestStatus[]
export async function transitionRequestStatus(input: {
  requestId: string;
  actorId: string;
  toStatus: RequestStatus;
  reason?: string | null;
  correlationId: string;
}): Promise<{ id: string; status: RequestStatus }>
```

From `src/lib/admin/users.ts`:
```ts
export async function createAdminUser({ actor, input, db = prisma })
export async function updateAdminUserRole({ actor, input, db = prisma })
export async function deactivateAdminUser({ actor, input, db = prisma })
export async function assignUserToWorkspace({ actor, input, db = prisma })
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create scoped real-database Phase 1 e2e suite</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <behavior>
    - Test refuses unsafe run when `DATABASE_URL` is missing or contains production-looking database name; allow only URL containing `dev`, `test`, `local`, or `localhost`/`127.0.0.1` host.
    - Test seeds data with unique `FOUNDATION_E2E_PREFIX` plus timestamp/random suffix: workspace slug, users, memberships, legal request, document, review, vault file.
    - Test cleanup runs in `finally`/`after` and deletes only rows connected to seeded workspace/request/users/correlation prefix; never calls `deleteMany({})` without scoped `where`.
  </behavior>
  <action>Create `src/lib/foundation.e2e.test.ts` using Node built-in `node:test`, `node:assert/strict`, and existing `prisma` import. Use real database from `DATABASE_URL`; do not mock Prisma or service modules. Build helpers: `assertSafeDatabaseUrl()`, `seedFoundationE2E()`, `cleanupFoundationE2E(seed)`. Seed one workspace, customer, specialist, reviewer, coordinator_admin, super_admin, active memberships, request initially `draft_intake`, document, review, vault file. Use correlation ids prefixed by `FOUNDATION_E2E_PREFIX`. Cleanup order must respect relations: audit/workflow/review/document/vault/request/membership/user/workspace, scoped by seeded ids or unique prefix. Do not modify production code or package scripts unless test command cannot run without it.</action>
  <verify>
    <automated>npm run prisma:generate && node --test --import tsx src/lib/foundation.e2e.test.ts</automated>
  </verify>
  <done>Test file exists, uses real Prisma database, seeds unique Phase 1 records, and cleanup deletes only seeded records even when assertion fails.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Assert Phase 1 database, RBAC, audit, workflow, admin service behavior</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <behavior>
    - Prisma schema relations work for tenant/workspace/user/membership/request/document/review/vault file with real inserts and reads.
    - RBAC allows customer to access own request, specialist assigned request, reviewer assigned review, coordinator workspace, super admin workspace; denies unrelated or inactive access.
    - Audit writer creates append-only row with string `metadataSummary`, rejects object metadata via runtime cast, rejects over-500 summary.
    - Workflow transition `draft_intake -> intake_submitted` updates request status, creates workflow transition row, creates audit event with `request.status_changed`.
    - Admin service creates user, updates role, assigns workspace membership, deactivates user, and writes expected audit actions.
  </behavior>
  <action>Add focused assertions into same e2e suite. Import and exercise `canAccessWorkspace`, `canAccessRequest`, `canAccessDocument`, `canAccessReview`, `canAccessVaultFile`, `recordAuditEvent`, `getAllowedTransitions`, `transitionRequestStatus`, `createAdminUser`, `updateAdminUserRole`, `assignUserToWorkspace`, `deactivateAdminUser`. Keep test serial in one `test(...)` block or controlled subtests sharing one seed to avoid parallel cleanup collisions. Use exact Phase 1 statuses/roles from `@prisma/client`. Assert persisted rows by querying Prisma after each service call, not by relying only on returned values. Keep UI pages out unless meaningful without browser dependencies; here skip browser UI because current admin pages are static scaffold and no browser test dependency exists.</action>
  <verify>
    <automated>npm run typecheck && node --test --import tsx src/lib/foundation.e2e.test.ts</automated>
  </verify>
  <done>E2E suite covers FND-01 through FND-05 on real database and proves audit/workflow/admin mutations persist expected database rows.</done>
</task>

<task type="auto">
  <name>Task 3: Add safety regression checks for cleanup scope</name>
  <files>src/lib/foundation.e2e.test.ts</files>
  <action>Add assertions or code comments close to cleanup that make unsafe patterns obvious: no unscoped `deleteMany({})`, cleanup filters by seeded ids/prefix, and final assertion confirms seeded workspace/users/audit rows are gone after cleanup while cleanup function never targets unrelated rows. If adding final cleanup verification inside same test is cleaner, call cleanup in `finally`, then query for seeded ids and assert zero. Preserve one-file scope.</action>
  <verify>
    <automated>node --test --import tsx src/lib/foundation.e2e.test.ts</automated>
  </verify>
  <done>Failure path still cleans seeded data, cleanup stays scoped, and e2e command passes repeatedly against same dev/test database.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Test runner -> DATABASE_URL database | Test creates/deletes real database rows; unsafe URL or unscoped cleanup could damage non-test data. |
| Seeded AppSession -> RBAC helpers | Session roles cross into server-side authorization checks; database membership must constrain access. |
| Service calls -> audit/workflow persistence | Admin/workflow mutations write durable audit and workflow rows. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-aqj-01 | T | `cleanupFoundationE2E` | mitigate | Scope every delete by seeded ids or `FOUNDATION_E2E_PREFIX`; forbid unscoped `deleteMany({})` in this file. |
| T-aqj-02 | I | `recordAuditEvent` e2e assertions | mitigate | Assert metadataSummary rejects object/raw metadata and length > 500, matching Phase 1 audit privacy rule. |
| T-aqj-03 | E | RBAC e2e assertions | mitigate | Assert inactive/unrelated users cannot access seeded tenant/request resources. |
| T-aqj-04 | T | `transitionRequestStatus` e2e assertions | mitigate | Assert status change persists only through backend workflow service with workflow row and audit event. |
</threat_model>

<verification>
Run full quick verification:

```bash
npm run prisma:generate
npm run typecheck
node --test --import tsx src/lib/foundation.e2e.test.ts
```

Before running, confirm `DATABASE_URL` points to local/dev/test database. Do not run against production. If database schema absent, run existing safe dev sync command only after confirming non-production URL:

```bash
npm run db:push
```
</verification>

<success_criteria>
- `src/lib/foundation.e2e.test.ts` is only code file created/modified.
- E2E test uses real DATABASE_URL database and no mocks.
- Seed data uses unique prefix and cleanup removes only seeded rows.
- Test covers FND-01 admin user service, FND-02/FND-04 RBAC/tenant models, FND-03 audit writer, FND-05 workflow transitions.
- `npm run typecheck` and `node --test --import tsx src/lib/foundation.e2e.test.ts` pass.
</success_criteria>

<output>
After completion, create `.planning/quick/260527-aqj-b-sung-e2e-test-t-t-c-c-c-t-nh-n-ng-c-a-/260527-aqj-SUMMARY.md`
</output>
