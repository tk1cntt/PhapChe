# Phase 20: internationalization - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up Next.js i18n infrastructure with locale routing, header language switcher, and 4-language support (Vietnamese, English, Chinese, Japanese). Complete the existing i18n foundation by updating middleware, adding a `[locale]` route segment, wiring `NextIntlClientProvider`, and keeping the flow compatible with the existing auth/session routing.

This phase clarifies infrastructure and route behavior. It does not translate user-uploaded legal content or add new localization automation.

</domain>

<decisions>
## Implementation Decisions

### Locale Routing Strategy
- **D-01:** Use sub-path routing (`/en/...`, `/zh/...`, `/ja/...`) because it is the standard `next-intl` App Router approach and makes active locale explicit in the URL.
- **D-02:** Default locale is `vi` (Vietnamese).
- **D-03:** Locale is detected from the URL path, not domain, browser header, or query parameter.
- **D-04:** Root/non-locale app entry should redirect or route into the default `vi` experience where appropriate.

### Middleware Integration
- **D-05:** Integrate i18n routing and auth checks in `src/middleware.ts` as a single middleware flow.
- **D-06:** Auth/API auth routes (`/sign-in`, `/api/auth`) remain unprefixed by locale.
- **D-07:** Protected app routes should use locale-prefixed paths after i18n routing runs.
- **D-08:** If an unauthenticated user hits a protected localized route, redirect to `/sign-in` rather than a locale-prefixed sign-in page.

### Page Structure
- **D-09:** Use `[locale]` route segment pattern for app pages that should be localized, e.g. `/[locale]/admin/...`, `/[locale]/customer/...`, `/[locale]/intake`.
- **D-10:** Add a locale layout/provider layer so pages under `[locale]` receive `NextIntlClientProvider` context.
- **D-11:** Preserve the current route-group semantics for admin/customer/specialist/reviewer while introducing locale path prefix.
- **D-12:** Do not create domain routing, locale query params, or a hybrid locale strategy.

### Translation Coverage Priority
- **D-13:** Priority 1 is customer-facing pages: `/intake`, `/customer`, `/customer/requests`, and customer request detail pages.
- **D-14:** Priority 2 is auth UI (`/sign-in`) where feasible without forcing locale prefix.
- **D-15:** Priority 3 is internal admin/specialist/reviewer screens.
- **D-16:** Server actions and deep service-layer error strings may remain hardcoded during this phase if translating them would require wider architectural changes.

### Translation Files and Formatting
- **D-17:** Existing `src/messages/{vi,en,zh,ja}.json` files remain the translation source of truth.
- **D-18:** UI strings in pages/components should use `next-intl` (`useTranslations()` for client components, `getTranslations()` for server components when needed).
- **D-19:** Dynamic data such as user names, request IDs, dates, numbers, legal document titles, and database content should not be stored as static translation keys.
- **D-20:** Date/number formatting can use built-in Intl APIs where straightforward; broad locale-specific formatting polish is deferred.

### Language Switcher
- **D-21:** Keep and integrate the existing `LanguageSwitcher` component.
- **D-22:** Support exactly four locale options: `vi`, `en`, `zh`, `ja`, with existing flag/label presentation.
- **D-23:** Switching language should preserve the current logical page path and replace only the locale prefix, instead of always navigating to `/`.
- **D-24:** Place the switcher in shared header/layout areas where it is visible without redesigning the application shell.

### Auth Flow
- **D-25:** Sign-in remains a shared unprefixed route.
- **D-26:** After successful login, redirect users to a locale-prefixed dashboard path. If no locale context exists, use `vi`.
- **D-27:** i18n changes must not weaken `requireAppSession()` protection or workspace/role isolation.

### Testing Expectations
- **D-28:** Because this is a UI-visible feature, include at least one UI/e2e testcase covering locale routing and language switching.
- **D-29:** If implementation fixes any discovered route/auth/i18n bug, include an e2e testcase reproducing the fixed behavior.

### Claude's Discretion
- Exact translation key naming convention for newly extracted strings.
- Whether an individual component uses client `useTranslations()` or server `getTranslations()`, based on existing component type and minimal-change implementation.
- Exact header placement/styling for the language switcher, as long as it matches current Ant Design layout style.
- Fallback behavior for missing translation keys, provided it does not crash user-facing pages.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and Existing Phase Context
- `.planning/ROADMAP.md` — Phase 20 goal and plan boundary.
- `.planning/phases/20-internationalization/20-CONTEXT.md` — This context file; locked phase decisions for planning.

### i18n Configuration
- `src/routing.ts` — Existing locale list and default locale (`vi`, `en`, `zh`, `ja`).
- `src/i18n.ts` — Existing `next-intl` server request config and locale/message loading.
- `src/messages/vi.json` — Vietnamese translation source.
- `src/messages/en.json` — English translation source.
- `src/messages/zh.json` — Chinese translation source.
- `src/messages/ja.json` — Japanese translation source.
- `src/components/LanguageSwitcher.tsx` — Existing language switcher component to reuse and improve.

### Middleware, Layout, and Auth
- `src/middleware.ts` — Existing combined i18n/auth middleware implementation point.
- `src/app/layout.tsx` — Root app layout and Ant Design provider location.
- `src/app/(auth)/sign-in/page.tsx` — Shared unprefixed sign-in route.
- `src/lib/security/session.ts` — `requireAppSession()` and protected session behavior.
- `src/auth.ts` — Better Auth instance used by app auth flow.
- `src/lib/auth-client.ts` — Client auth integration used by sign-in UI.

### User-Facing Pages for Priority Extraction
- `src/app/intake/page.tsx` — Intake entry page.
- `src/app/intake/components.tsx` — Intake UI components with user-visible strings.
- `src/app/customer/page.tsx` — Customer dashboard.
- `src/app/customer/requests/page.tsx` — Customer request list.
- `src/app/customer/requests/[requestId]/page.tsx` — Customer request detail.

### Next-intl Documentation Topics
- `next-intl` App Router `[locale]` segment setup.
- `next-intl` middleware integration with `defineRouting`.
- `NextIntlClientProvider` usage in layouts.
- `useTranslations()` and `getTranslations()` usage patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/LanguageSwitcher.tsx` — Already implements Ant Design dropdown with flags and labels for the four supported locales; needs path-preserving locale switching.
- `src/routing.ts` — Already defines `vi`, `en`, `zh`, `ja` and default `vi` via `defineRouting`.
- `src/messages/*.json` — Existing translation files are already present and should be extended rather than replaced.
- `src/app/providers/antd-provider.tsx` — Existing UI provider remains part of layout composition.

### Established Patterns
- Next.js 14 App Router with route groups for admin, customer, specialist, reviewer, and auth.
- Ant Design is the established UI library after Phase 14; language switcher/header changes should keep Ant Design style.
- Protected route access relies on Better Auth/session handling and `requireAppSession()`.
- Existing pages mix server components and client components; translation hook choice should respect the current component boundary rather than forcing broad refactors.

### Integration Points
- `src/middleware.ts` is the key integration point for locale routing plus auth redirects.
- `src/app/layout.tsx` currently sets `<html lang="vi">` and wraps children in `AntdProvider`; locale-specific layout/provider work must fit around this.
- New `[locale]` route segment will need to host localized versions of existing app route groups while auth stays outside locale prefix.
- Customer-facing pages and intake components are the first route set to verify after localization.

</code_context>

<specifics>
## Specific Ideas

- Prefer a minimal, surgical implementation: reuse current i18n files/components and avoid redesigning the app shell.
- Customer-facing experience matters most for this phase because SME users are the primary audience for language switching.
- Keep legal/workflow security constraints unchanged: locale routing must not bypass role checks, tenant/workspace checks, signed URL rules, or audit behavior.

</specifics>

<deferred>
## Deferred Ideas

- Translating user-uploaded content, legal documents, chat messages, or database-generated content — future phase.
- Browser-language auto-detection on first visit — deferred unless it falls out naturally from the chosen `next-intl` middleware setup.
- RTL language support — out of scope because supported locales are `vi`, `en`, `zh`, and `ja`.
- Comprehensive locale-specific date/number/currency formatting polish — future refinement beyond basic Intl usage.
- Machine translation workflow or translation management system — out of scope for this infrastructure phase.

</deferred>

---

*Phase: 20-internationalization*
*Context gathered: 2026-06-09*
