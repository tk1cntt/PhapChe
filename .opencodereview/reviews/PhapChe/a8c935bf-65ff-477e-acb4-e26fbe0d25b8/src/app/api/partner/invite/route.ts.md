# Review: `src/app/api/partner/invite/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟠 High (1)

**🔒 Security** · lines 39-40

GET handler is missing an authorization/permission check. Any active partner member can list all pending invites, which may leak sensitive data (email addresses, roles, etc.). The POST handler correctly checks `hasPermission(member.role, 'manage_members')`, but GET has no equivalent check. Consider adding a permission check (e.g., `view_members` or `manage_members`) before returning the invite list.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Check if user has permission to view invites
    if (!hasPermission(member.role, 'view_members') && !hasPermission(member.role, 'manage_members')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Get pending invites
    const invites = await partnerInviteService.listPendingInvites(member.partnerId);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get pending invites
    const invites = await partnerInviteService.listPendingInvites(member.partnerId);
```
</details>


## 🟡 Medium (2)

**⚡ Performance** · lines 42-54

GET endpoint returns all pending invites without pagination. For partners with a large number of invites, this could cause performance degradation and excessive response sizes. Consider adding pagination support (e.g., `page`, `limit` query parameters) and returning only a subset of results.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Support pagination via query params
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

    const result = await partnerInviteService.listPendingInvites(member.partnerId, { page, limit });

    return NextResponse.json({
      success: true,
      data: result.invites.map(invite => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        invitedBy: invite.invitedBy,
        createdAt: invite.createdAt,
      })),
      total: result.total,
      page,
      limit,
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return NextResponse.json({
      success: true,
      data: invites.map(invite => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        invitedBy: invite.invitedBy,
        createdAt: invite.createdAt,
      })),
      total: invites.length,
    });
```
</details>

---

**🔧 Maintainability** · lines 16-37

The session retrieval and partner member lookup logic is duplicated verbatim in both GET and POST handlers (lines 16-36 and lines 57-77). This duplication increases maintenance burden and risk of inconsistency. Consider extracting this into a shared helper function (e.g., `getPartnerMemberContext(req)`) that returns the session and member, or throws an appropriate error response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Get partner context (extracted to shared helper)
    const { session, member } = await getPartnerMemberContext(req);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get session from request headers (better-auth reads from cookie)
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


