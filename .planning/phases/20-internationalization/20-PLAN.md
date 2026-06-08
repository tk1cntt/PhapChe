---
phase: 20
plan: 01
slug: i18n
wave: 1
depends_on: []
files_modified:
  - next.config.ts
  - src/middleware.ts
  - src/i18n.ts
  - src/app/layout.tsx
  - src/app/[locale]/layout.tsx
autonomous: true
type: execute
requirements: []
requirements_addressed: []
must_haves:
  truths:
    - "User có thể truy cập /en/..., /zh/..., /ja/... với locale prefix"
    - "User có thể chuyển đổi ngôn ngữ qua dropdown trong header"
    - "Ngôn ngữ được giữ nguyên khi chuyển trang"
    - "Auth routes (/sign-in, /api/auth) không có locale prefix"
  artifacts:
    - path: next.config.ts
      provides: next-intl plugin configuration
    - path: src/middleware.ts
      provides: i18n routing + auth middleware combined
    - path: src/i18n.ts
      provides: dynamic locale detection
    - path: src/app/layout.tsx
      provides: NextIntlClientProvider wrapper
    - path: src/app/[locale]/layout.tsx
      provides: locale-specific layout with header
  key_links:
    - from: middleware.ts
      to: routing.ts
      via: createMiddleware from next-intl
    - from: layout.tsx
      to: i18n.ts
      via: getRequestConfig consumed by provider
    - from: LanguageSwitcher.tsx
      to: routing.ts
      via: useLocale + Link with locale prop
---

# Plan 20-01 — Internationalization (i18n) Foundation

<objective>
Hoàn thiện i18n infrastructure cho Next.js với locale routing, language switcher, và 4 ngôn ngữ (vi, en, zh, ja). Cập nhật middleware để tích hợp i18n routing, thêm [locale] route group, và tích hợp LanguageSwitcher vào app.

**Trạng thái hiện tại:**
- next-intl v4.13.0 DA duoc cai
- src/routing.ts DA ton tai voi 4 locales
- src/i18n.ts ton tai nhung can update cho dynamic locale
- src/components/LanguageSwitcher.tsx DA ton tai
- src/middleware.ts CHI co auth middleware, CHUA co i18n routing
- src/app/layout.tsx CHUA co NextIntlClientProvider
- next.config.ts CHUA co next-intl plugin
</objective>

<context>
@src/routing.ts
@src/i18n.ts
@src/middleware.ts
@src/components/LanguageSwitcher.tsx
@src/app/layout.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update next.config.ts with next-intl plugin</name>
  <files>
    - next.config.ts
  </files>
  <action>
Update next.config.ts to add the next-intl plugin:

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/middleware/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

This enables the i18n routing for App Router.
  </action>
  <verify>
    <automated>grep -c "createNextIntlPlugin" next.config.ts</automated>
  </verify>
  <done>next.config.ts exports withNextIntl wrapper</done>
</task>

<task type="auto">
  <name>Task 2: Update src/i18n.ts for dynamic locale detection</name>
  <files>
    - src/i18n.ts
  </files>
  <action>
Update src/i18n.ts to extract locale from request URL for dynamic locale detection:

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ request }) => {
  // Get locale from URL path (e.g., /en/admin -> en)
  const pathname = request.nextUrl.pathname;
  const locale = routing.locales.find(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  ) ?? routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

The locale is determined from the URL path segment, matching the sub-path routing strategy (D-01).
  </action>
  <verify>
    <automated>grep -c "pathname" src/i18n.ts && grep -c "routing.locales" src/i18n.ts</automated>
  </verify>
  <done>src/i18n.ts extracts locale from URL path dynamically</done>
</task>

<task type="auto">
  <name>Task 3: Update middleware.ts to integrate i18n with auth</name>
  <files>
    - src/middleware.ts
  </files>
  <action>
Update middleware.ts to combine i18n routing with existing auth middleware (per D-04):

```typescript
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './routing';

// Create i18n middleware first
const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Step 1: Handle i18n routing (redirect to locale prefix)
  const response = await intlMiddleware(request);

  // Step 2: Get locale from i18n middleware result
  const pathname = request.nextUrl.pathname;

  // Step 3: Check auth only for protected routes after i18n routing
  const sessionCookie = request.cookies.get('better-auth.session_token');

  // Skip auth check for auth routes and static files
  if (!pathname.startsWith('/sign-in') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/_next')) {
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return response;
}

export const config = {
  // Match all paths except static files and auth routes
  // I18n middleware handles locale routing for app routes
  matcher: ['/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)'],
};
```

Key points per decisions:
- D-04: Integrate i18n middleware with existing auth middleware
- D-05: Auth routes (/sign-in, /api/auth) remain without locale prefix
- i18n middleware runs first to handle locale prefix routing
  </action>
  <verify>
    <automated>grep -c "createMiddleware" src/middleware.ts && grep -c "routing" src/middleware.ts</automated>
  </verify>
  <done>middleware.ts handles both i18n routing and auth check</done>
</task>

<task type="auto">
  <name>Task 4: Add [locale] route group with layout</name>
  <files>
    - src/app/[locale]/layout.tsx
  </files>
  <action>
Create src/app/[locale]/layout.tsx to wrap all locale-prefixed pages with NextIntlClientProvider:

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import Header from '@/components/Header';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header>
        <LanguageSwitcher />
      </Header>
      {children}
    </NextIntlClientProvider>
  );
}
```

This layout (per D-08, D-09):
- Wraps all pages under [locale] segment
- Provides locale context via NextIntlClientProvider
- Integrates LanguageSwitcher in header

Note: This requires Header component to accept children or LanguageSwitcher as prop. If Header doesn't support this, add LanguageSwitcher to existing header component.
  </action>
  <verify>
    <automated>test -f src/app/[locale]/layout.tsx && grep -c "NextIntlClientProvider" src/app/\[locale\]/layout.tsx</automated>
  </verify>
  <done>src/app/[locale]/layout.tsx exists with NextIntlClientProvider and LanguageSwitcher</done>
</task>

<task type="auto">
  <name>Task 5: Add NextIntlClientProvider to root layout</name>
  <files>
    - src/app/layout.tsx
  </files>
  <action>
Update src/app/layout.tsx to add NextIntlClientProvider for fallback locale context:

```typescript
import type { Metadata } from "next";
import "./globals.css";
import AntdProvider from "@/app/providers/antd-provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Nen tang phap ly SME",
  description: "Nen tang van hanh dich vu phap ly cho SME.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <AntdProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
```

This ensures all pages have access to translations even before hitting [locale] layout.
  </action>
  <verify>
    <automated>grep -c "NextIntlClientProvider" src/app/layout.tsx</automated>
  </verify>
  <done>src/app/layout.tsx includes NextIntlClientProvider wrapper</done>
</task>

<task type="auto">
  <name>Task 6: Verify LanguageSwitcher Link uses proper locale switching</name>
  <files>
    - src/components/LanguageSwitcher.tsx
  </files>
  <action>
Check LanguageSwitcher.tsx to ensure it uses proper locale switching pattern per D-20:

Current implementation already uses:
```tsx
<Link href="/" locale={loc} ...>
```

This is correct for switching locale. However, verify that:
1. The `href` points to the current path with the new locale prefix
2. Or if href="/", ensure middleware redirects correctly

For proper locale switching on current page, the Link should preserve the current path:
```tsx
// Option A: Switch to new locale at root
<Link href={`/${loc}`} locale={loc}>

// Option B: Keep current path with new locale (preferred)
// This requires getting current pathname without locale prefix
```

If current implementation only goes to root, consider updating to preserve current page:
```tsx
const pathname = usePathname();
// Remove existing locale prefix from pathname
const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
<Link href={`/${loc}${pathnameWithoutLocale}`} locale={loc}>
```

Verify with D-20: LanguageSwitcher updates locale in URL path.
  </action>
  <verify>
    <automated>grep -c "locale=" src/components/LanguageSwitcher.tsx</automated>
  </verify>
  <done>LanguageSwitcher uses locale prop on Link for proper switching</done>
</task>

</tasks>

<verification>
```bash
# Verify i18n setup
npm run typecheck
grep -r "NextIntlClientProvider" src/app/
grep -r "createMiddleware" src/middleware.ts

# Check locale routing structure
ls src/app/\[locale\]/
```
</verification>

<success_criteria>
- next.config.ts has next-intl plugin
- src/i18n.ts extracts locale from URL path dynamically
- src/middleware.ts combines i18n + auth middleware
- src/app/layout.tsx has NextIntlClientProvider
- src/app/[locale]/layout.tsx exists with header + LanguageSwitcher
- LanguageSwitcher uses locale prop on Link for switching
- Accessing /en/admin redirects correctly (if auth allows)
- Accessing /sign-in does not require locale prefix
</success_criteria>

<output>
After completion, create `.planning/phases/20-internationalization/20-01-SUMMARY.md`
</output>
