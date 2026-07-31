# Review: `src/app/api/messages/[requestId]/read/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (1)

**🔒 Security** · lines 25-38

Implicit authorization — the endpoint does not verify the user is a participant of the legal request. If an attacker or buggy client sends a requestId the user doesn't belong to, `updateMany` silently matches 0 rows and returns 200 with `markedCount: 0`. This masks authorization failures and client errors. Consider verifying the user is a participant of the legal request first (e.g., by querying the legal request with the user's ID), and returning 403/404 if they are not authorized.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Verify the user is a participant of this legal request
    const legalRequest = await prisma.legalRequest.findFirst({
      where: {
        id: requestId,
        OR: [
          { creatorId: userId },
          { recipientId: userId },
        ],
      },
    });

    if (!legalRequest) {
      return NextResponse.json(
        { error: 'Legal request not found or access denied' },
        { status: 404 }
      );
    }

    // Mark all unread messages in this thread where user is recipient as read
    const result = await prisma.message.updateMany({
      where: {
        legalRequestId: requestId,
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Mark all unread messages in this thread where user is recipient as read
    const result = await prisma.message.updateMany({
      where: {
        legalRequestId: requestId,
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 18-23

Input validation is limited to a truthiness check. An extremely long or malformed `requestId` string could pass through, causing unnecessary database load. Consider adding a format/length validation (e.g., UUID regex check, or a max length constraint) to reject obviously invalid inputs early.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!requestId || typeof requestId !== 'string' || requestId.length > 100) {
      return NextResponse.json(
        { error: 'Invalid requestId' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId' },
        { status: 400 }
      );
    }
```
</details>

---

**🔧 Maintainability** · lines 39-45

The error log lacks request-specific identifiers (`requestId`, `userId`), making it difficult to correlate logs with failing requests in production. Consider including the `requestId` in the log message.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    const { requestId } = await params;
    console.error('Error marking messages as read:', { requestId, userId, error });
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
```
</details>


