# Review: `src/app/[locale]/admin/organizations/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🔴 Critical (1)

**🐛 Bug** · lines 136-141

Stats for `active` and `inactive` are calculated from `data.data` (the current page), not from the full dataset. This means the stat cards will only reflect counts for the 20 (or fewer) rows currently displayed, not the total organizations across all pages. The API should return aggregate stats, or a separate stats endpoint should be called.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      // Calculate stats — WARNING: active/inactive should come from the API
      // (aggregated across ALL records), not from the current page slice.
      const statsCalc: Stats = {
        total: data.pagination.total,
        active: data.data.filter(o => o.status === 'active').length,
        inactive: data.data.filter(o => o.status === 'inactive').length,
      };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      // Calculate stats
      const statsCalc: Stats = {
        total: data.pagination.total,
        active: data.data.filter(o => o.status === 'active').length,
        inactive: data.data.filter(o => o.status === 'inactive').length,
      };
```
</details>


## 🟡 Medium (3)

**🔧 Maintainability** · lines 250-253

Multiple inline `style` attributes use static values (e.g., `fontSize: 31`, `letterSpacing: '-0.8px'`, `marginBottom: 12`, `fontSize: 15`, `fontWeight: 500`, `margin: 0`). These should be moved to the CSS module (`organizations.css`) or a CSS-in-JS solution to keep the JSX clean and maintainable. The checklist allows inline styles only for truly dynamic values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
          <h1 className="page-title">
            {t('pageTitle')}
          </h1>
          <p className="page-description">
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
          <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--color-text)', marginBottom: 12 }}>
            {t('pageTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-muted)', margin: 0 }}>
```
</details>

---

**🔧 Maintainability** · line 121

API URLs (`/api/admin/organizations`, `/sign-in`) and locale path extraction logic (`window.location.pathname.split('/')[1]`) are hardcoded. These should be extracted into constants or a shared path utility to avoid duplication and make future route changes safer.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      const response = await fetch(`${API_ROUTES.ADMIN_ORGANIZATIONS}?${params.toString()}`);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      const response = await fetch(`/api/admin/organizations?${params.toString()}`);
```
</details>

---

**🐛 Bug** · lines 205-209

The `setTimeout` in `handleSubmit` creates a potential memory leak. If the component unmounts (e.g., user navigates away) before the 1500ms delay completes, the callback will still attempt to call `closeCreateModal()` and `fetchData()` on an unmounted component, causing a React warning. Use a cleanup ref or clear the timeout on unmount.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      setFormSuccess('Organization created successfully');
      const timer = setTimeout(() => {
        closeCreateModal();
        fetchData();
      }, 1500);
      // Consider storing timer in a ref and clearing on unmount
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      setFormSuccess('Organization created successfully');
      setTimeout(() => {
        closeCreateModal();
        fetchData();
      }, 1500);
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 225-226

`handleFilter` and `handleExport` are stub implementations that only log to console. If these features are not yet implemented, consider disabling the corresponding toolbar buttons or showing a "coming soon" toast instead of silently doing nothing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const handleFilter = () => { /* TODO: implement filter modal */ };
  const handleExport = () => { /* TODO: implement CSV export */ };
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

**🔧 Maintainability** · lines 378-379

Using `window.location.pathname` to extract the locale bypasses Next.js routing. Prefer `useParams()` from `next/navigation` to get the locale, which is more reliable and works with basePath/i18n configs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
                        // Prefer: const { locale } = useParams();
                        const locale = window.location.pathname.split('/')[1] || 'vi';
                        router.push(`/${locale}/admin/organizations/${org.id}`);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
                        const locale = window.location.pathname.split('/')[1] || 'vi';
                        router.push(`/${locale}/admin/organizations/${org.id}`);
```
</details>


