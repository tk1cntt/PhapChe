import type { SupportedLocale, MultilingualString, MultilingualText } from './types';
import { DEFAULT_LOCALE } from './types';

/**
 * Get localized content from a multilingual field
 * Fallback chain: requested_locale → default_locale (vi) → first available
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

  // Get the field for requested locale
  const localeKey = locale as SupportedLocale;

  // Try requested locale first
  if (localeKey !== 'vi' && field[localeKey]) {
    return field[localeKey] || '';
  }

  // Fallback to default (vi)
  if (field.vi) {
    return field.vi;
  }

  // Last resort: return first available value
  if (field.en) return field.en;
  if (field.zh) return field.zh;
  if (field.ja) return field.ja;

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
  return !!(field.vi || field.en || field.zh || field.ja);
}

/**
 * Get all available locales for a field (for debugging)
 */
export function getAvailableLocales(
  field: MultilingualString | MultilingualText | null | undefined
): SupportedLocale[] {
  if (!field) return [];
  const available: SupportedLocale[] = [];
  if (field.vi) available.push('vi');
  if (field.en) available.push('en');
  if (field.zh) available.push('zh');
  if (field.ja) available.push('ja');
  return available;
}
