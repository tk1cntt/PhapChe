# Codebase Concerns

**Analysis Date:** 2026-06-12

## Tech Debt

**Hardcoded Vietnamese Messages:**
- Issue: Error messages use hardcoded Vietnamese text instead of i18n keys
- Files: `src/app/[locale]/admin/vault/actions.ts:31`, `src/app/[locale]/admin/vault/actions.ts:56`
- Impact: Language not properly localized, violates i18n architecture
- Fix approach: Replace hardcoded strings with t() calls using i18n keys

**Incomplete Wizard Step Implementation:**
- Issue: Steps 3 and 4 in CreateRequestForm.tsx are placeholder divs with no functionality
- Files: `src/components/create-request/CreateRequestForm.tsx:64-71`
- Impact: User workflow is incomplete, no document upload or review step
- Fix approach: Implement document upload component and review summary panel

**Type Safety Workarounds:**
- Issue: Multiple `as any` and `as unknown` casts indicate TypeScript type mismatches
- Files:
  - `src/lib/prisma.ts:3` - globalThis cast
  - `src/lib/intake/intake-service.ts:84,93` - questionSchema casting
  - `src/app/[locale]/[workspaceSlug]/create/page.tsx:23` - session role access
  - `src/app/specialist/requests/[requestId]/page.tsx:192` - template variable schema
  - `src/app/[locale]/customer/cases/page.tsx:116` - status type
- Impact: Runtime type errors possible, hides potential bugs
- Fix approach: Define proper TypeScript interfaces for all API responses and session types

**Debug Console Statements:**
- Issue: Multiple console.log/error statements left in production code
- Files: `src/app/[locale]/[workspaceSlug]/messages/components/MessagesContainer.tsx:40`, `src/components/create-request/FloatingChatButton.tsx:22`, `src/app/[locale]/admin/AdminDashboardClient.tsx:225-227`, and many API routes
- Impact: Pollsutes browser console, potential information leakage
- Fix approach: Replace with proper logging framework or remove

**TODO Comment:**
- Issue: API integration for sending messages not implemented
- Files: `src/app/[locale]/[workspaceSlug]/messages/components/MessagesContainer.tsx:41`
- Impact: Messages cannot be sent - core functionality missing
- Fix approach: Implement server action or API endpoint for message sending

## Known Issues

**Hardcoded Locale in Auth Middleware:**
- Symptom: Unauthenticated users always redirected to `/vi/sign-in` regardless of current locale
- Files: `src/middleware.ts:26`
- Trigger: Accessing any protected route without session
- Workaround: Users manually navigate to correct locale sign-in page

**Database Provider Switching:**
- Symptom: SQLite used in development, PostgreSQL in production via runtime check
- Files: `src/auth.ts:9`
- Impact: Differences in behavior between environments (SQLite lacks enum support, different transaction handling)
- Workaround: Ensure all queries work on both providers before deployment

**Trusted Origins Configuration:**
- Risk: Multiple localhost ports hardcoded in production config
- Files: `src/auth.ts:24-31`
- Impact: If better-auth misreads environment, could expose auth to wrong origins
- Current mitigation: baseURL validated at startup

## Security Considerations

**RBAC Performance:**
- Risk: Multiple database queries per authorization check (hasActiveUser, hasActiveMembership)
- Files: `src/lib/security/rbac.ts`
- Current mitigation: Database indexes on userId and workspace membership
- Recommendations: Consider caching session roles, adding Redis/memory cache layer

**No Rate Limiting on API Routes:**
- Risk: Brute force attacks, denial of service
- Files: All API routes under `src/app/api/`
- Recommendations: Implement rate limiting middleware for authentication-sensitive endpoints

**File Upload Validation:**
- Files: `src/lib/intake/upload-service.ts:35-36`
- Current: Basic filename sanitization with regex
- Recommendations: Validate file content type, scan for malicious content, limit file sizes

## Performance Bottlenecks

**RBAC Double DB Lookup:**
- Problem: canAccessRequest queries database, then canAccessWorkspace may query again
- Files: `src/lib/security/rbac.ts:39-75`, `src/lib/security/rbac.ts:33-37`
- Cause: Separate checks for user active status and workspace membership
- Improvement path: Combine checks in single query with JOINs

**Missing Database Indexes:**
- Problem: Some query patterns may lack optimal indexes
- Files: Schema at `prisma/schema.prisma`
- Recommendation: Add composite indexes for common query patterns (workspaceId + status, reviewerId + status)

## Fragile Areas

**Middleware Execution Order:**
- Files: `src/middleware.ts`
- Why fragile: i18n middleware runs before auth check; redirect URL hardcoded breaks locale preservation
- Safe modification: Ensure any middleware changes maintain request/response flow integrity
- Test coverage: No unit tests for middleware behavior

**Workflow State Machine:**
- Files: `src/lib/workflow/request-workflow.ts`
- Why fragile: Status transitions defined as plain object, not enforced at DB level
- Safe modification: Add DB-level constraint or enum if supported
- Test coverage: Has unit tests but not edge cases

**Prisma Client Singleton:**
- Files: `src/lib/prisma.ts`
- Why fragile: Global singleton pattern; potential memory leaks in development with hot reload
- Safe modification: Use connection pooling in production
- Current: Development mode resets global on hot reload

## Scaling Limits

**SQLite in Development:**
- Current: SQLite database at `data/bot.db`
- Limit: Single writer at a time, 281TB max file size
- Scaling path: Migrate to PostgreSQL for production with connection pooling

**Session Storage:**
- Current: Prisma-backed session storage
- Limit: Database becomes bottleneck under high load
- Scaling path: Consider Redis session store for horizontal scaling

## Dependencies at Risk

**better-auth (v1.6.14):**
- Risk: Relatively new library (not as mature as next-auth)
- Impact: API changes could break authentication
- Migration plan: Monitor updates, test thoroughly on version bumps

**next-intl (v4.13.0):**
- Risk: Major version changes may affect routing and middleware behavior
- Impact: i18n routing could break
- Migration plan: Maintain compatibility shim if needed

## Missing Critical Features

**Message Persistence:**
- Problem: Messages component has UI but no API integration (TODO)
- Blocks: Customer communication functionality

**Document Generation Integration:**
- Problem: Wizard step 3 is placeholder
- Blocks: Document creation workflow

**Review Summary/Confirmation:**
- Problem: Wizard step 4 is placeholder
- Blocks: Final review before submission

## Test Coverage Gaps

**Middleware Tests:**
- What's not tested: Auth redirect behavior, locale preservation
- Files: `src/middleware.ts`
- Risk: Silent failures in redirect logic

**RBAC Tests:**
- What's not tested: Role combination edge cases
- Files: `src/lib/security/rbac.ts`
- Risk: Authorization bypass if role logic is wrong

**Component Tests (UI):**
- What's not tested: CreateRequestForm wizard navigation, form validation
- Files: `src/components/create-request/`
- Risk: Broken workflows not caught by CI

**API Integration Tests:**
- What's not tested: End-to-end data flow from API to UI
- Risk: Data transformation bugs between layers

**Error Boundary Tests:**
- What's not tested: Error state rendering and recovery
- Files: `src/app/error.tsx`, `src/app/[locale]/admin/*/error.tsx`
- Risk: Users see blank screens on unexpected errors

---

*Concerns audit: 2026-06-12*
