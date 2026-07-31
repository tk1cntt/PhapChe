# Review: `src/lib/ai/system-prompts/tos-generator.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 3

---

## 🔴 Critical (1)

**🔒 Security** · lines 24-31

Prompt injection vulnerability: user-supplied variables (`requestDescription`, `documentContent`, `requestTitle`, `matterType`) are injected directly into the AI system prompt without sanitization. An attacker could embed instructions (e.g., 'Ignore all previous instructions and...') in these fields to override the system prompt and manipulate the AI output.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
YÊU CẦU ĐẦU VÀO:
- Sản phẩm: {{sanitize requestTitle}}
- Loại sản phẩm: {{sanitize matterType}}
{{#if requestDescription}}- Mô tả chi tiết: {{sanitize requestDescription}}{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{sanitize documentContent}}
{{/if}}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
YÊU CẦU ĐẦU VÀO:
- Sản phẩm: {{requestTitle}}
- Loại sản phẩm: {{matterType}}
{{#if requestDescription}}- Mô tả chi tiết: {{requestDescription}}{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 34-37

Missing required variable: `legalContext` is used in the template (via `{{#each legalContext}}`) but is not listed in `requiredVariables`. If the rendering engine validates against this list, the template will fail to compile or produce unexpected output at runtime.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
{{#each legalContext}}
📜 {{source}}
{{content}}
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


## 🔵 Low (1)

**🔧 Maintainability** · line 51

Locale inconsistency: the `effectiveDate` field description is hardcoded as `'Ngày có hiệu lực'` (Vietnamese), but the template instructs output in `{{locale}}`. When `locale` is not 'vi', the AI may output mixed-language content, breaking the locale requirement.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
"effectiveDate": "Effective date / Ngày có hiệu lực"
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
"effectiveDate": "Ngày có hiệu lực"
```
</details>


