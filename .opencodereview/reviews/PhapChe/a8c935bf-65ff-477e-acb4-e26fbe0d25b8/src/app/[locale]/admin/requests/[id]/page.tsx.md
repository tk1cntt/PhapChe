# Review: `src/app/[locale]/admin/requests/[id]/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🟠 High (1)

**🐛 Bug** · lines 75-77

Missing AbortController for fetch request in useEffect. If the component unmounts before the fetch completes, the setState calls in the `finally` block will trigger a React warning ("Can't perform a React state update on an unmounted component") and leak memory. Use an AbortController to cancel the fetch on cleanup.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  useEffect(() => {
    const abortController = new AbortController();

    const fetchRequest = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/partner/requests/${requestId}`, {
          signal: abortController.signal,
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push('/sign-in');
            return;
          }
          if (res.status === 404) {
            throw new Error('Request not found');
          }
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || data.error || 'Failed to fetch request');
        }

        const data = await res.json();
        setRequest(data.data);
      } catch (err) {
        if (abortController.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch request');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRequest();

    return () => {
      abortController.abort();
    };
  }, [requestId, router]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  useEffect(() => {
    fetchRequest();
  }, [requestId]);
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 162-163

Locale is extracted from `window.location.pathname` with a hardcoded fallback to `'vi'`, but the `[locale]` route param is already available via `useParams()`. This is fragile and breaks if the URL structure changes. Use `params.locale` instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
              const locale = params.locale as string;
              router.push(`/${locale}/admin/partner`);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
              const locale = window.location.pathname.split('/')[1] || 'vi';
              router.push(`/${locale}/admin/partner`);
```
</details>

---

**🔧 Maintainability** · lines 56-58

The same locale extraction pattern (`window.location.pathname.split('/')[1] || 'vi'`) is duplicated in three places (back button, partner chip click, and side panel partner link). Extract this into a shared variable derived from `params.locale` to avoid duplication and the hardcoded fallback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const requestId = params.id as string;
  const locale = params.locale as string;

  const [request, setRequest] = useState<RequestDetail | null>(null);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const requestId = params.id as string;

  const [request, setRequest] = useState<RequestDetail | null>(null);
```
</details>

---

**🔧 Maintainability** · line 84

Hardcoded API path `/api/admin/partner/requests/${requestId}` and sign-in redirect `/sign-in`. These business-related URL strings should be centralized in a constants file or environment configuration to avoid scattering magic strings across the codebase.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const res = await fetch(`/api/admin/partner/requests/${requestId}`); // TODO: extract to API path constant
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const res = await fetch(`/api/admin/partner/requests/${requestId}`);
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 75-77

The `fetchRequest` function is defined inside the component but is not included in the `useEffect` dependency array. While `requestId` is stable, omitting `fetchRequest` from the dependency array violates the React hooks exhaustive-deps rule and can mask stale closure bugs if the function later references other state/props.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  useEffect(() => {
    fetchRequest();
  }, [requestId]);
```
</details>

---

**🐛 Bug** · lines 94-95

The `catch(() => ({}))` fallback on `res.json()` produces an untyped empty object. Accessing `data.detail` and `data.error` on it relies on implicit `any` typing, which can mask runtime errors. Use a typed fallback or check the shape explicitly.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        const data = await res.json().catch(() => ({} as Record<string, unknown>));
        const message = (data as Record<string, unknown>).detail || (data as Record<string, unknown>).error || 'Failed to fetch request';
        throw new Error(String(message));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || 'Failed to fetch request');
```
</details>


