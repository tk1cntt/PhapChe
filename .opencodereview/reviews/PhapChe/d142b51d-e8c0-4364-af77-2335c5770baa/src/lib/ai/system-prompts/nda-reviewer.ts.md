# Review: `src/lib/ai/system-prompts/nda-reviewer.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 2

---

## 🟠 High (1)

**🔒 Security** · lines 26-34

**Prompt Injection Risk**: User-controlled values (`documentContent`, `requestDescription`, `legalContext.source`, `legalContext.content`) are interpolated directly into the system prompt template without any sanitization or escaping. An attacker could craft input containing Handlebars-like syntax (e.g., `{{...}}`) to break out of the prompt structure, inject malicious instructions, or manipulate the AI's behavior — potentially bypassing the "TRẢ VỀ DUY NHẤT JSON" constraint and exfiltrating data or altering the review outcome.

**Recommendation**: Sanitize or escape user-provided values before interpolation. At minimum, replace `{{` and `}}` delimiters in user content (e.g., replace with their HTML entities or whitespace-padded equivalents). Consider using a template engine that auto-escapes interpolated values by default.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{sanitize documentContent}}
{{/if}}

BỐI CẢNH PHÁP LÝ (từ RAG):
{{#each legalContext}}
📜 {{sanitize source}}
{{sanitize content}}
{{/each}}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}

BỐI CẢNH PHÁP LÝ (từ RAG):
{{#each legalContext}}
📜 {{source}}
{{content}}
{{/each}}
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · line 73

**Missing critical variable in `requiredVariables`**: `documentContent` is essential for the NDA review task (the AI cannot meaningfully review a document without its content), yet it is not listed in `requiredVariables`. The `{{#if documentContent}}` guard makes it optional, but the caller should be warned that the output will be useless without it. This mismatch between the declared requirements and the actual functional needs can lead to silent failures where the AI returns a valid JSON response with no findings.

**Recommendation**: Add `'documentContent'` to the `requiredVariables` array, or at minimum add runtime validation on the caller side that logs a warning when `documentContent` is empty/missing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'documentContent', 'locale'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
```
</details>


