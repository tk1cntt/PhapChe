# Review: `src/lib/ops/ops-service.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 8

---

## 🟠 High (2)

**🐛 Bug** · line 298

**Incorrect `matterTypeLabel` assignment**: The `matterTypeLabel` field is set to `matterTypeKey` instead of the actual label text. This causes the label to display the key (e.g., `"contract_review"`) rather than the human-readable label. The `matterType` relation is selected (`{ key: true }`) but its result is never used. Consider using `request.intakeSubmission?.matterType?.key` or adding a label field to the select.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      matterTypeLabel: request.intakeSubmission?.matterType?.key ?? null,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      matterTypeLabel: request.intakeSubmission?.matterTypeKey ?? null,
```
</details>

---

**🐛 Bug** · line 605

**Same `matterTypeLabel` issue in `getOpsAggregate`**: The label is again set to the key instead of the actual label. Since `matterType` is already selected with `{ key: true }`, use `r.intakeSubmission?.matterType?.key` or the appropriate label field.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      matterTypeLabel: r.intakeSubmission?.matterType?.key ?? null,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      matterTypeLabel: r.intakeSubmission?.matterTypeKey ?? null,
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · lines 619-621

**`pendingReviewSince`, `deliveredAt`, `closedAt` are hardcoded to `null` in `getOpsAggregate`**: Unlike `getOpsDashboard` which computes these from the workflow transitions, the aggregate endpoint always returns `null` for these fields. This means the aggregate request rows lack timing data that the dashboard provides. Consider fetching workflow transitions for the paginated requests as well.

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

---

**🐛 Bug** · lines 376-378

**SLA calculation edge case**: When `slaDeadline` is before or equal to `requestCreatedAt`, `totalMs <= 0` triggers an early return with `{ level: 'ok', label: 'Đúng hạn', percent: 100 }`. This is incorrect — a deadline that predates the request creation is invalid data and should be reported as an error/info state, not as "on time" with 100% progress.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (totalMs <= 0) {
      return { level: 'info', label: 'Dữ liệu SLA không hợp lệ', percent: 0, source: 'none' };
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

**⚡ Performance** · lines 317-319

**O(n²) workload loop in `getOpsDashboard`**: `requests.find()` is called inside a loop over `requestRows`, causing quadratic complexity. For large result sets this can degrade performance. Build a `Map<string, OpsRequestRowDto>` keyed by `request.id` before the loop to achieve O(n) lookup.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const source = requestById.get(request.id);
    if (source?.assignedSpecialistId) workloadBySpecialist.set(source.assignedSpecialistId, [...(workloadBySpecialist.get(source.assignedSpecialistId) ?? []), request]);
    if (source?.assignedReviewerId) workloadByReviewer.set(source.assignedReviewerId, [...(workloadByReviewer.get(source.assignedReviewerId) ?? []), request]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const source = requests.find((item) => item.id === request.id);
    if (source?.assignedSpecialistId) workloadBySpecialist.set(source.assignedSpecialistId, [...(workloadBySpecialist.get(source.assignedSpecialistId) ?? []), request]);
    if (source?.assignedReviewerId) workloadByReviewer.set(source.assignedReviewerId, [...(workloadByReviewer.get(source.assignedReviewerId) ?? []), request]);
```
</details>

---

**🔧 Maintainability** · lines 506-516

**Duplicate where clause building in `getOpsAggregate`**: The where clause is built manually (lines 342-366) instead of reusing `buildOpsRequestWhere`. The only difference is the additional `search` filter. This duplication risks divergence — if the base filter logic changes in `buildOpsRequestWhere`, `getOpsAggregate` will silently fall out of sync. Extend `buildOpsRequestWhere` to accept an optional `search` parameter, or compose the search filter on top of the shared function.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const where = buildOpsRequestWhere(filters);
  if (filters.search && filters.search.length <= 200) {
    where.AND = [...(where.AND ?? []), { OR: [{ title: { contains: filters.search } }, { code: { contains: filters.search } }] }];
  }
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
```
</details>


## 🔵 Low (2)

**📝 Other** · line 534

**Unused variable `allActive`**: `allActive` is destructured from the `Promise.all` result but never used anywhere in the function. This appears to be dead code and also wastes a database query. Remove it or use it in the stats output.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const [totalCount, nearSlaCount, completedTodayCount] = await Promise.all([
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [totalCount, nearSlaCount, completedTodayCount, allActive] = await Promise.all([
```
</details>

---

**🔧 Maintainability** · line 504

**Debug `console.log` left in production code**: This will log pagination details on every aggregate request in production, potentially leaking internal state and filling logs with noise.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  console.log('[getOpsAggregate] page:', page, 'pageSize:', pageSize, 'skip:', skip);
```
</details>


