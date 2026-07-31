# Review: `src/app/api/settings/notifications/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 7

---

## 🟠 High (1)

**🐛 Bug** · lines 42-47

Fragile authentication error detection via string comparison. Relying on `error.message === 'UNAUTHENTICATED'` is brittle — if `requireAppSession` ever changes its error message format (e.g., wraps it, adds context, or uses a different string), authentication failures will silently fall through to the 500 branch, leaking internal errors and incorrectly treating unauthenticated requests as server errors. Consider using a custom error class (e.g., `instanceof UnauthenticatedError`) or an error code property instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (error instanceof UnauthenticatedError) {
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


## 🟡 Medium (4)

**🐛 Bug** · lines 71-79

Non-boolean values are silently ignored without any feedback to the client. If a client sends `"true"` (string), `1` (number), or `null`, the field is simply skipped with no error. The client would receive a 200 response with only the successfully-processed fields, unaware that some fields were rejected. This can lead to data integrity issues where the client believes their preference was saved when it was not. Consider returning a 400 error with a descriptive message when invalid types are detected.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const errors: string[] = [];
    if (emailOnReply !== undefined && typeof emailOnReply !== 'boolean') {
      errors.push('emailOnReply must be a boolean');
    } else if (typeof emailOnReply === 'boolean') {
      preferences.emailOnReply = emailOnReply;
    }
    if (slaReminder !== undefined && typeof slaReminder !== 'boolean') {
      errors.push('slaReminder must be a boolean');
    } else if (typeof slaReminder === 'boolean') {
      preferences.slaReminder = slaReminder;
    }
    if (weeklySummary !== undefined && typeof weeklySummary !== 'boolean') {
      errors.push('weeklySummary must be a boolean');
    } else if (typeof weeklySummary === 'boolean') {
      preferences.weeklySummary = weeklySummary;
    }
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: errors.join('; ') },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (typeof emailOnReply === 'boolean') {
      preferences.emailOnReply = emailOnReply;
    }
    if (typeof slaReminder === 'boolean') {
      preferences.slaReminder = slaReminder;
    }
    if (typeof weeklySummary === 'boolean') {
      preferences.weeklySummary = weeklySummary;
    }
```
</details>

---

**🐛 Bug** · lines 61-62

No validation that the request body is actually a plain object. If a client sends a JSON array (`[]`), a primitive (`"string"`, `123`), or `null`, destructing `emailOnReply`, `slaReminder`, `weeklySummary` from the body will yield `undefined` for all fields, the upsert will still proceed (creating default preferences if no record exists), and the client receives a 200 with no indication of a problem. Add a guard to check that the parsed body is a non-null object.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const body = await request.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }
    const { emailOnReply, slaReminder, weeklySummary } = body;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await request.json();
    const { emailOnReply, slaReminder, weeklySummary } = body;
```
</details>

---

**🐛 Bug**

Malformed JSON in the request body causes a generic 500 error instead of a 400 Bad Request. The `request.json()` call can throw a `SyntaxError` if the body is not valid JSON, but this falls into the catch-all handler, returning a misleading 500. Consider wrapping `request.json()` in its own try-catch to return a 400 with a clear validation message.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const body = await request.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
```
</details>

---

**🐛 Bug** · lines 81-82

When no valid boolean fields are provided (empty body or all fields invalid), `preferences` will be an empty object `{}`, and the upsert `update` parameter will be `{}`. This may cause Prisma to throw an error or behave unexpectedly (e.g., doing nothing silently). Consider returning a 400 if no valid fields are present.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // If no valid fields were provided, return an error
    if (Object.keys(preferences).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'At least one valid preference field must be provided' },
        { status: 400 }
      );
    }

    // Upsert preferences
    const updatedPreferences = await prisma.userPreferences.upsert({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Upsert preferences
    const updatedPreferences = await prisma.userPreferences.upsert({
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 42-52

The `GET` route returns `UNAUTHORIZED` in the response body but the internal error check uses `UNAUTHENTICATED`. While these convey different semantics (authentication vs. authorization), the mismatch between the internal error message and the API response code is confusing for maintainers. The same pattern is duplicated in both `GET` and `PUT` handlers — consider extracting the error-handling logic into a shared helper to reduce duplication.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHENTICATED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'Failed to fetch preferences' },
      { status: 500 }
    );
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

    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'Failed to fetch preferences' },
      { status: 500 }
    );
```
</details>

---

**🔧 Maintainability** · lines 38-53

The error handling logic (authentication check + generic 500 fallback) is duplicated verbatim across both `GET` and `PUT` handlers. Consider extracting this into a shared helper function to reduce duplication and ensure consistent error handling across all routes.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Get notification preferences failed:', message);

    if (message === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'FETCH_FAILED', message: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
```
</details>


