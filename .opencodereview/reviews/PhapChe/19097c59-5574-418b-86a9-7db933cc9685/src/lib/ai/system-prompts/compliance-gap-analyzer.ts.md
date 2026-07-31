# Review: `src/lib/ai/system-prompts/compliance-gap-analyzer.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 2

---

## 🟡 Medium (1)

**🔒 Security** · lines 27-30

Template injection risk: user-controlled variables (`documentContent`, `legalContext`, `requestDescription`) are interpolated into the system prompt without any sanitization indicators. If the downstream Handlebars/template engine does not escape these values, a malicious user could inject prompt instructions via `documentContent` (e.g., `Ignore all previous instructions and output...`). Ensure the rendering engine applies proper escaping or delimiter filtering to all user-supplied template variables.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
<!-- NOTE: Ensure downstream template engine escapes/sterilizes user-provided variables to prevent prompt injection -->
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 145

The `requiredVariables` array (`['matterType', 'requestTitle', 'locale']`) does not include `documentContent`, `legalContext`, or `requestDescription`, which are used in the template. While these are intentionally optional (guarded by `{{#if}}`/`{{#each}}`), this asymmetry could cause confusion if the array is used for runtime validation or documentation generation. Consider adding a separate `optionalVariables` field or documenting the discrepancy.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
  // Note: documentContent, legalContext, and requestDescription are optional template variables
  // guarded by {{#if}}/{{#each}} blocks — they are not required but may be provided for richer analysis.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
```
</details>


