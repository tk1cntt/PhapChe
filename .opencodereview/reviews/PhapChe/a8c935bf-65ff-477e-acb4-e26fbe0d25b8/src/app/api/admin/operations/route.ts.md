# Review: `src/app/api/admin/operations/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (1)

**🔒 Security** · line 32

Logging the full `searchParams.toString()` could leak sensitive query parameters (e.g., tokens, personally identifiable information) into server logs. Consider logging only non-sensitive params or redacting sensitive values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    console.log('[API /operations] page:', page, 'pageSize:', pageSize);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.log('[API /operations] page:', page, 'pageSize:', pageSize, 'params:', searchParams.toString());
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · line 48

The `data as OpsAggregateDto` type assertion is unnecessary if `getOpsAggregate` already returns the expected type. If the return type differs, this assertion silently masks a type mismatch and could hide a real bug. Consider removing the cast or ensuring the service returns the correct type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    return NextResponse.json(data);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return NextResponse.json(data as OpsAggregateDto);
```
</details>

---

**🔧 Maintainability** · line 23

The `ADMIN_ROLES as readonly string[]` cast is redundant — `ADMIN_ROLES` is already inferred as `readonly ["super_admin", "coordinator_admin"]` due to `as const`, and `ReadonlyArray.includes()` accepts `string` arguments. Removing the cast simplifies the code.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const hasAdminRole = session.roles?.some((role) => ADMIN_ROLES.includes(role));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
```
</details>


