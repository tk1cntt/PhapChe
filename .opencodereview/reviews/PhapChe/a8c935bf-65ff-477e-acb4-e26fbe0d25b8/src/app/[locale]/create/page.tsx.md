# Review: `src/app/[locale]/create/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (3)

**🐛 Bug** · line 26

**Dead code: `draftId` is extracted from `searchParams` but never used.**

The `draftId` search parameter is destructured on line 22 but never passed to `CreateRequestForm` or used in any logic. This suggests either:
- A missing feature (draft loading/editing was planned but not implemented), or
- Residual code from a refactor.

This is misleading for future developers and may indicate an incomplete feature. If draft support is intended, `draftId` should be passed to `CreateRequestForm` to pre-populate the form. Otherwise, remove the extraction.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // If draft support is planned: pass draftId to CreateRequestForm
  const { draftId } = await searchParams;
  // ... later:
  // <CreateRequestForm ... draftId={draftId} />

  // If draft support is not needed: remove this line entirely
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const { draftId } = await searchParams;
```
</details>

---

**🐛 Bug** · lines 37-40

**Incorrect workspace selection when `activeWorkspaceId` is null.**

The Prisma filter `workspaceId: activeWorkspaceId ?? undefined` causes the `where` clause to be omitted entirely when `activeWorkspaceId` is `null`. This means `prisma.user.findUnique` returns ALL memberships for the user, and `memberships[0]` arbitrarily picks the first one — which may not be the intended workspace.

This can lead to data integrity issues: the user sees the wrong workspace name/slug in the header and form context.

Consider: if `activeWorkspaceId` is null, should the page redirect to a workspace selection page, or use a different fallback?

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      memberships: {
        where: activeWorkspaceId
          ? { workspaceId: activeWorkspaceId }
          : { workspaceId: { not: undefined } }, // or handle null case explicitly
        select: { workspace: { select: { name: true, slug: true } } },
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true } } },
      },
```
</details>

---

**🐛 Bug** · lines 31-56

**Missing error handling for async database queries.**

Both `prisma.user.findUnique` and `prisma.workspace.findMany` are awaited directly without `try/catch`. If the database is unreachable or the queries fail, this will result in an unhandled promise rejection, crashing the page with a raw error (or Next.js error boundary fallback) rather than a user-friendly message.

Wrap the data-fetching logic in a `try/catch` block and handle errors gracefully (e.g., redirect to an error page, or render an error state).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        memberships: {
          where: { workspaceId: activeWorkspaceId ?? undefined },
          select: { workspace: { select: { name: true, slug: true } } },
        },
      },
    });

    const workspace = user?.memberships[0]?.workspace;
    const userName = user?.name ?? user?.email ?? 'User';
    const workspaceName = workspace?.name ?? 'Workspace';
    const workspaceSlug = workspace?.slug ?? 'workspace';

    const workspaces = await prisma.workspace.findMany({
      where: {
        memberships: {
          some: { userId },
        },
      },
      select: { id: true, name: true, slug: true },
    });
    // ... rest of rendering logic
  } catch (error) {
    console.error('Failed to load create request page:', error);
    // Redirect or render error state
    return <ErrorState message={t('loadError')} />;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true } } },
      },
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? user?.email ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

  const workspaces = await prisma.workspace.findMany({
    where: {
      memberships: {
        some: { userId },
      },
    },
    select: { id: true, name: true, slug: true },
  });
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 72-81

**Non-functional buttons in the header.**

The "Save Draft" and "View Draft" buttons (lines 65-75) have no `onClick` handlers, `formAction`, or `type="button"` attributes. Since this is a server component, these buttons are rendered as plain HTML `<button>` elements with no attached behavior. Without a `type` attribute, they default to `type="submit"`, which could cause unintended form submission if wrapped in a `<form>`.

If these are placeholders for future functionality, add a comment explaining the intent. If they should work, they need client-side interactivity (e.g., via a client component wrapper or form actions).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        <div className="header-actions">
          {/* TODO: Implement save draft functionality */}
          <button type="button" className="ghost-btn">{t('saveDraft')}</button>
          {/* TODO: Implement view drafts functionality */}
          <button type="button" className="create-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
            </svg>
            {t('viewDraft')}
          </button>
        </div>
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        <div className="header-actions">
          <button className="ghost-btn">{t('saveDraft')}</button>
          <button className="create-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
            </svg>
            {t('viewDraft')}
          </button>
        </div>
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 58-63

**Hardcoded `taxCode` with no data source.**

`userContactInfo.taxCode` is always set to an empty string `''` with no mechanism to populate it from the user or workspace data. If tax code is a required or expected field, this is a missing feature. If it is intentionally empty, consider adding a comment to clarify, or remove it from the `userContactInfo` object if the form doesn't need it.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const userContactInfo = {
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    companyName: workspaceName,
    taxCode: user?.taxCode ?? '', // TODO: source taxCode from user profile or workspace
  };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const userContactInfo = {
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    companyName: workspaceName,
    taxCode: '',
  };
```
</details>


