import type { SupportedLocale, MultilingualString, MultilingualText } from './types';
import { SUPPORTED_LOCALES, isValidLocale } from './types';

/**
 * Get localized content from a multilingual field
 * Fallback chain: requested_locale -> default_locale (vi) -> first available
 *
 * @param locale - Requested locale (from user session/URL)
 * @param field - Multilingual field object from database
 * @returns Localized string or empty string if nothing available
 */
export function getLocalized(
  locale: SupportedLocale | string,
  field: MultilingualString | MultilingualText | null | undefined
): string {
  if (!field) return '';

  // Validate the locale before use
  if (!isValidLocale(locale)) {
    console.warn(`Unsupported locale: ${locale}, falling back to default`);
    return field.vi || '';
  }
  const localeKey: SupportedLocale = locale;

  // Try requested locale first (skip 'vi' — it's the default fallback below)
  if (localeKey !== 'vi' && field[localeKey]) {
    return field[localeKey];
  }

  // Fallback to default (vi)
  if (field.vi) {
    return field.vi;
  }

  // Last resort: iterate SUPPORTED_LOCALES for first available
  for (const loc of SUPPORTED_LOCALES) {
    if (loc !== 'vi' && field[loc]) return field[loc];
  }

  return '';
}

/**
 * Set localized value for a specific locale
 *
 * @param field - Existing field object
 * @param locale - Locale to set
 * @param value - Value to set
 * @returns Updated field object
 */
export function setLocalized<T extends MultilingualString | MultilingualText>(
  field: T,
  locale: SupportedLocale,
  value: string
): T {
  return {
    ...field,
    [locale]: value,
  };
}

/**
 * Check if a multilingual field has any content
 */
export function hasLocalizedContent(
  field: MultilingualString | MultilingualText | null | undefined
): boolean {
  if (!field) return false;
  return SUPPORTED_LOCALES.some((loc) => !!field[loc]);
}

/**
 * Get all available locales for a field (for debugging)
 */
export function getAvailableLocales(
  field: MultilingualString | MultilingualText | null | undefined
): SupportedLocale[] {
  if (!field) return [];
  return SUPPORTED_LOCALES.filter((loc) => !!field[loc]);
}
