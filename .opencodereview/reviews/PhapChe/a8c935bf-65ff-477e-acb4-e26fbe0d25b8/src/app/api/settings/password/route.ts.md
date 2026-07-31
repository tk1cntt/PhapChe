# Review: `src/app/api/settings/password/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (1)

**🔒 Security** · lines 71-80

Missing session invalidation after password change. After a successful password update, all existing sessions for this user (including the current one) should be revoked/invalidated. Without this, if an attacker gained access to a session, they could change the password but still retain access via their existing session. Consider calling a session invalidation mechanism (e.g., revoking all refresh tokens or clearing session stores) after the password update succeeds.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Update account with new password
    await prisma.account.update({
      where: { id: account.id },
      data: { password: newHash }
    });

    // Invalidate all existing sessions for this user after password change
    // e.g., await invalidateUserSessions(userId);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Update account with new password
    await prisma.account.update({
      where: { id: account.id },
      data: { password: newHash }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
```
</details>


## 🟡 Medium (3)

**🔧 Maintainability** · lines 82-91

Fragile error handling: the catch block relies on a hardcoded string comparison `message === 'UNAUTHENTICATED'` to detect authentication failures from `requireAppSession()`. If the error message changes in `requireAppSession`, this check silently breaks and the user would receive a generic 500 error instead of a 401. Consider using a custom error class (e.g., `UnauthenticatedError`) or a structured error code that can be checked via `instanceof` or a dedicated error property.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    // Prefer a custom error class or error code property from requireAppSession
    // instead of fragile string comparison on the message.
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error('Password change failed:', message);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Password change failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }
```
</details>

---

**🐛 Bug** · lines 38-41

Using `findFirst` without an `orderBy` clause is ambiguous when a user has multiple accounts with passwords. If more than one account record exists for the same `userId` with a non-null password, `findFirst` may return an arbitrary one (database-dependent), causing the password update to be applied to the wrong account. Consider using `findUnique` if the combination of `userId` + password-bearing account should be unique, or add an explicit `orderBy` (e.g., by `createdAt`) to ensure deterministic selection.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Find account with password — use deterministic ordering if multiple may exist
    const account = await prisma.account.findFirst({
      where: { userId, password: { not: null } },
      orderBy: { createdAt: 'asc' }
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Find account with password
    const account = await prisma.account.findFirst({
      where: { userId, password: { not: null } }
    });
```
</details>

---

**🔒 Security** · lines 68-69

bcrypt has a maximum input length of 72 bytes. Passwords longer than 72 bytes are silently truncated before hashing, which means a user could set a very long password that is effectively shorter than expected. Consider adding a maximum length check on `newPassword` (e.g., 72 bytes or 128 characters) and returning a validation error if exceeded, to prevent silent truncation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // bcrypt truncates input at 72 bytes; enforce a limit to prevent silent truncation
    if (newPassword.length > 128) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'New password exceeds maximum length' },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await hash(newPassword, 10);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Hash new password
    const newHash = await hash(newPassword, 10);
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 86-91

Error code mismatch: the catch block checks for `'UNAUTHENTICATED'` but returns `'UNAUTHORIZED'` as the error code. While HTTP 401 is technically about authentication (not authorization), the inconsistency between the checked string and the response code is confusing. Align these to use consistent terminology.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Authentication required' },
        { status: 401 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }
```
</details>


