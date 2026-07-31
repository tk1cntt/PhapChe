# Review: `src/lib/ai/system-prompts/labor-discipline-checker.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 2

---

## 🟡 Medium (1)

**🔧 Maintainability** · line 88

Template variable `legalContext` is used in `{{#each legalContext}}` but is not listed in `requiredVariables`. This variable provides RAG-sourced legal context that is essential for accurate risk assessments. If omitted, the AI will lack the legal basis (BLLĐ 2019 articles, NĐ 145/2020/NĐ-CP) needed to produce compliant output. Consider adding it to `requiredVariables` or, if it's intentionally optional, adding a comment explaining when it can be safely omitted.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // legalContext is also expected but optional — RAG may return empty results
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  requiredVariables: ['matterType', 'requestTitle', 'locale'],
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 15

Type assertion `as AgentSkill` on the string literal bypasses type-checking: if `'labor-discipline-checker'` does not match the `AgentSkill` union type, the error would surface at runtime rather than compile time. Prefer annotating the entire object with `: SystemPromptTemplate` so the `skill` property is validated against the union type directly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  skill: 'labor-discipline-checker',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  skill: 'labor-discipline-checker' as AgentSkill,
```
</details>


