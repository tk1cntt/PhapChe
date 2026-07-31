# Review: `src/app/[locale]/settings/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 8

---

## 🟠 High (1)

**🐛 Bug** · lines 15-19

Missing error handling for all async operations. If any Prisma query or session check fails, the server will throw an unhandled rejection, resulting in a generic 500 error with no user-friendly message. Wrap the data fetching logic in a try-catch and either render an error UI or redirect appropriately.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
    const session = await requireAppSession();
    const { userId, roles } = session;

    // Fetch user data with workspaces
    const user = await prisma.user.findUnique({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;

  // Fetch user data with workspaces
  const user = await prisma.user.findUnique({
```
</details>


## 🟡 Medium (4)

**⚡ Performance** · lines 55-58

Redundant database query for workspaceCount. The user query already fetches memberships filtered by active workspaces, so `user?.memberships.length` gives the same result without an extra DB round-trip. This also avoids potential inconsistency between the two queries.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Workspace count — derived from already-fetched memberships below
    Promise.resolve(user?.memberships.length ?? 0),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Workspace count
    prisma.workspace.count({
      where: { memberships: { some: { userId, isActive: true } } },
    }),
```
</details>

---

**⚡ Performance** · lines 18-46

The user query and the stats queries are independent but execute sequentially, creating a waterfall. Move the user query into the same Promise.all as the stats queries to fetch them in parallel and reduce total latency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Fetch user data and stats in parallel
  const [user, accountRequests, securityEvents, notificationPreferences] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        title: true,
        timezone: true,
        locale: true,
        memberships: {
          where: { workspace: { isActive: true } },
          include: {
            workspace: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    }),
    // Total requests created by user
    prisma.legalRequest.count({ where: { createdById: userId } }),
    // Security-related audit events (auth events)
    prisma.auditEvent.count({
      where: { actorId: userId, action: { contains: 'auth' } },
    }),
    // Notification preferences count
    prisma.userPreferences.count({ where: { userId } }),
  ]);

  const userName = user?.name ?? user?.email ?? 'User';
  const workspace = user?.memberships[0]?.workspace;
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

  const workspaceCount = user?.memberships.length ?? 0;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Fetch user data with workspaces
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      title: true,
      timezone: true,
      locale: true,
      memberships: {
        where: { workspace: { isActive: true } },
        include: {
          workspace: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  const userName = user?.name ?? user?.email ?? 'User';
  const workspace = user?.memberships[0]?.workspace;
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

  // Fetch settings stats
  const [accountRequests, securityEvents, notificationPreferences, workspaceCount] = await Promise.all([
```
</details>

---

**🐛 Bug** · line 40

No null guard for the user object. If `prisma.user.findUnique` returns null (e.g., user deleted), the page renders with empty strings and fallback values without any indication of an error. Consider returning a not-found page or redirecting when the user is not found.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (!user) {
    // User not found — redirect or show not-found page
    notFound();
  }

  const userName = user.name ?? user.email ?? 'User';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const userName = user?.name ?? user?.email ?? 'User';
```
</details>

---

**🐛 Bug** · lines 41-43

The active workspace is selected as `user?.memberships[0]?.workspace` (first membership), but the session already provides `activeWorkspaceId`. This means the wrong workspace could be displayed if the user has multiple memberships and the first one isn't the active one. Use `activeWorkspaceId` to find the correct workspace from the memberships array.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const activeMembership = user?.memberships.find((m) => m.workspace.id === activeWorkspaceId);
  const workspace = activeMembership?.workspace ?? user?.memberships[0]?.workspace;
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const workspace = user?.memberships[0]?.workspace;
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';
```
</details>


## 🔵 Low (3)

**🔧 Maintainability** · line 16

Unused destructured variable `activeWorkspaceId`. It is extracted from the session but never referenced in the component. Remove it to avoid dead code and confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const { userId, roles } = session;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const { userId, activeWorkspaceId, roles } = session;
```
</details>

---

**🔧 Maintainability** · line 14

Unused variable `locale` destructured from params. It is extracted but never used in the component body. If it's intended for the SettingsClient, pass it explicitly; otherwise, remove the destructuring.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // locale is intentionally unused; params must still be awaited per Next.js conventions
  await params;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const { locale } = await params;
```
</details>

---

**🔧 Maintainability** · lines 83-84

Hardcoded business-specific default values for timezone (`'Asia/Ho_Chi_Minh'`) and locale (`'vi'`). These should be extracted to a shared constants/config file to avoid duplication across the codebase and to make region-specific changes easier.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          timezone: user?.timezone ?? DEFAULT_TIMEZONE,
          locale: user?.locale ?? DEFAULT_LOCALE,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          timezone: user?.timezone ?? 'Asia/Ho_Chi_Minh',
          locale: user?.locale ?? 'vi',
```
</details>


