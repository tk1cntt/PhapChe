# Phase 20: internationalization - Research

**Phase:** 20-internationalization
**Date:** 2026-06-09
**Status:** Research complete

## Summary

Phase 20 should complete the existing `next-intl` foundation rather than introduce a new i18n stack. The repo already has `next-intl`, `src/routing.ts`, `src/i18n.ts`, four message JSON files, and `LanguageSwitcher`. Planning should focus on making these work together with Next.js App Router, Better Auth, localized route structure, and e2e coverage.

## Key Findings

### 1. Existing i18n foundation is partially wired

Relevant files:
- `package.json` includes `next-intl` `^4.13.0`.
- `src/routing.ts` defines locales `vi`, `en`, `zh`, `ja` with default `vi`.
- `src/i18n.ts` loads locale messages based on URL path.
- `src/messages/{vi,en,zh,ja}.json` already exist.
- `src/components/LanguageSwitcher.tsx` exists but currently links every locale option to `/`, losing current page context.

Planning implications:
- Do not replace the library.
- Reuse and repair existing files.
- Include a task to confirm/fix `next.config.ts` plugin import. Current file imports `createNextIntlPlugin` from `next-intl/middleware/plugin`; common `next-intl` App Router setup uses `next-intl/plugin`.

### 2. App Router `[locale]` segment is the right route strategy

Locked decision from CONTEXT.md: use sub-path locale routing and `[locale]` route segment.

Expected shape:
- `src/app/[locale]/layout.tsx` provides `NextIntlClientProvider` for localized pages.
- Localized app pages should live under `src/app/[locale]/...` so `/vi/customer`, `/en/customer`, `/zh/customer`, `/ja/customer` share the same implementation pattern.
- Auth route stays outside locale prefix at `src/app/(auth)/sign-in/page.tsx`.

Planning implications:
- Migration must be surgical. Prefer moving or wrapping existing route groups under `[locale]` in controlled batches instead of rewriting page internals.
- Root `src/app/layout.tsx` can remain the global HTML/body/AntD provider boundary. Locale-specific provider belongs under `[locale]/layout.tsx`.
- `html lang` handling may remain default `vi` in root unless implementation chooses a safe dynamic approach. Do not overbuild if it forces broad layout changes.

### 3. Middleware must preserve auth exclusions

Current `src/middleware.ts` already combines `next-intl/middleware` and a cookie-based auth redirect. It excludes `/api/auth`, `/sign-in`, Next static assets, images, and favicon in matcher.

Risks:
- If matcher localizes `/sign-in`, Better Auth/login flow may break.
- If auth check runs before i18n routing, protected locale redirects can behave inconsistently.
- If `/api/*` routes are accidentally localized, API behavior can break.

Planning implications:
- Include explicit acceptance criteria for matcher exclusions:
  - `/sign-in` remains reachable without locale prefix.
  - `/api/auth` remains excluded.
  - Protected app routes redirect unauthenticated users to `/sign-in`.
  - Locale routes such as `/vi/customer` and `/en/customer` are matched as protected app routes.
- Keep `requireAppSession()` behavior unchanged; do not weaken route-level server protection.

### 4. LanguageSwitcher needs path-preserving switching

Current `LanguageSwitcher` uses:
- `useLocale()` for active locale.
- `routing.locales` for locale list.
- Ant Design `Dropdown`/`Button`.
- `Link href="/" locale={loc}` for each language.

Problem:
- Switching language always navigates to root instead of the current page.

Planning implications:
- Include a task to use current pathname and replace existing locale prefix with target locale.
- For unprefixed paths, generate `/${targetLocale}${pathname === '/' ? '' : pathname}` or default route behavior according to final router setup.
- Keep flags/labels unchanged.
- Add e2e coverage that starts on one locale page, switches language, and asserts the logical path is preserved with the new locale prefix.

### 5. Translation extraction should start with customer-facing pages

Locked priorities:
1. Customer-facing pages: intake and customer dashboard/request pages.
2. Auth page where feasible.
3. Internal admin/specialist/reviewer pages.

Planning implications:
- Phase goal/plan count currently suggests one foundation plan. However CONTEXT.md includes translation extraction priority. The planner should include either:
  - a foundation plan that covers provider/routing/switcher and minimal customer-facing string extraction, or
  - split into two plans if needed: infrastructure first, customer translation/test second.
- Do not attempt a full translation of every internal screen if it makes the phase too large. Internal screen extraction can be planned as later tasks only if still within scope and manageable.

### 6. E2E testing is mandatory

Project rule: every UI feature needs a testcase; bug fixes need e2e testcase.

Existing patterns:
- E2E tests live in `e2e/*.spec.ts`.
- `e2e/helpers.ts` has `loginAs(page, role)` and demo credentials.
- Existing auth tests skip when DB is not seeded.

Recommended tests:
- Create `e2e/internationalization.spec.ts`.
- Test 1: unauthenticated protected localized route redirects to `/sign-in`.
- Test 2: after login as customer/admin, localized customer/admin route renders and language switcher can switch from `vi` to `en` while preserving path.
- If DB seeding is unavailable and login remains on `/sign-in`, skip with the existing pattern.

### 7. Security considerations

The locale prefix must not become a bypass:
- Role checks remain in server pages/services via `requireAppSession()`.
- Middleware only provides an early redirect guard, not authorization.
- API routes should not be localized.
- Signed URL/download behavior is not part of this phase and should remain unchanged.

## Recommended Plan Shape

### Plan 20-01: i18n Foundation and Customer Route Coverage

Should include tasks for:
1. Fix/confirm `next.config.ts` next-intl plugin import and i18n request config.
2. Add `[locale]` layout with `NextIntlClientProvider` and route param validation.
3. Integrate/repair middleware locale routing with auth exclusions.
4. Migrate or wrap priority customer-facing routes under `[locale]`.
5. Update `LanguageSwitcher` to preserve logical path while changing locale.
6. Add `e2e/internationalization.spec.ts` for locale routing + language switching.
7. Run targeted verification: typecheck/build where feasible and Playwright e2e test.

If the planner determines moving all route groups is too large for one plan, split into:
- 20-01 Infrastructure: config, middleware, `[locale]` provider, switcher.
- 20-02 Customer routes + e2e: localized intake/customer route migration and tests.

## Validation Architecture

### Validation Dimensions

1. **Locale route availability**
   - `/vi/...`, `/en/...`, `/zh/...`, `/ja/...` routes exist for migrated app pages.
   - Root/default locale behavior redirects or resolves to Vietnamese experience.

2. **Auth compatibility**
   - `/sign-in` remains unprefixed and reachable.
   - `/api/auth` remains unlocalized.
   - Unauthenticated localized protected routes redirect to `/sign-in`.
   - Authenticated localized routes preserve existing role/session behavior.

3. **Provider correctness**
   - Localized pages render without `next-intl` provider errors.
   - `useTranslations()` works in client components under `[locale]`.

4. **Language switcher behavior**
   - Current locale label/flag appears.
   - Switching from `/vi/customer` to English navigates to `/en/customer`, not `/`.
   - Unsupported/missing locale paths should not crash user-facing pages.

5. **Translation source integrity**
   - `src/messages/{vi,en,zh,ja}.json` remain valid JSON.
   - New keys are added consistently across all four files when used by UI.

6. **UI/e2e coverage**
   - At least one Playwright test covers locale routing and language switching.
   - Any route/auth/i18n bug fixed during implementation has e2e coverage.

### Suggested Verification Commands

- `npm run typecheck` — may have known pre-existing failures; executor should record whether failures are pre-existing or introduced.
- `npm run build` — validates Next App Router/i18n configuration.
- `npm run test:e2e -- internationalization.spec.ts` or equivalent Playwright targeted invocation.

## Risks and Pitfalls

- Moving route directories can break relative imports; planner must require reading current files before moves.
- Locale middleware matchers can accidentally catch API/auth routes; acceptance criteria must grep matcher exclusions.
- `LanguageSwitcher` using `Link href="/"` loses path context; must be explicitly fixed.
- Broad internal translation extraction can balloon scope; customer-facing pages first is the locked priority.
- Existing TypeScript errors are known project debt; verification should distinguish pre-existing failures from phase regressions.

## RESEARCH COMPLETE
