# Review: `src/lib/document/index.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 1

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 12-18

`DEFAULT_OPTIONS` is exported from `./types` (line 97 of types.ts) but is not re-exported from this barrel file. Consumers of `@/lib/document` who want to spread the defaults when building custom options (e.g., `{ ...DEFAULT_OPTIONS, detectArticles: false }`) would be forced to import from the internal path `@/lib/document/types` directly, breaking the barrel's encapsulation promise.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export { DEFAULT_OPTIONS } from './types';
export type {
  NormalizeOptions,
  NormalizeResult,
  NormalizePhase,
  CacheEntry,
  MarkItDownResult,
} from './types';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export type {
  NormalizeOptions,
  NormalizeResult,
  NormalizePhase,
  CacheEntry,
  MarkItDownResult,
} from './types';
```
</details>


