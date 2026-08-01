# Review: `src/lib/services/partner-invite-service.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 5

---

## 🔴 Critical (1)

**🐛 Bug** · lines 219-233

**Concurrency: `updateMany` result is not checked — member created even when invite was already accepted.**

The `$transaction` with an array of operations does not throw when `updateMany` affects 0 rows. If two concurrent `acceptInvite` calls race, the first creates the member and updates the invite to `accepted`. The second call's `updateMany` matches 0 rows (since the invite is no longer `pending`), but the transaction still succeeds, creating a duplicate `partnerMember`. The code should check `updateMany.count` and throw an error if it's 0 to roll back the transaction.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const [member, inviteUpdate] = await this.prismaClient.$transaction([
        this.prismaClient.partnerMember.create({
          data: {
            partnerId: invite.partnerId,
            userId,
            role: invite.role,
            isActive: true,
          },
        }),
        this.prismaClient.partnerInvite.updateMany({
          where: { id: invite.id, status: 'pending' },
          data: { status: 'accepted' },
        }),
      ]);

      if (inviteUpdate.count === 0) {
        throw new Error('Invite was already accepted by another concurrent request');
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const [member] = await this.prismaClient.$transaction([
        this.prismaClient.partnerMember.create({
          data: {
            partnerId: invite.partnerId,
            userId,
            role: invite.role,
            isActive: true,
          },
        }),
        // Only update if still pending — prevents race with concurrent accept
        this.prismaClient.partnerInvite.updateMany({
          where: { id: invite.id, status: 'pending' },
          data: { status: 'accepted' },
        }),
      ]);
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 199-202

**Security: Email match check bypassed when `user.email` is null.**

The condition `if (user.email && user.email.toLowerCase() !== invite.email.toLowerCase())` only fires when `user.email` is truthy. If `user.email` is `null` or `undefined` (e.g., SSO users provisioned without email), the check is silently skipped, allowing any authenticated user to accept any invite regardless of the invite's intended email recipient.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Verify email matches — reject if user has no email or emails don't match
      if (!user.email || user.email.toLowerCase() !== invite.email.toLowerCase()) {
        return { success: false, error: 'Invite email does not match user email' };
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Verify email matches (if both user and invite emails are set)
      if (user.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
        return { success: false, error: 'Invite email does not match user email' };
      }
```
</details>

---

**🐛 Bug** · lines 112-138

**Concurrency: `createInvite` transaction lacks row-level locking, allowing duplicate pending invites.**

The `findFirst` inside the `$transaction` callback does not use `SELECT ... FOR UPDATE`. In PostgreSQL, two concurrent transactions can both pass the `findFirst` check (no existing pending invite found) and each create a new invite for the same `(partnerId, email)`. The Prisma schema also lacks a unique constraint on `(partnerId, email, status)` to enforce this at the database level.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Use interactive transaction with raw SQL lock, or add a unique constraint
      // on (partnerId, email, status) in the schema to prevent duplicates at DB level.
      // Alternatively, use $queryRaw to SELECT ... FOR UPDATE before the create.
      const invite = await this.prismaClient.$transaction(async (tx) => {
        // Lock existing pending invite rows to prevent concurrent inserts
        await tx.$queryRawUnsafe(
          `SELECT id FROM partner_invites WHERE "partnerId" = $1 AND email = $2 AND status = 'pending' AND "expiresAt" > NOW() FOR UPDATE`,
          partnerId,
          email.toLowerCase(),
        );

        const existingInvite = await tx.partnerInvite.findFirst({
          where: {
            partnerId,
            email: email.toLowerCase(),
            status: 'pending',
            expiresAt: { gt: new Date() },
          },
        });

        if (existingInvite) {
          throw Object.assign(new Error('Pending invite already exists for this email'), { code: 'DUPLICATE_INVITE' });
        }

        return tx.partnerInvite.create({
          data: {
            partnerId,
            email: email.toLowerCase(),
            role,
            token,
            invitedBy,
            expiresAt,
            status: 'pending',
          },
        });
      });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const invite = await this.prismaClient.$transaction(async (tx) => {
        // Check for existing pending invite (re-check inside transaction)
        const existingInvite = await tx.partnerInvite.findFirst({
          where: {
            partnerId,
            email: email.toLowerCase(),
            status: 'pending',
            expiresAt: { gt: new Date() },
          },
        });

        if (existingInvite) {
          throw Object.assign(new Error('Pending invite already exists for this email'), { code: 'DUPLICATE_INVITE' });
        }

        return tx.partnerInvite.create({
          data: {
            partnerId,
            email: email.toLowerCase(),
            role,
            token,
            invitedBy,
            expiresAt,
            status: 'pending',
          },
        });
      });
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 260-280

**Dead code: `revokedBy` parameter is accepted but never used.**

The `revokedBy` parameter is passed to `revokeInvite` but is never stored in the database or logged. This means the audit trail is lost — there's no way to know who revoked the invite. Either store it in the invite record (e.g., add a `revokedBy` field) or remove the unused parameter.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const result = await this.prismaClient.partnerInvite.updateMany({
        where: { id: inviteId, status: 'pending' },
        data: { status: 'revoked', },
      });
      // NOTE: Consider storing revokedBy in the invite record or an audit log.
      // Currently the revokedBy parameter is unused.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async revokeInvite(inviteId: string, revokedBy: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const invite = await this.prismaClient.partnerInvite.findUnique({
        where: { id: inviteId },
      });

      if (!invite) {
        return { success: false, error: 'Invite not found' };
      }

      if (invite.status !== 'pending') {
        return { success: false, error: 'Invite is not pending' };
      }

      const result = await this.prismaClient.partnerInvite.updateMany({
        where: { id: inviteId, status: 'pending' },
        data: { status: 'revoked' },
      });
```
</details>

---

**⚡ Performance** · lines 357-372

**Performance: `syncPartnerWorkspaceMemberships` runs sequential `findFirst` + `create` in a loop.**

Each iteration does two DB round-trips (`findFirst` then `create`). For N workspaces, this is up to 2N queries executed serially. Consider using `Promise.all` for independent lookups, or better yet, batch-fetch existing memberships and use a single `createMany` with a `skipDuplicates` or equivalent approach.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Batch-fetch existing memberships to reduce round-trips
      const workspaceIds = workspaces.map(ws => ws.id);
      const existingMemberships = await this.prismaClient.workspaceMembership.findMany({
        where: { userId, workspaceId: { in: workspaceIds } },
        select: { workspaceId: true },
      });
      const existingWorkspaceIds = new Set(existingMemberships.map(m => m.workspaceId));

      const toCreate = workspaceIds.filter(id => !existingWorkspaceIds.has(id));
      await Promise.all(toCreate.map(workspaceId =>
        this.prismaClient.workspaceMembership.create({
          data: {
            userId,
            workspaceId,
            role: 'specialist',
            isActive: true,
          },
        })
      ));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      for (const ws of workspaces) {
        const existing = await this.prismaClient.workspaceMembership.findFirst({
          where: { userId, workspaceId: ws.id },
          select: { id: true },
        });
        if (existing) continue;

        await this.prismaClient.workspaceMembership.create({
          data: {
            userId,
            workspaceId: ws.id,
            role: 'specialist', // Partner mặc định là specialist trong workspace
            isActive: true,
          },
        });
      }
```
</details>


