# Codebase Concerns

**Analysis Date:** 2026-06-14

## Tech Debt

**Dual Database Provider Abstraction:**

- Issue: `src/auth.ts:9` uses `process.env.NODE_ENV === "production"` to switch between SQLite and PostgreSQL providers at runtime
- Files: `src/auth.ts`
- Impact: Code paths differ between dev/prod without compile-time safety. SQLite lacks enum support (schema uses String fields with comments as pseudo-enums), making it easy to introduce production-only bugs
- Fix approach: Standardize on PostgreSQL for all environments, or use a proper multi-tenant migration strategy

**Type Safety Bypass in Routing Service:**

- Issue: `src/lib/routing/routing-service.ts:7-16` defines `RoutingPrisma` type with untyped `unknown` parameters for `upsert`, `findMany`, `findFirst`
- Files: `src/lib/routing/routing-service.ts`
- Impact: No compile-time validation of Prisma query parameters. Runtime errors only
- Fix approach: Use proper Prisma types or generate typed client methods

**Hardcoded Review Comments:**

- Issue: `src/lib/reviews/review-service.ts:260` and `:332` have Vietnamese hardcoded strings for transition reasons
- Files: `src/lib/reviews/review-service.ts`
- Impact: Not localizable, inconsistent with i18n architecture used elsewhere
- Fix approach: Extract to i18n keys or make reason parameter required

**Console Logging in Production Code:**

- Issue: 58 console.log/console.error statements found across 42 files
- Files: Multiple, including `src/components/admin/*.tsx`, `src/app/api/**/*.ts`, `src/lib/intake/actions.ts`
- Impact: Pollutes server logs, potential information leakage (e.g., `console.log('[API /operations] page:', page)` exposes pagination params)
- Fix approach: Replace with structured logging (e.g., pino, winston) with appropriate log levels

**Dev-Only Fallback Secrets:**

- Issue: `src/lib/documents/vault-service.ts:49` falls back to `'dev-vault-download-secret'` in development/test
- Files: `src/lib/documents/vault-service.ts`
- Impact: Weak HMAC secret in dev could be exploited if NODE_ENV is misconfigured
- Fix approach: Fail fast if secret is missing in non-test environments; use stronger dev secrets

**Debug Route Present:**

- Issue: `src/app/api/debug-session/route.ts` exists - likely debug-only endpoint
- Files: `src/app/api/debug-session/route.ts`
- Impact: Could expose session data if deployed to production
- Fix approach: Remove or protect with environment check

## Known Bugs

**Role Definition Inconsistency:**

- Issue: `src/app/api/admin/users/route.ts:5` defines `ADMIN_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin']`, but `src/app/api/admin/requests/route.ts:6` only has `['super_admin', 'coordinator_admin']` with comment "removed audit_admin - not in schema"
- Files: `src/app/api/admin/users/route.ts`, `src/app/api/admin/requests/route.ts`, `prisma/schema.prisma`
- Trigger: Users with 'audit_admin' role can access user endpoints but not request endpoints
- Workaround: Ensure only 'super_admin' and 'coordinator_admin' are assigned in practice

**Duplicate Workflow Logic:**

- Issue: `src/lib/routing/routing-service.ts:82-95` replicates `REQUEST_TRANSITIONS` logic from `src/lib/workflow/request-workflow.ts:8-20` in `assignmentPath()` function
- Files: `src/lib/routing/routing-service.ts`, `src/lib/workflow/request-workflow.ts`
- Trigger: Adding new statuses requires updates in two places
- Workaround: Import and reuse `getAllowedTransitions` from workflow module

**Empty Return Patterns:**

- Issue: `src/lib/documents/template-service.ts:268`, `src/lib/documents/draft-service.ts:196` return empty arrays on empty results; `src/components/[locale]/settings/SettingsClient.tsx:111` returns null
- Files: Multiple
- Impact: Inconsistent handling of empty states requires defensive checks downstream
- Workaround: Document expected return types consistently

## Security Considerations

**HMAC Signature Timing Attack Protection:**

- Positive: `src/lib/documents/vault-service.ts:57-66` uses `timingSafeEqual` for signature verification
- Risk: But fallback to `false` on any exception could mask other security issues
- Files: `src/lib/documents/vault-service.ts`

**Workspace Isolation in RBAC:**

- Positive: `src/lib/security/rbac.ts` properly checks workspace membership
- Risk: Multiple database queries per authorization check (hasActiveUser, hasActiveMembership, then resource check)
- Files: `src/lib/security/rbac.ts`
- Recommendations: Consider caching active memberships or using Prisma middleware for consistency

**Trusted Origins Not Environment-Based:**

- Issue: `src/auth.ts:24-31` hardcodes localhost ports 3000-3005 plus baseURL
- Files: `src/auth.ts`
- Risk: In production, these localhost origins may be ignored but represent confusion about deployment
- Recommendations: Move trusted origins to environment configuration

**Session Duration:**

- Positive: `src/auth.ts:21-22` sets 7-day sessions with daily refresh
- Risk: Long-lived sessions increase window of compromise; 7 days may be excessive for legal data
- Recommendations: Consider shorter session duration or re-authentication for sensitive operations

## Performance Bottlenecks

**N+1 Query Pattern in RBAC:**

- Issue: `src/lib/security/rbac.ts:39-75` `canAccessRequest` performs 3 sequential database queries (user check, request fetch, membership check)
- Files: `src/lib/security/rbac.ts`
- Cause: Each authorization check touches the database multiple times
- Improvement path: Combine queries using Prisma `include` or create a single authorization stored procedure

**No Connection Pooling Configuration:**

- Issue: `src/lib/prisma.ts` creates PrismaClient without explicit connection pool settings
- Files: `src/lib/prisma.ts`
- Impact: Default pool settings may not be optimal for production workloads
- Improvement path: Configure `datasourceUrl` with pool settings for PostgreSQL production

**Vault File Listing Without Pagination:**

- Issue: `src/lib/documents/vault-service.ts:110-146` `listVaultFiles` returns all files without pagination
- Files: `src/lib/documents/vault-service.ts`
- Impact: Requests with many attachments will load slowly
- Improvement path: Add pagination options

## Fragile Areas

**Intake Questions Form:**

- Files: `src/components/create-request/IntakeQuestionsForm.tsx`, `src/components/create-request/IntakeQuestionsForm.tsx`
- Why fragile: `useImperativeHandle` with `isValid()` and `getAnswers()` exposes internal state; tight coupling between form state and parent component
- Safe modification: Test wizard flow end-to-end after any changes
- Test coverage: Partial - wizard step navigation not fully tested

**Create Request Form State Machine:**

- Files: `src/components/create-request/CreateRequestForm.tsx`
- Why fragile: Manual step management with `currentStep` state (1-4), side effects in `handleNext`, draft creation on multiple paths
- Safe modification: Add integration tests for step progression, file upload, and submission
- Test coverage: Missing e2e tests for the complete wizard flow

**Message Polling Endpoint:**

- Files: `src/app/api/messages/poll/route.ts`
- Why fragile: Long-polling pattern with error handling that could leave clients hanging
- Safe modification: Test timeout behavior and connection cleanup
- Test coverage: Basic mocking only

**Admin Dashboard Client Components:**

- Files: `src/components/admin/*.tsx`
- Why fragile: Multiple `console.log` stubs (e.g., AdminDashboardClient.tsx:203-206) indicate incomplete functionality
- Safe modification: Implement missing handlers before production use
- Test coverage: API mocking exists but handlers not tested

## Scaling Limits

**Workspace-Based Multi-Tenancy:**

- Current capacity: Single workspace per session (enforced by `activeWorkspaceId` in session)
- Limit: Users cannot easily switch workspaces or view cross-workspace data
- Scaling path: Add workspace switcher UI, implement cross-workspace queries for super_admin

**SQLite Development Constraint:**

- Current capacity: SQLite for dev, PostgreSQL for production
- Limit: Dev environment may not catch PostgreSQL-specific bugs (e.g., enum handling, JSON operators)
- Scaling path: Use Docker Compose PostgreSQL for all local development

## Dependencies at Risk

**better-auth:**

- Risk: Newer library with evolving API
- Impact: Auth.ts relies on specific adapter patterns that may break on major updates
- Migration plan: Pin to minor version, review migration guide before upgrading

**next-intl:**

- Risk: Active development with breaking changes between versions
- Impact: Translation keys and locale routing depend on specific version API
- Migration plan: Test i18n thoroughly after version upgrades

**Prisma:**

- Risk: Schema uses String fields as pseudo-enums due to SQLite limitation
- Impact: Production PostgreSQL could use native enums, but migration path unclear
- Migration plan: Document enum migration strategy before PostgreSQL deployment

## Missing Critical Features

**File Upload Validation:**

- Problem: No file type validation, size limits enforced client-side only
- Blocks: Malicious file uploads
- Priority: High

**Rate Limiting:**

- Problem: No rate limiting on API endpoints
- Blocks: DDoS protection, brute force prevention
- Priority: High

**Input Sanitization:**

- Problem: Rich text content stored without sanitization
- Blocks: XSS prevention for displayed content
- Priority: Medium

**Audit Log Retention:**

- Problem: No defined retention policy for audit events
- Blocks: Compliance requirements, storage planning
- Priority: Medium

## Test Coverage Gaps

**Workflow Tests:**

- What's not tested: Complete workflow transitions with actual role combinations
- Files: `src/lib/workflow/request-workflow.ts`
- Risk: Authorization bypass if role logic changes
- Priority: High

**RBAC Tests:**

- What's not tested: Cross-workspace access attempts, edge cases in role inheritance
- Files: `src/lib/security/rbac.ts`
- Risk: Security vulnerabilities in authorization logic
- Priority: High

**Intake Flow Integration:**

- What's not tested: End-to-end from form submission to request creation with file attachments
- Files: `src/app/api/intake/**/*.ts`, `src/components/create-request/**/*.tsx`
- Risk: Broken onboarding flow
- Priority: High

**Review Service:**

- What's not tested: Checklist validation with various answer combinations
- Files: `src/lib/reviews/review-service.ts`
- Risk: Incorrect review decisions
- Priority: Medium

**Vault Service:**

- What's not tested: Download URL expiration and regeneration
- Files: `src/lib/documents/vault-service.ts`
- Risk: File access leakage
- Priority: Medium

---

*Concerns audit: 2026-06-14*
