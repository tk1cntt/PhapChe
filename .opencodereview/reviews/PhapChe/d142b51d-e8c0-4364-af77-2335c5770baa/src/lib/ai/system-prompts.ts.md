# Review: `src/lib/ai/system-prompts.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 5

---

## 🔴 Critical (1)

**🔒 Security** · line 678

Regex injection via unescaped context keys. The key from `context` is directly interpolated into `new RegExp()` without escaping special regex characters (e.g., `.`, `*`, `$`, `+`, `(`, `)`, `[`, `]`). If a context key contains any of these characters, it can cause runtime errors, unintended matches, or even ReDoS (Regular Expression Denial of Service). This occurs in two places: the simple variable replacement loop and the `#each` block inner replacement.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Escape special regex characters in the key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      rendered = rendered.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), String(value));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
```
</details>


## 🟠 High (2)

**🔒 Security** · line 678

Replacement pattern injection in `String.replace()`. `String(value)` is used directly as the replacement string, which interprets `$` patterns (e.g., `$&`, `$1`, `$'`, `$``). If a context value contains these patterns, they will be treated as special replacement tokens rather than literal text, leading to incorrect rendered output.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Use a replacer function to avoid $-pattern interpretation
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      rendered = rendered.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), () => String(value));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
```
</details>

---

**🔒 Security** · line 698

Same regex injection and replacement pattern injection issues exist in the `#each` block's inner variable replacement. The `k` from each item's keys is also unescaped in the regex, and `String(v ?? '')` is vulnerable to `$` pattern interpretation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          const escapedK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          b = b.replace(new RegExp(`\\{\\{${escapedK}\\}\\}`, 'g'), () => String(v ?? ''));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          b = b.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v ?? ''));
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · line 698

The `#each` block's inner replacement calls `String(v)` on every item value. When `v` is an object or array (since `item` is typed as `Record<string, unknown>`), `String(v)` produces `[object Object]` or comma-separated array elements, which is unlikely to be the intended output. Consider checking the type before stringifying.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          const strValue = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
          const escapedK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          b = b.replace(new RegExp(`\\{\\{${escapedK}\\}\\}`, 'g'), () => strValue);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          b = b.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v ?? ''));
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 706-709

After all replacements, unresolved `{{variable}}` patterns remain in the rendered output silently. This can lead to confusing downstream results when a required variable is missing from the context. Consider adding a cleanup pass or logging a warning for unresolved placeholders.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Clean remaining unresolved {{#if}} blocks
  rendered = rendered.replace(/\{\{#if \w+\}\}[\s\S]*?\{\{\/if\}\}/g, '');

  // Warn about unresolved placeholders
  const unresolved = rendered.match(/\{\{\w+\}\}/g);
  if (unresolved && unresolved.length > 0) {
    console.warn(`Unresolved template variables in "${skill}":`, unresolved);
  }

  return rendered;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Clean remaining unresolved {{#if}} blocks
  rendered = rendered.replace(/\{\{#if \w+\}\}[\s\S]*?\{\{\/if\}\}/g, '');

  return rendered;
```
</details>


