# Review: `src/app/api/admin/requests/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 7

---

## 🔴 Critical (1)

**🔒 Security** · lines 25-31

Missing workspace-level (tenant) isolation. The query does not filter by workspace, meaning a user authenticated in one workspace can access legal requests belonging to any other workspace simply by knowing or guessing the request ID or code. This is a cross-tenant data leakage vulnerability. The query should include a workspace filter based on the user's session workspace membership.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Add workspace filtering to enforce tenant isolation
    const userWorkspaceIds = session.workspaces?.map((w) => w.id) ?? [];
    if (userWorkspaceIds.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        workspaceId: { in: userWorkspaceIds },
        OR: [
          { id: id },
          { code: id },
        ],
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        OR: [
          { id: id },
          { code: id },
        ],
      },
```
</details>


## 🟠 High (1)

**🔒 Security** · lines 18-25

Missing object-level access control for specialist/reviewer roles. Users with 'specialist' or 'reviewer' roles can view any legal request within their workspace, not just requests assigned to them. Consider adding assignment-based filtering for non-admin roles (e.g., restrict to requests where assignedSpecialistId or assignedReviewerId matches the current user).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const hasAccess = session.roles?.some((role) => (ALLOWED_ROLES as readonly string[]).includes(role));
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const userId = session.user?.id;
    const isAdmin = session.roles?.some((r) => r === 'super_admin' || r === 'coordinator_admin');

    const legalRequest = await prisma.legalRequest.findFirst({ 
      where: {
        ...(!isAdmin && {
          OR: [
            { assignedSpecialistId: userId },
            { assignedReviewerId: userId },
          ],
        }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const hasAccess = session.roles?.some((role) => (ALLOWED_ROLES as readonly string[]).includes(role));
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const legalRequest = await prisma.legalRequest.findFirst({
```
</details>


## 🟡 Medium (3)

**🔒 Security** · lines 25-32

The query returns all fields of the legalRequest model with no explicit field selection (e.g., 'select' or 'omit'). This may expose sensitive internal data such as internal notes, metadata, or status details to users who should not see them. Consider defining an explicit field selection that only returns fields appropriate for the caller's role.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        OR: [
          { id: id },
          { code: id },
        ],
      },
      // Consider using 'select' to explicitly limit returned fields based on role
      // e.g., exclude internalNotes, sensitiveMetadata for non-admin roles
      include: {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        OR: [
          { id: id },
          { code: id },
        ],
      },
      include: {
```
</details>

---

**⚡ Performance** · lines 53-71

The 'reviews' and 'assignments' relations are fetched without pagination limits, unlike 'workflowTransitions' (which uses take: 10). If a legal request has a large number of reviews or assignments, this could cause performance degradation and large response payloads. Consider adding pagination (take/skip) to these relations as well.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
            createdBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
            createdBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
```
</details>

---

**🔧 Maintainability** · lines 5-7

The route path `/api/admin/requests/[id]` suggests admin-only access, but ALLOWED_ROLES includes 'specialist' and 'reviewer'. This is misleading — either the route should be renamed (e.g., `/api/requests/[id]`) to reflect its broader audience, or the role list should be restricted to admin roles only. As-is, it creates confusion about the intended access scope.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// If this route is truly admin-only, restrict to admin roles:
// const ALLOWED_ROLES = ['super_admin', 'coordinator_admin'] as const;
// Otherwise, rename the route path to remove 'admin' to avoid confusion.
const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
// Valid roles per schema: all admin, specialist, reviewer roles can access request details
const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 6-7

The `AllowedRole` type is declared but never used anywhere in the file. This is dead code and should be removed to keep the file clean.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];
```
</details>

---

**🔒 Security** · line 91

Logging the raw error object with `console.error` in production may leak sensitive information (e.g., database connection strings, internal paths, stack traces) into server logs. Consider logging only a sanitized message or error code, and use a structured logger with appropriate log levels.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Log only the error message, not the full error object, to avoid leaking sensitive data
    console.error('Admin request detail error:', error instanceof Error ? error.message : 'Unknown error');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Admin request detail error:', error);
```
</details>


