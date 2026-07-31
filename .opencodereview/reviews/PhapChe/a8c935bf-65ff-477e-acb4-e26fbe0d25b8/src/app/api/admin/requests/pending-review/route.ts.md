# Review: `src/app/api/admin/requests/pending-review/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (1)

**🐛 Bug** · lines 104-107

Error handling masks authentication errors: The catch block at line 72-75 returns a generic 500 INTERNAL_ERROR for all exceptions, including those thrown by `requireAppSession()` (e.g., when the session is invalid or expired). This misleads the client — a 401 Unauthorized or 403 Forbidden error gets swallowed and reported as 500, which violates REST semantics and prevents the client from taking appropriate action (e.g., redirecting to login). Consider re-throwing or handling known auth errors explicitly before the generic catch.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    // Re-throw authentication/authorization errors so Next.js can handle them properly
    if (error instanceof Error && 'statusCode' in error) {
      const statusCode = (error as { statusCode: number }).statusCode;
      if (statusCode === 401 || statusCode === 403) {
        return NextResponse.json({ error: error.message }, { status: statusCode });
      }
    }
    console.error('Pending-review API error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    console.error('Pending-review API error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · line 25

Search input is not trimmed: The `search` parameter from `searchParams.get('search')` is used directly in the Prisma query without calling `.trim()`. Leading or trailing whitespace from user input (e.g., a copy-paste with trailing space) will be included in the database `contains` filter, likely producing zero results and confusing the user.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const search = (searchParams.get('search') || '').trim();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const search = searchParams.get('search') || '';
```
</details>

---

**🔒 Security** · line 105

Sensitive data may be logged: `console.error('Pending-review API error:', error)` logs the entire error object. In production, this could expose stack traces, database connection strings, internal paths, or other sensitive details. Consider logging only the error message or a sanitized version.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    console.error('Pending-review API error:', error instanceof Error ? error.message : 'Unknown error');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Pending-review API error:', error);
```
</details>

---

**🐛 Bug** · lines 27-30

Ambiguous authorization logic for dual-role users: A user who holds both `reviewer` and an admin role (e.g., `super_admin`) will bypass the `assignedReviewerId` filter due to `isReviewer && !isAdmin`. This means they see ALL pending_review requests, not just their own assigned ones. While this may be intentional for admins, if the business intent is that admins who are also reviewers should still see their own assigned queue by default, this behavior is incorrect. Consider adding a comment to clarify intent or splitting the logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Admins see all pending requests; pure reviewers see only their assigned requests
    const where: Record<string, unknown> = {
      ...(isReviewer && !isAdmin ? { assignedReviewerId: session.userId } : {}),
      status: 'pending_review',
    };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const where: Record<string, unknown> = {
      ...(isReviewer && !isAdmin ? { assignedReviewerId: session.userId } : {}),
      status: 'pending_review',
    };
```
</details>


## 🔵 Low (1)

**🐛 Bug** · line 77

Potential `slice` failure on short IDs: `r.id.slice(-6)` assumes `r.id` has at least 6 characters. If `r.id` is shorter than 6 characters (e.g., an auto-increment integer stored as a short string), `slice(-6)` returns the entire string, which is fine. However, if `r.id` is ever empty or undefined, this would throw. Consider adding a length guard or using `r.id?.slice(-6) ?? 'UNKNOWN'`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      code: r.code ?? `REQ-${(r.id ?? '').slice(-6)}`,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      code: r.code ?? `REQ-${r.id.slice(-6)}`,
```
</details>


