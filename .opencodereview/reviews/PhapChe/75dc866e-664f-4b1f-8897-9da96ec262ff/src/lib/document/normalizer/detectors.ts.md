# Review: `src/lib/document/normalizer/detectors.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · line 43

**Incorrect Unicode character range in `[a-đ]`.**

In JavaScript/Unicode regex, `[a-đ]` matches a huge range of characters from U+0061 (`a`) through U+0111 (`đ`), which includes all of ASCII lowercase `a-z`, plus `{`, `|`, `}`, `~`, and dozens of Latin Extended characters (e.g., `ā`, `ă`, `ą`, `ć`, `ĉ`, `ċ`, `č`, `ď`, `đ`).

This means the regex will match lines like `z) ...`, `{) ...`, `~) ...`, and many other unexpected characters, incorrectly transforming them into bullet points. The intended behavior is to match only Vietnamese lowercase letters like `a`, `b`, `c`, `d`, `đ`.

**Fix**: Use an explicit character class like `[a-dđ]` or `[a-zA-Zà-ỹ]` for Vietnamese letters, depending on requirements.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const POINT_RE = /^(\s*)[a-dđ]\)\s+/gim;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const POINT_RE = /^(\s*)[a-đ]\)\s+/gim;
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 49

**ALL_CAPS_RE incorrectly matches purely numeric lines.**

The regex `/^([A-ZÀ...\s\d][^a-z...]+)$/gm` allows digits (`\d`) in the first character class. A line consisting solely of digits, such as `12345678` (8 digits), would match: the first `1` matches `[A-ZÀ...\s\d]`, and the remaining `2345678` matches `[^a-z...]+`. The length check (`8–70`) passes, and the line is incorrectly converted to `### 12345678`, breaking document structure.

**Fix**: Exclude pure-digit strings by adding a check that the trimmed line contains at least one uppercase letter, or modify the regex to require at least one letter.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const ALL_CAPS_RE = /^([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶĐÈÉẺẼẸÊỀẾỂỄỆÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ][A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶĐÈÉẺẼẸÊỀẾỂỄỆÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ\s\d]+)$/gm;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const ALL_CAPS_RE = /^([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶĐÈÉẺẼẸÊỀẾỂỄỆÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ\s\d][^a-zàáảãạâầấẩẫậăằắẳẵặđèéẻẽẹêềếểễệòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+)$/gm;
```
</details>

---

**🐛 Bug** · lines 156-162

**Ordering conflict: `normalizeLists` runs before `detectAllCapsHeadings`, causing all-caps list items to be incorrectly converted to headings.**

In `phase2Detect`, `normalizeLists` (line 157) runs before `detectAllCapsHeadings` (line 161). Consider a line like `1. INTRODUCTION`:
1. `normalizeLists` matches it and replaces it with `1. INTRODUCTION` (functionally unchanged).
2. `detectAllCapsHeadings` then matches `1. INTRODUCTION` as an all-caps line and converts it to `### 1. INTRODUCTION`, losing the ordered-list semantics.

**Fix**: Either run `detectAllCapsHeadings` before `normalizeLists`, or add a guard in `detectAllCapsHeadings` to skip lines that start with a digit followed by `.` or `)` (i.e., lines already identified as list items).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (opts.allCapsHeadings) {
    result = detectAllCapsHeadings(result);
  }

  if (opts.lists) {
    result = normalizeLists(result);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (opts.lists) {
    result = normalizeLists(result);
  }

  if (opts.allCapsHeadings) {
    result = detectAllCapsHeadings(result);
  }
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 133-135

**No null/undefined input guard — runtime error on invalid input.**

All detector functions (`detectArticles`, `detectSections`, `detectSubItems`, `detectPoints`, `normalizeLists`, `detectAllCapsHeadings`, and `phase2Detect`) declare `text: string` but have no runtime guards. If `null` or `undefined` is passed (e.g., from an API response or parsed JSON), calling `.replace()` on a non-string will throw a `TypeError`.

**Fix**: Add a guard at the entry point (`phase2Detect`) that returns early with empty/default values when `text` is not a string.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function phase2Detect(text: string, options?: DetectOptions): DetectResult {
  if (text == null || typeof text !== 'string') {
    return { transformed: '', articles: [], sections: [] };
  }
  const opts = { ...DEFAULT_DETECT_OPTIONS, ...options };
  let result = text;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function phase2Detect(text: string, options?: DetectOptions): DetectResult {
  const opts = { ...DEFAULT_DETECT_OPTIONS, ...options };
  let result = text;
```
</details>


