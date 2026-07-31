# Review: `src/app/[locale]/cases/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🔴 Critical (1)

**🐛 Bug** · lines 51-56

Pervasive `as any` casts on `getWorkspaceRequestWhere` results (lines 47-51, 55-56, 58, 60, 62) completely bypass TypeScript type checking. This masks potential mismatches between the filter shape expected by Prisma and what `getWorkspaceRequestWhere` returns. If the function signature changes or returns an invalid shape, these errors will only surface at runtime as Prisma query failures. The same applies to `tMatter(matterTypeKey as any)` on line 107 and `tStatus(...)` on line 109.

**Fix**: Define a proper shared type for the return value of `getWorkspaceRequestWhere` and use it instead of `as any`. For the translation functions, constrain the lookup keys to the actual union of valid keys.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Define proper types in getWorkspaceRequestWhere to avoid `as any`
  const [baseWhere, processingWhere, completedWhere, requestsWhere] = await Promise.all([
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusFilter),
    getWorkspaceRequestWhere(wsId, userId, completedStatusFilter),
    getWorkspaceRequestWhere(wsId, userId),
  ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [baseWhere, processingWhere, completedWhere, requestsWhere] = await Promise.all([
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusFilter),
    getWorkspaceRequestWhere(wsId, userId, completedStatusFilter),
    getWorkspaceRequestWhere(wsId, userId),
  ]);
```
</details>


## 🟠 High (2)

**🔧 Maintainability** · lines 132-140

Nested ternary expressions for `statusBadge` (lines 99-106) and `actionText` (lines 109-116) violate the codebase rule prohibiting nested ternaries. They are hard to read, maintain, and extend. A lookup map or a helper function would be much clearer.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const statusBadgeMap: Record<string, string> = {
        in_progress: 'review',
        pending_review: 'review',
        approved: 'approved',
        delivered: 'approved',
        closed: 'approved',
        triage: 'triage',
      };
      const statusBadge = isOverdue ? 'overdue' : (statusBadgeMap[req.status] ?? 'pending');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const statusBadge = isOverdue
        ? 'overdue'
        : req.status === 'in_progress' || req.status === 'pending_review'
          ? 'review'
          : req.status === 'approved' || req.status === 'delivered' || req.status === 'closed'
            ? 'approved'
            : req.status === 'triage'
              ? 'triage'
              : 'pending';
```
</details>

---

**🔧 Maintainability** · lines 160-167

Nested ternary for `actionText` (lines 109-116) is equally hard to read and maintain. Use a lookup map or if/else chain instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const actionKeyMap: Record<string, string> = {
        pending_review: 'reply',
        delivered: 'downloadResult',
        closed: 'downloadResult',
        revision_required: 'supplement',
      };
      const actionText = tActions(actionKeyMap[req.status] ?? 'view');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const actionText =
        req.status === 'pending_review'
          ? tActions('reply')
          : req.status === 'delivered' || req.status === 'closed'
            ? tActions('downloadResult')
            : req.status === 'revision_required'
              ? tActions('supplement')
              : tActions('view');
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · line 120

`Math.abs(Math.round(remainingHours / 24))` on line 87 can produce `0` when the case is overdue by less than 12 hours (-11 hours → Math.round(-0.458) → 0 → Math.abs(0) → 0), leading to a misleading "0 days overdue" message. Use `Math.ceil` or `Math.floor` with appropriate sign handling to ensure at least 1 day is shown for any overdue.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        const overdueDays = Math.max(1, Math.ceil(Math.abs(remainingHours) / 24));
        slaText = t('slaOverdue', { days: overdueDays });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        slaText = t('slaOverdue', { days: Math.abs(Math.round(remainingHours / 24)) });
```
</details>

---

**🔧 Maintainability** · lines 214-224

The catch block renders hardcoded Vietnamese text (lines 148-152), inconsistent with the app's i18n approach. Users in other locales will see untranslated error messages. Use translation keys or a dedicated error fallback component.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    console.error('Failed to load cases page:', error);
    // Use i18n keys for error messages; fallback to a shared ErrorFallback component
    return (
      <UserLayout userName="" userRole="customer" workspaceName="" workspaceSlug="">
        <ErrorFallback message={t('loadError')} />
      </UserLayout>
    );
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    console.error('Failed to load cases page:', error);
    return (
      <UserLayout userName="" userRole="customer" workspaceName="" workspaceSlug="">
        <div style={{ padding: 48, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Lỗi tải dữ liệu</h1>
          <p style={{ color: '#6b7280' }}>Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.</p>
        </div>
      </UserLayout>
    );
  }
```
</details>

---

**⚡ Performance** · lines 51-56

`baseWhere` and `requestsWhere` are identical (both result from `getWorkspaceRequestWhere(wsId, userId)` without extra filters). This means one of the four parallel calls on lines 47-51 is redundant. Additionally, the three count queries on lines 67-69 run sequentially (`await` each) instead of being parallelized with `Promise.all`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const [baseWhere, processingWhere, completedWhere] = await Promise.all([
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusFilter),
    getWorkspaceRequestWhere(wsId, userId, completedStatusFilter),
  ]);
  const requestsWhere = baseWhere; // reuse the same filter
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [baseWhere, processingWhere, completedWhere, requestsWhere] = await Promise.all([
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusFilter),
    getWorkspaceRequestWhere(wsId, userId, completedStatusFilter),
    getWorkspaceRequestWhere(wsId, userId),
  ]);
```
</details>


