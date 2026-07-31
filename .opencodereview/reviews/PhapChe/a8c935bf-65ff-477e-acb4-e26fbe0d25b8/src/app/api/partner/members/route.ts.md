# Review: `src/app/api/partner/members/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · lines 23-30

**Non-deterministic partner selection**: `findFirst` without `orderBy` can arbitrarily pick one membership when a user belongs to multiple active partners. This may lead to the wrong partner context being used, especially if the user is a member of several partner organizations. Add `orderBy` (e.g., `orderBy: { createdAt: 'asc' }`) to ensure deterministic selection, or handle the multi-partner scenario explicitly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        partner: { status: 'active' },
      },
      include: { partner: true },
      orderBy: { createdAt: 'asc' },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        partner: { status: 'active' },
      },
      include: { partner: true },
    });
```
</details>

---

**🐛 Bug** · line 56

**`avatarUrl` is always `undefined` at runtime**: The `partnerAuthService.getPartnerMembers()` method selects only `id`, `name`, `email`, `isActive`, `emailVerified`, `createdAt`, `lastActiveAt` from the user — it does NOT include `avatarUrl`. The type cast `as Promise<(PartnerMember & { user: User })[]>` in the service masks this at compile time, but at runtime `m.user.avatarUrl` will be `undefined`. Either add `avatarUrl` to the service's `select` or handle the missing field here.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        avatarUrl: (m.user as any).avatarUrl ?? null,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        avatarUrl: m.user.avatarUrl,
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · line 40

**Nested ternary expression**: The assignment of `isActive` uses a nested ternary, which is prohibited by project rules. Replace with a clearer conditional or `if/else` block for readability.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    let isActive: boolean | undefined;
    if (status === 'active') {
      isActive = true;
    } else if (status === 'inactive') {
      isActive = false;
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const isActive = status === 'inactive' ? false : status === 'active' ? true : undefined;
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 38-46

**Missing role validation**: The `role` query parameter is passed directly to the service without validation. Invalid role values (e.g., `?role=superadmin`) will silently return an empty result set. Consider validating against known roles (`admin`, `specialist`, `viewer`) and returning a 400 error for invalid values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // Validate role if provided
    const VALID_ROLES = ['admin', 'specialist', 'viewer'];
    if (role && !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role filter' }, { status: 400 });
    }

    let isActive: boolean | undefined;
    if (status === 'active') {
      isActive = true;
    } else if (status === 'inactive') {
      isActive = false;
    }

    // Get all members
    const members = await partnerAuthService.getPartnerMembers(member.partnerId, {
      role: role || undefined,
      isActive,
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const isActive = status === 'inactive' ? false : status === 'active' ? true : undefined;

    // Get all members
    const members = await partnerAuthService.getPartnerMembers(member.partnerId, {
      role: role || undefined,
      isActive,
    });
```
</details>

---

**⚡ Performance** · lines 50-61

**Over-fetching user fields**: The `getPartnerMembers` service method selects `isActive`, `emailVerified`, `createdAt`, and `lastActiveAt` on the user object, but these fields are never used in the response mapping. This increases database load and response payload size. Consider adding a `select` parameter to the service method or creating a lighter query variant.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      data: members.map(m => ({
        id: m.id,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
        },
        role: m.role,
        isActive: m.isActive,
        joinedAt: m.createdAt,
      })),
```
</details>


