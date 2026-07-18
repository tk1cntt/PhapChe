'use client';

import { useLocale } from 'next-intl';
import { routing } from '@/routing';
import { useRouter, usePathname } from 'next/navigation';
import { DropdownMenu } from '@/components/shared/ui/DropdownMenu';
import type { DropdownItem } from '@/components/shared/ui/DropdownMenu';

const LABEL: Record<string, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

const FLAG: Record<string, string> = {
  vi: '🇻🇳',
  en: '🇺🇸',
  zh: '🇨🇳',
  ja: '🇯🇵',
};

function getLocalizedPath(pathname: string, locale: string) {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  // Extract query string and hash from pathname
  let queryString = '';
  let hash = '';
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    const hashIndex = lastSegment.indexOf('#');
    const queryIndex = lastSegment.indexOf('?');

    if (hashIndex !== -1) {
      hash = lastSegment.substring(hashIndex);
    }

    if (queryIndex !== -1) {
      queryString = lastSegment.substring(queryIndex, hashIndex !== -1 ? hashIndex : undefined);
    }

    // Remove query/hash from last segment for path manipulation
    segments[segments.length - 1] = lastSegment.substring(0, queryIndex !== -1 ? queryIndex : (hashIndex !== -1 ? hashIndex : undefined));
  }

  const rest = routing.locales.includes(firstSegment as (typeof routing.locales)[number]) ? segments.slice(1) : segments;
  const basePath = `/${[locale, ...rest].join('/')}`;

  // Preserve query string and hash
  return basePath + queryString + hash;
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const items: DropdownItem[] = routing.locales.map((loc) => ({
    key: loc,
    label: `${FLAG[loc]} ${LABEL[loc]}`,
    onClick: () => router.push(getLocalizedPath(pathname, loc)),
  }));

  return (
    <DropdownMenu items={items} trigger={['click']} placement="bottomRight">
      <button className="tool-btn" type="button">
        <span>{FLAG[locale] ?? '🌐'}</span>
        <span>{LABEL[locale] ?? locale}</span>
      </button>
    </DropdownMenu>
  );
}
