# Review: `src/app/[locale]/admin/requests/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟠 High (2)

**🐛 Bug** · lines 37-55

**Loading state conflates empty roles with loading.** The condition `userRoles.length === 0` treats both the initial loading state (roles not yet fetched) and a user who genuinely has no roles identically — both show a spinner indefinitely. A user with no roles will never see the `errorForbidden` state below, because the first early return always catches them. If `useAdminRoles()` provides a loading discriminator (e.g., `isLoading`, or `null` vs `[]`), use it to distinguish these two cases. Otherwise, the forbidden error state is dead code.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // If the hook exposes a loading flag, use it here:
  // if (isLoading) {
  //   return <LoadingSpinner />;
  // }

  if (!effectiveTab) {
    return (
      <div className="requests-error-state">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{t('errorForbidden')}</span>
      </div>
    );
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (userRoles.length === 0) {
    return (
      <div className="requests-loading">
        <div className="spinner" />
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (!effectiveTab) {
    return (
      <div className="requests-error-state">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{t('errorForbidden')}</span>
      </div>
    );
  }
```
</details>

---

**🐛 Bug** · lines 33-35

**Stale active tab after role change.** When `visibleTabs` changes (e.g., user roles are updated and some tabs are no longer visible), `activeTab` may still hold a key that is no longer in `visibleTabs`. Since `activeTab` is non-null, `effectiveTab` will be the stale value, and none of the `{effectiveTab === '...' && ...}` conditions will match — leaving an empty content area with no visible panel. Add a `useEffect` that resets `activeTab` to `null` (or clamps to the first visible tab) whenever the current `activeTab` is no longer in `visibleTabs`.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const firstTab = visibleTabs[0] ?? null;

  // Reset activeTab when the selected tab is no longer visible
  React.useEffect(() => {
    if (activeTab && !visibleTabs.includes(activeTab)) {
      setActiveTab(null);
    }
  }, [activeTab, visibleTabs]);

  const effectiveTab = activeTab ?? firstTab;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const firstTab = visibleTabs[0] ?? null;
  const effectiveTab = activeTab ?? firstTab;
```
</details>


