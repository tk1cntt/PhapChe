'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Check } from 'lucide-react';

export interface LanguageSectionProps {
  currentLocale: string;
  onLocaleChange?: (locale: string) => void;
}

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function LanguageSection({ currentLocale, onLocaleChange }: LanguageSectionProps): React.ReactElement {
  const t = useTranslations('UserSettings');

  const handleChange = (locale: string) => {
    if (onLocaleChange) {
      onLocaleChange(locale);
    }
  };

  return (
    <div className="form-section">
      <div className="form-section-header">
        <Globe size={20} />
        <h3>{t('languageTitle')}</h3>
      </div>
      <p className="section-description">{t('languageDesc')}</p>

      <div className="language-list">
        {LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className={`language-option ${currentLocale === lang.code ? 'active' : ''}`}
            onClick={() => handleChange(lang.code)}
          >
            <span className="language-flag">{lang.flag}</span>
            <span className="language-name">{lang.name}</span>
            {currentLocale === lang.code && (
              <Check size={18} className="language-check" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LanguageSection;
