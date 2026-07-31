# Review: `src/app/api/messages/unread-count/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 1

---

## 🟠 High (1)

**🐛 Bug** · lines 5-25

The `requireAppSession()` call is wrapped inside a `try/catch` block. When `requireAppSession` fails (e.g., unauthenticated user or no active memberships), it calls `redirect()` from `next/navigation`, which throws a `NEXT_REDIRECT` error. Catching this error prevents the framework from handling the redirect, and instead the catch block returns a 500 error. The user will not be redirected to the sign-in page as intended.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function GET() {
  const session = await requireAppSession();
  const { userId } = session;

  try {
    const count = await prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread message count.' },
      { status: 500 }
    );
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function GET() {
  try {
    const session = await requireAppSession();
    const { userId } = session;

    const count = await prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread message count.' },
      { status: 500 }
    );
  }
}
```
</details>


