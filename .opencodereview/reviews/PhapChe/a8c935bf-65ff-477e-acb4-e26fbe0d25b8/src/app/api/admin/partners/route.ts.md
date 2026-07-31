# Review: `src/app/api/admin/partners/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟡 Medium (2)

**🐛 Bug** · lines 54-57

Partners with no active engagements are classified as 'dedicated' by default, which may be semantically incorrect. When `orgIds` is empty (`[]`), `new Set([]).size` is `0`, `hasMultipleOrgs` is `false`, so `partnerType` falls through to `'dedicated'`. A partner with no engagements has no basis for classification. Consider using a third category like `'none'` or `'unassigned'`, or consulting the partner's historical/all engagements rather than only active ones.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Determine partner model type based on engagement pattern
      const orgIds = partner.engagements.map((e) => e.organizationId);
      const hasMultipleOrgs = new Set(orgIds).size > 1;
      const partnerType = orgIds.length === 0 ? 'unassigned' : (hasMultipleOrgs ? 'specialist' : 'dedicated');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Determine partner model type based on engagement pattern
      const orgIds = partner.engagements.map((e) => e.organizationId);
      const hasMultipleOrgs = new Set(orgIds).size > 1;
      const partnerType = hasMultipleOrgs ? 'specialist' : 'dedicated';
```
</details>

---

**⚡ Performance** · lines 23-50

No pagination is applied to the partner query. As the number of partners grows, fetching all records with nested includes (`engagements`, `assignedRequests`, `_count`) could cause significant performance degradation or request timeouts. Consider adding `take`/`skip` parameters or cursor-based pagination.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // TODO: Add pagination (take/skip) to prevent performance issues as partner count grows
    const partners = await prisma.partner.findMany({
      include: {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get all partners with their assignments and engagements
    const partners = await prisma.partner.findMany({
      include: {
        _count: {
          select: {
            members: true,
            engagements: true,
          },
        },
        // Get active engagements with organization info
        engagements: {
          where: { status: 'active' },
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        },
        // Count assigned requests
        assignedRequests: {
          where: {
            status: { notIn: ['closed', 'cancelled'] },
          },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });
```
</details>


## 🔵 Low (2)

**🐛 Bug** · lines 68-72

`serviceScopes` is hardcoded to an empty array with a TODO comment. If the frontend UI relies on this field to display engagement scope data, it will always show blank/incomplete information for every active engagement. This should be populated from the actual data source (e.g., `EngagementServiceScope`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        activeEngagements: partner.engagements.map((e) => ({
          id: e.id,
          organization: e.organization,
          serviceScopes: e.serviceScopes ?? [], // Populated from EngagementServiceScope relation
        })),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        activeEngagements: partner.engagements.map((e) => ({
          id: e.id,
          organization: e.organization,
          serviceScopes: [], // Could be populated from EngagementServiceScope
        })),
```
</details>

---

**🔧 Maintainability** · lines 81-90

The response body contains redundant data: `data` already holds all `transformedPartners`, while `specialistPartners` and `dedicatedPartners` are also returned separately. This duplicates the partner data in the response payload (roughly 2x the size). If the frontend only needs the separated lists, `data` can be omitted; if it needs both, consider whether the summary is sufficient.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    return NextResponse.json({
      data: transformedPartners,
      summary: {
        total: transformedPartners.length,
        specialistCount: specialistPartners.length,
        dedicatedCount: dedicatedPartners.length,
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return NextResponse.json({
      data: transformedPartners,
      summary: {
        total: transformedPartners.length,
        specialistCount: specialistPartners.length,
        dedicatedCount: dedicatedPartners.length,
      },
      specialistPartners,
      dedicatedPartners,
    });
```
</details>


