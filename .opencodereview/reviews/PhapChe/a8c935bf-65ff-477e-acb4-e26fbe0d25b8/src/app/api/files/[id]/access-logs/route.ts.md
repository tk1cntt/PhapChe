# Review: `src/app/api/files/[id]/access-logs/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟠 High (1)

**🐛 Bug** · lines 40-41

Pagination parameters are not validated for NaN, zero, or negative values. `parseInt` returns `NaN` for non-numeric strings (e.g., `?page=abc`), and `pageSize = 0` would cause division by zero in `Math.ceil(result.total / pageSize)` producing `Infinity`. Negative values could also lead to unexpected database behavior.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawPageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const pageSize = Number.isNaN(rawPageSize) || rawPageSize < 1
      ? 20
      : Math.min(100, rawPageSize);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10));
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 74-82

If `result.total` is `undefined` or not a number, `Math.ceil(result.total / pageSize)` will produce `NaN`. This could happen if `storageServer.getAccessLogs` returns an unexpected shape or `total` is omitted.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const total = result.total ?? 0;

    return NextResponse.json({
      data: result.data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return NextResponse.json({
      data: result.data,
      meta: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    });
```
</details>

---

**🔧 Maintainability** · lines 87-98

Relying on `error.message.includes('NOT_FOUND')` and `error.message.includes('PERMISSION')` for control flow is fragile. If the error message string changes in `storageServer.getAccessLogs`, these checks silently break and fall through to a generic 500 error. Consider using a custom error class (e.g., `class NotFoundError extends Error`) or a structured error code property instead of string matching.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      if (error instanceof NotFoundError) {
        return NextResponse.json(
          { error: 'Not found', detail: 'File not found' },
          { status: 404 }
        );
      }
      if (error instanceof PermissionError) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Access denied' },
          { status: 403 }
        );
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json(
          { error: 'Not found', detail: 'File not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('PERMISSION')) {
        return NextResponse.json(
          { error: 'Forbidden', detail: 'Access denied' },
          { status: 403 }
        );
      }
```
</details>


