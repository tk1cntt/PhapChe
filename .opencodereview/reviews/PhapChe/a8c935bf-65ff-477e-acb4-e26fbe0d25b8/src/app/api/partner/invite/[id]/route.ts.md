# Review: `src/app/api/partner/invite/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟡 Medium (2)

**🔧 Maintainability** · lines 20-41

Duplicate auth/authorization logic: Both DELETE and GET handlers repeat the same session validation (lines 28-33, 85-89) and partner member lookup (lines 36-48, 92-100). Extract this into a shared helper or middleware to avoid drift and reduce maintenance burden.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // TODO: Extract shared auth + partner member resolution into a helper, e.g.:
    // const { session, member } = await resolvePartnerContext(req);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get session from request headers
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner context
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        partner: { status: 'active' },
      },
      include: { partner: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a partner member' }, { status: 403 });
    }
```
</details>

---

**🔒 Security** · lines 91-105

Inconsistent authorization: The DELETE handler checks `hasPermission(member.role, 'manage_members')` (line 52), but the GET handler performs no similar permission check — any active partner member can view invite details. If invite viewing should also require `manage_members` (or an equivalent permission), add the same check to the GET handler.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Get partner context
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        partner: { status: 'active' },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a partner member' }, { status: 403 });
    }

    // Check if user has permission to view invites
    if (!hasPermission(member.role, 'manage_members')) {
      return NextResponse.json(
        { error: 'Permission denied. Requires manage_members permission.' },
        { status: 403 }
      );
    }

    // Get invite
    const invite = await partnerInviteService.getInviteById(id);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get partner context
    const member = await prisma.partnerMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        partner: { status: 'active' },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Not a partner member' }, { status: 403 });
    }

    // Get invite
    const invite = await partnerInviteService.getInviteById(id);
```
</details>


