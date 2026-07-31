# Review: `src/app/api/workspaces/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟠 High (2)

**🔒 Security** · lines 9-16

The query returns all workspaces in the database without filtering by the authenticated user's memberships. Any authenticated user can see the full list of workspaces, including their member counts, regardless of whether they belong to them. This is a data exposure vulnerability — the session is obtained but never used to scope the query.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const workspaces = await prisma.workspace.findMany({
      where: {
        memberships: {
          some: { userId: session.userId },
        },
      },
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const workspaces = await prisma.workspace.findMany({
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
```
</details>

---

**🐛 Bug** · lines 28-30

The catch block maps all errors to a 401 'UNAUTHORIZED' response. If the database is unreachable or prisma throws any other error, the client receives a misleading 401 status with an authentication message, making debugging difficult and potentially causing incorrect client behavior (e.g., prompting the user to re-login when the real issue is a server error).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    if (error instanceof requireAppSession.Error) {
      return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
    }
    console.error('Failed to fetch workspaces:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: 'An unexpected error occurred' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED', detail: 'Authentication required' }, { status: 401 });
  }
```
</details>


