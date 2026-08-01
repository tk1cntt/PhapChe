# Review: `src/lib/document/annotation-parser.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · line 44

The section marker regex `\*{0,2}(Vấn đề|Issue|...)` allows zero asterisks, meaning bare keywords like 'Issue:' or 'Đề xuất:' appearing inside section content will be misinterpreted as new section markers. This corrupts the parsed structure whenever the AI-generated content accidentally contains these words. The regex should require at least `**` (bold markdown) to distinguish real headers from inline mentions.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const sectionRegex = /\*{2}(Vấn đề|Issue|Đề xuất|Recommendation|Căn cứ|Legal Basis)\*{0,2}:\s*/gi;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const sectionRegex = /\*{0,2}(Vấn đề|Issue|Đề xuất|Recommendation|Căn cứ|Legal Basis)\*{0,2}:\s*/gi;
```
</details>


## 🟠 High (1)

**🔧 Maintainability** · line 44

The section labels are hardcoded both in `SECTION_META` keys (lines 24-30) and again in the regex (line 41). Adding a new section type requires updating two places, risking inconsistency. Generate the regex pattern dynamically from `SECTION_META` keys to maintain a single source of truth.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const labelPattern = Object.keys(SECTION_META).join('|');
  const sectionRegex = new RegExp(
    `\\*{2}(${labelPattern})\\*{0,2}:\\s*`,
    'gi'
  );
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const sectionRegex = /\*{0,2}(Vấn đề|Issue|Đề xuất|Recommendation|Căn cứ|Legal Basis)\*{0,2}:\s*/gi;
```
</details>


## 🟡 Medium (2)

**⚡ Performance** · lines 87-91

The sort comparator calls `Object.values(SECTION_META).find()` on every comparison (O(n) per compare), making the sort O(n·m·log m) instead of O(m·log m). Store the `order` directly on each section item during construction so sorting uses a simple numeric comparison.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // During section creation (line ~70), store the order:
  // const meta = SECTION_META[current.label] || { label: current.label, order: 99 };
  // sections.push({ key: ..., label: meta.label, content: sectionText, _order: meta.order });

  sections.sort((a, b) => (a as any)._order - (b as any)._order);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  sections.sort((a, b) => {
    const orderA = Object.values(SECTION_META).find(s => s.label === a.label)?.order ?? 99;
    const orderB = Object.values(SECTION_META).find(s => s.label === b.label)?.order ?? 99;
    return orderA - orderB;
  });
```
</details>

---

**🐛 Bug** · line 93

When sections are successfully parsed (`matches.length > 0`), the returned object omits the `raw` property entirely (it is `undefined`). This is inconsistent with the type definition and the no-match case. Callers checking `parsed.raw` won't get the original content when sections exist, which may be unexpected. Either always set `raw` or document that it is only present on parse failure.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  return { sections, raw: content };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return { sections };
```
</details>


