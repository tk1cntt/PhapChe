'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';

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

  const handleSwitch = ({ key }: { key: string }) => {
    // Replace current locale in pathname with new locale
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && languages.some((l) => l.code === segments[0])) {
      segments[0] = key;
    } else {
      segments.unshift(key);
    }
    const newPath = '/' + segments.join('/');
    router.push(newPath);
  };

  const menuItems: MenuProps['items'] = languages.map((lang) => ({
    key: lang.code,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{lang.flag}</span>
        <span>{lang.label}</span>
        {lang.code === locale && (
          <span style={{ marginLeft: 'auto', color: '#10b981' }}>✓</span>
        )}
      </div>
    ),
  }));

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleSwitch }}
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
          background: '#fff',
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
    </Dropdown>
  );
}
