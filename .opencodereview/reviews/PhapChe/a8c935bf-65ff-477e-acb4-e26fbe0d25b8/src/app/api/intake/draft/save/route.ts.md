# Review: `src/app/api/intake/draft/save/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · line 43

## Dead code: unused `workspaceId` variable

The `workspaceId` is extracted from the session on line 52 but **never referenced** anywhere in the remainder of the handler. It is not passed to the Prisma `create` or `update` calls. If the `Draft` model has a `workspaceId` field, this is a **data integrity bug**: drafts from different workspaces would be mixed together and not scoped properly. If the model does not have a `workspaceId` field, the variable is simply dead code that should be removed.

**Suggestion:** Either use `workspaceId` in the draft create/update queries to scope the draft to the active workspace, or remove the unused destructuring if workspace scoping is not needed.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const workspaceId = session.activeWorkspaceId;
```
</details>

---

**🐛 Bug** · lines 109-117

## Unconditional `status` overwrite on update

When updating an existing draft, the code **always** sets `status: 'draft'` unconditionally (line 118). This means if a draft has been transitioned to another status (e.g., `'submitted'`, `'in_review'`) by a different process, saving will silently revert it back to `'draft'`. This can cause data integrity issues and lost workflow state.

**Suggestion:** Consider preserving the existing status, or only set `status: 'draft'` when creating a new draft. For updates, you could use `where: { id: ..., status: 'draft' }` to only allow updating drafts that are still in draft status, or conditionally set the status.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        data: {
          domainId: data.domainId,
          serviceType: data.serviceType,
          answers: data.answers,
          files: data.files,
          priority: data.priority,
          contactInfo: data.contactInfo,
          status: 'draft',
        },
```
</details>


## 🟡 Medium (2)

**⚡ Performance** · lines 46-56

## Potentially redundant user existence check

After `requireAppSession()` authenticates the user, an additional `prisma.user.findUnique` query is performed to verify the user exists in the database. If `requireAppSession` already guarantees the user exists (e.g., by fetching the user record during session validation), this second query is redundant and adds unnecessary database overhead on every request.

**Suggestion:** If `requireAppSession` already ensures a valid user, remove the `findUnique` check. If it doesn't, consider adding this check inside `requireAppSession` to avoid duplicating it across all route handlers.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', detail: 'User not found' },
        { status: 401 }
      );
    }
```
</details>

---

**🔧 Maintainability** · lines 156-161

## Fragile error-type detection via string matching

The catch block relies on **string comparison** (`message === 'UNAUTHENTICATED'`) to detect authentication errors. This is brittle — if `requireAppSession` changes its error message, adds a prefix, or a different error happens to produce the same string, the logic breaks or misfires. It also couples the route handler to the internal implementation details of the session module.

**Suggestion:** Use a custom error class (e.g., `class UnauthenticatedError extends Error {}`) thrown by `requireAppSession`, then check with `instanceof` in the catch block. This is type-safe and decoupled from message strings.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', detail: 'Please login to continue' },
        { status: 401 }
      );
    }
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 153-154

## Dead code: unused `stack` variable

The `stack` variable is declared on line 129 but **never used** — it is not included in the `console.error` call or anywhere else. This appears to be leftover from an earlier version where stack traces were logged. Dead code clutters the source and may confuse future readers into thinking it serves a purpose.

**Suggestion:** Either remove the `stack` variable entirely, or incorporate it into the error logging (e.g., `console.error('Draft save failed:', message, stack)`).

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
```
</details>


