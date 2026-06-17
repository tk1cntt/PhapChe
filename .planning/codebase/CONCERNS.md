# Codebase Concerns

**Analysis Date:** 2026-06-17

## Tech Debt

**Dual Database Provider Abstraction:**
- Issue: `src/auth.ts:9` uses `process.env.NODE_ENV === "production"` to switch between SQLite and PostgreSQL providers at runtime
- Files: `src/auth.ts`
- Impact: Code paths differ between dev/prod without compile-time safety. SQLite lacks enum support (schema uses String fields with comments as pseudo-enums)
- Fix approach: Standardize on PostgreSQL for all environments, or use a proper multi-tenant migration strategy

**Type Safety Bypass in Routing Service:**
- Issue: `src/lib/routing/routing-service.ts` defines `RoutingPrisma` type with untyped `unknown` parameters
- Files: `src/lib/routing/routing-service.ts`
- Impact: No compile-time validation of Prisma query parameters
- Fix approach: Use proper Prisma types or generate typed client methods

**Hardcoded Review Comments:**
- Issue: `src/lib/reviews/review-service.ts` has Vietnamese hardcoded strings for transition reasons
- Files: `src/lib/reviews/review-service.ts`
- Impact: Not localizable, inconsistent with i18n architecture
- Fix approach: Extract to i18n keys or make reason parameter required

**Console Logging in Production Code:**
- Issue: 58 console.log/console.error statements found across 42 files
- Files: Multiple files in `src/components/admin/*.tsx`, `src/app/api/**/*.ts`
- Impact: Pollutes server logs, potential information leakage
- Fix approach: Replace with structured logging (e.g., pino, winston) with appropriate log levels

**Dev-Only Fallback Secrets:**
- Issue: `src/lib/documents/vault-service.ts` falls back to `'dev-vault-download-secret'` in development/test
- Files: `src/lib/documents/vault-service.ts`
- Impact: Weak HMAC secret in dev could be exploited if NODE_ENV is misconfigured
- Fix approach: Fail fast if secret is missing in non-test environments

**Debug Route Present:**
- Issue: `src/app/api/debug-session/route.ts` exists - debug-only endpoint
- Files: `src/app/api/debug-session/route.ts`
- Impact: Could expose session data if deployed to production
- Fix approach: Remove or protect with environment check

**S3 Storage Not Implemented:**
- Issue: Migration command exists but S3StorageProvider not implemented
- Files: `src/lib/storage/commands/migrate.ts:205`
- Impact: Cannot move from local storage to cloud
- Fix approach: Implement S3 provider following the existing `LocalStorageProvider` pattern

## Known Bugs

**Role Definition Inconsistency:**
- Issue: `src/app/api/admin/users/route.ts` defines `ADMIN_ROLES` including 'audit_admin', but `src/app/api/admin/requests/route.ts` only has 'super_admin', 'coordinator_admin'
- Files: `src/app/api/admin/users/route.ts`, `src/app/api/admin/requests/route.ts`
- Trigger: Users with 'audit_admin' role can access user endpoints but not request endpoints
- Workaround: Ensure only 'super_admin' and 'coordinator_admin' are assigned in practice

**Duplicate Workflow Logic:**
- Issue: `src/lib/routing/routing-service.ts` replicates `REQUEST_TRANSITIONS` logic from `src/lib/workflow/request-workflow.ts`
- Files: `src/lib/routing/routing-service.ts`, `src/lib/workflow/request-workflow.ts`
- Trigger: Adding new statuses requires updates in two places
- Workaround: Import and reuse `getAllowedTransitions` from workflow module

**Empty Return Patterns:**
- Issue: Some services return empty arrays on empty results; others return null
- Files: Multiple
- Impact: Inconsistent handling of empty states
- Workaround: Document expected return types consistently

## Security Considerations

**HMAC Signature Timing Attack Protection:**
- Positive: `src/lib/documents/vault-service.ts` uses `timingSafeEqual` for signature verification
- Risk: But fallback to `false` on any exception could mask other security issues

**Workspace Isolation in RBAC:**
- Positive: `src/lib/security/rbac.ts` properly checks workspace membership
- Risk: Multiple database queries per authorization check
- Recommendations: Consider caching active memberships

**Trusted Origins Not Environment-Based:**
- Issue: `src/auth.ts` hardcodes localhost ports 3000-3005 plus baseURL
- Files: `src/auth.ts`
- Risk: In production, these localhost origins may be ignored
- Recommendations: Move trusted origins to environment configuration

**Session Duration:**
- Positive: `src/auth.ts` sets 7-day sessions with daily refresh
- Risk: Long-lived sessions increase window of compromise
- Recommendations: Consider shorter session duration or re-authentication for sensitive operations

## Performance Bottlenecks

**N+1 Query Pattern in RBAC:**
- Issue: `src/lib/security/rbac.ts` `canAccessRequest` performs 3 sequential database queries
- Files: `src/lib/security/rbac.ts`
- Cause: Each authorization check touches the database multiple times
- Improvement path: Combine queries using Prisma `include`

**No Connection Pooling Configuration:**
- Issue: `src/lib/prisma.ts` creates PrismaClient without explicit connection pool settings
- Files: `src/lib/prisma.ts`
- Impact: Default pool settings may not be optimal for production
- Improvement path: Configure `datasourceUrl` with pool settings for PostgreSQL production

**Vault File Listing Without Pagination:**
- Issue: `src/lib/documents/vault-service.ts` `listVaultFiles` returns all files without pagination
- Files: `src/lib/documents/vault-service.ts`
- Impact: Requests with many attachments will load slowly
- Improvement path: Add pagination options

## Fragile Areas

**Intake Questions Form:**
- Files: `src/components/create-request/IntakeQuestionsForm.tsx`
- Why fragile: `useImperativeHandle` with `isValid()` and `getAnswers()` exposes internal state
- Safe modification: Test wizard flow end-to-end after any changes

**Create Request Form State Machine:**
- Files: `src/components/create-request/CreateRequestForm.tsx`
- Why fragile: Manual step management with `currentStep` state (1-4), side effects in `handleNext`
- Safe modification: Add integration tests for step progression

**Message Polling Endpoint:**
- Files: `src/app/api/messages/poll/route.ts`
- Why fragile: Long-polling pattern with error handling that could leave clients hanging
- Safe modification: Test timeout behavior and connection cleanup

**Admin Dashboard Client Components:**
- Files: `src/components/admin/*.tsx`
- Why fragile: Multiple `console.log` stubs indicate incomplete functionality
- Safe modification: Implement missing handlers before production use

## Scaling Limits

**Workspace-Based Multi-Tenancy:**
- Current capacity: Single workspace per session (enforced by `activeWorkspaceId` in session)
- Limit: Users cannot easily switch workspaces or view cross-workspace data
- Scaling path: Add workspace switcher UI, implement cross-workspace queries for super_admin

**SQLite Development Constraint:**
- Current capacity: SQLite for dev, PostgreSQL for production
- Limit: Dev environment may not catch PostgreSQL-specific bugs
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

*Concerns audit: 2026-06-17*
