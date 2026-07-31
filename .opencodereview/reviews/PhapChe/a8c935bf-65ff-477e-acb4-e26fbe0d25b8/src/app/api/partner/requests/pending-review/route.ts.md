# Review: `src/app/api/partner/requests/pending-review/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟠 High (2)

**🐛 Bug** · lines 22-24

NaN handling for page/pageSize: `parseInt` on non-numeric input (e.g., `?page=abc`) returns `NaN`, which propagates through `Math.max`/`Math.min` (e.g., `Math.max(1, NaN)` → `NaN`). This results in `skip` and `take` being `NaN`, causing the Prisma query to behave unpredictably or return zero results. Use `isNaN` checks or provide a safe fallback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawPageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const page = isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    const pageSize = isNaN(rawPageSize) ? 10 : Math.min(50, Math.max(5, rawPageSize));
    const skip = (page - 1) * pageSize;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;
```
</details>

---

**🐛 Bug** · lines 56-61

Stats mismatch for admin users: The main query for admins returns ALL pending_review requests across all reviewers, but the stats (pendingCount, approvedCount, revisionCount) are always scoped to `assignedReviewerId: session.userId`. An admin sees a full list but stats reflect only their own assignments, producing inconsistent counts. Stats should match the same scope as the main query.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Stats — scope matches the main query
    const statsWhere: Record<string, unknown> = {
      ...(isReviewer && !isAdmin ? { assignedReviewerId: session.userId } : {}),
    };
    const [pendingCount, approvedCount, revisionCount] = await Promise.all([
      prisma.legalRequest.count({ where: { ...statsWhere, status: 'pending_review' } }),
      prisma.legalRequest.count({ where: { ...statsWhere, status: 'approved' } }),
      prisma.legalRequest.count({ where: { ...statsWhere, status: 'revision_required' } }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Stats
    const [pendingCount, approvedCount, revisionCount] = await Promise.all([
      prisma.legalRequest.count({ where: { assignedReviewerId: session.userId, status: 'pending_review' } }),
      prisma.legalRequest.count({ where: { assignedReviewerId: session.userId, status: 'approved' } }),
      prisma.legalRequest.count({ where: { assignedReviewerId: session.userId, status: 'revision_required' } }),
    ]);
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · line 50

Priority ordering is alphabetical, not severity-based. With string values like 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', alphabetical `asc` order produces: CRITICAL → HIGH → LOW → MEDIUM, which puts LOW before MEDIUM. This misrepresents urgency. Use a CASE-based ordering or map priorities to numeric values for correct severity sort.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // Consider mapping priority to numeric sort (e.g., via a CASE expression or a computed field)
        // Alternatively store priority as an integer or use enum ordering in the DB schema.
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 29

Hardcoded status strings (`'pending_review'`, `'approved'`, `'revision_required'`, `'resolved'`) and role strings (`'reviewer'`, `'super_admin'`, `'coordinator_admin'`) are repeated across the file. Consider extracting them into shared constants or an enum to prevent typos and simplify refactoring.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // e.g., status: RequestStatus.PENDING_REVIEW,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      status: 'pending_review',
```
</details>


