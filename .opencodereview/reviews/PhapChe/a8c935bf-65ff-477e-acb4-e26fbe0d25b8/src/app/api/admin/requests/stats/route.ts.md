# Review: `src/app/api/admin/requests/stats/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (2)

**🐛 Bug** · lines 70-71

**Percentage baseline includes all statuses, causing misleading breakdown.** The `total` denominator (line 73: `totalCount || 1`) includes all legal requests regardless of status — including `closed`, `cancelled`, and any other statuses not represented in the 5 breakdown categories. As a result, the status breakdown percentages will not sum to 100%, and the dashboard may misrepresent the actual distribution of requests. Additionally, the "SLA rủi ro cao" category overlaps with the other categories (e.g., an `assigned` request at SLA risk appears in both), making the percentages even less meaningful.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Calculate percentages based on active (non-terminal) requests for a meaningful breakdown
    const activeTotal = pendingTriageCount + statusAssignedCount + statusInProgressCount || 1;
    const completedTotal = statusApprovedCount + statusDeliveredCount || 0;
    const denominator = totalCount || 1;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Calculate percentages
    const total = totalCount || 1; // Avoid division by zero
```
</details>

---

**🐛 Bug** · lines 57-67

**SLA risk query includes `draft_intake` and `triage` statuses, which may not have meaningful SLA deadlines.** These are preliminary/intake statuses where an SLA deadline may not yet be set or may not be relevant. Including them can inflate the SLA risk count and lead to false alarms on the dashboard. Consider adding `draft_intake` and `triage` to the `notIn` exclusion list, or alternatively, add an explicit `slaDeadline: { not: null }` filter to ensure only requests with an actual SLA deadline are counted.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // SLA at risk (slaDeadline within 24 hours or passed)
      prisma.legalRequest.count({
        where: {
          slaDeadline: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
            not: null,
          },
          status: {
            notIn: ['draft_intake', 'triage', 'closed', 'cancelled', 'approved', 'delivered'],
          },
        },
      }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // SLA at risk (slaDeadline within 24 hours or passed)
      prisma.legalRequest.count({
        where: {
          slaDeadline: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          status: {
            notIn: ['closed', 'cancelled', 'approved', 'delivered'],
          },
        },
      }),
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 85-88

**Hardcoded `specialistPartner.count: 0` appears to be dead/incomplete code.** The `specialistPartner` object always returns a count of `0` with a description suggesting it should be computed dynamically ("Xử lý theo loại hồ sơ / service scope"). If this feature is not yet implemented, consider adding a `// TODO` comment or removing the field until it's ready to avoid confusion on the dashboard.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // TODO: Implement specialist partner count based on service scope matching
      specialistPartner: {
        count: 0,
        description: 'Xử lý theo loại hồ sơ / service scope',
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      specialistPartner: {
        count: 0,
        description: 'Xử lý theo loại hồ sơ / service scope',
      },
```
</details>


