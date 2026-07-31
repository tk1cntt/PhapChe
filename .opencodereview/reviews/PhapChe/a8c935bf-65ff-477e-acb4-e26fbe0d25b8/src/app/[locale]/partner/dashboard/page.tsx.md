# Review: `src/app/[locale]/partner/dashboard/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🔴 Critical (1)

**🐛 Bug** · lines 23-48

All three Prisma database queries lack error handling. If any query fails (network error, DB outage, connection pool exhaustion), the entire page will crash with an unhandled promise rejection, potentially leaking internal error details to the user. Wrap the database operations in a try/catch block and either render a user-friendly error state or redirect to an error page.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
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

    // Get stats for dashboard
    const totalMembers = await prisma.partnerMember.count({
      where: { partnerId: member.partnerId, isActive: true },
    });

    return (
      <UserLayout userName={user?.name ?? 'User'} userRole="partner" workspaceName={member.partner.name} workspaceSlug="partner">
        <PartnerDashboardClient
          currentUserId={userId}
          currentUserRole={member.role}
          partnerName={member.partner.name}
          memberCount={totalMembers}
        />
      </UserLayout>
    );
  } catch (error) {
    console.error('Failed to load partner dashboard:', error);
    redirect(`/${locale}/dashboard?error=partner_load_failed`);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
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

  // Get stats for dashboard
  const [totalMembers] = await Promise.all([
    prisma.partnerMember.count({
      where: { partnerId: member.partnerId, isActive: true },
    }),
  ]);
```
</details>


## 🟡 Medium (1)

**⚡ Performance** · lines 44-48

`Promise.all` is used to wrap a single promise, which adds unnecessary overhead. This was likely left behind after other parallel queries were removed. Use a direct `await` instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const totalMembers = await prisma.partnerMember.count({
    where: { partnerId: member.partnerId, isActive: true },
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [totalMembers] = await Promise.all([
    prisma.partnerMember.count({
      where: { partnerId: member.partnerId, isActive: true },
    }),
  ]);
```
</details>


