# Review: `src/lib/ai/system-prompts/entity-compliance-checker.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 2

---

## 🟠 High (1)

**🔒 Security** · lines 18-28

Prompt Injection Vulnerability: User-supplied variables (matterType, requestTitle, requestDescription, documentContent, locale) are interpolated directly into the system prompt template without any sanitization or escaping. A malicious user could inject Handlebars syntax or LLM-prompt-override instructions (e.g., 'Ignore all previous instructions and...') through these fields, potentially altering the AI's behavior, bypassing output format constraints, or leaking sensitive information. Consider sanitizing these inputs to strip or escape Handlebars directives and known prompt-injection patterns before interpolation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider wrapping user-supplied values with a sanitization function:
// import { sanitizePromptInput } from '../utils/prompt-sanitizer';
//
// Then in the template building logic:
// - Loại kiểm tra: {{sanitizePromptInput matterType}}
// - Doanh nghiệp: {{sanitizePromptInput requestTitle}}
// etc.
//
// sanitizePromptInput should at minimum:
// 1. Escape/remove Handlebars delimiters ({{, }})
// 2. Strip or neutralize known prompt-injection patterns
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
NHIỆM VỤ:
Kiểm tra tình trạng tuân thủ pháp luật doanh nghiệp và đưa ra checklist hành động.

YÊU CẦU ĐẦU VÀO:
- Loại kiểm tra: {{matterType}}
- Doanh nghiệp: {{requestTitle}}
{{#if requestDescription}}- Mô tả chi tiết: {{requestDescription}}{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
```
</details>


## 🟡 Medium (1)

**🔒 Security** · lines 30-34

The `legalContext` array items (source and content) are interpolated directly into the prompt. If the RAG pipeline or external legal sources are compromised, they could inject malicious content into the LLM prompt. Consider sanitizing `legalContext` entries as well, especially `content` which may contain arbitrary text from retrieved documents.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Sanitize legalContext entries before passing to the template:
// const sanitizedContext = legalContext.map(item => ({
//   source: sanitizePromptInput(item.source),
//   content: sanitizePromptInput(item.content),
// }));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
BỐI CẢNH PHÁP LÝ (từ RAG):
{{#each legalContext}}
📜 {{source}}
{{content}}
{{/each}}
```
</details>


