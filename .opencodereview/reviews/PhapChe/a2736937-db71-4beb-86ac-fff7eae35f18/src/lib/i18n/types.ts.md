# Review: `src/lib/i18n/types.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 3

---

## 🟡 Medium (2)

**🐛 Bug** · lines 70-72

The `snakeToCamel` function does not handle leading underscores correctly. A key starting with `_` (e.g., `_private_field`) would produce `PrivateField` instead of preserving the leading underscore or stripping it correctly. This silently corrupts DB keys that begin with an underscore.

Additionally, consecutive underscores like `hello__world` produce `hello_World` (capitalized `W`), which may not be the intended behavior.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function snakeToCamel(str: string): string {
  // Only process underscores between words; preserve leading underscores
  return str.replace(/([a-z0-9])_([a-z])/g, (_m: string, _before: string, c: string) => _before + c.toUpperCase());
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_m: string, c: string) => c.toUpperCase());
}
```
</details>

---

**🔧 Maintainability** · lines 37-42

`MultilingualText` makes all locale fields (including `vi`) optional. This means consumers can receive `undefined` or `null` for every field, resulting in empty content with no fallback. This is inconsistent with `MultilingualString` which requires `vi` as a mandatory `string`. Consider making at least one field required, or clearly document the expected fallback chain in the JSDoc comment.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
/**
 * Multilingual text field - for longer content like descriptions.
 * At least one locale should be provided; consumers must implement fallback.
 */
export type MultilingualText = {
  vi?: string | null;
  en?: string | null;
  zh?: string | null;
  ja?: string | null;
};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export type MultilingualText = {
  vi?: string | null;
  en?: string | null;
  zh?: string | null;
  ja?: string | null;
};
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 44-64

`PrismaMultilingualString` and `LOCALE_TO_SUFFIX` are marked `@deprecated` but are still exported. If they are truly no longer used anywhere in the codebase, they should be removed to prevent accidental usage and reduce maintenance burden. Dead exports increase the API surface and create confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Remove these deprecated exports if they are no longer referenced in the codebase.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
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
```
</details>


