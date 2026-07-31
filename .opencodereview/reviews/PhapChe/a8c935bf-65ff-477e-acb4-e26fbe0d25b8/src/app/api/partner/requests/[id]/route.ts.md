# Review: `src/app/api/partner/requests/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · lines 19-22

Using `findFirst` without `orderBy` makes partner membership selection non-deterministic when a user is active in multiple partner organizations. This can cause the access check on line 43-44 to incorrectly deny access — the query may return partner A's membership, but the request belongs to partner B which the user is also a legitimate active member of. Add `orderBy: { createdAt: 'asc' }` (or another deterministic field) to ensure consistent behavior, or refactor to check all active memberships of the user.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Get all active partner memberships for the user
    const memberships = await prisma.partnerMember.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { partnerId: true },
    });

    if (memberships.length === 0) {
      return NextResponse.json({ error: 'FORBIDDEN', detail: 'Not a partner' }, { status: 403 });
    }

    const partnerIds = memberships.map(m => m.partnerId);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const member = await prisma.partnerMember.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { partnerId: true },
    });
```
</details>

---

**🐛 Bug** · lines 43-45

If the membership query above is refactored to return all active partner IDs, this access check must also be updated to use `partnerIds.includes(...)` instead of comparing against a single `member.partnerId`. Otherwise, a user with multiple active memberships may still be denied access.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Check permission - partner can access if assigned directly or via engagement
    const hasAccess = partnerIds.includes(request.assignedPartnerId) ||
      (request.engagement?.partnerId != null && partnerIds.includes(request.engagement.partnerId));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Check permission - partner can access if assigned directly or via engagement
    const hasAccess = request.assignedPartnerId === member.partnerId ||
      request.engagement?.partnerId === member.partnerId;
```
</details>


## 🟡 Medium (2)

**🔒 Security** · lines 32-34

The response exposes email addresses for `createdBy`, `assignedSpecialist`, and `assignedReviewer`. Verify that exposing these PII fields to partner users is intentional and complies with your data privacy requirements. If not needed for partner workflows, remove the `email` field from the select clauses.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        createdBy: { select: { id: true, name: true } },
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        createdBy: { select: { id: true, name: true, email: true } },
        assignedSpecialist: { select: { id: true, name: true, email: true } },
        assignedReviewer: { select: { id: true, name: true, email: true } },
```
</details>

---

**🔒 Security** · line 53

Logging the raw `error` object via `console.error` can leak sensitive information such as stack traces, database connection strings, or request payloads in production logs. Consider logging only a sanitized message (e.g., `error instanceof Error ? error.message : 'Unknown error'`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Partner request detail error:', message);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Partner request detail error:', error);
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 52

The `error` in the catch block is implicitly typed as `any` (or `unknown` in strict mode). Per TypeScript best practices, avoid `any`. If your tsconfig has `useUnknownInCatchVariables` enabled, add a type guard before accessing properties; otherwise, annotate explicitly as `unknown`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (err: unknown) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
```
</details>


