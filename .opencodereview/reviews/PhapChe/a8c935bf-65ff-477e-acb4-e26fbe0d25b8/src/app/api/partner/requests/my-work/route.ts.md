# Review: `src/app/api/partner/requests/my-work/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · lines 24-25

parseInt can return NaN for invalid query strings (e.g., page=abc). Math.max(1, NaN) and Math.min(50, NaN) both yield NaN, which will be passed to Prisma's skip and take, causing a runtime error. Provide a fallback for NaN via `|| 1` / `|| 10` after parseInt.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
```
</details>

---

**🐛 Bug** · lines 36-38

When a statusFilter is provided, it replaces the entire where.status object, discarding the default 'notIn' exclusion list. This means a filtered query (e.g., ?status=draft_intake) could return requests with statuses that should normally be hidden. The statusFilter should be combined with the exclusion list, or the exclusion should be applied separately.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (statusFilter) {
      // Apply status filter in addition to the default exclusion list
      where.status = { equals: statusFilter, notIn: ['draft_intake', 'triage', 'cancelled', 'delivered', 'closed'] };
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (statusFilter) {
      where.status = statusFilter;
    }
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 65-70

The stats queries (assignedCount, inProgressCount, pendingReviewCount, revisionCount) always filter by assignedSpecialistId: session.userId, regardless of whether the user is a specialist or an admin. For a pure admin (not a specialist), session.userId will never match any assignedSpecialistId, so all four stats will always be 0 — misleading the admin about the actual workload in the system.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // For admins, show global stats; for specialists, show personal stats only
    const statsWhere = isAdmin && !isSpecialist ? {} : { assignedSpecialistId: session.userId };
    const [assignedCount, inProgressCount, pendingReviewCount, revisionCount] = await Promise.all([
      prisma.legalRequest.count({ where: { ...statsWhere, status: 'assigned' } }),
      prisma.legalRequest.count({ where: { ...statsWhere, status: 'in_progress' } }),
      prisma.legalRequest.count({ where: { ...statsWhere, status: 'pending_review' } }),
      prisma.legalRequest.count({ where: { ...statsWhere, status: 'revision_required' } }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const [assignedCount, inProgressCount, pendingReviewCount, revisionCount] = await Promise.all([
      prisma.legalRequest.count({ where: { assignedSpecialistId: session.userId, status: 'assigned' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: session.userId, status: 'in_progress' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: session.userId, status: 'pending_review' } }),
      prisma.legalRequest.count({ where: { assignedSpecialistId: session.userId, status: 'revision_required' } }),
    ]);
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 33

The status strings ('draft_intake', 'triage', 'cancelled', 'delivered', 'closed', 'assigned', 'in_progress', 'pending_review', 'revision_required') are hardcoded in multiple places. Consider extracting them into a shared enum or constant to avoid drift and typos across the codebase.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Consider: status: { notIn: EXCLUDED_STATUSES } where EXCLUDED_STATUSES is a shared constant
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      status: { notIn: ['draft_intake', 'triage', 'cancelled', 'delivered', 'closed'] },
```
</details>

---

**⚡ Performance** · lines 40-46

The search OR query traverses a relation (createdBy.name). This can cause performance degradation on large datasets, especially when combined with the status filter. Consider whether a full-text search index or a denormalized search column would be more appropriate, or at minimum ensure the 'createdBy' relation's 'name' field is indexed if this query is frequently used.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // NOTE: createdBy.name contains search may be slow on large datasets;
    // consider adding an index or using full-text search if this becomes a bottleneck.
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


