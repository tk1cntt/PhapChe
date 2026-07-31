# Review: `src/lib/ai/AiContext.tsx`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 4

---

## 🟡 Medium (3)

**🐛 Bug** · lines 44-46

**Race condition: duplicate concurrent requests via retryInit.**

The `init` function does not guard against re-entry. If `retryInit` is called while `isInitializing` is already `true`, a second concurrent `fetch('/api/ai/init')` will be fired. This can lead to inconsistent state (e.g., the first response sets `isReady=true`, then the second response overwrites it with an error).

Add a guard at the top of `init`:
```ts
if (isInitializing) return;
```

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const init = useCallback(async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    setInitError(null);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const init = useCallback(async () => {
    setIsInitializing(true);
    setInitError(null);
```
</details>

---

**🐛 Bug** · lines 53-55

**Missing null check on `json.data` before accessing `.indexed`.**

Even when `json.success` is `true`, `json.data` could be `null` or `undefined` (e.g., a malformed API response). Accessing `json.data.indexed` would throw a TypeError, bypassing the `catch` block's user-friendly error message and potentially crashing the UI.

Use optional chaining with a default:
```ts
setDocsIndexed(json.data?.indexed ?? 0);
```

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      if (json.success) {
        setIsReady(true);
        setDocsIndexed(json.data?.indexed ?? 0);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      if (json.success) {
        setIsReady(true);
        setDocsIndexed(json.data.indexed);
```
</details>

---

**🔧 Maintainability** · line 49

**Hardcoded API path.**

The URL `/api/ai/init` is hardcoded directly in the component. If the API route changes, every call site must be updated manually. Consider extracting this to a shared constants file or an environment variable so it can be managed centrally.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const res = await fetch('/api/ai/init'); // TODO: extract to shared constant or env variable
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const res = await fetch('/api/ai/init');
```
</details>


## 🔵 Low (1)

**⚡ Performance** · lines 44-49

**Missing AbortController for in-flight fetch on unmount.**

If the component unmounts while `fetch` is still pending, the state setters in the `then`/`catch`/`finally` blocks will fire on an unmounted component, causing a React memory-leak warning in development. Use an `AbortController` to cancel the fetch on cleanup.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const init = useCallback(async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    setInitError(null);

    const controller = new AbortController();
    try {
      const res = await fetch('/api/ai/init', { signal: controller.signal });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const init = useCallback(async () => {
    setIsInitializing(true);
    setInitError(null);

    try {
      const res = await fetch('/api/ai/init');
```
</details>


