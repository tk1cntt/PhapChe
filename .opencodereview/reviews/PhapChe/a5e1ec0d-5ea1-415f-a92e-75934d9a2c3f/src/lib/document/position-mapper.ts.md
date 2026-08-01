# Review: `src/lib/document/position-mapper.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · lines 159-176

Levenshtein similarity is computed on the full line vs. the snippet, so short snippets that are perfect substrings of long lines almost always get a similarity score below the MIN_SIMILARITY threshold (0.3). For example, snippet "thanh toán" (11 chars) inside a 43-char line yields similarity ≈ 0.256, falling to zero confidence. This directly contradicts the test expectation at line 173 of the test file and means the fallback systematically fails for short snippets within long lines.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // ── Strategy 3: Best Levenshtein similarity within window ──
  let bestScore = 0;
  let bestIdx = idx;
  let bestText = '';

  for (let i = searchStart; i < searchEnd; i++) {
    // Normalize: compare snippet against a sliding window of the line
    // of similar length to avoid penalizing short snippets in long lines
    const line = lines[i];
    const sim = bestSubstringSimilarity(normalizedSnippet, line);
    if (sim > bestScore) {
      bestScore = sim;
      bestIdx = i;
      bestText = line;
    }
  }

  // Require minimum similarity to accept
  const MIN_SIMILARITY = 0.3;
  if (bestScore >= MIN_SIMILARITY) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // ── Strategy 3: Best Levenshtein similarity within window ──
  let bestScore = 0;
  let bestIdx = idx;
  let bestText = '';

  for (let i = searchStart; i < searchEnd; i++) {
    // Only try lines that have some character overlap
    const sim = similarity(normalizedSnippet, lines[i]);
    if (sim > bestScore) {
      bestScore = sim;
      bestIdx = i;
      bestText = lines[i];
    }
  }

  // Require minimum similarity to accept
  const MIN_SIMILARITY = 0.3;
  if (bestScore >= MIN_SIMILARITY) {
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 110-119

Strategy 1 is labeled "Exact match" in the comment but uses `includes()` which is substring containment, not exact match. This can produce a false positive with confidence 1.0 when the snippet is a substring of an unrelated line. For example, snippet "a" would match any line containing "a" with full confidence.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // ── Strategy 1: Exact match at AI-suggested line ──
  const idx = searchCenter - 1; // convert to 0-indexed
  if (idx < totalLines && lines[idx] === normalizedSnippet) {
    return {
      lineStart: searchCenter,
      lineEnd: searchCenter,
      confidence: 1.0,
      matchedText: lines[idx],
    };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // ── Strategy 1: Exact match at AI-suggested line ──
  const idx = searchCenter - 1; // convert to 0-indexed
  if (idx < totalLines && lines[idx].includes(normalizedSnippet)) {
    return {
      lineStart: searchCenter,
      lineEnd: searchCenter,
      confidence: 1.0,
      matchedText: lines[idx],
    };
  }
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 23-29

`getLinesArray`'s JSDoc says it converts "numbered output back to raw lines" but the implementation only splits by newline without stripping the `N| ` prefix. In practice it works because the call site passes `rawContent` (not numbered output), but the misleading JSDoc and implementation could cause bugs if someone later calls it on the numbered output as documented.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
/**
 * Split document content into raw lines array for position mapping.
 * Note: pass the raw document content, not the numbered output.
 */
export function getLinesArray(md: string): string[] {
  if (!md) return [];
  return md.split('\n');
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
/**
 * Split numbered output back to raw lines array for position mapping.
 */
export function getLinesArray(md: string): string[] {
  if (!md) return [];
  return md.split('\n');
}
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 148-149

In the multi-line match loop, `threeLines` is computed by accessing `lines[i + 2]` before the bounds check `i < searchEnd - 2`. When `i === searchEnd - 2`, this accesses `lines[searchEnd]` which may be `undefined` (when `searchEnd === totalLines`). While the guard prevents the body from executing, the computation of `threeLines` with `undefined` still occurs, which is a minor code smell.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (i < searchEnd - 2) {
      const threeLines = lines[i] + ' ' + lines[i + 1] + ' ' + lines[i + 2];
      if (threeLines.includes(normalizedSnippet)) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const threeLines = lines[i] + ' ' + lines[i + 1] + ' ' + lines[i + 2];
    if (i < searchEnd - 2 && threeLines.includes(normalizedSnippet)) {
```
</details>


