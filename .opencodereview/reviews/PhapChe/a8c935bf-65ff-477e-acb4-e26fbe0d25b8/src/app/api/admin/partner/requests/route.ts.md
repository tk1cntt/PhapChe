# Review: `src/app/api/admin/partner/requests/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🔴 Critical (1)

**🐛 Bug** · lines 47-77

In-memory filtering with hardcoded `fetchLimit = 200` causes data loss and incorrect pagination. The database query is capped at 200 records total (sorted by `updatedAt desc`), then filtered in memory for partner-related entries. If there are more than 200 matching records in the database (including non-partner ones), partner-related records beyond the first 200 are silently dropped. Additionally, pagination metadata (`total`, `pages`) is computed from the truncated in-memory set, not the actual database count, so the client sees wrong totals and may never reach later pages of partner requests.

Fix: apply the partner-related condition at the database level so proper pagination can be used. For example:
```typescript
const where: Prisma.LegalRequestWhereInput = {
  AND: [
    { OR: [{ assignedPartnerId: { not: null } }, { engagement: { partnerId: { not: null } } }] },
    ...(status ? [{ status }] : []),
    ...(partnerId ? [{ assignedPartnerId: partnerId }] : []),
  ],
};
```
Then use Prisma's `skip`/`take` for proper pagination and `count` for accurate totals, removing the in-memory filter entirely.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Ensure we only fetch partner-related requests at the database level
    const baseWhere: Record<string, unknown> = {
      OR: [
        { assignedPartnerId: { not: null } },
        { engagement: { partnerId: { not: null } } },
      ],
    };

    if (status) baseWhere.status = status;
    if (partnerId) baseWhere.assignedPartnerId = partnerId;

    if (search) {
      baseWhere.AND = [
        { OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { createdBy: { name: { contains: search, mode: 'insensitive' } } },
          { assignedPartner: { name: { contains: search, mode: 'insensitive' } } },
        ]},
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.legalRequest.count({ where: baseWhere }),
      prisma.legalRequest.findMany({
        where: baseWhere,
        include: {
          assignedPartner: { select: { id: true, name: true } },
          engagement: {
            select: {
              partnerId: true,
              partner: { select: { name: true } }
            }
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Fetch more records to filter for partner-related ones in memory
    // SQLite doesn't handle OR with NOT NULL well
    const fetchLimit = 200; // Fetch up to 200 to filter

    const allRequests = await prisma.legalRequest.findMany({
      where,
      include: {
        assignedPartner: { select: { id: true, name: true } },
        engagement: {
          select: {
            partnerId: true,
            partner: { select: { name: true } }
          }
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: fetchLimit,
    });

    // Filter in-memory for partner-related requests
    const partnerRequests = allRequests.filter(
      (r) => r.assignedPartnerId || r.engagement?.partnerId
    );

    // Apply pagination
    const total = partnerRequests.length;
    const paginatedRequests = partnerRequests.slice(
      (page - 1) * limit,
      page * limit
    );
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 38-45

The `mode: 'insensitive'` option in Prisma `contains` queries is not supported by SQLite and will cause a runtime error. The code comment mentions SQLite, suggesting this is the intended database. Remove `mode: 'insensitive'` (SQLite `LIKE` is case-insensitive for ASCII by default) or use a database-agnostic approach (e.g., convert both sides to lowercase).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { createdBy: { name: { contains: search } } },
        { assignedPartner: { name: { contains: search } } },
      ];
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { createdBy: { name: { contains: search, mode: 'insensitive' } } },
        { assignedPartner: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 25-26

Missing input validation for `page` and `limit` query parameters. `parseInt` on non-numeric strings returns `NaN`, which passes through `??` (only guards against `null`/`undefined`). This causes `NaN` values in pagination calculations (e.g., `Math.ceil(NaN / NaN)` → `NaN`, `slice(NaN, NaN)` → empty array). Negative or zero `page`/`limit` values can also produce unexpected slicing behavior. Add explicit validation and fallback to safe defaults.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 20;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
```
</details>


