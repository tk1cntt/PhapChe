# Review: `src/lib/admin/users.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 3

---

## 🔴 Critical (2)

**🐛 Bug** · lines 124-137

The `upsert` in `updateAdminUserRole` does not update the `role` field in the `update` clause. When a user already has a membership with a different role, the `updateMany` deactivates it, then the `upsert` reactivates it via `{ isActive: true }` but leaves the old role intact. The new role is never applied to existing memberships.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const membership = await tx.workspaceMembership.upsert({
      where: {
        userId_workspaceId: {
          userId: input.userId,
          workspaceId: input.workspaceId,
        },
      },
      update: { isActive: true, role: input.role },
      create: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        role: input.role,
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const membership = await tx.workspaceMembership.upsert({
      where: {
        userId_workspaceId: {
          userId: input.userId,
          workspaceId: input.workspaceId,
        },
      },
      update: { isActive: true },
      create: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        role: input.role,
      },
    });
```
</details>

---

**🐛 Bug** · lines 124-137

The `upsert` in `assignUserToWorkspace` does not update the `role` field in the `update` clause. If the user already has an active membership in the workspace with a different role, the role will not be changed to the new one — only `isActive` is set to `true`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const membership = await tx.workspaceMembership.upsert({
      where: {
        userId_workspaceId: {
          userId: input.userId,
          workspaceId: input.workspaceId,
        },
      },
      update: { isActive: true, role: input.role },
      create: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        role: input.role,
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const membership = await tx.workspaceMembership.upsert({
      where: {
        userId_workspaceId: {
          userId: input.userId,
          workspaceId: input.workspaceId,
        },
      },
      update: { isActive: true },
      create: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        role: input.role,
      },
    });
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 160-163

`deactivateAdminUser` sets `user.isActive = false` but does not deactivate the user's workspace memberships. This leaves orphaned active memberships for an inactive user, which can cause data inconsistency — e.g., membership-based access checks may still pass for a deactivated user.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    await tx.workspaceMembership.updateMany({
      where: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        isActive: true,
      },
      data: { isActive: false },
    });

    const user = await tx.user.update({
      where: { id: input.userId },
      data: { isActive: false },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const user = await tx.user.update({
      where: { id: input.userId },
      data: { isActive: false },
    });
```
</details>


