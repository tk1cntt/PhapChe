# Review: `src/app/api/admin/partner/requests/[id]/comments/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟡 Medium (1)

**🐛 Bug** · lines 135-138

No type validation for `content` before calling `.trim()`. If `content` is a non-string JSON value (e.g., a number like `123` or an object like `{}`), `content?.trim()` will throw a `TypeError` because optional chaining only guards against `null`/`undefined`, not against non-string types. The error is caught by the generic catch block and returns a 500, but the client gets a misleading error message instead of a proper validation error.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const body = await req.json();
    const { content } = body;

    if (typeof content !== 'string' || !content.trim()) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 118

Destructured variables `session` and `activeWorkspaceId` are never used in the POST handler. This is dead code that can confuse readers and trigger lint warnings.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { userId } = await requireAdminSession();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { session, userId, activeWorkspaceId } = await requireAdminSession();
```
</details>


