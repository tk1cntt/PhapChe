# Review: `src/lib/document/cache.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 3

---

## 🟡 Medium (1)

**🐛 Bug** · lines 59-66

Unbounded cache growth when `pruneRatio` is 0 (or negative). `Math.floor(this.maxEntries * 0)` = 0, so `prune()` removes zero entries, yet `set()` continues adding new entries unconditionally. The cache will grow indefinitely past `maxEntries`, causing a memory leak. Add a guard ensuring `removeCount >= 1` or validate `pruneRatio > 0` in the constructor.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  private prune(): void {
    const removeCount = Math.max(1, Math.floor(this.maxEntries * this.pruneRatio));
    const entries = Array.from(this.store.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.store.delete(entries[i][0]);
    }
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  private prune(): void {
    const removeCount = Math.floor(this.maxEntries * this.pruneRatio);
    const entries = Array.from(this.store.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.store.delete(entries[i][0]);
    }
  }
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 17-20

Constructor parameters lack validation. `pruneRatio` values > 1 would cause `prune()` to attempt deleting more entries than exist (wasteful but not harmful). Negative values cause `Math.floor` to produce a negative number, making the prune loop a no-op (same as 0). `maxEntries` of 0 or negative would cause the cache to prune on every `set()` and potentially behave unexpectedly. Consider adding range validation in the constructor.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  constructor(maxEntries = 200, pruneRatio = 0.5) {
    if (maxEntries < 1) throw new Error('maxEntries must be >= 1');
    if (pruneRatio <= 0 || pruneRatio > 1) throw new Error('pruneRatio must be in (0, 1]');
    this.maxEntries = maxEntries;
    this.pruneRatio = pruneRatio;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  constructor(maxEntries = 200, pruneRatio = 0.5) {
    this.maxEntries = maxEntries;
    this.pruneRatio = pruneRatio;
  }
```
</details>

---

**🔧 Maintainability** · lines 23-27

The `get()` method returns `entry.normalized` directly. While `CacheEntry.normalized` is typed as `string` and `set()` always stores a `string`, a runtime guard (e.g., `return entry.normalized ?? null`) would make the method resilient against cache corruption or unexpected `undefined` values, and better align with the declared `string | null` return type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  get(hash: string): string | null {
    const entry = this.store.get(hash);
    if (!entry) return null;
    return entry.normalized ?? null;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  get(hash: string): string | null {
    const entry = this.store.get(hash);
    if (!entry) return null;
    return entry.normalized;
  }
```
</details>


