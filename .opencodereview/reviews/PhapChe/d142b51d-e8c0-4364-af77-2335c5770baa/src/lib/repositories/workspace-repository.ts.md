# Review: `src/lib/repositories/workspace-repository.ts`

**Project:** PhapChe | **Review:** `d142b51d-e8c0-4364-af77-2335c5770baa`

**Comments:** 7

---

## 🟠 High (1)

**🐛 Bug** · lines 66-72

Missing null check for `ctx.user` before accessing `ctx.user.id`. If the user is not authenticated (e.g., `ctx.user` is `undefined` or `null`), this will throw a runtime `TypeError: Cannot read properties of undefined (reading 'id')`. Add a guard early in the method.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async listForUser(ctx: RequestContext, options?: { skip?: number; take?: number }) {
    if (!ctx.user?.id) {
      return [];
    }
    return this.db.workspace.findMany({
      where: {
        memberships: {
          some: { userId: ctx.user.id, isActive: true },
        },
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async listForUser(ctx: RequestContext, options?: { skip?: number; take?: number }) {
    return this.db.workspace.findMany({
      where: {
        memberships: {
          some: { userId: ctx.user.id, isActive: true },
        },
      },
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 67-72

The `listForUser` query filters by `memberships.isActive` but does not filter by the workspace's own `isActive` field. A deactivated workspace will still appear in the results as long as the user has an active membership record. Consider adding `isActive: true` to the top-level `where` clause to exclude deactivated workspaces.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    return this.db.workspace.findMany({
      where: {
        isActive: true,
        memberships: {
          some: { userId: ctx.user.id, isActive: true },
        },
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return this.db.workspace.findMany({
      where: {
        memberships: {
          some: { userId: ctx.user.id, isActive: true },
        },
      },
```
</details>

---

**🔧 Maintainability** · lines 25-27

The `dbFindMany` method uses `as Parameters<typeof this.db.workspace.findMany>[0]` to cast the `FindManyOptions` to Prisma's `findMany` args. This unsafe type assertion bypasses TypeScript type-checking and can silently mask mismatches between the generic `FindManyOptions` interface and Prisma's actual expected arguments. If the `FindManyOptions` shape diverges from Prisma's input, this will fail at runtime with no compile-time warning. Consider using a more precise mapped type or validating the input at runtime.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async dbFindMany(options: FindManyOptions<{ id?: string; organizationId?: string; isActive?: boolean }>) {
    return this.db.workspace.findMany(options as unknown as Parameters<typeof this.db.workspace.findMany>[0]);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async dbFindMany(options: FindManyOptions<{ id?: string; organizationId?: string; isActive?: boolean }>) {
    return this.db.workspace.findMany(options as Parameters<typeof this.db.workspace.findMany>[0]);
  }
```
</details>

---

**🔧 Maintainability** · line 54

Method signature mismatch with the base class. The abstract `canUpdate` in `BaseRepository` expects `(ctx: RequestContext, entity: unknown, data: UpdateInput)`, but this override accepts only `(ctx: RequestContext, entity: unknown)`. The `data` parameter (the update payload) is discarded, meaning the permission check cannot consider what is being changed. This could allow a user who can update workspace A to also change restricted fields that should require higher privileges.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async canUpdate(ctx: RequestContext, entity: unknown, _data?: { name?: string; isActive?: boolean }): Promise<boolean> {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async canUpdate(ctx: RequestContext, entity: unknown): Promise<boolean> {
```
</details>


## 🔵 Low (3)

**🔧 Maintainability** · lines 41-44

The `canAccess` method casts `entity` to `{ slug: string }` without any validation. If the entity returned by `dbFindById` or `dbFindMany` is not actually a workspace-like object with a `slug` property, accessing `workspace.slug` will yield `undefined` and the permission check may silently pass or fail incorrectly. Consider adding a runtime guard or using a proper type guard instead of a blind cast.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const workspace = entity as { slug: string };
    if (!workspace?.slug) return false;
    return this.permissionService.canAccessWorkspace(ctx, workspace.slug);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const workspace = entity as { slug: string };
    return this.permissionService.canAccessWorkspace(ctx, workspace.slug);
  }
```
</details>

---

**🔧 Maintainability** · line 46

Method signature mismatch with the base class. The abstract `canCreate` in `BaseRepository` expects `(ctx: RequestContext, data: CreateInput)`, but this override only accepts `(ctx: RequestContext)`. While TypeScript allows this (extra parameters are silently ignored), it means the `data` parameter — which the base class passes via `canCreate(ctx, data)` — is discarded. This may be intentional, but the signature should match the base class to avoid confusion and future bugs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async canCreate(ctx: RequestContext, _data?: { name: string; slug: string; organizationId?: string }): Promise<boolean> {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async canCreate(ctx: RequestContext): Promise<boolean> {
```
</details>

---

**🔧 Maintainability** · line 59

Method signature mismatch with the base class. The abstract `canDelete` in `BaseRepository` expects `(ctx: RequestContext, entity: unknown)`, but this override only accepts `(ctx: RequestContext)`. The entity being deleted is passed by the base `delete` method but ignored here. While the current logic (only platform admins can delete) may be correct, the signature should match the base class for clarity and to avoid issues if the permission logic later needs to inspect the entity.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async canDelete(ctx: RequestContext, _entity?: unknown): Promise<boolean> {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async canDelete(ctx: RequestContext): Promise<boolean> {
```
</details>


