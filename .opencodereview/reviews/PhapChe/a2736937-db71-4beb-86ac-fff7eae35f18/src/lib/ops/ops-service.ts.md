# Review: `src/lib/ops/ops-service.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 9

---

## 🟠 High (2)

**🐛 Bug** · lines 354-358

Aging metric `olderThanSevenDays` only counts from the top 100 fetched requests, not the full dataset. This produces incorrect statistics — the dashboard may show 0 aging requests even when hundreds exist in the database. Replace with a database-level count query.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    aging: {
      pendingReview: countByStatus(byStatus, 'pending_review'),
      revisionRequired: countByStatus(byStatus, 'revision_required'),
      olderThanSevenDays: await prisma.legalRequest.count({
        where: { AND: [where, { createdAt: { lte: sevenDaysAgo }, status: { notIn: ['closed', 'cancelled'] } }] },
      }),
    },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    aging: {
      pendingReview: countByStatus(byStatus, 'pending_review'),
      revisionRequired: countByStatus(byStatus, 'revision_required'),
      olderThanSevenDays: requests.filter((request) => request.createdAt <= sevenDaysAgo && !['closed', 'cancelled'].includes(request.status)).length,
    },
```
</details>

---

**🐛 Bug** · lines 619-621

`getOpsAggregate` request rows hardcode `pendingReviewSince`, `deliveredAt`, `closedAt` to `null` instead of populating them from workflow transitions. This means the aggregate endpoint returns incomplete timeline data for each request, unlike `getOpsDashboard` which does populate these fields.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      pendingReviewSince: pendingByRequest.get(r.id) ?? null,
      deliveredAt: deliveredByRequest.get(r.id) ?? null,
      closedAt: closedByRequest.get(r.id) ?? null,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      pendingReviewSince: null,
      deliveredAt: null,
      closedAt: null,
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · lines 376-378

When `slaDeadline` is before or equal to `requestCreatedAt` (data corruption), `totalMs <= 0` triggers an early return with `level: 'ok'`. This masks invalid data — should return `level: 'danger'` or `'info'` with an appropriate message indicating data inconsistency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (totalMs <= 0) {
      return { level: 'info', label: 'Invalid SLA', percent: 100, source: 'deadline' };
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (totalMs <= 0) {
      return { level: 'ok', label: 'Đúng hạn', percent: 100, source: 'deadline' };
    }
```
</details>

---

**🐛 Bug** · line 298

`matterTypeLabel` is incorrectly set to `matterTypeKey` (the key) instead of the actual label. The `matterType` relation is selected but only `key` is used — the label is never populated. This happens in both `getOpsDashboard` and `getOpsAggregate`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      matterTypeLabel: request.intakeSubmission?.matterType?.label ?? null,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      matterTypeLabel: request.intakeSubmission?.matterTypeKey ?? null,
```
</details>

---

**🔧 Maintainability** · lines 506-525

`buildOpsRequestWhere` is defined but not reused in `getOpsAggregate`. The filter construction logic is duplicated at lines 326–340, risking inconsistency and maintenance overhead. Call `buildOpsRequestWhere` and then extend the result with the search filter.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Build where clause — reuse existing filter builder, then extend with search
  const baseWhere = buildOpsRequestWhere(filters);
  const and: Prisma.LegalRequestWhereInput[] = baseWhere.AND ? [...baseWhere.AND] : [];
  if (filters.search && filters.search.length <= 200) {
    and.push({
      OR: [
        { title: { contains: filters.search } },
        { code: { contains: filters.search } },
      ],
    });
  }
  const where: Prisma.LegalRequestWhereInput = and.length ? { AND: and } : {};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Build where clause
  const and: Prisma.LegalRequestWhereInput[] = [];
  if (filters.workspaceId) and.push({ workspaceId: filters.workspaceId });
  // Note: intakeSubmission has @unique requestId, so { is: } is correct for one-to-one filtering
  if (filters.matterTypeKey) and.push({ intakeSubmission: { is: { matterTypeKey: filters.matterTypeKey } } });
  if (filters.status) and.push({ status: filters.status });
  if (filters.assignedSpecialistId) and.push({ assignedSpecialistId: filters.assignedSpecialistId });
  if (filters.assignedReviewerId) and.push({ assignedReviewerId: filters.assignedReviewerId });
  if (filters.dateFrom || filters.dateTo) {
    and.push({ createdAt: { ...(filters.dateFrom ? { gte: filters.dateFrom } : {}), ...(filters.dateTo ? { lte: filters.dateTo } : {}) } });
  }
  if (filters.search && filters.search.length <= 200) {
    and.push({
      OR: [
        { title: { contains: filters.search } },
        { code: { contains: filters.search } },
      ],
    });
  }
  const where: Prisma.LegalRequestWhereInput = and.length ? { AND: and } : {};
```
</details>

---

**🐛 Bug** · lines 534-539

`allActive` is destructured from `Promise.all` on line 534 but never used anywhere in the function. This is dead code — and worse, it's a duplicate of `totalCount` (both count the same active-status requests). Remove it to avoid confusion and wasted database queries.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const [totalCount, nearSlaCount, completedTodayCount] = await Promise.all([
    prisma.legalRequest.count({ where: { AND: [where, { status: { in: activeStatuses } }] } }),
    prisma.legalRequest.count({ where: { AND: [where, { slaDeadline: { lte: twentyFourHoursFromNow, gte: now }, status: { in: activeStatuses } }] } }),
    prisma.legalRequest.count({ where: { AND: [where, { status: { in: closedStatuses }, updatedAt: { gte: todayStart } }] } }),
  ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [totalCount, nearSlaCount, completedTodayCount, allActive] = await Promise.all([
    prisma.legalRequest.count({ where: { AND: [where, { status: { in: activeStatuses } }] } }),
    prisma.legalRequest.count({ where: { AND: [where, { slaDeadline: { lte: twentyFourHoursFromNow, gte: now }, status: { in: activeStatuses } }] } }),
    prisma.legalRequest.count({ where: { AND: [where, { status: { in: closedStatuses }, updatedAt: { gte: todayStart } }] } }),
    prisma.legalRequest.count({ where: { AND: [where, { status: { in: activeStatuses } }] } }),
  ]);
```
</details>


## 🔵 Low (3)

**🐛 Bug** · lines 407-411

`calcOpsSla` Path 3 never uses the computed `daysElapsed` or `percent` to determine the level — it always returns `'info'`. If Path 3 is meant to also show danger/warn based on request age, the computed values should be used. If not, the `daysElapsed` and `percent` computations are dead code.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Path 3: request age fallback (no SLA deadline set)
  return { level: 'info', label: 'Chưa có SLA', percent: 0, source: 'none' };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Path 3: request age fallback
  const daysElapsed = daysBetween(requestCreatedAt);
  const maxDays = 7;
  const percent = Math.min(100, Math.round((daysElapsed / maxDays) * 100));
  return { level: 'info', label: 'Chưa có SLA', percent, source: 'none' };
```
</details>

---

**🔧 Maintainability** · line 504

`console.log` in production code at line 325 leaks internal pagination state to logs. Consider removing or replacing with a proper logger at debug level.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Remove console.log in production; use a logger if needed
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  console.log('[getOpsAggregate] page:', page, 'pageSize:', pageSize, 'skip:', skip);
```
</details>

---

**🎨 Style** · line 739

Inconsistent arrow character in `metadataSummary`: `getGlobalTimeline` uses `→` (Unicode), while `getOpsRequestTimeline` uses `->` (ASCII). This inconsistency may cause subtle display issues downstream.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      metadataSummary: `${transition.fromStatus} → ${transition.toStatus}`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      metadataSummary: `${transition.fromStatus} -> ${transition.toStatus}`,
```
</details>


