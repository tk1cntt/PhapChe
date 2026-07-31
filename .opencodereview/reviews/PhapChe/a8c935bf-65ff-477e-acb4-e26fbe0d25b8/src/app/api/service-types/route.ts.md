# Review: `src/app/api/service-types/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (3)

**🔒 Security** · lines 12-15

Missing role-based authorization check. The endpoint only verifies that the user is authenticated but does not enforce any role or permission restriction. Any authenticated user can access all service types. If this endpoint is intended only for admins or specific roles, add a role/permission check (e.g., `session.user.role !== 'admin'`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // TODO: Add role-based check if this endpoint should be restricted
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
```
</details>

---

**🐛 Bug** · line 18

Loose boolean parsing of `isActive` query parameter. Using `!== 'false'` means any value other than the literal string `'false'` (including empty string `''`, `'random'`, `'0'`, or `'FALSE'`) is treated as `true`. This can lead to unexpected filtering behavior. Consider using an explicit check like `searchParams.get('isActive') === 'true'` to default to `false` when the parameter is absent or ambiguous, or use a more robust parsing utility.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === null ? true : isActiveParam === 'true';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const isActive = searchParams.get('isActive') !== 'false';
```
</details>

---

**🔒 Security** · line 27

Logging the raw error object to the console can leak sensitive information in production (e.g., stack traces, database connection strings, internal paths). Consider logging only a sanitized message or error code, and use a structured logger with appropriate production-level filtering.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    console.error('Service types error:', error instanceof Error ? error.message : 'Unknown error');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Service types error:', error);
```
</details>


