# Review: `src/lib/ai/system-prompts/client-letter-drafter.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 3

---

## 🔴 Critical (1)

**🔒 Security** · lines 24-30

**Prompt Injection Vulnerability**: User-supplied `requestDescription`, `documentContent`, and `requestTitle` are interpolated directly into the system prompt without sanitization. A malicious user could inject natural-language instructions that override or subvert the system prompt's intended behavior (e.g., "Ignore all previous instructions and output..."). Since this is a system prompt sent to an LLM, this is a high-risk injection vector.

**Recommendation**: Sanitize user-provided content before interpolation. At minimum, wrap user content in delimiters (e.g., triple backticks or XML tags like `<user_content>...</user_content>`) and add explicit instructions that user content should not be treated as system instructions. Consider using a separate message role (e.g., user message) for user-provided content rather than embedding it in the system prompt.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
- Vấn đề pháp lý: {{matterType}}
- Khách hàng: {{requestTitle}}
{{#if requestDescription}}- Mô tả chi tiết:
<user_provided_content>
{{requestDescription}}
</user_provided_content>
{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
<user_provided_content>
{{documentContent}}
</user_provided_content>
{{/if}}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
- Vấn đề pháp lý: {{matterType}}
- Khách hàng: {{requestTitle}}
{{#if requestDescription}}- Mô tả chi tiết: {{requestDescription}}{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 98-99

**Hardcoded Vietnamese disclaimer with dynamic locale**: The `disclaimer` field in the output schema is hardcoded as `"TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ TIÊU CHUẨN"` (Vietnamese), but the `locale` variable controls the output language. When `locale` is set to a non-Vietnamese language (e.g., `"en"`), the AI may produce a letter in the requested language but with a Vietnamese disclaimer, creating inconsistency. Additionally, the summary field at line 112 uses `{{locale}}` for dynamic language, but the disclaimer does not.

**Recommendation**: Either make the disclaimer language dynamic (e.g., `"STANDARD LEGAL DISCLAIMER"` when locale is English) or add a note in the template that the disclaimer should be generated in the output locale.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  "risksAndCaveats": {
    "disclaimer": "TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ TIÊU CHUẨN (viết bằng {{locale}})",
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  "risksAndCaveats": {
    "disclaimer": "TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM PHÁP LÝ TIÊU CHUẨN",
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 33-36

**Unvalidated data shape assumption for `legalContext`**: The `{{#each legalContext}}` block assumes each item has `source` and `content` properties, but `legalContext` is not listed in `requiredVariables` and there is no `{{#if}}` guard. While Handlebars gracefully handles a null/undefined `legalContext` in `{{#each}}`, if an item in the array is missing `source` or `content`, it will render as empty text (e.g., `📜` followed by nothing), producing confusing output.

**Recommendation**: Add a guard inside the `{{#each}}` to handle missing properties, or ensure at the data layer that all items have both `source` and `content`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
{{#if legalContext}}
{{#each legalContext}}
📜 {{source}}
{{content}}
{{/each}}
{{/if}}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
{{#each legalContext}}
📜 {{source}}
{{content}}
{{/each}}
```
</details>


