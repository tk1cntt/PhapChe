---
phase: 20
plan: 01
subsystem: internationalization
tags: [i18n, next-intl, routing, e2e]
key-files:
  created:
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - src/app/[locale]/customer/page.tsx
    - src/app/[locale]/customer/requests/page.tsx
    - src/app/[locale]/customer/requests/[requestId]/page.tsx
    - src/app/[locale]/intake/page.tsx
    - e2e/internationalization.spec.ts
  modified:
    - next.config.ts
    - src/i18n.ts
    - src/middleware.ts
    - src/components/LanguageSwitcher.tsx
metrics:
  tasks_completed: 7
  e2e_tests: 3
---

# Phase 20 Plan 01 Summary — i18n Foundation and Customer Locale Coverage

## Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| 20-01-01 | Fixed next-intl config and request locale loading | Complete |
| 20-01-02 | Added `[locale]` layout and localized route entry points | Complete |
| 20-01-03 | Hardened middleware for locale routing plus auth exclusions | Complete |
| 20-01-04 | Made LanguageSwitcher preserve current logical path | Complete |
| 20-01-05 | Kept message JSON valid; no broad string extraction needed for wrapper routes | Complete |
| 20-01-06 | Added Playwright e2e coverage for locale routing and language switching | Complete |
| 20-01-07 | Ran verification and documented results | Complete |

## What Changed

- `next.config.ts` now uses `next-intl/plugin` with explicit `./src/i18n.ts` request config path.
- `src/i18n.ts` now reads `requestLocale`, validates it against `routing.locales`, and falls back to `routing.defaultLocale`.
- `src/middleware.ts` combines `next-intl` middleware with the existing auth redirect guard while excluding `/sign-in`, `/api/auth`, and static assets.
- `src/app/[locale]/layout.tsx` validates locale params, provides `NextIntlClientProvider`, and exposes `LanguageSwitcher` on localized routes.
- Localized wrappers were added for the priority customer-facing routes:
  - `/[locale]`
  - `/[locale]/customer`
  - `/[locale]/customer/requests`
  - `/[locale]/customer/requests/[requestId]`
  - `/[locale]/intake`
- `LanguageSwitcher` now changes only the locale prefix and preserves the current logical path.
- `e2e/internationalization.spec.ts` covers:
  - `/sign-in` reachable without locale prefix
  - unauthenticated `/en/customer` redirects to `/sign-in`
  - language switching preserves `/customer` path when DB/login is available

## Verification

| Command | Result | Notes |
|---------|--------|-------|
| `npm run build` | Partial pass / blocked by unrelated route | Compile and TypeScript passed; build failed during prerender of `/reviewer/requests` due to existing `useSearchParams()` missing Suspense boundary outside Phase 20 scope. |
| `npm run typecheck` | Passed | `tsc --noEmit` completed successfully. |
| `npm run test:e2e -- internationalization.spec.ts` | Passed | Ran after starting dev server. 2 tests passed, 1 skipped because database login/seed was unavailable. |

## E2E Detail

Targeted Playwright run for `e2e/internationalization.spec.ts` completed successfully:

- PASS: `renders sign-in without locale prefix`
- PASS: `redirects unauthenticated localized customer route to sign-in`
- SKIP: `switches locale while preserving customer path` when login remained on `/sign-in` due to missing seeded database, using the existing project skip pattern.

## Deviations

- Direct subagent execution was skipped due to runtime team-context failures; implementation was executed inline on the main working tree per user instruction.
- Minimal localized route wrappers were used instead of moving all page implementations to avoid broad route refactors.
- Deep customer-facing string extraction was not performed because wrappers reuse existing page implementations; message JSON files remain valid and available for follow-up extraction.
- `npm run build` is not fully green because of an unrelated `/reviewer/requests` prerender issue. It is outside Phase 20 i18n scope and did not appear in TypeScript or targeted e2e checks.

## Self-Check: PASSED

Phase 20 Plan 01 satisfies the must-haves: locale-prefixed routing exists, auth exclusions remain intact, protected localized routes redirect to sign-in, LanguageSwitcher preserves path, and required UI/e2e coverage exists.
