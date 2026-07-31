# Review: `src/app/api/settings/language/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟠 High (2)

**🐛 Bug** · lines 47-52

Fragile authentication error detection: The catch block relies on exact string matching (`message === 'UNAUTHENTICATED'`) to detect auth failures from `requireAppSession`. If the library changes its error message, wraps it in a custom error type, or uses an error code instead, this check will silently fail and return a misleading 500 instead of 401. Consider using a dedicated error class (e.g., `instanceof AuthenticationError`) or a structured error code from the session library.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (error instanceof AuthenticationError || (error as any).code === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
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

---

**🐛 Bug** · lines 32-36

Missing Prisma `P2025` (record not found) handling: If the user was deleted between session creation and this update call, `prisma.user.update` throws a `PrismaClientKnownRequestError` with code `P2025`. This is caught by the generic catch block and returns a 500 error, when it should return a 401 (session invalid) or 404 (user not found).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Update user locale
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { locale }
      });
    } catch (updateError) {
      if (updateError instanceof Prisma.PrismaClientKnownRequestError && updateError.code === 'P2025') {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'User no longer exists' },
          { status: 401 }
        );
      }
      throw updateError;
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Update user locale
    await prisma.user.update({
      where: { id: userId },
      data: { locale: locale as string }
    });
```
</details>


## 🟡 Medium (1)

**🐛 Bug** · lines 14-15

Malformed JSON body returns 500 instead of 400: If `request.json()` fails due to an empty or malformed body, the error is caught by the generic catch block and returns a 500. This should be a 400 Bad Request since it's a client error.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    const { locale } = body;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await request.json();
    const { locale } = body;
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 44-45

Error logging loses the original stack trace: Only `error.message` is logged via `console.error`, which discards the full error object and stack trace, making production debugging significantly harder.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    console.error('Language update failed:', error);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const message = error instanceof Error ? error.message : String(error);
    console.error('Language update failed:', message);
```
</details>


