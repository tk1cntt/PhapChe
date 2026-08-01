# Review: `src/lib/ai/system-prompts/cease-desist-drafter.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 3

---

## 🟠 High (1)

**🔒 Security** · lines 24-31

Prompt Injection Risk: Template variables {{matterType}}, {{requestTitle}}, {{requestDescription}}, {{documentContent}}, and {{#each legalContext}} content are injected directly into the system prompt without any visible sanitization or escaping. If any of these inputs contain Handlebars-like syntax (e.g., `{{...}}`), control characters, or instruction-override text (e.g., 'Ignore all previous instructions...'), an attacker could manipulate the AI's behavior, break the output JSON format, or cause the model to produce unintended responses. The rendering system must escape or sanitize all user-supplied values before interpolation into the prompt.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Ensure the template rendering engine escapes/sanitizes all user-supplied variables
// before interpolation. For example:
// - Strip or escape Handlebars syntax characters ({{, }}, {{{, }}})
// - Consider truncating or sanitizing documentContent to a reasonable length
// - Validate that variables don't contain instruction-override patterns
//
// Example sanitization (implemented in the rendering layer, not this file):
// const sanitized = value.replace(/\{\{[^}]*\}\}/g, '').slice(0, MAX_LENGTH);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
YÊU CẦU ĐẦU VÀO:
- Loại vi phạm: {{matterType}}
- Bên bị vi phạm (khách hàng): {{requestTitle}}
{{#if requestDescription}}- Mô tả chi tiết hành vi vi phạm: {{requestDescription}}{{/if}}
{{#if documentContent}}
NỘI DUNG TÀI LIỆU CẦN PHÂN TÍCH:
{{documentContent}}
{{/if}}
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · line 126

Hardcoded business values: The deadline range '7-15 ngày' and specific legal article references (e.g., 'Điều 206-208 BLTTDS 2015') are hardcoded in the template string. These values may change when laws are amended or business policies are updated. Consider extracting them into configurable variables or constants so they can be updated without modifying the prompt template.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider extracting hardcoded legal references and business values:
// const DEFAULT_DEADLINE_DAYS = { min: 7, max: 15 };
// const LEGAL_ARTICLES = { preliminaryInjunction: 'Điều 206-208 BLTTDS 2015' };
// Then reference them in the template via variables.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
6. CÁC BIỆN PHÁP KHẨN CẤP: Đánh giá khả năng xin áp dụng BPCKTT theo Điều 206-208 BLTTDS 2015
```
</details>


## 🔵 Low (1)

**🐛 Bug** · line 126

Likely typo in abbreviation: 'BPCKTT' should be 'BPKCTT'. The full phrase is 'Biện Pháp Khẩn Cấp Tạm Thời'. Taking the first letter of each word yields: B(iện) + P(háp) + K(hẩn) + C(ấp) + T(ạm) + T(hời) = BPKCTT. The current 'BPCKTT' transposes the 'C' and 'K', which doesn't match the natural word order and could confuse readers familiar with the standard legal abbreviation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
6. CÁC BIỆN PHÁP KHẨN CẤP: Đánh giá khả năng xin áp dụng BPKCTT theo Điều 206-208 BLTTDS 2015
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
6. CÁC BIỆN PHÁP KHẨN CẤP: Đánh giá khả năng xin áp dụng BPCKTT theo Điều 206-208 BLTTDS 2015
```
</details>


