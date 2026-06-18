# Codebase Concerns

**Analysis Date:** 2026-06-18

## Tech Debt

**Incomplete S3 Storage Migration:**
- Issue: `S3StorageProvider` not implemented - migration command cannot actually upload files to S3
- Files: `src/lib/storage/commands/migrate.ts:205`
- Impact: Storage migration script runs but only updates database, files stay on local storage
- Fix approach: Implement `S3StorageProvider` class in `src/lib/storage/providers/`

**Type Safety - Excessive `any` Usage:**
- Issue: 231 occurrences of `any` type across 61 files weakens TypeScript guarantees
- Key files with heavy `any` usage:
  - `src/lib/documents/vault-service.test.ts` (7 instances)
  - `src/lib/delivery/delivery-service.test.ts` (9 instances)
  - `src/lib/documents/draft-service.test.ts` (31 instances)
  - `src/app/api/admin/users/[id]/route.ts` (8 instances)
  - `src/app/api/admin/organizations/[id]/route.ts` (6 instances)
- Impact: Runtime errors more likely, IDE assistance limited
- Fix approach: Replace with proper types, use `unknown` with type guards where necessary

**Type Casting with `as never`:**
- Issue: RBAC `hasRole` function casts to `as never` bypassing type safety
- Files: `src/lib/security/rbac.ts:5`
- Code:
  ```typescript
  function hasRole(session: AppSession | null | undefined, role: string) {
    return session?.roles.includes(role as never) ?? false;
  }
  ```
- Impact: Any string passes type check, no compile-time protection
- Fix approach: Use proper role union type with `includes(role as Role)`

**Error Handling Pattern Inconsistency:**
- Issue: Some routes use `error: any` and `console.error`, others have different patterns
- Files: Multiple API routes in `src/app/api/admin/` and `src/app/api/`
- Impact: Inconsistent error response formats, potential information leakage via console
- Fix approach: Standardize error handling with centralized error utilities

## Known Bugs

**Storage Permission Check Uses Wrong Field:**
- Issue: `checkWorkspacePermission` checks `organizationId` instead of `workspaceId`
- Files: `src/lib/storage/storage.service.ts:95`
- Code:
  ```typescript
  const hasPermission = await this.checkWorkspacePermission(input.organizationId, input.createdBy);
  ```
- But `checkWorkspacePermission` queries `workspaceMembership` with `workspaceId`
- Trigger: Upload files with workspace-scoped permissions
- Impact: Permission check always fails or checks wrong workspace
- Workaround: None
- Fix approach: Pass correct `workspaceId` field

**Test Setup File Nearly Empty:**
- Issue: Vitest config references `./tests/setup.ts` but file has only 36 bytes
- Files: `vitest.config.ts:10`, `tests/setup.ts`
- Impact: Tests may not have proper mocks/fixtures configured
- Fix approach: Add proper test setup with test-specific database cleanup

## Security Considerations

**RBAC Role Type Safety Bypass:**
- Risk: Role checking uses loose string comparison without type enforcement
- Files: `src/lib/security/rbac.ts`
- Current mitigation: Runtime checks via Prisma queries
- Recommendations:
  - Define `Role` as a strict union type: `type Role = 'customer' | 'specialist' | 'reviewer' | 'coordinator_admin' | 'super_admin'`
  - Use `includes(role)` with proper type guard
  - Add role validation middleware

**No API Rate Limiting Detected:**
- Risk: DoS attacks, brute force login attempts
- Files: All API routes in `src/app/api/`
- Current mitigation: None visible
- Recommendations: Implement rate limiting middleware for authentication endpoints

**Console Error Logging in Production:**
- Risk: Sensitive information may leak through `console.error` calls
- Files: Multiple API routes log errors directly
- Current mitigation: None visible
- Recommendations:
  - Replace `console.error` with structured logging (e.g., Winston, Pino)
  - Ensure error messages don't expose stack traces or internal paths in production

**SQLite for Production Data:**
- Risk: SQLite has limited concurrency, no network access, single-writer lock
- Files: `prisma/schema.prisma:6-8`
- Current mitigation: `better-auth.ts` uses `sqlite` for dev, expects `postgresql` for production
- Recommendations:
  - Use PostgreSQL in all environments for consistency
  - Add database connection pooling configuration
  - Plan migration path from SQLite

## Performance Bottlenecks

**N+1 Query Pattern in Routing Service:**
- Problem: `getRoutingSuggestions` calls Prisma twice sequentially for specialists and reviewers
- Files: `src/lib/routing/routing-service.ts:215-218`
- Code:
  ```typescript
  const [specialists, reviewers] = await Promise.all([
    suggestionsFor(scopedInput, submission.matterTypeKey, 'specialist'),
    suggestionsFor(scopedInput, submission.matterTypeKey, 'reviewer'),
  ]);
  ```
- Cause: Each `suggestionsFor` call does separate database queries
- Improvement path: Batch queries or use single query with GROUP BY

**Missing Database Index Considerations:**
- Problem: Some queries may lack proper indexes
- Files: `prisma/schema.prisma` - various `@index` declarations
- Areas to verify:
  - Composite indexes for common query patterns
  - Partial indexes for soft-delete queries
- Improvement path: Analyze slow queries with EXPLAIN QUERY PLAN

## Fragile Areas

**RBAC Implementation with Multiple Role Checks:**
- Files: `src/lib/security/rbac.ts`
- Why fragile: Role checking scattered across multiple functions, easy to miss a case
- Safe modification: Add test coverage for each role combination
- Test coverage: Unit tests for RBAC logic recommended

**Workflow State Machine Logic:**
- Files: `src/lib/workflow/request-workflow.ts`
- Why fragile: Status transitions defined in multiple places (`REQUEST_TRANSITIONS`, `canTransitionRequestStatus`)
- Safe modification: Ensure both definitions stay in sync, add transition validation tests
- Test coverage: Verify all status combinations covered

**Intake Submission FK Relation:**
- Files: `prisma/schema.prisma:339`
- Code:
  ```prisma
  matterType        MatterType?  @relation(fields: [workspaceId, matterTypeKey], references: [workspaceId, key])
  ```
- Why fragile: Composite foreign key with optional workspaceId - NULL values may not match
- Safe modification: Ensure workspaceId is always set for MatterType lookups

## Scaling Limits

**Audit Event Retention:**
- Current: No automatic cleanup configured
- Files: `prisma/schema.prisma:610-612` (comment only)
- Comment: "Run periodically (e.g., weekly) to prevent unbounded table growth"
- Limit: AuditEvent table will grow indefinitely
- Scaling path: Implement `cleanupOldAuditEvents()` scheduled job

**Session Storage in SQLite:**
- Current capacity: SQLite handles ~100-1000 concurrent connections poorly
- Files: `prisma/schema.prisma:659-670`
- Limit: Session table becomes bottleneck under load
- Scaling path: Move sessions to Redis or PostgreSQL with connection pooling

## Dependencies at Risk

**Better Auth Plugin:**
- Risk: Version `1.6.14` - verify stability and security updates
- Impact: Authentication failure breaks entire application
- Migration plan: Test with newer versions, monitor changelog for breaking changes

**Prisma Client:**
- Risk: Version `6.19.0` - ensure compatibility with SQLite and PostgreSQL
- Impact: Database operations fail
- Migration plan: Test migrations in staging before production

**Next.js (latest):**
- Risk: Using `latest` tag - may introduce breaking changes
- Files: `package.json:33,37`
- Impact: Build failures on dependency update
- Migration plan: Pin to specific version, test updates in CI

## Missing Critical Features

**File Encryption at Rest:**
- Problem: Files stored without encryption
- Blocks: Compliance requirements for sensitive legal documents
- Priority: High

**Webhook System for External Integrations:**
- Problem: No outbound webhook capability
- Blocks: Third-party system notifications
- Priority: Medium

**Backup/Restore Strategy:**
- Problem: No documented backup procedure
- Blocks: Disaster recovery readiness
- Priority: High

## Test Coverage Gaps

**Unit Test Coverage Missing:**
- What's not tested: Service layer authorization logic, complex business rules
- Files:
  - `src/lib/security/rbac.ts` - no dedicated tests
  - `src/lib/storage/storage.service.ts` - no unit tests
  - `src/lib/delivery/delivery-service.ts` - partial coverage
- Risk: Authorization bypasses may go undetected
- Priority: High

**Integration Test Gaps:**
- What's not tested: Partner API routes, organization management workflows
- Files:
  - `src/app/api/admin/partners/[id]/route.ts` - no tests
  - `src/app/api/admin/organizations/route.ts` - no tests
- Risk: Data integrity issues in partner workflows
- Priority: Medium

**E2E Test Coverage:**
- Current: 17 Playwright specs, most focus on login/dashboard
- Missing:
  - Complete intake flow with file uploads
  - Document review and approval workflow
  - Vault file management end-to-end
  - Multi-user concurrent editing scenarios
- Risk: User-facing workflows may break silently
- Priority: High

**Coverage Enforcement:**
- Problem: No minimum coverage threshold configured
- Files: `vitest.config.ts` has no coverage configuration
- Risk: Coverage may decrease without CI failure
- Priority: Medium

---

*Concerns audit: 2026-06-18*
