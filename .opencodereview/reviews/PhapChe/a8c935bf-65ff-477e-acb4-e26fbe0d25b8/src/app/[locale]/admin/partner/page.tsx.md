# Review: `src/app/[locale]/admin/partner/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · lines 116-121

**Stats are calculated from current page data only, not the full dataset.**

The `inProgress`, `pendingReview`, and `completed` stats are computed by filtering `data.data`, which only contains the current page's records. This means the stats will be misleading whenever the user paginates — they'll show counts for the current page (e.g., 0–10 items) rather than the entire dataset. These breakdown stats should either come from a dedicated server endpoint or be aggregated from the full dataset.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // FIXME: stats should come from the server or aggregate the full dataset, not just the current page
      const statsCalc: Stats = {
        total: data.pagination.total,
        // These values are incorrect when paginating — they reflect only the current page
        inProgress: data.data.filter(r => r.status === 'in_progress').length,
        pendingReview: data.data.filter(r => r.status === 'pending_review').length,
        completed: data.data.filter(r => r.status === 'completed' || r.status === 'delivered').length,
      };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const statsCalc: Stats = {
        total: data.pagination.total,
        inProgress: data.data.filter(r => r.status === 'in_progress').length,
        pendingReview: data.data.filter(r => r.status === 'pending_review').length,
        completed: data.data.filter(r => r.status === 'completed' || r.status === 'delivered').length,
      };
```
</details>

---

**🐛 Bug** · lines 89-100

**Race condition: no request cancellation on rapid filter/page changes.**

When the user rapidly changes filters, pages, or search terms, multiple `fetchData` calls can be in-flight simultaneously. A stale response from an earlier request can overwrite a newer one, causing incorrect data to be displayed. Use `AbortController` to cancel the previous in-flight request when dependencies change.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/partner/requests?${params.toString()}`, { signal });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/partner/requests?${params.toString()}`);
```
</details>


## 🟡 Medium (1)

**🔒 Security** · lines 107-108

**Server error details are exposed directly to the user.**

When the API returns a non-OK response, the raw server error message (`errorData.detail` or `errorData.error`) is displayed to the user without sanitization. This can leak internal stack traces, database errors, or system implementation details that could aid an attacker. Use a generic user-facing error message and log the real error server-side or to the console only.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        const errorData = await response.json().catch(() => ({}));
        console.error('API error details:', errorData.detail || errorData.error);
        throw new Error(tCommon('fetchError') || 'Failed to fetch requests');
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Failed to fetch requests');
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 135-136

**`handleFilter` and `handleExport` are unimplemented stubs.**

These functions only log to the console, giving users the false impression that filter and export functionality exists. Either implement them or disable/hide the corresponding toolbar buttons until the features are ready.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // TODO: Implement filter modal and CSV export functionality
  const handleFilter = () => { /* TODO: Open filter modal */ };
  const handleExport = () => { /* TODO: Export to CSV */ };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const handleFilter = () => { console.log('Open filter modal'); };
  const handleExport = () => { console.log('Export to CSV'); };
```
</details>

---

**🐛 Bug** · lines 145-148

**`getCustomerInitials` can produce `undefined` characters for names with leading/trailing or consecutive spaces.**

For example, `' John  Doe'` splits into `['', 'John', '', 'Doe']`. Accessing `n[0]` on an empty string returns `undefined`, which would appear in the avatar as `'UNDEFINED'` (via `.toUpperCase()`). Use `.filter(Boolean)` on the split result to remove empty segments.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const getCustomerInitials = (name: string) => {
    if (!name) return '—';
    return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const getCustomerInitials = (name: string) => {
    if (!name) return '—';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };
```
</details>


