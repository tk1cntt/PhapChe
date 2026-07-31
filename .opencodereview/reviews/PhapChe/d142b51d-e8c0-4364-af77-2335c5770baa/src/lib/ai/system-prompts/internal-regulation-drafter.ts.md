# Review: `src/lib/ai/system-prompts/internal-regulation-drafter.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 1

---

## 🔵 Low (1)

**🔧 Maintainability** · line 15

The `as AgentSkill` type assertion on line 14 is redundant. The string literal `'internal-regulation-drafter'` is already a valid member of the `AgentSkill` union type (confirmed at types.ts line 147), so TypeScript will infer the type correctly without the cast. Using an unnecessary `as` cast can be harmful: if the `AgentSkill` union is later refactored and `'internal-regulation-drafter'` is removed or renamed, this cast would silently suppress the resulting type error, making the bug harder to detect. Consider removing the `as` cast to let TypeScript catch future mismatches naturally.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  skill: 'internal-regulation-drafter',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  skill: 'internal-regulation-drafter' as AgentSkill,
```
</details>


