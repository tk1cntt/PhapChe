# Review: `src/lib/ai/system-prompts/legal-memo-drafter.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 2

---

## 🟡 Medium (1)

**🐛 Bug** · lines 35-39

The `legalContext` section (lines 35-38) has no `{{#if}}` guard, unlike `documentContent` (which has `{{#if documentContent}}` on line 32). When `legalContext` is empty or undefined, the `{{#each}}` silently iterates nothing, but the section header `BỐI CẢNH PHÁP LÝ (từ RAG):` will still render in the prompt, followed by no content. This can confuse the AI and produce inconsistent prompt quality. Wrap the entire section in `{{#if legalContext}}...{{/if}}` (or check `legalContext.length`) to suppress the header when RAG returns no results.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
{{#if legalContext}}
BỐI CẢNH PHÁP LÝ (từ RAG):
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
BỐI CẢNH PHÁP LÝ (từ RAG):
{{#each legalContext}}
📜 {{source}}
{{content}}
{{/each}}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 161

Incomplete `requiredVariables`: The template uses `requestDescription` (line 30), `documentContent` (line 32), and `legalContext` (line 36) but only `matterType`, `requestTitle`, and `locale` are declared in `requiredVariables`. While these are intentionally optional (guarded by `{{#if}}`/`{{#each}}`), callers have no type-level awareness that they can supply these variables to enrich the analysis. The `skill-executor.ts` always passes them (lines 185-195), so the array doesn't reflect the full variable contract. Adding a comment or `optionalVariables` field would prevent integration confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
  // Optional: requestDescription, documentContent, legalContext are also consumed
  // by the template but are guarded by {{#if}}/{{#each}} blocks.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
```
</details>


