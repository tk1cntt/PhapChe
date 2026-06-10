# Phase 21: gap-validation - Context

**Gathered:** 2026-06-10 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Close gaps from v1.1 audit — validate Phase 18 e2e tests, fix login redirect URL with i18n, verify auth routes integration. This is a gap closure phase (closes INT-01, FLOW-01, FLOW-02).

**In scope:**
- Phase 18 e2e test validation (which tests exist, run them, fix failures)
- Login redirect URL fix: redirect after login should go to `/vi/intake` (not `/intake`)
- Auth routes integration verification with i18n locale prefix
- Customer dashboard i18n routing verification

**Out of scope:**
- New e2e test creation beyond Phase 18 scope
- Full Phase 20 i18n verification (that's Phase 20's own verification)
- TypeScript error fixes (Phase 22)

</domain>

<decisions>
## Implementation Decisions

### Phase 18 E2E Test Validation
- **D-01:** Validate existing Phase 18 e2e tests exist and are runnable
- **D-02:** Run full e2e suite against current codebase
- **D-03:** Document which tests pass/fail with clear pass criteria
- **D-04:** Fix any test failures that are actual bugs (not test setup issues)

### Login Redirect URL Fix
- **D-05:** After successful login, redirect to `/vi/intake` (Vietnamese as default locale per Phase 20)
- **D-06:** This fixes INT-01 from v1.1 audit
- **D-07:** Verify redirect works in both `/sign-in` (unprefixed) and locale-prefixed contexts

### Auth Routes Integration with i18n
- **D-08:** Verify middleware correctly handles auth checks for locale-prefixed routes
- **D-09:** Unauthenticated users hitting `/[locale]/admin/...` should redirect to `/sign-in`
- **D-10:** Authenticated users should land on the locale-prefixed dashboard after login
- **D-11:** This fixes FLOW-01 and FLOW-02 from v1.1 audit

### Customer Dashboard i18n Routing
- **D-12:** Verify `/[locale]/customer/...` routes render correctly
- **D-13:** Confirm customer dashboard displays in the correct locale
- **D-14:** Test locale switching from customer dashboard works

### Verification Strategy
- **D-15:** Use Playwright e2e tests for end-to-end validation
- **D-16:** Include HTTP status checks for route availability
- **D-17:** Include screenshot capture for visual verification where appropriate

### Claude's Discretion
- Exact implementation of the redirect fix (middleware vs page-level)
- Which specific test assertions to add for comprehensive coverage
- Test data seeding approach for e2e tests

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/20-internationalization/20-CONTEXT.md` — Phase 20 decisions including locale routing and login redirect behavior
- `.planning/phases/18-ui-test-cases/18-CONTEXT.md` — Phase 18 e2e test scope and structure

### i18n Infrastructure
- `src/middleware.ts` — Auth + i18n middleware integration point
- `src/app/(auth)/sign-in/page.tsx` — Sign-in page with redirect logic
- `src/routing.ts` — Locale list and default locale definition
- `src/auth.ts` — Better Auth instance

### Customer Dashboard
- `src/app/customer/page.tsx` — Customer dashboard entry
- `src/app/[locale]/customer/page.tsx` — Locale-prefixed customer dashboard

### E2E Test Infrastructure
- `e2e/` — Existing e2e test directory
- `playwright.config.ts` — Playwright configuration
- `.planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs` — Existing validation pattern

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `src/middleware.ts` — Combined i18n/auth middleware; redirect logic lives here
- `e2e/*.spec.ts` — Existing e2e test files from Phase 18
- Playwright test infrastructure already configured

### Established Patterns
- Login redirect should preserve locale context or default to `vi`
- Locale-prefixed routes use `[locale]` segment pattern
- Auth checks use `requireAppSession()` from `src/lib/security/session.ts`

### Integration Points
- Sign-in page → middleware → locale-prefixed dashboard
- Auth routes (`/sign-in`) are unprefixed, app routes are locale-prefixed
- Customer dashboard under `[locale]/customer/...` pattern

</codebase_context>

<specifics>
## Specific Ideas

- Login redirect fix: After successful authentication, redirect to `/vi/intake` (Phase 20 default locale)
- E2e validation: Run existing Phase 18 tests to verify current state
- Gap closure: INT-01 (login redirect), FLOW-01 (auth routes), FLOW-02 (customer dashboard i18n)

</specifics>

<deferred>
## Deferred Ideas

- TypeScript error fixes — Phase 22 (Tech Debt Cleanup)
- Pre-existing typecheck failures — Phase 22
- Full i18n verification across all pages — covered by Phase 20 verification

---

*Phase: 21-gap-validation*
*Context gathered: 2026-06-10 (auto mode)*
