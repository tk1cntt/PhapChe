# Phase 20: internationalization - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up Next.js i18n infrastructure with locale routing, header language switcher, and 4-language support (Vietnamese, English, Chinese, Japanese). Extract all UI strings from pages into translation JSON files. Replace hardcoded strings in pages with `t()` calls. Works alongside existing auth/session flow without breaking changes.

</domain>

<decisions>
## Implementation Decisions

### Locale Routing Strategy
- **D-01:** Use sub-path routing (`/en/...`, `/zh/...`, `/ja/...`) — standard next-intl approach
- **D-02:** Default locale is `vi` (Vietnamese)
- **D-03:** Locale detection from URL path, not domain or query params

### Middleware Integration
- **D-04:** Integrate i18n middleware with existing auth middleware
- **D-05:** Auth routes (`/sign-in`, `/api/auth`) remain without locale prefix
- **D-06:** Protected routes require locale prefix after i18n middleware processes
- **D-07:** Language switcher updates URL to include locale prefix

### Page Structure
- **D-08:** Use `[locale]` route group pattern: `/[locale]/admin/...`, `/[locale]/customer/...`
- **D-09:** Root layout provides locale context via `NextIntlClientProvider`
- **D-10:** Existing translation files at `src/messages/{vi,en,zh,ja}.json` remain as source of truth

### String Extraction Priority
- **D-11:** Priority 1: Customer-facing pages (`/intake`, `/customer/*`)
- **D-12:** Priority 2: Auth pages (`/sign-in`)
- **D-13:** Priority 3: Admin/Specialist/Reviewer pages
- **D-14:** Server actions and error messages may remain hardcoded (not translatable via `useTranslations`)

### Translation Coverage
- **D-15:** Translation files already contain: Nav, Breadcrumb, RequestStatus, Actions, Intake, Common, Language keys
- **D-16:** Pages must import and use `useTranslations()` hook from `next-intl`
- **D-17:** Dynamic content (user names, dates, numbers) handled by Intl APIs, not translation files

### Language Switcher
- **D-18:** LanguageSwitcher component already exists at `src/components/LanguageSwitcher.tsx`
- **D-19:** Switcher uses flags and labels for 4 locales: vi 🇻🇳, en 🇺🇸, zh 🇨🇳, ja 🇯🇵
- **D-20:** LanguageSwitcher updates locale in URL path

### Auth Flow
- **D-21:** Sign-in page should be translatable but not require locale prefix (same for all locales)
- **D-22:** After login, redirect to locale-prefixed dashboard

### Claude's Discretion
- Exact component placement in layouts (header position, dropdown styling)
- Translation key naming conventions for new pages
- Whether to use server component `getTranslations()` or client `useTranslations()`
- Fallback strategy for missing translation keys

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### i18n Configuration
- `src/routing.ts` — Existing locale routing configuration (vi, en, zh, ja)
- `src/i18n.ts` — Existing next-intl server config (needs update for dynamic locale)
- `src/messages/vi.json` — Vietnamese translation source (Nav, Actions, RequestStatus, etc.)
- `src/messages/en.json` — English translations
- `src/messages/zh.json` — Chinese translations
- `src/messages/ja.json` — Japanese translations
- `src/components/LanguageSwitcher.tsx` — Existing language switcher component

### Middleware and Auth
- `src/middleware.ts` — Existing auth middleware (needs i18n integration)
- `src/app/layout.tsx` — Root layout (needs locale provider)
- `src/lib/security/session.ts` — `requireAppSession()` for protected routes

### Next-intl Documentation
- `next-intl` v4.x App Router integration with `[locale]` segment
- `NextIntlClientProvider` setup in client layout
- `useTranslations` hook usage in client components
- `getTranslations` usage in server components

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/LanguageSwitcher.tsx` — Already implements dropdown with flags and locale switching
- `src/routing.ts` — Already defines 4 locales with `defineRouting`
- `src/messages/*.json` — Translation files with common UI keys already populated

### Established Patterns
- Next.js App Router with route groups (admin, customer, specialist, reviewer)
- Ant Design components for UI (Dropdown, Button already used in LanguageSwitcher)
- `requireAppSession()` for route protection
- Prisma + service layer for data access

### Integration Points
- `src/app/layout.tsx` — Root layout needs `NextIntlClientProvider` wrapper
- `src/middleware.ts` — Needs to use `next-intl/middleware` for locale routing
- `src/app/[locale]/layout.tsx` — New locale-specific layout for locale context
- Route pages need to be moved under `[locale]` segment or use locale detection

### Migration Strategy
- Existing pages can stay in place, wrapped with `useTranslations()`
- OR move pages to `[locale]` segment for clean sub-path routing
- LanguageSwitcher Link needs `locale` prop to switch properly

</code_context>

<specifics>
## Specific Ideas

- Customer-facing pages should be translated first for maximum user value
- Auth error messages in server actions may remain in Vietnamese (server-side limitation)
- Sub-path routing is the standard next-intl pattern for App Router

</specifics>

<deferred>
## Deferred Ideas

- Translation of user-uploaded content (documents, chat messages) — separate phase
- RTL language support — not applicable (no RTL languages in scope)
- Browser language auto-detection on first visit — deferred unless easy to implement
- Locale-specific date/number formatting beyond `Intl` API — deferred

---

*Phase: 20-internationalization*
*Context gathered: 2026-06-08*
