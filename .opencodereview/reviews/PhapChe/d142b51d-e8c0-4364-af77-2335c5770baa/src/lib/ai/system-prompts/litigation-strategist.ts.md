# Review: `src/lib/ai/system-prompts/litigation-strategist.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 4

---

## 🟠 High (3)

**🔒 Security** · lines 29-32

**Prompt Injection Risk**: `documentContent` (line 31) and `legalContext[x].content` (line 36) are injected directly into the system prompt without any sanitization guidance. An attacker could craft document content or RAG results containing prompt injection payloads (e.g., "Ignore all previous instructions...") that override the LLM's behavior, potentially bypassing the structured JSON output constraint or producing malicious outputs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
```
{{sanitize documentContent}}
```
{{/if}}
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

---

**🐛 Bug** · lines 42-52

**Invalid JSON Example in Prompt**: The output format template (lines 42-192) contains non-standard JSON:
- Unquoted property keys (e.g., `caseSummary:`, `swotAnalysis:`, `recoveryRate: "Tỷ lệ thu hồi dự kiến (%)"`)
- Vietnamese inline comments (e.g., `// Tên nguyên đơn`, `// Tỷ lệ thu hồi dự kiến (%)`)
- Range notation `0-100` instead of a numeric value

Given `outputFormat: 'json_object'`, the LLM may emulate this invalid format, producing malformed JSON that fails downstream `JSON.parse()`. Remove all comments and use valid JSON with placeholder values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  "caseSummary": {
    "type": "commercial",
    "jurisdiction": "[Tòa án có thẩm quyền]",
    "value": 0,
    "currency": "VND",
    "parties": {
      "plaintiff": "[Tên nguyên đơn]",
      "defendant": "[Tên bị đơn]",
      "thirdParties": ["[Người có quyền lợi, nghĩa vụ liên quan]"]
    }
  },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  "caseSummary": {
    "type": "commercial|civil|labor|administrative|ip|criminal|other",
    "jurisdiction": "Tòa án có thẩm quyền",
    "value": 0,
    "currency": "VND",
    "parties": {
      "plaintiff": "Tên nguyên đơn",
      "defendant": "Tên bị đơn",
      "thirdParties": ["Người có quyền lợi, nghĩa vụ liên quan"]
    }
  },
```
</details>

---

**🐛 Bug** · lines 35-38

**Template Field Mismatch — `legalContext` iteration**: The template iterates with `{{#each legalContext}}` and accesses `{{source}}` and `{{content}}` directly. However, `SkillContext.legalContext` is typed as `SearchResult[]`, where each `SearchResult` wraps a `DocumentChunk` in a `chunk` property. The correct paths should be `{{chunk.source}}` and `{{chunk.content}}`. Unless the template engine flattens the data beforehand, this will produce empty strings, rendering the RAG legal context references useless.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
{{#each legalContext}}
📜 {{chunk.source}}
{{chunk.content}}
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


## 🟡 Medium (1)

**🐛 Bug** · line 221

**Missing `legalContext` in `requiredVariables`**: The template uses `legalContext` (line 33) for RAG-based legal grounding, but it is not listed in `requiredVariables` (line 261). `SkillContext.legalContext` is optional (`SearchResult[] | undefined`), so the caller can omit it silently. The LLM would then produce a strategy analysis without legal references, potentially yielding an unreliable or incomplete assessment. Consider adding `'legalContext'` to `requiredVariables` or adding an `{{#if legalContext}}` guard with a fallback warning.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale', 'legalContext'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
```
</details>


