# Review: `src/lib/types/wizard.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 1

---

## 🟡 Medium (1)

**🔧 Maintainability** · line 47

Inconsistent action shape: `SET_ANSWER` uses top-level `key` and `value` properties while all other actions use a `payload` property. This inconsistency makes the reducer harder to maintain and increases the risk of bugs when developers pattern-match on the action shape. Consider using `payload: { key: string; value: string }` to match the convention used by every other action in this union.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  | { type: 'SET_ANSWER'; payload: { key: string; value: string } }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  | { type: 'SET_ANSWER'; key: string; value: string }
```
</details>


