# Review: `src/lib/i18n/get-localized-content.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 6

---

## 🟠 High (1)

**🔧 Maintainability** · lines 32-34

The list of fallback locales (`en`, `zh`, `ja`) is hardcoded in three different functions: `getLocalized` (lines 27-30), `hasLocalizedContent` (line 55), and `getAvailableLocales` (lines 62-66). If a new locale is added to `SUPPORTED_LOCALES` in types.ts, all three functions must be manually updated, easily leading to inconsistencies. Use `SUPPORTED_LOCALES` from `./types` to iterate dynamically, or derive from it so the fallback chain stays in sync automatically.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Use SUPPORTED_LOCALES to iterate dynamically
  for (const loc of SUPPORTED_LOCALES) {
    if (loc !== 'vi' && field[loc]) return field[loc];
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (field.en) return field.en;
  if (field.zh) return field.zh;
  if (field.ja) return field.ja;
```
</details>


## 🟡 Medium (4)

**🔧 Maintainability** · line 2

`DEFAULT_LOCALE` is imported but never used anywhere in this file. Remove the unused import to keep the code clean and avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Remove this line — DEFAULT_LOCALE is unused
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import { DEFAULT_LOCALE } from './types';
```
</details>

---

**🐛 Bug** · lines 19-24

`locale` is cast to `SupportedLocale` without validation (`locale as SupportedLocale`). If the caller passes an unsupported string (e.g. `'fr'`), `field[localeKey]` evaluates to `undefined` and the function silently falls back to a different locale. This can hide bugs in callers that accidentally pass wrong locale values. The `isValidLocale()` type guard already exists in `./types` — use it to validate the locale first, or at least log a warning when an unsupported locale is received.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Validate the locale before use
  if (!isValidLocale(locale)) {
    console.warn(`Unsupported locale: ${locale}, falling back to default`);
    return field.vi || '';
  }
  const localeKey: SupportedLocale = locale;

  // Try requested locale first
  if (localeKey !== 'vi' && field[localeKey]) {
    return field[localeKey];
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const localeKey = locale as SupportedLocale;

  // Try requested locale first
  if (localeKey !== 'vi' && field[localeKey]) {
    return field[localeKey];
  }
```
</details>

---

**🔧 Maintainability** · lines 61-66

`hasLocalizedContent` and `getAvailableLocales` duplicate the same hardcoded locale checks (`field.vi`, `field.en`, `field.zh`, `field.ja`). This can be simplified by iterating over `SUPPORTED_LOCALES`, reducing duplication and preventing drift when locales are added or removed.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function hasLocalizedContent(
  field: MultilingualString | MultilingualText | null | undefined
): boolean {
  if (!field) return false;
  return SUPPORTED_LOCALES.some((loc) => !!field[loc]);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function hasLocalizedContent(
  field: MultilingualString | MultilingualText | null | undefined
): boolean {
  if (!field) return false;
  return !!(field.vi || field.en || field.zh || field.ja);
}
```
</details>

---

**🔧 Maintainability** · lines 71-81

Manual locale enumeration duplicates the list from `SUPPORTED_LOCALES`. Use `SUPPORTED_LOCALES.filter()` to keep the list in sync automatically.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function getAvailableLocales(
  field: MultilingualString | MultilingualText | null | undefined
): SupportedLocale[] {
  if (!field) return [];
  return SUPPORTED_LOCALES.filter((loc) => !!field[loc]);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
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
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 21-24

The condition `localeKey !== 'vi'` before trying `field[localeKey]` is logically redundant with the immediate `field.vi` fallback on the next line. It's an optimization to avoid a redundant lookup, but the intent is not obvious. Consider adding a brief comment explaining that 'vi' is skipped here because it is already handled as the default fallback below.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Try requested locale first (skip 'vi' — it's the default fallback below)
  if (localeKey !== 'vi' && field[localeKey]) {
    return field[localeKey];
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Try requested locale first
  if (localeKey !== 'vi' && field[localeKey]) {
    return field[localeKey];
  }
```
</details>


