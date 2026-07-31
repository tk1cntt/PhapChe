# Review: `src/lib/services/permission-service.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 8

---

## 🟠 High (2)

**🐛 Bug** · lines 195-202

Method `getPartnerPermissionLevel` is named to suggest it returns permission levels for a specific partner, but it only takes `engagementId` and returns **all** permission levels across all partners for that engagement. This is likely a missing `partnerId` parameter — add it and filter by `partnerId` in the Prisma query, or rename the method to `getEngagementPermissionLevels` if the current behavior is intentional.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async getPartnerPermissionLevel(engagementId: string, partnerId: string): Promise<PermissionLevel | null> {
    const scope = await this.prismaClient.engagementServiceScope.findFirst({
      where: { engagementId, partnerId },
      select: { permissionLevel: true },
    });

    return scope ? (scope.permissionLevel as PermissionLevel) : null;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async getPartnerPermissionLevel(engagementId: string): Promise<PermissionLevel[]> {
    const scopes = await this.prismaClient.engagementServiceScope.findMany({
      where: { engagementId },
      select: { permissionLevel: true },
    });

    return scopes.map(s => s.permissionLevel as PermissionLevel);
  }
```
</details>

---

**🐛 Bug** · lines 28-33

All async methods (`canReadRequest`, `canWriteRequest`, `canAccessWorkspace`, `canManageOrganization`, `canManageWorkspace`, `getPartnerPermissionLevel`, `checkPartnerFullAccess`) lack `try-catch` error handling. A failed Prisma query (e.g., connection timeout, constraint violation) will result in an unhandled promise rejection that can crash the application or produce a 500 without a meaningful response. Wrap database calls in try-catch blocks and propagate user-friendly errors.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async canReadRequest(ctx: RequestContext, requestId: string): Promise<boolean> {
    try {
      // Platform admins can read all
      if (this.isPlatformAdmin(ctx)) return true;

      // Get request details
      const request = await this.prismaClient.legalRequest.findUnique({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async canReadRequest(ctx: RequestContext, requestId: string): Promise<boolean> {
    // Platform admins can read all
    if (this.isPlatformAdmin(ctx)) return true;

    // Get request details
    const request = await this.prismaClient.legalRequest.findUnique({
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · lines 21-23

`isPlatformAdmin` accesses `ctx.user.roles` without checking if `roles` is defined. If `ctx.user.roles` is `null` or `undefined`, calling `.includes()` will throw a `TypeError`. Add a null-safe check: `ctx.user.roles?.includes('super_admin') ?? false`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  isPlatformAdmin(ctx: RequestContext): boolean {
    return ctx.user.roles?.includes('super_admin') ?? false;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  isPlatformAdmin(ctx: RequestContext): boolean {
    return ctx.user.roles.includes('super_admin');
  }
```
</details>

---

**🔧 Maintainability** · line 22

Role strings (`'super_admin'`, `'specialist'`, `'coordinator_admin'`) and permission level strings (`'full_access'`) are hardcoded throughout the service. These are business-critical constants that should be extracted into a shared enum or constants object to avoid typos and make refactoring easier. If these values change, every occurrence must be updated manually.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Define as constants/enum at module level:
// const ROLES = { SUPER_ADMIN: 'super_admin', SPECIALIST: 'specialist', COORDINATOR_ADMIN: 'coordinator_admin' } as const;
// const PERMISSION_LEVELS = { FULL_ACCESS: 'full_access' } as const;
    return ctx.user.roles.includes(ROLES.SUPER_ADMIN);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return ctx.user.roles.includes('super_admin');
```
</details>

---

**🐛 Bug** · lines 46-49

In `canReadRequest`, `request.workspace` is accessed without a null check. If a `legalRequest` exists without an associated workspace (optional relation), accessing `request.workspace.memberships` will throw a `TypeError: Cannot read properties of null`. Add a null guard: `if (!request.workspace) return false;` before checking memberships.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!request) return false;

    // Check workspace membership
    if (!request.workspace) return false;
    const isMember = request.workspace.memberships.length > 0;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!request) return false;

    // Check workspace membership
    const isMember = request.workspace.memberships.length > 0;
```
</details>

---

**🐛 Bug** · lines 81-84

Same null reference risk as `canReadRequest`: `request.workspace` may be null if the relation is optional. Add a null guard before accessing `request.workspace.memberships`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!request) return false;

    // Check workspace membership with write role
    if (!request.workspace) return false;
    const isWriter = request.workspace.memberships.length > 0;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!request) return false;

    // Check workspace membership with write role
    const isWriter = request.workspace.memberships.length > 0;
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 104-111

The workspace membership query pattern (find workspace, include memberships filtered by userId and role) is duplicated across `canReadRequest`, `canWriteRequest`, `canAccessWorkspace`, `canManageWorkspace`, and `canManageOrganization`. Consider extracting a private helper like `getWorkspaceMembership(userId, workspaceSlug, role?)` to reduce duplication and centralize the query logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Extracted helper:
  // private async getWorkspaceMembership(userId: string, workspaceSlug: string, role?: string) {
  //   const workspace = await this.prismaClient.workspace.findUnique({
  //     where: { slug: workspaceSlug },
  //     include: { memberships: { where: { userId, isActive: true, ...(role ? { role } : {}) } } },
  //   });
  //   return workspace;
  // }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const workspace = await this.prismaClient.workspace.findUnique({
      where: { slug: workspaceSlug },
      include: {
        memberships: {
          where: { userId: ctx.user.id, isActive: true },
        },
      },
    });
```
</details>

---

**⚡ Performance** · lines 28-33

In `canReadRequest` and `canWriteRequest`, the same `legalRequest` is fetched twice when checking both read and write permissions sequentially. Consider caching the request object or fetching it once and passing it to internal methods to avoid redundant database queries when both checks are needed.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider a shared private method:
  // private async getRequestWithWorkspace(requestId: string, userId: string, role?: string[]) {
  //   return this.prismaClient.legalRequest.findUnique({
  //     where: { id: requestId },
  //     include: { workspace: { include: { memberships: { where: { userId, isActive: true, ...(role ? { role: { in: role } } : {}) } } } } },
  //   });
  // }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async canReadRequest(ctx: RequestContext, requestId: string): Promise<boolean> {
    // Platform admins can read all
    if (this.isPlatformAdmin(ctx)) return true;

    // Get request details
    const request = await this.prismaClient.legalRequest.findUnique({
```
</details>


