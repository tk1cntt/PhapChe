# Review: `src/lib/document/normalizer/formatters.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · line 114

The first replace is a no-op: `.replace(/&amp;/g, '&amp;')` replaces `&amp;` with `&amp;` — it does absolutely nothing. This appears to be a copy-paste error. The intended logic was likely to first escape all `&` to `&amp;`, then restore already-valid entities. The current no-op line should be removed or corrected.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Remove this no-op line; the lookahead in the next replace already
    // handles already-escaped entities
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    .replace(/&amp;/g, '&amp;')      // Đã escape → giữ nguyên
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · line 28

Dead code: `hasH1OrTitle` is computed but never referenced anywhere in the function. The comment block (lines 24-26) describes logic about title text and level-1 headings that is never implemented. Either remove this variable or implement the missing logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // TODO: implement level-1 heading removal logic or remove this variable
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const hasH1OrTitle = lines.some((l) => /^#\s/.test(l) || /^[A-ZÀ-Ỹ\s]{10,60}$/.test(l.trim()));
```
</details>

---

**🔒 Security** · line 115

The negative lookbehind `(?<!&amp;)` is semantically wrong. It checks whether the character *before* `&` is `&amp;` — which would only match the pattern `&amp;&`. It does NOT protect `&amp;` from being double-escaped (that's handled by the lookahead). The lookbehind is both useless and misleading. Remove it to simplify and avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    .replace(/(?<!&amp;)&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
```
</details>

---

**🐛 Bug** · lines 26-51

Function documentation says it should 'Remove heading level 1 (#) if it's not the only title', but the implementation only handles upgrading `###` to `##` when no `##` exists. Level-1 headings (`#`) are never removed or adjusted, leaving the heading hierarchy potentially inconsistent.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function formatHeadingHierarchy(text: string): string {
  const lines = text.split('\n');

  let hasH1 = false;
  let hasH2 = false;
  let hasH3 = false;

  for (const line of lines) {
    if (/^#\s/.test(line)) hasH1 = true;
    if (/^##\s/.test(line)) hasH2 = true;
    if (/^###\s/.test(line)) hasH3 = true;
  }

  let result = lines;

  // If only ### exists without ##, upgrade ### → ##
  if (hasH3 && !hasH2 && !hasH1) {
    result = result.map((l) =>
      /^###\s/.test(l) ? l.replace(/^###/, '##') : l,
    );
  }

  // If # exists alongside other headings, remove # (downgrade to ##)
  // Only keep # if it is the sole heading level
  if (hasH1 && (hasH2 || hasH3)) {
    result = result.map((l) =>
      /^#\s/.test(l) ? l.replace(/^#\s/, '## ') : l,
    );
  }

  return result.join('\n');
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function formatHeadingHierarchy(text: string): string {
  const lines = text.split('\n');
  const hasH1OrTitle = lines.some((l) => /^#\s/.test(l) || /^[A-ZÀ-Ỹ\s]{10,60}$/.test(l.trim()));

  // Nếu có title text (dòng ALL CAPS ở đầu) và chưa có # heading,
  // ta không tự động thêm — để detectors xử lý.
  // Chỉ fix các ## và ### bị lệch level.

  // Logic: đếm levels đã dùng
  let hasH2 = false;
  let hasH3 = false;

  for (const line of lines) {
    if (/^##\s/.test(line)) hasH2 = true;
    if (/^###\s/.test(line)) hasH3 = true;
  }

  // Nếu có ### nhưng không có ## → upgrade ### lên ##
  if (hasH3 && !hasH2) {
    return lines.map((l) =>
      /^###\s/.test(l) ? l.replace(/^###/, '##') : l,
    ).join('\n');
  }

  return text;
}
```
</details>

---

**🐛 Bug** · line 86

The list-item detection regex `^\s*[-*\d+]\d*\s` is overly broad. The character class `[-*\d+]` matches `-`, `*`, any digit, or `+`, followed by `\d*` (zero or more digits). This can match non-standard patterns like `-1 ` (minus-one), `+2 `, `*3 `, or `42 ` (a lone number). Consider tightening to standard Markdown markers: `[-*+]` for unordered and `\d+[.)]` for ordered.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const isListItem = /^\s*[-*+]\s/.test(line) || /^\s*\d+[.)]\s/.test(line);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const isListItem = /^\s*[-*\d+]\d*\s/.test(line) || /^\s*\d+[.)]\s/.test(line);
```
</details>


