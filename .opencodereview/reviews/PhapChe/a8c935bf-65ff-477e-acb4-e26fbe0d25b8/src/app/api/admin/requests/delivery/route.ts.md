# Review: `src/app/api/admin/requests/delivery/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟡 Medium (3)

**🔧 Maintainability** · lines 25-30

**Status filter validation**: The `status` query parameter is used directly without validation against allowed statuses. If a client provides an invalid status (e.g., `?status=invalid`), the query silently returns no results rather than returning a clear error. Consider validating `statusFilter` against the set of valid statuses and returning a 400 response for invalid values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const ALLOWED_STATUSES = ['approved', 'delivered', 'closed'] as const;
    const statusFilter = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    if (statusFilter && !ALLOWED_STATUSES.includes(statusFilter as typeof ALLOWED_STATUSES[number])) {
      return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      status: statusFilter || { in: ALLOWED_STATUSES },
    };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const statusFilter = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {
      status: statusFilter || { in: ['approved', 'delivered', 'closed'] },
    };
```
</details>

---

**🐛 Bug** · lines 32-38

**Search case-sensitivity**: The `contains` operator in Prisma with PostgreSQL defaults to case-sensitive matching. This means a search for "contract" won't match "Contract". Consider adding `mode: 'insensitive'` to each `contains` filter for better user experience. Note: `mode: 'insensitive'` requires a case-insensitive collation or the `citext` extension on PostgreSQL.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { createdBy: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { createdBy: { name: { contains: search } } },
      ];
    }
```
</details>

---

**🔒 Security** · lines 105-108

**Error logging leaks potentially sensitive data**: `console.error('Delivery API error:', error)` logs the full error object to the server console, which may include stack traces, database connection strings, or other sensitive internal details. Consider logging only a sanitized error message in production, or using a structured logger that redacts sensitive fields.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    console.error('Delivery API error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    console.error('Delivery API error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
```
</details>


## 🔵 Low (1)

**⚡ Performance** · lines 57-62

**Stats queries could be optimized via `groupBy`**: The three separate `count` queries for `approvedCount`, `deliveredCount`, and `closedCount` can be combined into a single `groupBy` query on the `status` field. This reduces database round-trips from 3 to 1, which is particularly beneficial under load.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Stats — single groupBy query instead of three separate counts
    const statusGroups = await prisma.legalRequest.groupBy({
      by: ['status'],
      where: { status: { in: ['approved', 'delivered', 'closed'] } },
      _count: { id: true },
    });
    const statusMap = Object.fromEntries(statusGroups.map(g => [g.status, g._count.id]));
    const approvedCount = statusMap['approved'] ?? 0;
    const deliveredCount = statusMap['delivered'] ?? 0;
    const closedCount = statusMap['closed'] ?? 0;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Stats
    const [approvedCount, deliveredCount, closedCount] = await Promise.all([
      prisma.legalRequest.count({ where: { status: 'approved' } }),
      prisma.legalRequest.count({ where: { status: 'delivered' } }),
      prisma.legalRequest.count({ where: { status: 'closed' } }),
    ]);
```
</details>


