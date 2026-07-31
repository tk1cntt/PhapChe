# Review: `src/lib/document/normalizer/cleaners.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 2

---

## 🟡 Medium (2)

**🐛 Bug** · lines 10-12

Missing input validation: all cleaning functions assume `text` is a string. If `null` or `undefined` is passed (e.g., from an upstream parser returning empty content), calling `.replace()`, `.split()`, or `.normalize()` on a non-string will throw a `TypeError`, breaking the entire normalization pipeline. Consider adding a guard at the entry point (`phase1Clean`) or in each function.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function normalizeLineEndings(text: string): string {
  if (text == null) return '';
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
```
</details>

---

**🐛 Bug** · lines 46-53

`collapseBlankLines` unconditionally appends a trailing newline (`+ '\n'`). This alters the semantics of the input: an empty string `""` becomes `"\n"`, and text that intentionally lacks a trailing newline will gain one. If downstream code relies on exact string equality or the absence of a trailing newline, this could cause subtle bugs. Consider only appending the newline when the result is non-empty, or making this behavior configurable.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function collapseBlankLines(text: string): string {
  const result = text
    .replace(/\n{4,}/g, '\n\n\n')      // 4+ → 3
    .replace(/\n{3,}/g, '\n\n')        // 3 → 2
    .replace(/^\n+/, '')               // trim leading blank lines
    .replace(/\n+$/, '');              // trim trailing blank lines
  return result ? result + '\n' : result;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function collapseBlankLines(text: string): string {
  return text
    .replace(/\n{4,}/g, '\n\n\n')      // 4+ → 3
    .replace(/\n{3,}/g, '\n\n')        // 3 → 2
    .replace(/^\n+/, '')               // trim leading blank lines
    .replace(/\n+$/, '')               // trim trailing blank lines
    + '\n';                            // ensure trailing newline
}
```
</details>


