# Review: `src/lib/types/index.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 1

---

## 🔵 Low (1)

**🔧 Maintainability** · lines 50-51

Redundant re-export: `export type { AccountType } from './user'` is already covered by `export * from './user'` on line 8. The explicit re-export is unnecessary and adds maintenance burden (if the source module changes, you'd need to update two places).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Re-export user types — already covered by `export * from './user'` above
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
// Re-export user types
export type { AccountType } from './user';
```
</details>


