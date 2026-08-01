# Review: `src/lib/document/types.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 3

---

## 🟡 Medium (3)

**🐛 Bug** · lines 97-107

The sentinel `maxLength: 0` for "no limit" is ambiguous: a user explicitly passing `maxLength: 0` would reasonably expect the output to be truncated to zero characters, not unlimited. The `Required<NormalizeOptions>` type forces `maxLength` to be `number`, which drives this workaround. Consider keeping `maxLength` as `number | undefined` in the defaults, or using a dedicated sentinel like `-1` or `Infinity` and documenting it clearly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Option A: avoid Required<>, keep maxLength optional
// export const DEFAULT_OPTIONS: NormalizeOptions = { ... };

// Option B: use a clearly documented sentinel
// maxLength: Number.POSITIVE_INFINITY, // Infinity = no limit
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const DEFAULT_OPTIONS: Required<NormalizeOptions> = {
  phases: ['clean', 'detect', 'format'],
  detectArticles: true,
  detectSections: true,
  detectSubItems: true,
  normalizeLists: true,
  collapseBlankLines: true,
  trimTrailing: true,
  normalizeUnicode: true,
  maxLength: 0, // 0 = không giới hạn
};
```
</details>

---

**🔧 Maintainability** · lines 53-54

The field is named `errors` but the comment describes it as "Cảnh báo" (warnings). This misleads downstream consumers about severity — they may treat informational warnings as hard failures, or conversely, critical errors may be ignored because they're labeled as mere warnings. Rename the field to `warnings` to match the described semantics.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    /** Cảnh báo từ quá trình detect */
    warnings: string[];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    /** Cảnh báo từ quá trình detect */
    errors: string[];
```
</details>

---

**🔧 Maintainability** · lines 71-78

`CacheEntry` only stores the `normalized` string, discarding the `detected` patterns and `stats` from `NormalizeResult`. If a consumer needs the full result (e.g., to display detected articles/sections or stats), they must recompute it from the cached string, defeating the purpose of caching. Consider storing the full `NormalizeResult` or at least the `detected` payload alongside the normalized string.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface CacheEntry {
  /** SHA-256 hash của raw content */
  hash: string;
  /** Kết quả normalize đầy đủ */
  result: NormalizeResult;
  /** Timestamp khi cache được tạo */
  createdAt: number;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface CacheEntry {
  /** SHA-256 hash của raw content */
  hash: string;
  /** Markdown đã normalize */
  normalized: string;
  /** Timestamp khi cache được tạo */
  createdAt: number;
}
```
</details>


