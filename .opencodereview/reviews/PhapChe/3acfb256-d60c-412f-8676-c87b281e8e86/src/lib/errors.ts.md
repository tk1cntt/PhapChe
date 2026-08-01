# Review: `src/lib/errors.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 3

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 63-67

`isStructuredError` is exported but never used by any of the error handling functions in this module (`errorStatusCode`, `errorCode`, `safeErrorMessage`, `errorResponseBody`). These functions all rely solely on `isAppError`, meaning a plain-object throw like `throw { status: 404, error: 'NOT_FOUND' }` would be detected by `isStructuredError` but would still fall through to the 500/INTERNAL_ERROR fallback in every handler. Either integrate `isStructuredError` into the handler functions or remove it to avoid misleading consumers.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider using isStructuredError in errorStatusCode, errorCode, etc.
// e.g., in errorStatusCode:
// if (isStructuredError(value)) return value.status;
export function isStructuredError(value: unknown): value is { status: number; error: string; detail?: string; message?: string } {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.status === 'number' && typeof obj.error === 'string';
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function isStructuredError(value: unknown): value is { status: number; error: string; detail?: string; message?: string } {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.status === 'number' && typeof obj.error === 'string';
}
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 33-36

The magic strings `'INTERNAL_ERROR'` and `'Internal server error'` are repeated in `errorCode`, `safeErrorMessage`, and `errorResponseBody`. Consider extracting them as module-level constants to avoid drift and make updates easier.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const FALLBACK_ERROR_CODE = 'INTERNAL_ERROR';
const FALLBACK_ERROR_MESSAGE = 'Internal server error';

export function errorCode(value: unknown): string {
  if (isAppError(value)) return value.error;
  return FALLBACK_ERROR_CODE;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function errorCode(value: unknown): string {
  if (isAppError(value)) return value.error;
  return 'INTERNAL_ERROR';
}
```
</details>

---

**🔧 Maintainability** · lines 45-51

`errorResponseBody` has a side effect (`console.error`) despite its name and JSDoc suggesting it is a pure data-transformation function ("Build a sanitized JSON response body"). Logging should be handled separately by the caller, or the function name should reflect that it also logs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function errorResponseBody(value: unknown): { error: string; detail?: string } {
  if (isAppError(value)) {
    return { error: value.error, detail: value.detail };
  }
  // Logging is intentionally left to the caller so this function remains a pure transformation.
  return { error: 'INTERNAL_ERROR', detail: 'Internal server error' };
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function errorResponseBody(value: unknown): { error: string; detail?: string } {
  if (isAppError(value)) {
    return { error: value.error, detail: value.detail };
  }
  console.error('Unhandled error:', value instanceof Error ? value.message : String(value));
  return { error: 'INTERNAL_ERROR', detail: 'Internal server error' };
}
```
</details>


