'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, CheckCircle, XCircle } from 'lucide-react';

interface LanguageSettingsProps {
  currentLocale: string;
  onLocaleChange?: (locale: string) => void;
}

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: 'VN' },
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'zh', name: '中文', flag: 'CN' },
  { code: 'ja', name: '日本語', flag: 'JP' },
] as const;

export function LanguageSettings({ currentLocale, onLocaleChange }: LanguageSettingsProps): React.ReactElement {
  const t = useTranslations('UserSettings');
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLanguageChange = async (locale: string) => {
    if (locale === selectedLocale) return;

    setSelectedLocale(locale);
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/settings/language', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update language');
      }

      setSuccess(t('languageChangeSuccess'));
      onLocaleChange?.(locale);

      // Refresh page to apply new locale after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setSelectedLocale(currentLocale); // Revert on error
      setError(err instanceof Error ? err.message : 'Failed to update language');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="language-settings">
      <div className="settings-section">
        <div className="section-header">
          <Globe size={20} />
          <h3>{t('languageTitle')}</h3>
        </div>

        <p className="text-muted">{t('languageDesc')}</p>

        {error && (
          <div className="alert alert-error">
            <XCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <div className="language-options">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-option ${selectedLocale === lang.code ? 'selected' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={loading}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
              {selectedLocale === lang.code && (
                <CheckCircle size={18} className="check-icon" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LanguageSettings;
