# Review: `src/app/api/workspace/invite/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 7

---

## 🟠 High (4)

**🔒 Security** · lines 8-9

Authorization check missing: The route extracts `roles` from the session (line 11) but never checks whether the current user has permission to invite members to the active workspace. Any authenticated user — including a `customer` — can invite anyone with any role, potentially escalating their own privileges. The session's `roles` array is available but unused.

Fix: Verify that the current user holds a role in the active workspace that is authorized to invite (e.g., `super_admin`, `coordinator_admin`), and that the invited role is not higher than the inviter's own role.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const session = await requireAppSession();
    const { userId, activeWorkspaceId, roles } = session;

    // Only staff roles (super_admin, coordinator_admin, audit_admin) can invite members
    const ALLOWED_INVITE_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin'];
    const hasInvitePermission = roles.some((r) => ALLOWED_INVITE_ROLES.includes(r));
    if (!hasInvitePermission) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members to this workspace' },
        { status: 403 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;
```
</details>

---

**🐛 Bug** · lines 43-59

Race condition: The `findFirst` check (line 47) and the `create` call (line 59) are not atomic. Two concurrent requests can both pass the existence check and then both attempt to create. The database has a `@@unique([userId, workspaceId])` constraint (schema line 281), so the second `create` will throw a Prisma `P2002` unique constraint violation, which falls through to the generic 500 handler instead of returning a proper 409 response.

Fix: Use a database-level atomic upsert or catch the Prisma unique constraint error (`P2002`) and return a 409 response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Create workspace membership for existing user (atomic upsert)
    try {
      const membership = await prisma.workspaceMembership.create({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Check if user is already a member of this workspace
    const existingMembership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: activeWorkspaceId,
        userId: invitedUser.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 409 }
      );
    }

    // Create workspace membership for existing user
    const membership = await prisma.workspaceMembership.create({
```
</details>

---

**🔒 Security** · line 20

Unvalidated role input: The `role` field from the request body is used directly in the `create` call without validation. The schema has no enum constraint on `WorkspaceMembership.role` (it's a plain `String`), so an attacker could set arbitrary roles like `super_admin` and escalate their privileges.

Fix: Validate that `role` is one of the allowed workspace roles (`customer`, `specialist`, `reviewer`, `coordinator_admin`, `audit_admin`, `super_admin`) before creating the membership.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { email, role = 'customer' } = body;

    // Validate role is one of the allowed workspace roles
    const VALID_ROLES = ['customer', 'specialist', 'reviewer', 'coordinator_admin', 'audit_admin', 'super_admin'];
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { email, role = 'customer' } = body;
```
</details>

---

**🐛 Bug** · lines 8-9

The session's `roles` array aggregates roles from ALL workspace memberships (see session.ts line 66), not just the active workspace. A user could be `super_admin` in workspace A but `customer` in the active workspace B. Checking `roles` against the active workspace would grant elevated privileges that the user doesn't actually have in the active workspace.

Fix: Instead of checking the session-level `roles` (which are cross-workspace), query the current user's membership specifically in the active workspace to determine their actual role for authorization.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    // Fetch the current user's membership in the active workspace for authorization
    const currentMembership = await prisma.workspaceMembership.findFirst({
      where: {
        workspaceId: activeWorkspaceId,
        userId,
        isActive: true,
      },
    });

    if (!currentMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
        { status: 403 }
      );
    }

    const ALLOWED_INVITE_ROLES = ['super_admin', 'coordinator_admin', 'audit_admin'];
    if (!ALLOWED_INVITE_ROLES.includes(currentMembership.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members' },
        { status: 403 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;
```
</details>


## 🟡 Medium (3)

**🔒 Security** · lines 36-41

Information disclosure via user enumeration: The error message at line 47 reveals whether an email is registered in the system ("User with this email does not exist"). This enables attackers to enumerate valid user accounts by probing different email addresses.

Fix: Use a generic message like "Invitation could not be processed" or implement rate limiting to mitigate enumeration attacks.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!invitedUser) {
      return NextResponse.json(
        { error: 'Unable to process invitation. Please check the email and try again.' },
        { status: 404 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!invitedUser) {
      return NextResponse.json(
        { error: 'User with this email does not exist. They must register first.' },
        { status: 404 }
      );
    }
```
</details>

---

**🐛 Bug** · lines 36-41

Missing self-invite check: A user can invite themselves to the workspace, which would create a duplicate membership and result in a confusing error. Additionally, inviting yourself could be used to bypass the role validation if the inviter is targeting a higher role.

Fix: Check if `invitedUser.id === userId` and return an appropriate error.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!invitedUser) {
      return NextResponse.json(
        { error: 'Unable to process invitation. Please check the email and try again.' },
        { status: 404 }
      );
    }

    // Prevent self-invite
    if (invitedUser.id === userId) {
      return NextResponse.json(
        { error: 'You cannot invite yourself to the workspace' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!invitedUser) {
      return NextResponse.json(
        { error: 'User with this email does not exist. They must register first.' },
        { status: 404 }
      );
    }
```
</details>

---

**⚡ Performance** · lines 5-6

Missing rate limiting: This endpoint has no rate limiting, which makes it vulnerable to brute-force email enumeration attacks and denial-of-service. An attacker could rapidly probe email addresses to discover valid users.

Fix: Add rate limiting middleware (e.g., using `@upstash/ratelimit` or Next.js middleware) to limit the number of invite requests per IP or user.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider adding rate limiting middleware (e.g., @upstash/ratelimit) to prevent
// brute-force email enumeration and abuse of this endpoint.
export async function POST(request: NextRequest) {
  try {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function POST(request: NextRequest) {
  try {
```
</details>


