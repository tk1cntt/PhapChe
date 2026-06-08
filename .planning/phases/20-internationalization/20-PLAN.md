---
phase: 20
plan: 01
slug: i18n
wave: 1
depends_on: []
files_modified:
  - src/middleware.ts
  - src/app/layout.tsx
  - src/app/[locale]/layout.tsx
  - src/messages/vi.json
  - src/messages/en.json
  - src/messages/zh.json
  - src/i18n.ts
autonomous: true
type: execute
requirements: []
requirements_addressed: []
---

# Plan 20-01 — Internationalization (i18n) Foundation

<objective>
Set up Next.js i18n infrastructure with locale routing, header language switcher, and 4-language support (Vietnamese, English, Chinese, Japanese). Extract all UI strings from pages into translation JSON files. Replace hardcoded strings in pages with `t()` calls.

Target locales: vi (default), en, zh, ja.
</objective>

<must_haves>
- Locale routing via sub-path (/en/..., /zh/..., /ja/...)
- Language switcher in app header (dropdown with flags/labels)
- Translation files: `src/messages/{vi,en,zh,ja}.json`
- UI pages use `t()` for all visible text
- Auth flows (sign-in, errors) are translated
- Works alongside existing auth/session flow (no breaking changes)
</must_haves>

<tasks>

<task id="20-01-01" type="execute">
<title>Install next-intl and configure i18n infrastructure</title>
<read_first>
- src/middleware.ts (existing middleware)
- src/app/layout.tsx (root layout)
</read_first>
<files>
- src/i18n.ts
- src/messages/vi.json
- src/messages/en.json
- src/messages/zh.json
- src/messages/ja.json
- src/middleware.ts
</files>
<action>
1. Install next-intl:
   ```
   npm install next-intl
   ```
2. Create `src/i18n.ts`:
   ```ts
   import { getRequestConfig } from 'next-intl/server';
   import { routing } from './routing';

   export default getRequestConfig(async ({ request }) => {
     const locale = await requestLocale(request, routing.locales, routing.defaultLocale);
     return {
       locale,
       messages: (await import(`./messages/${locale}.json`)).default,
     };
   });
   ```
3. Create `src/routing.ts`:
   ```ts
   import { defineRouting } from 'next-intl/routing';

   export const routing = defineRouting({
     locales: ['vi', 'en', 'zh', 'ja'],
     defaultLocale: 'vi',
   });
   ```
4. Update `src/middleware.ts` to use next-intl middleware:
   ```ts
   import createMiddleware from 'next-intl/middleware';
   import { routing } from './routing';
   export default createMiddleware(routing);
   ```
5. Move `src/app/**` to `src/app/[locale]/**` structure, or use next-intl App Router plugin in next.config.{js,mjs}.
   If keeping existing route groups, configure `next.config.mjs` plugin instead:
   ```js
   import createNextIntlPlugin from 'next-intl/middleware/plugin';
   const withIntl = createNextIntlPlugin();
   export default withIntl(nextConfig);
   ```
6. Create translation files with all UI strings extracted from components (see task 20-01-02).

</action>
<verify>
- npm install next-intl
- grep -r "next-intl" package.json
- grep -r "getRequestConfig" src/i18n.ts
</verify>
<acceptance_criteria>
- `next-intl` in package.json dependencies
- `src/i18n.ts` exports getRequestConfig
- `src/routing.ts` defines 4 locales
- middleware handles locale routing
</acceptance_criteria>
</task>

<task id="20-01-02" type="execute">
<title>Extract UI strings to translation files and add language switcher</title>
<read_first>
- src/app/admin/users/AdminUsersTable.tsx
- src/app/customer/requests/page.tsx
- src/app/requests/[requestId]/page.tsx
- src/app/sign-in/page.tsx (if exists)
- src/app/intake/page.tsx
</read_first>
<files>
- src/messages/vi.json
- src/messages/en.json
- src/messages/zh.json
- src/messages/ja.json
- src/components/LanguageSwitcher.tsx (new)
- src/app/layout.tsx
</files>
<action>
1. Extract all hardcoded Vietnamese strings from UI pages into `src/messages/vi.json` with nested keys:
   ```json
   {
     "Nav": {
       "dashboard": "Dashboard",
       "requests": "Requests",
       "users": "Users"
     },
     "RequestStatus": {
       "draft_intake": "Đang nhập thông tin",
       "intake_submitted": "Đã gửi yêu cầu",
       "triage": "Cần phân loại"
     },
     "Actions": {
       "edit": "Sửa",
       "delete": "Xóa",
       "submit": "Gửi",
       "cancel": "Hủy"
     }
   }
   ```
   For English (en): translate all values to English.
   For Chinese (zh): translate to Simplified Chinese.
   For Japanese (ja): translate to Japanese.

2. Create `src/components/LanguageSwitcher.tsx` (client component):
   ```tsx
   'use client';
   import { useLocale, useTranslations } from 'next-intl';
   import { routing } from '@/routing';
   import Link from 'next/link';
   import { Dropdown } from 'antd';
   
   const LANGUAGE_LABELS = {
     vi: 'Tiếng Việt',
     en: 'English',
     zh: '中文',
     ja: '日本語',
   };
   
   export default function LanguageSwitcher() {
     const locale = useLocale();
     const t = useTranslations();
     return (
       <Dropdown menu={{ items: routing.locales.map(l => ({
         key: l,
         label: (
           <Link href={l} locale={l} legacyBehavior>
             <a>{LANGUAGE_LABELS[l]}</a>
           </Link>
         ),
       }) }} placement="bottomRight">
         <Button>{LANGUAGE_LABELS[locale]}</Button>
       </Dropdown>
     );
   }
   ```

3. Add LanguageSwitcher to root layout or customer/admin header.

4. Replace hardcoded strings in pages with `t()` calls from next-intl.
   Keep error messages in actions.ts as-is (server actions cannot use useTranslations).
   Only translate user-facing UI strings in page/component files.
</action>
<verify>
- src/messages/vi.json exists with RequestStatus, Actions keys
- src/messages/en.json exists with translated values
- src/messages/zh.json exists with Chinese values
- src/messages/ja.json exists with Japanese values
- LanguageSwitcher renders locale switcher
- pages use t() for visible text
</verify>
<acceptance_criteria>
- 4 translation files exist with matching keys
- LanguageSwitcher component renders language dropdown
- Page headers/labels use t() calls
- npm run typecheck passes
</acceptance_criteria>
</task>

</tasks>

<verification>
```bash
npm run typecheck
ls src/messages/
grep -l "RequestStatus" src/messages/*.json
```
</verification>

<success_criteria>
- i18n infrastructure in place
- 4 language files created
- Language switcher visible in UI
- Pages render translated strings based on locale
- Auth/actions (server-side) remain unchanged (hardcoded errors acceptable)
</success_criteria>

## PLANNING COMPLETE
