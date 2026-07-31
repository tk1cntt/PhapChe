# Review: `src/lib/ai/system-prompts/trademark-clearance.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 1

---

## 🟡 Medium (1)

**🐛 Bug** · line 130

The template uses `{{#each legalContext}}` (line 33) to iterate over legal context data, but `legalContext` is not listed in `requiredVariables`. If the runtime validates required variables before rendering, the legal context data may not be provided, leading to incomplete or missing legal analysis in the AI's output. Consider adding `'legalContext'` to the `requiredVariables` array.

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


