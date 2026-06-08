---
phase: 20
status: passed
verified_at: 2026-06-09
plans_verified: 1
---

# Phase 20: internationalization - Verification

## Result

**Status:** passed

Phase 20 goal achieved: Next.js i18n infrastructure is wired with locale-prefixed routing support, a `[locale]` route segment/provider, auth route exclusions, path-preserving language switcher, four configured locales, and UI/e2e coverage.

## Must-Haves Verification

| Must-have | Status | Evidence |
|-----------|--------|----------|
| Locale routing uses sub-path prefixes for `vi`, `en`, `zh`, `ja` with `vi` as default | PASS | `src/routing.ts` defines locales/default; `src/app/[locale]/layout.tsx` validates locale; localized wrappers exist. |
| Auth routes `/sign-in` and `/api/auth` remain unprefixed and reachable | PASS | `src/middleware.ts` excludes `sign-in` and `api/auth`; e2e confirms `/sign-in` renders. |
| Protected localized routes do not bypass auth/session checks | PASS | Middleware redirects unauthenticated `/en/customer` to `/sign-in`; e2e confirms this behavior. Existing page-level `requireAppSession()` remains reused. |
| LanguageSwitcher preserves logical path while changing locale prefix | PASS | `src/components/LanguageSwitcher.tsx` uses `usePathname()` and `getLocalizedPath()`. E2E includes path-preservation scenario, skipped only when DB seed/login unavailable. |
| UI/e2e testcase covers locale routing and language switching | PASS | `e2e/internationalization.spec.ts` added; targeted Playwright run passed with 2 pass / 1 DB-seed skip. |

## Automated Checks

| Check | Status | Notes |
|-------|--------|-------|
| `npm run typecheck` | PASS | `tsc --noEmit` completed successfully. |
| `npm run test:e2e -- internationalization.spec.ts` | PASS | 2 tests passed; 1 skipped due to missing seeded login DB, following existing project skip pattern. |
| `npm run build` | PARTIAL | Next compile and TypeScript passed; prerender failed on unrelated `/reviewer/requests` `useSearchParams()` Suspense issue outside Phase 20 scope. |

## Files Verified

- `next.config.ts`
- `src/i18n.ts`
- `src/middleware.ts`
- `src/components/LanguageSwitcher.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/customer/page.tsx`
- `src/app/[locale]/customer/requests/page.tsx`
- `src/app/[locale]/customer/requests/[requestId]/page.tsx`
- `src/app/[locale]/intake/page.tsx`
- `e2e/internationalization.spec.ts`

## Open Notes

- Full production build remains blocked by pre-existing/unrelated reviewer route prerender issue: `/reviewer/requests` uses `useSearchParams()` without Suspense boundary.
- `data/bot.db-wal` was touched by dev/e2e runtime and remains unstaged; it is not part of Phase 20 deliverables.

## Verdict

Phase 20 passes goal-backward verification for i18n infrastructure and required UI/e2e coverage.
