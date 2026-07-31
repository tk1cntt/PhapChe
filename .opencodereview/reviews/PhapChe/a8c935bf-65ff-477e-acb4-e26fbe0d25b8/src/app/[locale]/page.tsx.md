# Review: `src/app/[locale]/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟡 Medium (2)

**🔧 Maintainability** · line 5

Hardcoded URL path '/dashboard': The redirect target path is hardcoded as a string literal. If the dashboard route changes in the future, this implicit dependency must be updated manually. Consider extracting the path into a route configuration constant or using a route helper to centralize URL management.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Consider using a route constant: e.g., ROUTES.DASHBOARD or a route helper
  redirect(`/${locale}/dashboard`);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  redirect(`/${locale}/dashboard`);
```
</details>

---

**🐛 Bug** · lines 4-5

Missing error handling for async operation: The `await params` expression and `redirect()` call are not wrapped in a try/catch block. If the params promise rejects (e.g., due to an unexpected framework error), the unhandled rejection will propagate as an uncaught exception, resulting in a poor user experience. Consider adding error handling with a fallback (e.g., redirect to a default locale or render an error boundary). Note: if you add a try/catch, ensure you re-throw Next.js `NEXT_REDIRECT` errors from `redirect()`, as they are intentionally thrown and must propagate.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  try {
    const { locale } = await params;
    redirect(`/${locale}/dashboard`);
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e;
    // Fallback: redirect to a safe default locale
    redirect(`/en/dashboard`);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
```
</details>


