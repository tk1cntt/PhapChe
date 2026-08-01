# Review: `src/lib/api/client.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 6

---

## 🔴 Critical (1)

**🐛 Bug** · lines 55-57

Default `baseUrl` is an empty string (`''`), which causes `new URL(endpoint, '')` to throw a `TypeError` because an empty string is not a valid base URL. The singleton `apiClient` is created with no argument, so **every API call will fail immediately** before any request is sent.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  constructor(baseUrl: string = '/') {
    this.baseUrl = baseUrl;
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
```
</details>


## 🟠 High (2)

**🐛 Bug** · line 113

Template literal is using single quotes instead of backticks, so `${response.status}` is never interpolated. The error message will be the literal string `"HTTP ${response.status}"` instead of e.g. `"HTTP 404"`, making debugging and error handling much harder.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const error = new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const error = new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
```
</details>

---

**🐛 Bug** · line 102

`response.json()` is called unconditionally without checking the `Content-Type` header. If the server returns a non-JSON response (e.g. HTML error page from a reverse proxy, or plain text), `response.json()` will throw a `SyntaxError`/`TypeError`, losing the original HTTP status code and meaningful error information. The caller receives a generic parse error instead of the actual HTTP error.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          const error = new Error(`Unexpected content type: ${contentType}`);
          handleError(response.status, error);
        }
        const data = await response.json() as T | ErrorResponse;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        const data = await response.json() as T | ErrorResponse;
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · line 89

Off-by-one in retry loop: `attempt <= maxRetries` with `maxRetries = 3` means the loop runs 4 times (attempts 0, 1, 2, 3). The comment says "max retries 3" and `retryDelays` has only 3 entries, but the initial attempt plus 3 retries = 4 total attempts. Either change the condition to `attempt < maxRetries` or rename `maxRetries` to `maxAttempts`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    for (let attempt = 0; attempt < maxRetries; attempt++) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
```
</details>

---

**🐛 Bug** · lines 85-87

`process.env.NODE_ENV` is a Node.js-specific global. In browser environments without a bundler that injects it (e.g. Next.js/Turbopack/Webpack), accessing `process.env` will throw a `ReferenceError` and crash the client before any request is made. Consider using a bundler-provided compile-time constant or guarding with `typeof process !== 'undefined'`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.debug(`[API] ${method} ${url.toString()}`);
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${method} ${url.toString()}`);
    }
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 34-47

The `handleError` function accepts an `error: Error` parameter but only uses it to re-throw. The error message is never surfaced in the toast notifications or logged. This means the caller receives the error object, but the user-facing toast messages are generic and don't include the actual error detail. Consider logging the error or including the detail in the toast.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function handleError(status: number, error: Error): never {
  if (status === 401 && typeof window !== 'undefined') {
    // Avoid redirect loop if already on login page
    if (!window.location.pathname.startsWith('/login')) {
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnPath)}`;
    }
  } else if (status === 403) {
    toastError('Không có quyền truy cập');
  } else if (status === 500) {
    toastError('Lỗi máy chủ, vui lòng thử lại');
  } else {
    console.error(`[API] HTTP ${status}: ${error.message}`);
  }
  throw error;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function handleError(status: number, error: Error): never {
  if (status === 401 && typeof window !== 'undefined') {
    // Avoid redirect loop if already on login page
    if (!window.location.pathname.startsWith('/login')) {
      const returnPath = window.location.pathname + window.location.search;
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnPath)}`;
    }
  } else if (status === 403) {
    toastError('Không có quyền truy cập');
  } else if (status === 500) {
    toastError('Lỗi máy chủ, vui lòng thử lại');
  }
  throw error;
}
```
</details>


