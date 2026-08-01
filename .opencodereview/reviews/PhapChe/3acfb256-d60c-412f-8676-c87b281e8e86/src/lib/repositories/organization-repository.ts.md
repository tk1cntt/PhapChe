# Review: `src/lib/repositories/organization-repository.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 7

---

## 🟠 High (1)

**🔒 Security** · lines 25-27

**Unsafe type cast bypasses TypeScript type checking for Prisma query options.**

The cast `as Parameters<typeof this.db.organization.findMany>[0]` suppresses all type errors. If `FindManyOptions` contains properties that Prisma doesn't accept (or if Prisma changes its API), this will fail at runtime with no compile-time warning. Consider mapping the options explicitly or using a type-safe adapter.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async dbFindMany(options: FindManyOptions<{ id?: string; tenantId?: string; status?: string }>) {
    return this.db.organization.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: options.include,
    });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async dbFindMany(options: FindManyOptions<{ id?: string; tenantId?: string; status?: string }>) {
    return this.db.organization.findMany(options as Parameters<typeof this.db.organization.findMany>[0]);
  }
```
</details>


## 🟡 Medium (4)

**🔒 Security** · lines 66-72

**`listForTenant` bypasses the permission system entirely.**

This method calls `this.db.organization.findMany` directly without going through `canAccess`. While it does filter by `ctx.tenant.id`, it does not verify that the caller is allowed to list organizations for that tenant. Consider delegating to `this.findMany` with a tenant-scoped where clause, or adding an explicit permission check.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async listForTenant(ctx: RequestContext, options?: { skip?: number; take?: number }) {
    if (!ctx.tenant) throw new Error('Tenant context required');
    return this.findMany(ctx, {
      where: { tenantId: ctx.tenant.id },
      ...options,
    });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async listForTenant(ctx: RequestContext, options?: { skip?: number; take?: number }) {
    if (!ctx.tenant) throw new Error('Tenant context required');
    return this.db.organization.findMany({
      where: { tenantId: ctx.tenant.id },
      ...options,
    });
  }
```
</details>

---

**🐛 Bug** · lines 41-46

**Unsafe cast of `entity` to `{ tenantId: string }` without runtime validation.**

If `entity` is not actually an object with a `tenantId` property (e.g., `null`, `undefined`, or a Prisma result with a different shape), `org.tenantId` will silently evaluate to `undefined`, making all comparisons fail and denying access. This masks bugs. Consider adding a runtime guard or using a type predicate.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const org = entity as { tenantId?: string } | null | undefined;
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && org && ctx.tenant.id === org.tenantId) return true;
    return false;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const org = entity as { tenantId: string };
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && ctx.tenant.id === org.tenantId) return true;
    return false;
  }
```
</details>

---

**🐛 Bug** · lines 59-61

**`canDelete` and `canCreate` method signatures omit the `entity`/`data` parameter declared in the base class.**

Base class declares:
- `canDelete(ctx: RequestContext, entity: unknown): Promise<boolean>`
- `canCreate(ctx: RequestContext, data: CreateInput): Promise<boolean>`

While TypeScript allows this (fewer parameters are assignable), the base class call sites pass these arguments (e.g., `delete` at line 96 passes `entity`). If future code in the base class starts relying on the subclass inspecting `entity` or `data`, this will silently break. Add the parameter explicitly (even if unused) to match the contract, or update the base class to use optional parameters.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async canDelete(ctx: RequestContext, _entity: unknown): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async canDelete(ctx: RequestContext): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }
```
</details>

---

**🐛 Bug** · lines 48-50

**`canCreate` signature omits the `data` parameter defined in the base class.**

Base class: `canCreate(ctx: RequestContext, data: CreateInput): Promise<boolean>`
This override: `canCreate(ctx: RequestContext): Promise<boolean>`

While TypeScript allows fewer parameters, the base class passes `data` at call sites. If the base class later begins using the return value from `canCreate` to conditionally filter `data` fields, this override would silently ignore the data. Add the parameter explicitly to match the contract.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  protected async canCreate(ctx: RequestContext, _data: { name: string; tenantId: string; businessType?: string }): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async canCreate(ctx: RequestContext): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 67

**Throwing a plain `Error` with a hardcoded message makes error handling fragile.**

Consider using a custom error class (e.g., `TenantContextRequiredError`) so that upstream code can distinguish this error type from other generic errors without relying on string matching.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!ctx.tenant) throw new TenantContextRequiredError();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!ctx.tenant) throw new Error('Tenant context required');
```
</details>

---

**🔧 Maintainability** · lines 41-57

**Duplicate permission logic between `canAccess` and `canUpdate`.**

Both methods implement the same check: platform admin, or tenant match. Consider extracting this shared logic into a private helper (e.g., `isSameTenant`) to reduce duplication and the risk of divergent behavior.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  private isSameTenantOrAdmin(ctx: RequestContext, org: { tenantId?: string } | null | undefined): boolean {
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && org && ctx.tenant.id === org.tenantId) return true;
    return false;
  }

  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    return this.isSameTenantOrAdmin(ctx, entity as { tenantId?: string } | null | undefined);
  }

  protected async canCreate(ctx: RequestContext): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }

  protected async canUpdate(ctx: RequestContext, entity: unknown): Promise<boolean> {
    return this.isSameTenantOrAdmin(ctx, entity as { tenantId?: string } | null | undefined);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const org = entity as { tenantId: string };
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && ctx.tenant.id === org.tenantId) return true;
    return false;
  }

  protected async canCreate(ctx: RequestContext): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }

  protected async canUpdate(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const org = entity as { tenantId: string };
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && ctx.tenant.id === org.tenantId) return true;
    return false;
  }
```
</details>


