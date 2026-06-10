import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['vi', 'en', 'zh', 'ja'],
  defaultLocale: 'vi',
  localePrefix: 'always',
});
