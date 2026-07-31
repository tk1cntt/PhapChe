# Review: `src/app/[locale]/partner/settings/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🔴 Critical (1)

**🐛 Bug** · lines 15-41

All async operations (auth.api.getSession, prisma.partnerMember.findFirst, prisma.user.findUnique) lack error handling. If any of these throw — e.g., a database connection failure or auth service error — the page will crash with an unhandled 500 error. Wrap the data-fetching logic in a try/catch block and either redirect to an error page or render a fallback UI.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
    // Get session directly (partner users may not have workspace membership)
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      redirect(`/${locale}/login`);
    }

    const userId = session.user.id;

    // Get partner context
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: userId,
        isActive: true,
        partner: { status: 'active' },
      },
      include: { partner: true },
    });

    if (!member) {
      redirect(`/${locale}/dashboard`);
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    return (
      <UserLayout userName={user?.name ?? 'User'} userRole="partner" workspaceName={member.partner.name} workspaceSlug={member.partner.slug}>
        <PartnerSettingsClient
          currentUserId={userId}
          currentUserRole={member.role}
        />
      </UserLayout>
    );
  } catch (error) {
    console.error('Partner settings page error:', error);
    redirect(`/${locale}/error`);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Get session directly (partner users may not have workspace membership)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const userId = session.user.id;

  // Get partner context
  const member = await prisma.partnerMember.findFirst({
    where: {
      userId: userId,
      isActive: true,
      partner: { status: 'active' },
    },
    include: { partner: true },
  });

  if (!member) {
    redirect(`/${locale}/dashboard`);
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
```
</details>


## 🟠 High (1)

**🐛 Bug** · line 44

The workspaceSlug prop is hardcoded as the string `'partner'` instead of using the actual partner slug from the database (`member.partner.slug`). The Partner model has a unique `slug` field that should be used here. The hardcoded value will be incorrect for any partner whose slug is not literally "partner", and the UserLayout displays this value in the header.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    <UserLayout userName={user?.name ?? 'User'} userRole="partner" workspaceName={member.partner.name} workspaceSlug={member.partner.slug}>
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    <UserLayout userName={user?.name ?? 'User'} userRole="partner" workspaceName={member.partner.name} workspaceSlug="partner">
```
</details>


## 🟡 Medium (1)

**⚡ Performance** · lines 37-41

The `prisma.user.findUnique` query selects `email: true` but the `email` field is never consumed in the return JSX — only `user?.name` is used. Remove `email` from the select to avoid fetching unnecessary data from the database.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
```
</details>


