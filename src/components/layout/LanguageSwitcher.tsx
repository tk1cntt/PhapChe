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
    document.cookie = `${LOCALE_COOKIE}=${langCode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && languages.some((l) => l.code === segments[0])) {
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
      <div className="lang-switcher">
        <svg className="lang-switcher-globe" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="lang-switcher-flag">{currentLang.flag}</span>
        <span className="lang-switcher-label">{currentLang.label}</span>
      </div>
    </DropdownMenu>
  );
}
