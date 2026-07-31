# Review: `src/app/api/settings/profile/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟡 Medium (2)

**🐛 Bug** · lines 29-36

Email regex validation is applied **before** trimming, so a valid email like `'  user@example.com  '` (with leading/trailing spaces) will fail with "Invalid email format". This is confusing for users who may copy-paste emails with surrounding whitespace. The regex should be applied to the trimmed email instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Validate email format (trim first to accept emails with surrounding whitespace)
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid email format' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid email format' },
        { status: 400 }
      );
    }
```
</details>

---

**🐛 Bug** · line 12

The `timezone` field is accepted as any arbitrary string without validation. Invalid timezone values (e.g., `'not-a-timezone'`, `'GMT+5'`) will be stored directly in the database, causing downstream issues when the timezone is consumed by date/time libraries. Consider validating against a known list of IANA timezone identifiers (e.g., using `Intl.supportedValuesOf('timeZone')` or a whitelist).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const { name, email, phone, title, timezone } = body;

    // Validate timezone if provided
    const VALID_TIMEZONES = new Set(Intl.supportedValuesOf?.('timeZone') ?? []);
    if (timezone && !VALID_TIMEZONES.has(timezone)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid timezone' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const { name, email, phone, title, timezone } = body;
```
</details>


## 🔵 Low (2)

**🐛 Bug** · lines 48-50

The transaction error thrown for email conflicts sets `error: 'VALIDATION_ERROR'` but does **not** set `detail`, so the user-friendly message `'Email is already in use'` (stored in `error.message`) is lost in the response. The `isStructuredError` handler returns `{ error: error.error, detail: error.detail }`, which produces `{ error: 'VALIDATION_ERROR' }` — missing the helpful explanation. Use `appError(400, 'VALIDATION_ERROR', 'Email is already in use')` from the errors module, or set `detail` explicitly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      if (existingUser) {
        throw Object.assign(new Error('Email is already in use'), { status: 400, error: 'VALIDATION_ERROR', detail: 'Email is already in use' });
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      if (existingUser) {
        throw Object.assign(new Error('Email is already in use'), { status: 400, error: 'VALIDATION_ERROR' });
      }
```
</details>

---

**🔧 Maintainability** · lines 14-20

No length validation on `name`, `title`, or `phone`. A user could submit excessively long strings (e.g., 10KB+), which could cause database storage issues or degrade performance. Consider adding max-length constraints consistent with the database schema.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 255) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Name is too long' },
        { status: 400 }
      );
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Name is required' },
        { status: 400 }
      );
    }
```
</details>


