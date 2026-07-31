/**
 * Supported locales in the application
 */
export const SUPPORTED_LOCALES = ['vi', 'en', 'zh', 'ja'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Default/fallback locale
 */
export const DEFAULT_LOCALE: SupportedLocale = 'vi';

/**
 * Locale display names
 */
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

/**
 * Multilingual string field - for short text like labels, titles
 * _vi is required (primary), others are optional
 * NULL = "fallback to another available locale"
 */
export type MultilingualString = {
  vi: string;
  en?: string | null;
  zh?: string | null;
  ja?: string | null;
};

/**
 * Multilingual text field - for longer content like descriptions
 */
/**
 * Multilingual text field - for longer content like descriptions.
 * At least one locale should be provided; consumers must implement fallback via getLocalized().
 */
export type MultilingualText = {
  vi?: string | null;
  en?: string | null;
  zh?: string | null;
  ja?: string | null;
};

/**
 * Prisma-compatible type for multilingual fields
 * @deprecated No longer used — DB stores keys, translations in src/messages/
 */
export type PrismaMultilingualString = {
  vi: string | null;
  en: string | null;
  zh: string | null;
  ja: string | null;
};

/**
 * Locale to field suffix mapping
 * @deprecated No longer used — DB uses key-based i18n
 */
export const LOCALE_TO_SUFFIX: Record<SupportedLocale, string> = {
  vi: '_vi',
  en: '_en',
  zh: '_zh',
  ja: '_ja',
};

/**
 * Convert snake_case DB key to camelCase for message lookup.
 * e.g., "labor_contract" → "laborContract"
 */
export function snakeToCamel(str: string): string {
  return str.replace(/([a-z0-9])_([a-z])/g, (_m: string, before: string, c: string) => before + c.toUpperCase());
}

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}
