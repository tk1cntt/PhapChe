# Review: `src/lib/api/index.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 5

---

## 🔴 Critical (2)

**🐛 Bug** · lines 173-185

**vaultApi.upload bypasses centralized apiClient** — Uses raw `fetch` instead of `apiClient`, losing: auth (no `credentials: 'include'` consistency), automatic 401 redirect, toast error notifications, retry logic for 502/503/504, and network-error retry. Also, `response.ok` is never checked, so HTTP errors (4xx/5xx) pass silently and `response.json()` may fail on non-JSON error bodies. Consider using `apiClient.post` or at minimum check `response.ok` and handle errors.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  upload: async (file: File, folderId?: string, requestId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (requestId) formData.append('requestId', requestId);

    const response = await fetch('/api/vault/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `Upload failed with status ${response.status}`);
    }

    return response.json();
  },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  upload: async (file: File, folderId?: string, requestId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (requestId) formData.append('requestId', requestId);

    const response = await fetch('/api/vault/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    return response.json();
  },
```
</details>

---

**🐛 Bug** · lines 187-188

**vaultApi.download will fail at runtime** — `apiClient.get<Blob>` expects a `Blob` response, but `apiClient.request` (client.ts line 102) unconditionally calls `response.json()` on every response. For binary file downloads, `response.json()` will throw a JSON parse error. This needs a separate code path that returns `response.blob()` or uses raw `fetch` with proper error handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  download: async (fileId: string) => {
    const response = await fetch(`/api/vault/${fileId}/download`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `Download failed with status ${response.status}`);
    }
    return response.blob();
  },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  download: (fileId: string) =>
    apiClient.get<Blob>(`/api/vault/${fileId}/download`),
```
</details>


## 🟠 High (1)

**🐛 Bug** · lines 173-185

**vaultApi.upload: missing `Content-Type` header handling for FormData** — The raw `fetch` call does not set `Content-Type` (which is correct for FormData — the browser auto-sets `multipart/form-data` with boundary). However, `apiClient.request` always forces `Content-Type: application/json` (client.ts line 94), which means `apiClient.post` cannot be used for file uploads. To use `apiClient` for uploads, it would need to support omitting `Content-Type` when the body is `FormData`. This is a secondary issue confirming the raw `fetch` approach here is a symptom of `apiClient` not supporting multipart uploads.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  upload: async (file: File, folderId?: string, requestId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (requestId) formData.append('requestId', requestId);

    const response = await fetch('/api/vault/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    return response.json();
  },
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · lines 39-40

**Extensive use of `unknown` types throughout all API methods** — Every request body and response data shape is typed as `unknown`, providing zero type safety for consumers of this API module. This defeats the purpose of TypeScript in a centralized API layer. Consider defining proper interfaces for each resource (e.g., `RequestData`, `UserData`, `WorkspaceData`) and using them in the generic parameters so callers get autocomplete and compile-time validation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Example: define proper types
  // interface RequestData { title: string; type: string; ... }
  // create: (data: RequestData) =>
  //   apiClient.post<{ data: RequestData }>('/api/requests', data),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  create: (data: unknown) =>
    apiClient.post<{ data: unknown }>('/api/requests', data),
```
</details>

---

**🔧 Maintainability** · lines 187-191

**vaultApi.getDownloadUrl and vaultApi.download share the same endpoint** — Both hit `/api/vault/${fileId}/download` but return different shapes (`{ data: { url: string } }` vs `Blob`). This is confusing and likely a bug: the download endpoint is called twice, once for the URL and once for the actual blob. Consider having a single method that returns the blob, or rename `getDownloadUrl` to a different endpoint that returns only metadata.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // If getDownloadUrl is meant to return a presigned URL, use a distinct endpoint
  getDownloadUrl: (fileId: string) =>
    apiClient.get<{ data: { url: string } }>(`/api/vault/${fileId}/download-url`),

  download: async (fileId: string) => {
    const response = await fetch(`/api/vault/${fileId}/download`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `Download failed`);
    }
    return response.blob();
  },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  download: (fileId: string) =>
    apiClient.get<Blob>(`/api/vault/${fileId}/download`),

  getDownloadUrl: (fileId: string) =>
    apiClient.get<{ data: { url: string } }>(`/api/vault/${fileId}/download`),
```
</details>


