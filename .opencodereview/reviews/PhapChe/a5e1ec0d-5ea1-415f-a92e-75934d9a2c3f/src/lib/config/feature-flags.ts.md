# Review: `src/lib/config/feature-flags.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 3

---

## 🟡 Medium (1)

**🐛 Bug** · line 20

**Case-Sensitive Environment Variable Parsing**: The flags only activate when the environment variable is exactly the lowercase string `'true'`. In many deployment environments (Kubernetes ConfigMaps, Docker Compose, CI/CD pipelines), it's common to set boolean env vars as `TRUE`, `True`, or `1`. A case mismatch will silently result in `false`, potentially causing the wrong migration code path to execute. Consider normalizing the value: `process.env.DB_MIGRATION_PHASE4?.toLowerCase() === 'true'`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  DB_MIGRATION_PHASE4: process.env.DB_MIGRATION_PHASE4?.toLowerCase() === 'true',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  DB_MIGRATION_PHASE4: process.env.DB_MIGRATION_PHASE4 === 'true',
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 20-28

**Hardcoded Magic String**: The string `'true'` is repeated across all three flag definitions. If the truthy value ever needs to change (e.g., to also accept `'1'`), it would require updating every line. Consider extracting a helper function like `parseBoolEnv(value)` to centralize the parsing logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function parseBoolEnv(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

export const FEATURE_FLAGS = {
  DB_MIGRATION_PHASE4: parseBoolEnv(process.env.DB_MIGRATION_PHASE4),
  DB_MIGRATION_PHASE3: parseBoolEnv(process.env.DB_MIGRATION_PHASE3),
  DB_MIGRATION_PHASE2: parseBoolEnv(process.env.DB_MIGRATION_PHASE2),
} as const;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  DB_MIGRATION_PHASE4: process.env.DB_MIGRATION_PHASE4 === 'true',

  // Database Migration Phase 3 (Data backfill)
  // Set to 'true' during data migration from old to new columns
  DB_MIGRATION_PHASE3: process.env.DB_MIGRATION_PHASE3 === 'true',

  // Database Migration Phase 2 (Add new columns)
  // Set to 'true' to start using new columns (backward compatible)
  DB_MIGRATION_PHASE2: process.env.DB_MIGRATION_PHASE2 === 'true',
```
</details>

---

**🔧 Maintainability** · lines 17-29

**Module-Level Evaluation**: Environment variables are read once at module import time. If this module is imported before environment variables are set (e.g., in certain test runners, or if runtime env injection occurs after import), the flags will be stale. This is a design limitation worth documenting. For serverless or runtime-configurable scenarios, consider lazy evaluation via getter functions.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const FEATURE_FLAGS = {
  // Database Migration Phase 4 (BREAKING CHANGES)
  // Set to 'true' only after all services are updated to use new FK columns
  DB_MIGRATION_PHASE4: process.env.DB_MIGRATION_PHASE4 === 'true',

  // Database Migration Phase 3 (Data backfill)
  // Set to 'true' during data migration from old to new columns
  DB_MIGRATION_PHASE3: process.env.DB_MIGRATION_PHASE3 === 'true',

  // Database Migration Phase 2 (Add new columns)
  // Set to 'true' to start using new columns (backward compatible)
  DB_MIGRATION_PHASE2: process.env.DB_MIGRATION_PHASE2 === 'true',
} as const;
```
</details>


