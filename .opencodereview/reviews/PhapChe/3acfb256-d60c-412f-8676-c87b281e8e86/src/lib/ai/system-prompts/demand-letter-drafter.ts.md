# Review: `src/lib/ai/system-prompts/demand-letter-drafter.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 1

---

## 🟠 High (1)

**🐛 Bug** · line 15

Type assertion `as AgentSkill` bypasses compile-time type checking. If `'demand-letter-drafter'` is not a valid member of the `AgentSkill` union type, the compiler will silently accept it, potentially causing runtime issues downstream when this value is consumed. Consider using `satisfies AgentSkill` (TypeScript 4.9+) or type the variable with `: SystemPromptTemplate` and let the `skill` field be inferred and validated against the union.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  skill: 'demand-letter-drafter' as AgentSkill, // Ensure this literal is a valid member of the AgentSkill union; prefer `satisfies` if available
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  skill: 'demand-letter-drafter' as AgentSkill,
```
</details>


