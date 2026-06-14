'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

const LOCALE_STORAGE_KEY = 'preferred-locale';

export function LocaleSync() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we have a preferred locale saved
    const preferredLocale = localStorage.getItem(LOCALE_STORAGE_KEY);

    // If preferred locale exists and is different from current, redirect
    if (preferredLocale && preferredLocale !== locale) {
      // Replace current locale in pathname with preferred locale
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0 && ['vi', 'en', 'zh', 'ja'].some((l) => l === segments[0])) {
        segments[0] = preferredLocale;
      }
      const newPath = '/' + segments.join('/');

      if (newPath !== pathname) {
        router.replace(newPath);
      }
    }
  }, []); // Run only on mount

  return null;
}
