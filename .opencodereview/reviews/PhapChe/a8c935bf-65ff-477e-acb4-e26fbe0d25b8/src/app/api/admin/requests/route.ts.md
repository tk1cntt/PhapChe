# Review: `src/app/api/admin/requests/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🔴 Critical (1)

**🐛 Bug** · lines 146-149

Null-safety: `req.workspace` and `req.createdBy` are accessed directly without null checks. If these Prisma relations are optional (e.g., workspace or createdBy could be null when the relation is not loaded or the referenced record is deleted), this will throw a runtime `TypeError: Cannot read properties of null` and crash the entire request. Use optional chaining and provide fallback values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        workspace: req.workspace?.name ?? '—',
        workspaceSlug: req.workspace?.slug ?? '—',
        customer: req.createdBy?.name ?? '—',
        customerEmail: req.createdBy?.email ?? '—',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        workspace: req.workspace.name,
        workspaceSlug: req.workspace.slug,
        customer: req.createdBy.name,
        customerEmail: req.createdBy.email,
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 50-51

Input validation: `page` and `pageSize` are parsed from query parameters without any validation. Negative values, zero, or extremely large numbers could cause unexpected behavior (e.g., `skip` becoming negative, `take: 0` returning no results, or a huge `take` causing performance issues). Add validation to clamp these values to reasonable ranges.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
```
</details>

---

**🐛 Bug** · lines 173-176

Error handling: The catch block returns a generic 500 `Internal server error` for all exceptions, including authentication errors thrown by `requireAppSession()` (which should return 401). Consider catching specific error types or re-throwing authentication errors with the appropriate status code so the client can distinguish between auth failures and server errors.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    console.error('Admin requests list error:', error);
    if (error instanceof Error && error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    console.error('Admin requests list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · line 130

Unsafe type assertion: `as { matterTypeRef?: { key?: string | null } | null }` on the `req` object is a forced cast that bypasses TypeScript type checking. If the actual shape differs, the code will silently fail at runtime. Consider defining a proper Prisma return type that includes the conditional include, or use a type guard instead of a cast.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Define a proper type for the request with optional matterTypeRef
      const matterTypeKey = (req as { matterTypeRef?: { key?: string | null } | null }).matterTypeRef?.key ?? (req as { matterType?: string | null }).matterType ?? null;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const matterTypeKey = (req as { matterTypeRef?: { key?: string | null } | null }).matterTypeRef?.key ?? req.matterType ?? null;
```
</details>


