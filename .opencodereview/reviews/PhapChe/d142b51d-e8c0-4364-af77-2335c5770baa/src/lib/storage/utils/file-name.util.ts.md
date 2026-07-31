# Review: `src/lib/storage/utils/file-name.util.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 3

---

## 🟡 Medium (1)

**🐛 Bug** · lines 90-101

**Bug: Dotfiles (e.g., `.gitignore`, `.env`) are incorrectly treated as extensions.**

When `lastIndexOf('.')` returns `0` (the dot is at index 0), the function returns the entire filename as the extension. For example, `getFileExtension('.gitignore')` returns `'.gitignore'` instead of `''`.

This can cause downstream issues: `generateSafeFileName` will produce `_<fileId>.gitignore` (a hidden file with the basename as the extension), and `getMimeTypeFromExtension` will return `null` for `.gitignore`.

**Fix:** Add a check for `lastDot === 0` to return `''` for dotfiles that have no basename before the dot.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function getFileExtension(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    return '';
  }

  return fileName.slice(lastDot);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function getFileExtension(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return '';
  }

  return fileName.slice(lastDot);
}
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 51-54

**Redundant check: `sanitized === ''` is already covered by `!sanitized`.**

Since `!''` evaluates to `true`, the second condition is dead code. Simplify to `if (!sanitized)` for clarity.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Handle empty result
  if (!sanitized) {
    return 'unnamed_file';
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Handle empty result
  if (!sanitized || sanitized === '') {
    return 'unnamed_file';
  }
```
</details>

---

**🐛 Bug** · lines 44-49

**Edge case: `sanitized.slice(0, negative)` when extension exceeds 200 characters.**

If `ext.length > 200`, then `200 - ext.length` is negative, and `slice(0, negative)` returns an empty string. The result would be just the extension, potentially exceeding 200 characters, defeating the truncation purpose. While unlikely in practice, consider guarding with `Math.max(0, 200 - ext.length)`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Truncate if too long (Windows MAX_PATH consideration)
  if (sanitized.length > 200) {
    const ext = getFileExtension(sanitized);
    const nameWithoutExt = sanitized.slice(0, Math.max(0, 200 - ext.length));
    sanitized = nameWithoutExt + ext;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Truncate if too long (Windows MAX_PATH consideration)
  if (sanitized.length > 200) {
    const ext = getFileExtension(sanitized);
    const nameWithoutExt = sanitized.slice(0, 200 - ext.length);
    sanitized = nameWithoutExt + ext;
  }
```
</details>


