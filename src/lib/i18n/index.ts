// Re-export all i18n utilities
export * from './types';
export * from './date-format';

const LOCALE_DATE_CODES: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export function getLocaleDateCode(locale: string): string {
  return LOCALE_DATE_CODES[locale] || 'vi-VN';
}
