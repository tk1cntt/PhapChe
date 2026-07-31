# Review: `src/app/[locale]/admin/users/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (1)

**🐛 Bug** · lines 63-67

**Role counts double-count users across workspaces.** `WorkspaceMembership.groupBy` counts each membership row, not unique users. A user with the same role in multiple workspaces will be counted multiple times, inflating the role statistics. Use `countDistinct` on `userId` instead, or use a subquery/DISTINCT approach.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Role counts: count distinct users per role
      prisma.$queryRaw<{ role: string; count: bigint }[]>`
        SELECT role, COUNT(DISTINCT userId) as count
        FROM WorkspaceMembership
        WHERE isActive = true
        GROUP BY role
      `,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Role counts from memberships
      prisma.workspaceMembership.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 52-58

**Pending users metric is misleading.** The query filters `emailVerified: false` with a 7-day window, but the variable is named `pendingUsers` and implies all unverified users. Users who registered more than 7 days ago and never verified are excluded, making the metric silently inaccurate. Either rename to `recentUnverifiedUsers` or remove the `createdAt` filter to include all unverified users.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Pending users (all unverified users)
      prisma.user.count({
        where: {
          emailVerified: false,
        },
      }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Pending users (unverified within last 7 days)
      prisma.user.count({
        where: {
          emailVerified: false,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
```
</details>

---

**🐛 Bug** · lines 63-67

**Missing `isActive` filter on role counts.** The `WorkspaceMembership.groupBy` query does not filter for `isActive: true`, which means inactive (soft-deleted) memberships are included in the role statistics. This inflates the dashboard counts with stale data.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Role counts from active memberships
      prisma.workspaceMembership.groupBy({
        by: ['role'],
        where: { isActive: true },
        _count: { role: true },
      }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Role counts from memberships
      prisma.workspaceMembership.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 28-32

**Hardcoded Vietnamese error messages** in the server component make localization difficult. Consider using i18n message keys (e.g., from `@/messages/{locale}.json`) to match the project's existing translation pattern referenced in the MatterType model comments.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      <UsersPageClient
        error="admin.users.unauthorized"
        locale={locale}
        workspaceOptions={[]}
      />
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      <UsersPageClient
        error="Bạn không có quyền truy cập trang này."
        locale={locale}
        workspaceOptions={[]}
      />
```
</details>

---

**🔧 Maintainability** · line 110

**`console.error` in production** may leak stack traces or internal details. Consider using a structured logger (e.g., `logger.error`) with sanitized error context, and avoid exposing raw error details in server logs unnecessarily.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    logger.error({ err: error }, 'Failed to fetch admin user stats');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Failed to fetch admin user stats:', error);
```
</details>


