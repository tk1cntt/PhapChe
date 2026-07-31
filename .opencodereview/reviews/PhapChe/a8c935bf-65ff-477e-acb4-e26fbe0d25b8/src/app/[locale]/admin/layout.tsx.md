# Review: `src/app/[locale]/admin/layout.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟡 Medium (1)

**🔧 Maintainability** · line 62

Hardcoded URL paths are used in multiple redirect calls. These should be extracted to named constants or a route configuration object to avoid typos and make future route changes easier.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const ROUTES = {
  dashboard: (locale: string) => `/${locale}/dashboard`,
  adminDashboard: (locale: string) => `/${locale}/admin/dashboard`,
  signIn: (locale: string) => `/${locale}/sign-in`,
} as const;

// usage:
redirect(ROUTES.dashboard(locale));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      redirect(`/${locale}/dashboard`);
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 101

Using `as any` to access the `digest` property on the caught error bypasses TypeScript type safety. Next.js exports `isRedirectError()` from 'next/dist/client/components/redirect' (or 'next/navigation' in newer versions) which can be used instead to properly type-guard redirect errors.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    import { isRedirectError } from 'next/dist/client/components/redirect';
    // ...
    if (isRedirectError(e)) throw e;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if ((e as any)?.digest?.startsWith('NEXT_REDIRECT')) throw e;
```
</details>


