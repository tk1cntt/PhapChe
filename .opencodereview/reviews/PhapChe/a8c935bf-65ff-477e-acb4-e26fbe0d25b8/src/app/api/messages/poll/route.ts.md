# Review: `src/app/api/messages/poll/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 9

---

## 🟠 High (1)

**🐛 Bug** · line 88

`senderName` is incorrectly set to `msg.senderId` (a UUID) instead of the sender's actual name. The `findMany` query for messages does not include the sender relation, so the sender's name is not available. This will display raw UUIDs in the UI as sender names.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          // NOTE: sender name not available without include: { sender: { select: { name: true } } }
          senderName: null,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          senderName: msg.senderId,
```
</details>


## 🟡 Medium (4)

**🔧 Maintainability** · line 78

Using `any` type is prohibited. The message type should be explicitly defined. Consider defining a `PollMessage` interface or using the Prisma-generated type for the message object.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    interface PollMessage {
      id: string;
      content: string;
      senderId: string;
      senderName: string | null;
      isOutgoing: boolean;
      createdAt: Date;
    }
    const messagesByThread: Record<string, PollMessage[]> = {};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const messagesByThread: Record<string, any[]> = {};
```
</details>

---

**⚡ Performance** · lines 54-68

The two `prisma` queries (`recentThreads` and `newMessages`) are independent of each other and can be executed in parallel with `Promise.all` to reduce total response time.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const [recentThreads, newMessages] = await Promise.all([
      prisma.legalRequest.findMany({
        where: {
          workspaceId: activeWorkspaceId,
          updatedAt: { gte: sinceDate },
        },
        include: {
          createdBy: { select: { name: true } },
          assignedSpecialist: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      prisma.message.findMany({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const recentThreads = await prisma.legalRequest.findMany({
      where: {
        workspaceId: activeWorkspaceId,
        updatedAt: { gte: sinceDate },
      },
      include: {
        createdBy: { select: { name: true } },
        assignedSpecialist: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    // Fetch new messages
    const newMessages = await prisma.message.findMany({
```
</details>

---

**🐛 Bug** · line 51

No validation of the `since` query parameter format. `new Date(since)` with an invalid date string will produce an `Invalid Date` object, and subsequent queries using `{ gte: sinceDate }` will silently return incorrect or empty results.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid since parameter format' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const sinceDate = new Date(since);
```
</details>

---

**🐛 Bug** · line 114

`isRead` is hardcoded to `true` for every thread. This means all threads will always appear as read regardless of whether the current user has actually read them. This should be derived from actual read-status data.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // TODO: derive from actual read status (e.g., compare req.updatedAt to user's lastReadAt)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      isRead: true,
```
</details>


## 🔵 Low (4)

**🔧 Maintainability** · line 60

The `createdBy` relation is included in the `recentThreads` query but its data is never used in the transformation below. This is dead code that adds unnecessary database load.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // Remove unused include, or use createdBy.name in the threads mapping below
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        createdBy: { select: { name: true } },
```
</details>

---

**🐛 Bug** · line 104

`specialistStatus` is hardcoded to `'online'` for every specialist. This will incorrectly show all specialists as online even when they are not.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // TODO: derive from actual specialist presence/status data
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      specialistStatus: 'online' as const,
```
</details>

---

**🔧 Maintainability** · lines 106-108

The `preview` computation uses `newMessages.find()` inside a `map`, resulting in O(n*m) complexity. While n is capped at 20, building a lookup map first would be cleaner and more efficient.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Build a lookup map outside the map:
      // const latestMsgByThread: Record<string, string> = {};
      // newMessages.forEach((m) => { if (m.legalRequestId && m.senderId !== userId) { latestMsgByThread[m.legalRequestId] = m.content; } });
      preview: /* lookup from map */ latestMsgByThread[req.id] ?? 'Tin nhắn mới',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      preview: newMessages.find(
        (m) => m.legalRequestId === req.id && m.senderId !== userId
      )?.content ?? 'Tin nhắn mới',
```
</details>

---

**🔧 Maintainability** · line 42

The `workspaceSlug` variable is extracted from the query parameters but is never used in the function body. This is dead code and may indicate an incomplete implementation or leftover from a refactor.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Remove this line if unused, or use workspaceSlug for filtering/logic
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const workspaceSlug = searchParams.get('workspace');
```
</details>


