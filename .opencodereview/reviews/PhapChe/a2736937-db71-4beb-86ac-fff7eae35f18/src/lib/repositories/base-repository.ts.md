# Review: `src/lib/repositories/base-repository.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 6

---

## 🟠 High (3)

**🔒 Security** · lines 71-80

Information disclosure: `update` and `delete` throw distinct error messages ('Not found' vs 'Permission denied'), which allows an attacker to probe for entity existence. This is inconsistent with `findById`, which intentionally returns `null` for both cases to avoid info leaks. Use the same generic message for all authorization failures.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const existing = await this.dbFindById(id);
    if (!existing) throw new Error('Not found');

    if (!await this.canAccess(ctx, existing)) {
      throw new Error('Not found');
    }

    if (!await this.canUpdate(ctx, existing, data)) {
      throw new Error('Not found');
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const existing = await this.dbFindById(id);
    if (!existing) throw new Error('Not found');

    if (!await this.canAccess(ctx, existing)) {
      throw new Error('Permission denied');
    }

    if (!await this.canUpdate(ctx, existing, data)) {
      throw new Error('Permission denied');
    }
```
</details>

---

**🔒 Security** · lines 89-98

Same information disclosure issue in `delete` — distinct 'Not found' vs 'Permission denied' messages reveal entity existence.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const existing = await this.dbFindById(id);
    if (!existing) throw new Error('Not found');

    if (!await this.canAccess(ctx, existing)) {
      throw new Error('Not found');
    }

    if (!await this.canDelete(ctx, existing)) {
      throw new Error('Not found');
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const existing = await this.dbFindById(id);
    if (!existing) throw new Error('Not found');

    if (!await this.canAccess(ctx, existing)) {
      throw new Error('Permission denied');
    }

    if (!await this.canDelete(ctx, existing)) {
      throw new Error('Permission denied');
    }
```
</details>

---

**🐛 Bug** · lines 71-82

Race condition (TOCTOU): Update/delete perform a read-check-write in separate non-atomic steps. Between the `dbFindById` read and the `dbUpdate`/`dbDelete` mutation, a concurrent request could modify or delete the entity, bypassing permission checks or causing data corruption. Consider using optimistic concurrency (version field) or database-level pessimistic locks (e.g., `SELECT ... FOR UPDATE`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Consider wrapping in a transaction with SELECT ... FOR UPDATE or using
    // optimistic concurrency (version field) to prevent TOCTOU race conditions.
    const existing = await this.dbFindById(id);
    if (!existing) throw new Error('Not found');

    if (!await this.canAccess(ctx, existing)) {
      throw new Error('Permission denied');
    }

    if (!await this.canUpdate(ctx, existing, data)) {
      throw new Error('Permission denied');
    }

    return this.dbUpdate(id, data) as Promise<T>;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const existing = await this.dbFindById(id);
    if (!existing) throw new Error('Not found');

    if (!await this.canAccess(ctx, existing)) {
      throw new Error('Permission denied');
    }

    if (!await this.canUpdate(ctx, existing, data)) {
      throw new Error('Permission denied');
    }

    return this.dbUpdate(id, data) as Promise<T>;
```
</details>


## 🟡 Medium (3)

**⚡ Performance** · lines 48-52

Sequential `await` in a loop: `findMany` uses `for...of` with `await` for each entity's `canAccess` check, serializing independent permission evaluations. For large result sets this causes significant latency. Use `Promise.all` to parallelize the checks.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const accessResults = await Promise.all(
      results.map(async (result) => ({
        result,
        accessible: await this.canAccess(ctx, result),
      }))
    );

    for (const { result, accessible: canAccess } of accessResults) {
      if (canAccess) {
        accessible.push(result as T);
      }
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    for (const result of results) {
      if (await this.canAccess(ctx, result)) {
        accessible.push(result as T);
      }
    }
```
</details>

---

**🔧 Maintainability** · lines 104-108

Unsafe type casts: Abstract methods return `unknown`, but public methods cast to `T` via `as T` without runtime validation. If a subclass violates the contract (e.g., returns a different shape), the type system will not catch it, leading to runtime errors downstream. Consider making `dbFindById` and `dbFindMany` return `T` directly (using the generic) to enforce type safety at the subclass level.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected abstract dbFindById(id: string): Promise<T | null>;
  protected abstract dbFindMany(options: FindManyOptions<WhereInput>): Promise<T[]>;
  protected abstract dbCreate(data: CreateInput): Promise<T>;
  protected abstract dbUpdate(id: string, data: UpdateInput): Promise<T>;
  protected abstract dbDelete(id: string): Promise<T>;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected abstract dbFindById(id: string): Promise<unknown | null>;
  protected abstract dbFindMany(options: FindManyOptions<WhereInput>): Promise<unknown[]>;
  protected abstract dbCreate(data: CreateInput): Promise<unknown>;
  protected abstract dbUpdate(id: string, data: UpdateInput): Promise<unknown>;
  protected abstract dbDelete(id: string): Promise<unknown>;
```
</details>

---

**🔧 Maintainability** · line 62

Plain `Error` objects lack structured information: All methods throw `new Error(message)` with only a string. This makes it difficult for callers to programmatically distinguish error types (e.g., not found vs. permission denied vs. validation error) and for monitoring tools to classify errors. Consider defining custom error classes (e.g., `NotFoundError`, `PermissionDeniedError`) with structured properties.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      throw new PermissionDeniedError('Permission denied');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      throw new Error('Permission denied');
```
</details>


