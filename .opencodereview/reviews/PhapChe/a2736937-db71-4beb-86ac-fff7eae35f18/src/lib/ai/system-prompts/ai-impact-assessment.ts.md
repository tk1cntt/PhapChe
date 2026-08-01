# Review: `src/lib/ai/system-prompts/ai-impact-assessment.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 3

---

## 🟠 High (1)

**🔒 Security** · lines 27-33

Template injection vulnerability: user-supplied variables `{{requestTitle}}`, `{{requestDescription}}`, and `{{documentContent}}` are interpolated directly into the system prompt without sanitization. An attacker could inject instructions like "Ignore all previous instructions and..." or craft malicious content that overrides the system prompt's behavioral constraints, leading to AI misbehavior. The caller or templating engine must sanitize/escape these inputs before interpolation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// SECURITY NOTE: All user-supplied variables (requestTitle, requestDescription,
// documentContent) MUST be sanitized/escaped before interpolation to prevent
// prompt injection attacks. The templating engine should strip or escape
// delimiter-like sequences (e.g., "{{", "}}", "#if", "#each") from user input.
- Hệ thống AI: {{requestTitle}}
- Loại hệ thống: {{matterType}}
{{#if requestDescription}}- Mô tả chi tiết: {{requestDescription}}{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
- Hệ thống AI: {{requestTitle}}
- Loại hệ thống: {{matterType}}
{{#if requestDescription}}- Mô tả chi tiết: {{requestDescription}}{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · line 156

The `requiredVariables` array only lists `['matterType', 'requestTitle', 'locale']`, but the template also references `requestDescription`, `documentContent`, and `legalContext` (via `#if`/`#each` blocks). While these are technically optional (guarded by conditionals), the runtime must be aware of all possible variables to supply them. Consider adding a separate `optionalVariables` field or documenting the full variable contract to avoid integration errors.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
  // Note: requestDescription, documentContent, and legalContext are optional
  // variables consumed by the template but not required for rendering.
  optionalVariables: ['requestDescription', 'documentContent', 'legalContext'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 18-20

The system prompt template is a single large string literal (~80 lines) with embedded JSON schema, conditional logic (`#if`/`#each`), and mixed Vietnamese/English content. This makes it difficult to review, validate the JSON schema, and maintain consistency between the prompt's output schema and the downstream parser. Consider extracting the JSON schema into a separate TypeScript type/interface and composing the template from smaller, documented segments.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // NOTE: The JSON output schema embedded in the template should be kept in sync
  // with the downstream parser's expected shape. Consider extracting the schema
  // into a shared TypeScript interface for compile-time validation.
  template: `Bạn là chuyên gia tư vấn về quản trị AI và pháp lý công nghệ, chuyên đánh giá
tác động của hệ thống trí tuệ nhân tạo theo các tiêu chuẩn quốc tế và
khung pháp lý Việt Nam.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  template: `Bạn là chuyên gia tư vấn về quản trị AI và pháp lý công nghệ, chuyên đánh giá
tác động của hệ thống trí tuệ nhân tạo theo các tiêu chuẩn quốc tế và
khung pháp lý Việt Nam.
```
</details>


