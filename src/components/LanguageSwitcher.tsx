'use client';

import { useLocale } from 'next-intl';
import { routing } from '@/routing';
import Link from 'next/link';
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

export default function LanguageSwitcher() {
  const locale = useLocale();

  const items: MenuProps['items'] = routing.locales.map((loc) => ({
    key: loc,
    label: (
      <Link href="/" locale={loc} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
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
