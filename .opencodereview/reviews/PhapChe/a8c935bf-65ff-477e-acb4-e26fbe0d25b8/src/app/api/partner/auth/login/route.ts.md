# Review: `src/app/api/partner/auth/login/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟡 Medium (3)

**🐛 Bug** · lines 84-87

The `session` variable from `auth.api.getSession()` is declared but never used. The call is made but its result is discarded — this is dead code that wastes a database/network call. If the intent was to include session info in the response, the `session` variable should be used. Otherwise, remove the call entirely.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Remove unused getSession call — session is already established by signInEmail above
    // If session token is needed, use the result:
    // const session = await auth.api.getSession({ headers: req.headers });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Generate session token (using better-auth session)
    const session = await auth.api.getSession({
      headers: req.headers,
    });
```
</details>

---

**🔧 Maintainability** · lines 15-16

`body` is typed as `any` because `req.json()` returns `Promise<any>`. This means `email` and `password` are untyped, defeating TypeScript safety. Define an explicit interface and use a type assertion to catch shape mismatches early.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const body: unknown = await req.json();
    const { email, password } = body as { email?: string; password?: string };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await req.json();
    const { email, password } = body;
```
</details>

---

**🐛 Bug** · lines 15-19

If `req.json()` succeeds but returns `null` or `undefined` (e.g., empty body), destructuring on line 19 will throw a TypeError. The surrounding try/catch will catch it, but it produces a misleading generic 'Login failed' message instead of a proper 400 Bad Request.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 90-91

Magic number: the 7-day session expiry is hardcoded. Consider extracting this to a named constant or configuration value so it can be changed consistently across the application.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const SESSION_EXPIRY_DAYS = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
```
</details>


