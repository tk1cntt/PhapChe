# Review: `src/lib/i18n/seed-multilingual.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 3

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 43-45

The string literal `'2026-05-27'` is duplicated across all four matter type definitions (lines 42, 60, 77, 90). If the schema version needs to be updated, it's easy to miss one of them, leading to inconsistent schema versions across matter types. Consider extracting it to a named constant (e.g., `DEFAULT_SCHEMA_VERSION`) and referencing it in each matter type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    questions: [
      { key: 'employee_role', label: { vi: 'Vị trí công việc', en: 'Job Position', zh: '职位', ja: '職位' }, required: true, type: 'text' },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    schemaVersion: '2026-05-27',
    questions: [
      { key: 'employee_role', label: { vi: 'Vị trí công việc', en: 'Job Position', zh: '职位', ja: '職位' }, required: true, type: 'text' },
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 18-23

The `SEED_METADATA.primaryLocale` is typed as `string` (widened from `'vi'`), while `SEED_METADATA.locales` is typed as `readonly ['vi', 'en', 'zh', 'ja']` due to `as const`. This means `primaryLocale` is not constrained to be one of the valid locales. Consider using `as const` on the entire `SEED_METADATA` object, or explicitly typing `primaryLocale` to ensure it stays in sync with the `locales` array.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export const SEED_METADATA = {
  version: SEED_VERSION,
  createdAt: '2026-06-12',
  locales: ['vi', 'en', 'zh', 'ja'] as const,
  primaryLocale: 'vi' as const,
};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const SEED_METADATA = {
  version: SEED_VERSION,
  createdAt: '2026-06-12',
  locales: ['vi', 'en', 'zh', 'ja'] as const,
  primaryLocale: 'vi',
};
```
</details>

---

**🔧 Maintainability** · lines 193-201

`getSeedStats` is exported but never imported by any consumer in the codebase. The only imports from this module are `SEED_MATTER_TYPES`, `SEED_FOLDERS`, `SEED_TAGS`, `SEED_VERSION`, and `SEED_METADATA`. If this function is genuinely unused, consider removing it to avoid dead code accumulation. If it's intended for future use, add a comment explaining its purpose.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Intended for future use: returns aggregate seed data stats
// export function getSeedStats() {
//   return {
//     version: SEED_VERSION,
//     matterTypes: Object.keys(SEED_MATTER_TYPES).length,
//     folders: Object.keys(SEED_FOLDERS).length,
//     tags: Object.keys(SEED_TAGS).length,
//     locales: SEED_METADATA.locales,
//   };
// }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function getSeedStats() {
  return {
    version: SEED_VERSION,
    matterTypes: Object.keys(SEED_MATTER_TYPES).length,
    folders: Object.keys(SEED_FOLDERS).length,
    tags: Object.keys(SEED_TAGS).length,
    locales: SEED_METADATA.locales,
  };
}
```
</details>


