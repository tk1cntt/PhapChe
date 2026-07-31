# Review: `src/lib/hooks/usePaginationParams.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 2

---

## 🟡 Medium (1)

**🐛 Bug** · lines 105-114

`clearFilters` unintentionally clears the `search` parameter as well. It constructs a fresh `URLSearchParams` from scratch, only setting `page` and `pageSize`, which means any existing `search` term is lost when filters are cleared. Use `buildUrl` to selectively remove only the `filter_*` params instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    // Remove all filter_* params, keep search, page, pageSize
    const keysToDelete: string[] = [];
    params.forEach((_, key) => {
      if (key.startsWith('filter_')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => params.delete(key));
    params.set('page', '1');
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [router, pathname, searchParams]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    // Keep only page and pageSize
    params.set('page', '1');
    if (pageSize !== defaultPageSize) {
      params.set('pageSize', String(pageSize));
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [buildUrl, router, pathname, pageSize, defaultPageSize]);
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 114

`buildUrl` is listed in the dependency array of `clearFilters` but is never called inside the callback. This is a dead dependency that can cause unnecessary re-creations of the callback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  }, [router, pathname, searchParams]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  }, [buildUrl, router, pathname, pageSize, defaultPageSize]);
```
</details>


