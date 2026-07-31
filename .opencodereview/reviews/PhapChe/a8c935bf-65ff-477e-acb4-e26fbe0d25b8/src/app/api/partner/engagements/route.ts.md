# Review: `src/app/api/partner/engagements/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (2)

**🔧 Maintainability** · line 42

Using `new URL(req.url)` to parse the URL is unnecessary and non-idiomatic in Next.js. `NextRequest` already exposes a parsed `nextUrl` property (a `URL` object) that includes `searchParams`. Using `new URL()` adds overhead and could theoretically fail if `req.url` is not an absolute URL in certain edge cases. Use `req.nextUrl.searchParams` instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { searchParams } = req.nextUrl;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { searchParams } = new URL(req.url);
```
</details>

---

**🐛 Bug** · line 43

The `status` query parameter is passed directly into the Prisma `where` clause without validation. If an invalid status value is provided (e.g., `?status=invalid`), Prisma will throw an error that is caught by the generic 500 handler, returning an unhelpful "Internal server error" to the user. Consider validating `status` against allowed values (e.g., enum values from the Engagement model) and returning a 400 Bad Request for invalid inputs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const ALLOWED_STATUSES = ['active', 'inactive', 'pending', 'all'] as const;
    const rawStatus = searchParams.get('status') || 'active';
    if (!ALLOWED_STATUSES.includes(rawStatus)) {
      return NextResponse.json(
        { error: 'INVALID_PARAMETER', detail: `Invalid status: ${rawStatus}` },
        { status: 400 }
      );
    }
    const status = rawStatus;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const status = searchParams.get('status') || 'active';
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 47

Hardcoded magic numbers for pagination limits (`100` for max `take`, `10` for default `take`) reduce maintainability. Consider extracting them as named constants at the module level so they can be easily adjusted and their purpose is self-documenting.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const MAX_PAGE_SIZE = 100;
    const DEFAULT_PAGE_SIZE = 10;
    // ...
    const take = Number.isFinite(rawTake) ? Math.min(MAX_PAGE_SIZE, Math.max(1, rawTake)) : DEFAULT_PAGE_SIZE;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const take = Number.isFinite(rawTake) ? Math.min(100, Math.max(1, rawTake)) : 10;
```
</details>


