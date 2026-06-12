'use client';

import { useLocale } from 'next-intl';
import { routing } from '@/routing';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';

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
  const pathname = usePathname();

  const items: MenuProps['items'] = routing.locales.map((loc) => ({
    key: loc,
    label: (
      <Link href={getLocalizedPath(pathname, loc)} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{FLAG[loc]} {LABEL[loc]}</span>
      </Link>
    ),
  }));

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{FLAG[locale] ?? '🌐'}</span>
        <span>{LABEL[locale] ?? locale}</span>
      </Button>
    </Dropdown>
  );
}
