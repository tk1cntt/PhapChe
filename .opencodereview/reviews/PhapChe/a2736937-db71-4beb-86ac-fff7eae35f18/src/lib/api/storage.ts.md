# Review: `src/lib/api/storage.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 6

---

## 🟡 Medium (3)

**🔧 Maintainability** · lines 52-74

Inconsistent HTTP client usage: `uploadFile`, `downloadFile`, and `deleteFile` use raw `fetch` while `getFile` and `getAccessLogs` use `apiClient`. This means global interceptors (e.g., auth token refresh, CSRF tokens, centralized error logging) configured on `apiClient` are bypassed for these three operations. If `apiClient` supports Blob/FormData, consider using it consistently; otherwise, document why raw `fetch` is necessary for these endpoints.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Consider using apiClient for consistency, or document why raw fetch is needed:
// - uploadFile: apiClient may not support FormData natively; if so, add a comment
// - downloadFile: apiClient may handle blob responses; check if apiClient supports responseType
// - deleteFile: can trivially use apiClient.delete(`/api/files/${fileId}`)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function uploadFile(
  file: File,
  options: {
    organizationId: string;
    requestId?: string;
    category?: string;
    visibility?: string;
  }
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('organizationId', options.organizationId);
  if (options.requestId) {
    formData.append('requestId', options.requestId);
  }
  formData.append('category', options.category || 'request_upload');
  formData.append('visibility', options.visibility || 'private');

  const response = await fetch('/api/files', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
```
</details>

---

**🔧 Maintainability** · lines 76-79

Duplicated error handling pattern: the same `response.ok` check + `response.json().catch(() => ({ error: '...' }))` + `throw new Error(...)` logic is repeated 3 times in `uploadFile`, `downloadFile`, and `deleteFile`. Extract this into a shared helper (e.g., `handleResponse` or `assertOk`) to reduce duplication and ensure consistent error behavior.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Extract to a shared helper:
async function assertResponseOk(response: Response, fallbackMessage: string): Promise<void> {
  if (!response.ok) {
    let message = fallbackMessage;
    try {
      const body = await response.json();
      message = body.error || body.message || fallbackMessage;
    } catch {
      // non-JSON response; keep fallback
    }
    throw new Error(`${message} (HTTP ${response.status})`);
  }
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }
```
</details>

---

**🐛 Bug** · lines 76-79

Fragile error parsing loses HTTP status code context: when the server returns a non-JSON error response (e.g., an HTML error page, a gateway timeout, or a plain-text 500), the catch fallback provides a generic message like 'Upload failed' with no HTTP status code. This makes debugging difficult. Include `response.status` and `response.statusText` in the error message so the caller has actionable context.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (!response.ok) {
    let message = 'Upload failed';
    try {
      const error = await response.json();
      message = error.error || error.message || message;
    } catch { /* non-JSON body */ }
    throw new Error(`${message} (HTTP ${response.status}: ${response.statusText})`);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }
```
</details>


## 🔵 Low (3)

**🔧 Maintainability** · lines 70-74

Hardcoded URL paths: `/api/files` and its variants are duplicated across multiple functions. Consider extracting them into named constants (e.g., `const FILES_ENDPOINT = '/api/files'`) to make future route changes easier and reduce the risk of typos.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const FILES_ENDPOINT = '/api/files';
// ...
  const response = await fetch(FILES_ENDPOINT, {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const response = await fetch('/api/files', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
```
</details>

---

**🔧 Maintainability** · line 7

Unused import: `ApiResponse` is imported from `./client` but is never referenced in this file. Remove it to keep imports clean.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import { apiClient } from './client';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import { apiClient, type ApiResponse } from './client';
```
</details>

---

**🐛 Bug** · lines 81-82

`uploadFile` accesses `result.data` (line 53) without checking that `result` is an object with a `data` property. If the API returns a 200 response with a JSON body that lacks a `data` field (e.g., `{ error: '...' }`), this will return `undefined` silently. Consider adding a runtime check or using a type guard.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const result = await response.json();
  if (!result?.data) {
    throw new Error('Upload succeeded but no file data returned');
  }
  return result.data;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const result = await response.json();
  return result.data;
```
</details>


