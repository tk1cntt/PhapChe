# Review: `src/lib/i18n/index.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 2

---

## 🟡 Medium (1)

**🐛 Bug** · lines 12-14

The function `getLocaleDateCode` only matches short locale codes (`vi`, `en`, `ja`, `zh`) but does not handle full locale codes like `'en-US'` or `'ja-JP'`. If called with a full locale code (e.g., `'en-US'`), the lookup in `LOCALE_DATE_CODES` returns `undefined` and the fallback `'vi-VN'` is returned — which is incorrect. Consider also checking if the input itself is already a valid locale-date-code by testing against the map's values, or simply returning the input as-is if it matches the expected format.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function getLocaleDateCode(locale: string): string {
  return LOCALE_DATE_CODES[locale] || (Object.values(LOCALE_DATE_CODES).includes(locale) ? locale : 'vi-VN');
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function getLocaleDateCode(locale: string): string {
  return LOCALE_DATE_CODES[locale] || 'vi-VN';
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 5-14

The fallback value `'vi-VN'` appears twice: once as the value for key `vi` in `LOCALE_DATE_CODES` and once as the hardcoded fallback in `getLocaleDateCode`. Extract it into a named constant to avoid inconsistency if the default locale ever changes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const DEFAULT_LOCALE_DATE_CODE = 'vi-VN';

const LOCALE_DATE_CODES: Record<string, string> = {
  vi: DEFAULT_LOCALE_DATE_CODE,
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export function getLocaleDateCode(locale: string): string {
  return LOCALE_DATE_CODES[locale] || DEFAULT_LOCALE_DATE_CODE;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const LOCALE_DATE_CODES: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export function getLocaleDateCode(locale: string): string {
  return LOCALE_DATE_CODES[locale] || 'vi-VN';
}
```
</details>


