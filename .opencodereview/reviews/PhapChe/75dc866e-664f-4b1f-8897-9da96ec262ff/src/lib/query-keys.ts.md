# Review: `src/lib/query-keys.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 1

---

## 🔵 Low (1)

**🔧 Maintainability** · lines 16-17

The `list()` function treats `undefined` and empty object `{}` differently: `list()` returns `[entity, 'list']`, while `list({})` returns `[entity, 'list', {}]`. This can lead to subtle cache misses if a caller passes an empty filters object expecting it to match the unfiltered list query. Consider normalizing empty filters to produce the same key as no filters.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    list: (filters?: Record<string, unknown>) => {
      const hasFilters = filters && Object.keys(filters).length > 0;
      return hasFilters
        ? ([entity, 'list', { ...filters }] as const)
        : ([entity, 'list'] as const);
    },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    list: (filters?: Record<string, unknown>) =>
      filters ? [entity, 'list', { ...filters }] as const : [entity, 'list'] as const,
```
</details>


