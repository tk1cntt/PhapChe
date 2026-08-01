# Review: `src/lib/ai/index.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 2

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 48-49

Exposing the mutable `vectorIndex` singleton in the barrel export breaks encapsulation. Any consumer can directly call mutation methods like `vectorIndex.clear()`, `vectorIndex.add()`, or `vectorIndex.removeDocument()`, bypassing the higher-level API (`indexDocument`, `semanticSearch`, etc.). Consider removing `vectorIndex` from the barrel export, or at minimum exporting only a read-only interface (e.g., a frozen wrapper or stats-only accessor).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // vectorIndex is intentionally NOT exported — use indexDocument(), semanticSearch(), etc.
} from './vector-store';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  vectorIndex,
} from './vector-store';
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 55-57

The `getSkillsForDomain` function exported from `./system-prompts` requires two arguments (`domain: string` and `domainSkillMap: Record<string, AgentSkill[]>`), but `DOMAIN_SKILL_MAP` is already available in the same module. This forces callers to pass the internal map manually. Consider whether `getSkillsForDomain` should use `DOMAIN_SKILL_MAP` internally (simplifying the signature) or whether a different helper (like `suggestSkills` from `./domain-resolver`) is more appropriate for the public API.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  getSkillsForDomain,
  renderSystemPrompt,
} from './system-prompts';
```
</details>


