# Review: `src/lib/react-query.tsx`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 1

---

## 🟠 High (1)

**🐛 Bug** · lines 19-28

Module-level QueryClient singleton causes cross-request state pollution in Next.js SSR. Even with `'use client'`, client components are pre-rendered on the server where module-level state is shared across requests. This can leak cached query data between users/sessions.

Follow the official TanStack Query Next.js pattern: lazily create the QueryClient — on the server always create a fresh instance, and on the browser use a module-level singleton.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new QueryClient to avoid cross-request contamination
    return makeQueryClient();
  }
  // Browser: reuse the same QueryClient across the component lifecycle
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```
</details>


