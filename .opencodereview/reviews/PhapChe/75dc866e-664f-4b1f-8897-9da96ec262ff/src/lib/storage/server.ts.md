# Review: `src/lib/storage/server.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 3

---

## 🟠 High (3)

**🐛 Bug** · lines 32-34

Swallowed initialization error: The `.catch()` on `initPromise` only logs the error but does not re-throw. This causes `ensureStorageReady()` to resolve successfully even when the provider failed to initialize. Subsequent calls (uploadFile, getFile, etc.) would then operate on an uninitialized provider, leading to unpredictable behavior or cryptic downstream errors.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      initPromise = provider.initialize().catch((err) => {
        console.error('Failed to initialize storage:', err);
        throw err;
      });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      initPromise = provider.initialize().catch((err) => {
        console.error('Failed to initialize storage:', err);
      });
```
</details>

---

**🐛 Bug** · lines 57-60

Race condition: The delegate methods call `ensureStorageReady()` before `getStorageService()`. On the very first call, `initPromise` is still `null`, so `ensureStorageReady()` returns immediately without waiting. Then `getStorageService()` triggers `provider.initialize()` asynchronously, but the method proceeds to call provider operations before initialization completes. Fix: call `getStorageService()` first to guarantee `initPromise` is set, then await `ensureStorageReady()`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async uploadFile(input: Parameters<StorageService['uploadFile']>[0]) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.uploadFile(input);
  },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async uploadFile(input: Parameters<StorageService['uploadFile']>[0]) {
    await ensureStorageReady();
    return getStorageService().uploadFile(input);
  },
```
</details>

---

**🐛 Bug** · lines 62-80

Same race condition as `uploadFile`: on first call, `ensureStorageReady()` returns before `getStorageService()` sets `initPromise`. All five delegate methods (getFile, getDownloadUrl, deleteFile, getAccessLogs) need the same fix: call `getStorageService()` first, then `await ensureStorageReady()`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async getFile(fileId: string, userId: string) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.getFile(fileId, userId);
  },

  async getDownloadUrl(fileId: string, userId: string) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.getDownloadUrl(fileId, userId);
  },

  async deleteFile(fileId: string, userId: string) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.deleteFile(fileId, userId);
  },

  async getAccessLogs(fileId: string, userId: string, options?: { page?: number; pageSize?: number }) {
    const svc = getStorageService();
    await ensureStorageReady();
    return svc.getAccessLogs(fileId, userId, options);
  },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async getFile(fileId: string, userId: string) {
    await ensureStorageReady();
    return getStorageService().getFile(fileId, userId);
  },

  async getDownloadUrl(fileId: string, userId: string) {
    await ensureStorageReady();
    return getStorageService().getDownloadUrl(fileId, userId);
  },

  async deleteFile(fileId: string, userId: string) {
    await ensureStorageReady();
    return getStorageService().deleteFile(fileId, userId);
  },

  async getAccessLogs(fileId: string, userId: string, options?: { page?: number; pageSize?: number }) {
    await ensureStorageReady();
    return getStorageService().getAccessLogs(fileId, userId, options);
  },
```
</details>


