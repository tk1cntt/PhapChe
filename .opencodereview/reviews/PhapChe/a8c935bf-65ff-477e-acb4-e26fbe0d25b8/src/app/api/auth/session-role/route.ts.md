# Review: `src/app/api/auth/session-role/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🔴 Critical (1)

**🔒 Security** · lines 26-54

**Cross-workspace privilege escalation**: The primary role is computed as the highest-priority role across ALL workspaces, not scoped to a single workspace. If this endpoint is used to authorize workspace-specific actions, a user who is an admin in Workspace A would be granted admin-level privileges in Workspace B where they are only a customer. This is a serious authorization bypass vulnerability.

**Recommendation**: Either (a) require a `workspaceId` query parameter and return the role only for that workspace, or (b) return a per-workspace role map so the client can look up the correct role for the current workspace context. For example:
```typescript
// Option A: workspace-scoped
const { searchParams } = new URL(request.url);
const workspaceId = searchParams.get('workspaceId');
// ... filter memberships by workspaceId

// Option B: return all roles keyed by workspace
return NextResponse.json({
  roles: Object.fromEntries(
    memberships.map(m => [m.workspaceId, m.role])
  )
});
```

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Fetch user's workspace memberships to determine primary role
    const memberships = await prisma.workspaceMembership.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        role: true,
      },
    });

    if (memberships.length === 0) {
      // No workspace memberships - default to customer
      return NextResponse.json({ role: 'customer' });
    }

    // Find highest priority role
    let primaryRole = 'customer';
    let highestPriority = 0;

    for (const membership of memberships) {
      const priority = ROLE_PRIORITY[membership.role] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        primaryRole = membership.role;
      }
    }

    return NextResponse.json({ role: primaryRole });
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 46-52

**Stale role priority map causes incorrect role classification**: When a role exists in the database but is not present in the `ROLE_PRIORITY` map, `ROLE_PRIORITY[membership.role]` returns `undefined`, which falls back to priority `0`. Since `highestPriority` starts at `0`, the `priority > highestPriority` check (`0 > 0`) is never true, so the user is silently classified as `'customer'` even though they hold a different role. This is a silent data corruption bug that will manifest whenever a new role is added to the system without updating this map.

**Recommendation**: Consider one of: (a) derive the priority map from the database (e.g., a `Role` table with a `priority` column), (b) add a runtime warning when an unmapped role is encountered, or (c) use a more defensive fallback (e.g., keep the actual role name with a default mid-level priority rather than silently falling back to `customer`).

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    for (const membership of memberships) {
      const priority = ROLE_PRIORITY[membership.role] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        primaryRole = membership.role;
      }
    }
```
</details>

---

**🔧 Maintainability** · line 54

**Ambiguous response without workspace context**: The response `{ role: primaryRole }` provides no indication of which workspace the role is associated with. Clients that need to make per-workspace authorization decisions cannot determine which workspace this role applies to, which compounds the cross-workspace privilege escalation issue noted above. Consider returning workspace-scoped role information.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return NextResponse.json({ role: primaryRole });
```
</details>


