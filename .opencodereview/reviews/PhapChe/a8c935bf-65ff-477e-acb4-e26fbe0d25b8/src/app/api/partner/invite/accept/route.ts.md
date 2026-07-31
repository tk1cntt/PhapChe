# Review: `src/app/api/partner/invite/accept/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟡 Medium (2)

**🔒 Security** · lines 27-35

Token is only checked for truthiness but not validated as a non-empty string. Malicious or malformed input (arrays, objects, numbers, booleans) can pass this check and reach the service layer, potentially causing unexpected behavior or bypassing validation logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invite token is required' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invite token is required' },
        { status: 400 }
      );
    }
```
</details>

---

**🔒 Security** · lines 40-45

Returning `result.error` directly to the client may leak internal implementation details (e.g., database error messages, stack traces, or service internals). Prefer returning a generic user-facing message while logging the actual error server-side.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (!result.success) {
      console.error('Accept invite failed:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to accept invite' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
```
</details>


## 🔵 Low (1)

**📚 Documentation** · lines 1-7

The comment says this is a "public endpoint" but the implementation requires authentication. This is contradictory and may cause confusion about access control expectations. Consider clarifying: "This endpoint is public-facing but requires a valid user session."

<details>
<summary>:bulb: Suggestion</summary>

```typescript
/**
 * Partner Accept Invite API
 * POST /api/partner/invite/accept - Accept an invite
 *
 * This endpoint is public-facing but requires authentication.
 * The user must be logged in to accept an invite.
 */
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
/**
 * Partner Accept Invite API
 * POST /api/partner/invite/accept - Accept an invite (public endpoint)
 *
 * This endpoint is public but requires a valid session.
 * The user must be logged in to accept an invite.
 */
```
</details>


