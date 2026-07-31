# Review: `src/app/api/messages/[requestId]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟠 High (1)

**🔒 Security** · lines 18-23

Missing authorization check on the legal request. The endpoint does not verify that the authenticated user has access to the request identified by `requestId`. An attacker who knows or can guess a `requestId` can read messages from any legal request, regardless of workspace membership.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Verify the legal request exists and belongs to the user's workspace
    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        id: requestId,
        ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
      },
      select: { id: true },
    });

    if (!legalRequest) {
      return NextResponse.json(
        { error: 'Legal request not found' },
        { status: 404 }
      );
    }

    // Fetch messages for this thread
    const messages = await prisma.message.findMany({
      where: {
        legalRequestId: requestId,
        ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Fetch messages for this thread
    const messages = await prisma.message.findMany({
      where: {
        legalRequestId: requestId,
        ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
      },
```
</details>


## 🟡 Medium (1)

**🔒 Security** · lines 19-23

The workspace filter is conditionally applied via spread. If `activeWorkspaceId` is null/undefined (e.g., due to a session edge case), the workspace scope is silently dropped, allowing cross-workspace message access. Consider making the workspace filter mandatory or returning an error when `activeWorkspaceId` is missing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!activeWorkspaceId) {
      return NextResponse.json(
        { error: 'No active workspace' },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        legalRequestId: requestId,
        workspaceId: activeWorkspaceId,
      },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const messages = await prisma.message.findMany({
      where: {
        legalRequestId: requestId,
        ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
      },
```
</details>


## 🔵 Low (1)

**🔒 Security** · line 42

When a sender's name is not found in the user lookup, the raw `senderId` is exposed to the client as a fallback. This leaks internal user identifiers. Consider using a generic label like "Unknown User" instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      senderName: userMap.get(msg.senderId) || 'Unknown User',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      senderName: userMap.get(msg.senderId) || msg.senderId,
```
</details>


