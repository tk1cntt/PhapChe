# Review: `src/app/api/messages/send/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (1)

**🔒 Security** · lines 41-50

Missing workspace authorization check. The code fetches the legal request's `workspaceId` but never verifies it matches the user's `activeWorkspaceId`. A user could send messages to legal requests belonging to other workspaces by guessing or enumerating `threadId` values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Verify the request belongs to the user's active workspace
    if (legalRequest.workspaceId !== activeWorkspaceId) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Authorization: sender must be creator, specialist, or reviewer of the request
    const isAuthorized =
      userId === legalRequest.createdById ||
      userId === legalRequest.assignedSpecialistId;
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Authorization: sender must be creator, specialist, or reviewer of the request
    const isAuthorized =
      userId === legalRequest.createdById ||
      userId === legalRequest.assignedSpecialistId;
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      );
    }
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 41-44

Authorization comment mentions 'reviewer' but the check only validates creator and specialist. Either the comment is misleading or the reviewer role check is missing. If reviewers should be able to send messages, this is a functional bug.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Authorization: sender must be creator, specialist, or reviewer of the request
    const isAuthorized =
      userId === legalRequest.createdById ||
      userId === legalRequest.assignedSpecialistId;
    // TODO: also check reviewer role if applicable
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Authorization: sender must be creator, specialist, or reviewer of the request
    const isAuthorized =
      userId === legalRequest.createdById ||
      userId === legalRequest.assignedSpecialistId;
```
</details>

---

**🐛 Bug** · lines 52-68

When the creator sends a message but no specialist is assigned (`assignedSpecialistId` is null), `recipientId` falls back to empty string via `?? ''`. This creates a message with no valid recipient, which is likely a silent data integrity issue. Consider returning an error or allowing `recipientId` to be null when no specialist exists.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Determine recipient (if user is customer, send to specialist; if specialist, send to customer)
    const recipientId =
      userId === legalRequest.createdById
        ? legalRequest.assignedSpecialistId
        : legalRequest.createdById;

    if (!recipientId) {
      return NextResponse.json(
        { error: 'No recipient available – no specialist assigned yet' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        workspaceId: activeWorkspaceId ?? '',
        senderId: userId,
        recipientId,
        legalRequestId: threadId,
        isRead: false,
      },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Determine recipient (if user is customer, send to specialist; if specialist, send to customer)
    const recipientId =
      userId === legalRequest.createdById
        ? legalRequest.assignedSpecialistId
        : legalRequest.createdById;

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        workspaceId: activeWorkspaceId ?? '',
        senderId: userId,
        recipientId: recipientId ?? '',
        legalRequestId: threadId,
        isRead: false,
      },
    });
```
</details>

---

**🐛 Bug** · line 62

The message is created with `workspaceId: activeWorkspaceId ?? ''` from the session, but the legal request may have a different `workspaceId`. This could cause the message to be stored under a different workspace than its parent legal request, breaking data consistency. Use the legal request's own `workspaceId` instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        workspaceId: legalRequest.workspaceId,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        workspaceId: activeWorkspaceId ?? '',
```
</details>


## 🔵 Low (1)

**⚡ Performance** · lines 58-74

The `message.create` and `legalRequest.update` operations are independent and could run in parallel via `Promise.all` to reduce latency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Create message and update the request's updatedAt in parallel
    const [message] = await Promise.all([
      prisma.message.create({
        data: {
          content,
          workspaceId: activeWorkspaceId ?? '',
          senderId: userId,
          recipientId: recipientId ?? '',
          legalRequestId: threadId,
          isRead: false,
        },
      }),
      prisma.legalRequest.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        workspaceId: activeWorkspaceId ?? '',
        senderId: userId,
        recipientId: recipientId ?? '',
        legalRequestId: threadId,
        isRead: false,
      },
    });

    // Update the request's updatedAt
    await prisma.legalRequest.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });
```
</details>


