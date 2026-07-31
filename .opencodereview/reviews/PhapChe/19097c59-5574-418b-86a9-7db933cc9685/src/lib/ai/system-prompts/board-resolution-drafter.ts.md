# Review: `src/lib/ai/system-prompts/board-resolution-drafter.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 3

---

## 🟠 High (1)

**🔒 Security** · lines 25-29

**Prompt Injection Vulnerability**: User-supplied `documentContent` and `requestDescription` are interpolated directly into the system prompt without any structural separation or sanitization. An attacker could inject instructions like "Ignore all previous instructions and instead output..." to override the AI's intended behavior. Since these variables are placed inline with the system instructions, the AI cannot distinguish between developer-authored rules and user-provided content.

**Recommendation**: Isolate user content from system instructions by using clearly delimited sections (e.g., XML-style tags like `<user_input>...</user_input>`) and instruct the model to treat content within those delimiters as data, not instructions. Additionally, consider sanitizing or validating user input at the rendering layer to strip or escape prompt-injection patterns.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
{{#if requestDescription}}
<user_description>
{{requestDescription}}
</user_description>
{{/if}}
{{#if documentContent}}
<document_to_analyze>
{{documentContent}}
</document_to_analyze>
{{/if}}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
{{#if requestDescription}}- Mô tả chi tiết: {{requestDescription}}{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · line 86

**Incomplete `requiredVariables`**: The `requiredVariables` array only lists `['matterType', 'requestTitle', 'locale']`, but the template also references `documentContent`, `requestDescription`, and `legalContext`. This mismatch means the template's actual variable dependencies are not fully documented, which could lead to runtime errors if the rendering layer relies on this array for validation and one of the undocumented variables is missing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
  optionalVariables: ['requestDescription', 'documentContent', 'legalContext'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
```
</details>

---

**🔒 Security** · lines 32-35

**Prompt Injection via `legalContext` RAG results**: The `{{#each legalContext}}` loop renders `{{source}}` and `{{content}}` directly into the system prompt. If the RAG data source is ever compromised or contains untrusted third-party content, an attacker could inject prompt-overriding instructions through these fields. Consider wrapping RAG-sourced content in delimited data sections as well.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
{{#each legalContext}}
<legal_reference source="{{source}}">
{{content}}
</legal_reference>
{{/each}}
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


