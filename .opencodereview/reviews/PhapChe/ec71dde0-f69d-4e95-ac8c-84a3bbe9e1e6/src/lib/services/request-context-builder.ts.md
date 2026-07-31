# Review: `src/lib/services/request-context-builder.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 6

---

## 🟠 High (1)

**🔒 Security** · lines 212-224

**Privilege escalation risk**: `buildPlatformContext` returns a hardcoded platform-tenant context for **any valid userId** without verifying the user actually has platform admin privileges. Any caller that trusts this context could inadvertently grant admin-level access to regular users.

Suggestion: Add an admin role check (e.g., query a `platformAdmin` table or check a system-level role) before returning the platform tenant context, or throw an error if the user is not authorized.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async buildPlatformContext(userId: string): Promise<RequestContext> {
    const user = await this.buildUserContext(userId);

    // Verify the user has platform admin privileges
    const platformAdmin = await this.prisma.platformAdmin.findUnique({
      where: { userId },
    });

    if (!platformAdmin) {
      throw new Error(`User is not a platform admin: ${userId}`);
    }

    return {
      user,
      tenant: {
        id: 'platform-tenant',
        mode: 'shared_platform',
        code: 'shared_platform',
        name: 'GitNexus Platform',
      },
    };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async buildPlatformContext(userId: string): Promise<RequestContext> {
    const user = await this.buildUserContext(userId);

    return {
      user,
      tenant: {
        id: 'platform-tenant',
        mode: 'shared_platform',
        code: 'shared_platform',
        name: 'GitNexus Platform',
      },
    };
  }
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 62-87

**Inactive user still builds full context**: `buildUserContext` does not filter by `isActive` in the Prisma query, and the `build` method proceeds to fetch workspace, organization, tenant, and partner contexts even when the user is inactive. This wastes database resources and could leak workspace/organization membership information for deactivated accounts.

Suggestion: Either add `isActive: true` to the `findUnique` where clause, or check `user.isActive` after retrieval and throw/return early if the user is inactive.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  private async buildUserContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        memberships: {
          select: { role: true },
        },
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (!user.isActive) {
      throw new Error(`User is inactive: ${userId}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.memberships.map((m) => m.role),
      isActive: user.isActive,
    };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  private async buildUserContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        memberships: {
          select: { role: true },
        },
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.memberships.map((m) => m.role),
      isActive: user.isActive,
    };
  }
```
</details>

---

**🐛 Bug** · lines 100-121

**Authorization bypass risk — missing workspace silently returns `undefined`**: When `workspaceSlug` or `workspaceId` is provided but the workspace is not found, `buildWorkspaceContext` / `buildWorkspaceContextById` return `undefined` and the builder continues constructing a context without a workspace. If the caller assumes the workspace is present (e.g., for authorization checks), this could lead to permission bypass.

Suggestion: Consider throwing an error when a workspace is explicitly requested but not found, rather than silently omitting it. Alternatively, ensure all callers explicitly check for the presence of `context.workspace` before authorizing workspace-scoped operations.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!workspace) {
      throw new Error(`Workspace not found for slug: ${slug}`);
    }

    return {
      id: workspace.id,
      slug: workspace.slug,
      organizationId: workspace.organizationId, // NOT NULL since v2.3
      isActive: workspace.isActive,
    };
  }

  private async buildWorkspaceContextById(id: string): Promise<WorkspaceContext | undefined> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!workspace) {
      throw new Error(`Workspace not found for id: ${id}`);
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!workspace) return undefined;

    return {
      id: workspace.id,
      slug: workspace.slug,
      organizationId: workspace.organizationId, // NOT NULL since v2.3
      isActive: workspace.isActive,
    };
  }

  private async buildWorkspaceContextById(id: string): Promise<WorkspaceContext | undefined> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!workspace) return undefined;
```
</details>

---

**🐛 Bug** · lines 189-192

**Partner status not validated**: `buildPartnerContext` selects `partner.status` from the database but never checks whether the partner is active. Only `partnerMember.isActive` is checked. A user could be an active member of a suspended/inactive partner, and the partner context would still be returned with `partner.status` potentially being `'inactive'` or `'suspended'`.

Suggestion: Add a check for `member.partner.status` after the `findFirst` query to ensure only active partners are included in the context.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!member) return undefined;

    // Exclude inactive or suspended partners
    if (member.partner.status !== 'active') return undefined;

    // Get active engagements for this partner
    const engagements = await this.prisma.engagement.findMany({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!member) return undefined;

    // Get active engagements for this partner
    const engagements = await this.prisma.engagement.findMany({
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 89-129

**Duplicate code**: `buildWorkspaceContext` and `buildWorkspaceContextById` are nearly identical — the only difference is the `where` clause (`{ slug }` vs `{ id }`). The select clause, null check, and return shape are duplicated.

Suggestion: Extract a shared private method (e.g., `buildWorkspaceContextByWhere(where)`) to eliminate duplication and reduce maintenance burden.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  private async buildWorkspaceContext(slug: string): Promise<WorkspaceContext | undefined> {
    return this.buildWorkspaceContextByWhere({ slug });
  }

  private async buildWorkspaceContextById(id: string): Promise<WorkspaceContext | undefined> {
    return this.buildWorkspaceContextByWhere({ id });
  }

  private async buildWorkspaceContextByWhere(
    where: { slug: string } | { id: string },
  ): Promise<WorkspaceContext | undefined> {
    const workspace = await this.prisma.workspace.findUnique({
      where,
      select: {
        id: true,
        slug: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!workspace) return undefined;

    return {
      id: workspace.id,
      slug: workspace.slug,
      organizationId: workspace.organizationId,
      isActive: workspace.isActive,
    };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  private async buildWorkspaceContext(slug: string): Promise<WorkspaceContext | undefined> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!workspace) return undefined;

    return {
      id: workspace.id,
      slug: workspace.slug,
      organizationId: workspace.organizationId, // NOT NULL since v2.3
      isActive: workspace.isActive,
    };
  }

  private async buildWorkspaceContextById(id: string): Promise<WorkspaceContext | undefined> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!workspace) return undefined;

    return {
      id: workspace.id,
      slug: workspace.slug,
      organizationId: workspace.organizationId, // NOT NULL since v2.3
      isActive: workspace.isActive,
    };
  }
```
</details>

---

**🔧 Maintainability** · lines 217-222

**Hardcoded business strings**: `buildPlatformContext` contains hardcoded business identifiers (`'platform-tenant'`, `'shared_platform'`, `'GitNexus Platform'`). These should be extracted to a constants file or configuration to avoid magic strings scattered in code and to make platform rebranding or tenant-mode changes safer.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      tenant: {
        id: PLATFORM_TENANT_ID,
        mode: PLATFORM_TENANT_MODE,
        code: PLATFORM_TENANT_CODE,
        name: PLATFORM_TENANT_NAME,
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      tenant: {
        id: 'platform-tenant',
        mode: 'shared_platform',
        code: 'shared_platform',
        name: 'GitNexus Platform',
      },
```
</details>


