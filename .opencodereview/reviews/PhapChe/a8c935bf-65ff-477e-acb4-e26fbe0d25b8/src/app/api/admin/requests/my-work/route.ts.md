# Review: `src/app/api/admin/requests/my-work/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🔴 Critical (1)

**🐛 Bug** · line 61

Priority ordering is alphabetical, not by severity. Sorting `priority` ascending yields 'HIGH', 'LOW', 'MEDIUM' instead of the intended 'HIGH', 'MEDIUM', 'LOW'. This means LOW-priority requests appear before MEDIUM-priority requests, defeating the purpose of priority-based ordering. Consider storing priority as a numeric value in the schema, using a raw SQL CASE expression, or sorting in application code (though the latter conflicts with pagination).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // WARNING: alphabetical sort on priority enum gives 'HIGH','LOW','MEDIUM' — not severity order.
        // Consider: storing priority as a numeric rank, or using a raw-sort workaround.
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 31-32

The comment on line 27–28 lists excluded statuses as 'draft_intake, triage, approved, delivered, closed, cancelled' but the actual `EXCLUDED_STATUSES` array also includes `'pending_review'`. This discrepancy misleads maintainers about which statuses are actually filtered out. Update the comment to match the array, or remove `pending_review` if it is not intended to be excluded.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Active work only: exclude intake, triage, pending_review, finished, and cancelled
    const EXCLUDED_STATUSES = ['draft_intake', 'triage', 'pending_review', 'approved', 'delivered', 'closed', 'cancelled'];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Active work only: exclude intake, triage, finished, and cancelled
    const EXCLUDED_STATUSES = ['draft_intake', 'triage', 'pending_review', 'approved', 'delivered', 'closed', 'cancelled'];
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 34

The `where` variable is typed as `Record<string, unknown>`, which bypasses Prisma's generated type safety for the `legalRequest` model. When the schema evolves (e.g., renamed fields, changed relations), the compiler won't catch mismatches in the dynamically built `where` object. Consider using `Prisma.legalRequestWhereInput` (or the equivalent generated type) and casting only where unavoidable, to retain type checking for most of the filter shape.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const where: Prisma.legalRequestWhereInput = {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const where: Record<string, unknown> = {
```
</details>


