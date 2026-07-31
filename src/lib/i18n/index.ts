// Re-export all i18n utilities
export * from './types';
export * from './date-format';

const DEFAULT_LOCALE_DATE_CODE = 'vi-VN';

const LOCALE_DATE_CODES: Record<string, string> = {
  vi: DEFAULT_LOCALE_DATE_CODE,
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export function getLocaleDateCode(locale: string): string {
  return LOCALE_DATE_CODES[locale]
    || (Object.values(LOCALE_DATE_CODES).includes(locale) ? locale : DEFAULT_LOCALE_DATE_CODE);
}
