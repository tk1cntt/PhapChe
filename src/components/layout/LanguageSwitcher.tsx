'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DropdownMenu } from '@/components/shared/ui/DropdownMenu';
import type { DropdownItem } from '@/components/shared/ui/DropdownMenu';

const LOCALE_COOKIE = 'preferred-locale';

const languages = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  const handleSwitch = (langCode: string) => {
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

// ... inside handleSwitch:
    document.cookie = `${LOCALE_COOKIE}=${langCode}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;

// ... inside handleSwitch:
    document.cookie = `${LOCALE_COOKIE}=${langCode}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
      segments[0] = langCode;
    } else {
      segments.unshift(langCode);
    }
    const newPath = '/' + segments.join('/');
    router.push(newPath);
  };

  const menuItems: DropdownItem[] = languages.map((lang) => ({
    key: lang.code,
    label: `${lang.flag}  ${lang.label}${lang.code === locale ? '  ✓' : ''}`,
    onClick: () => handleSwitch(lang.code),
  }));

  return (
    <DropdownMenu
      items={menuItems}
      trigger={['click']}
      placement="bottomRight"
    >
      <div
        className="lang"
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          background: 'var(--color-surface)',
          transition: 'all 0.2s',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{currentLang.flag}</span>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{currentLang.label}</span>
      </div>
    </DropdownMenu>
  );
}
