# Review: `src/app/api/admin/audit/stats/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 1

---

## 🔵 Low (1)

**🔧 Maintainability** · line 5

Redundant `as const` followed by `as readonly string[]` — the `as const` assertion already produces a `readonly` tuple. The subsequent cast widens it back to `readonly string[]`, which is needed for `.includes(role)` to type-check when `role` is `string`, but the two assertions work against each other. A cleaner approach: drop `as const` and use a type annotation instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const ADMIN_ROLES: readonly string[] = ['super_admin', 'coordinator_admin'];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
```
</details>


