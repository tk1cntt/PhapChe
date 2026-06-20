---
status: has_issues
phase: 74-sign-in
depth: standard
files_reviewed: 5
date: 2026-06-20
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
---

# Code Review: Phase 74 — Sign-In

**Phase:** 74-sign-in
**Reviewer:** gsd-code-review (standard depth)
**Date:** 2026-06-20
**Files reviewed:** 5
**Findings:** 0 critical, 2 warnings, 1 info

## Files Reviewed

| File | Lines | Verdict |
|------|-------|---------|
| `src/components/ui/input.tsx` | 26 | ✓ Clean |
| `src/components/auth/SignInForm.tsx` | 181 | ⚠ 2 findings |
| `src/components/auth/SignInForm.test.tsx` | 459 | ✓ Clean |
| `src/app/[locale]/sign-in/page.tsx` | 10 | ✓ Clean |
| `src/messages/vi.json` | — | ✓ Clean (i18n keys) |

## Overall Assessment

Implementation quality is **good**. No Ant Design imports remain, shadcn/ui pattern followed correctly, role-based redirect implemented for all 5 roles, locale preservation via `useLocale()`, and comprehensive test coverage (27 tests). The two warnings are edge-case robustness issues in URL handling.

---

## Findings

### WR-01: `isValidReturnUrl` crashes on malformed percent-encoded URLs

- **Severity:** Warning
- **File:** `src/components/auth/SignInForm.tsx`
- **Line:** 49
- **Category:** Robustness

**Issue:** `decodeURIComponent(url)` on line 49 can throw `URIError` for malformed percent-encoded input (e.g., `%ZZ`, `%E0%A4%A`). The function lacks a try-catch, so an attacker could craft a returnUrl like `%ZZ` that causes an unhandled exception during form submission.

```typescript
// Current (line 48-54)
function isValidReturnUrl(url: string): boolean {
  const decoded = decodeURIComponent(url);  // ← throws URIError on malformed input
  if (!decoded.startsWith('/')) return false;
  if (decoded.startsWith('//')) return false;
  if (decoded.includes('://')) return false;
  return true;
}
```

**Fix:** Wrap in try-catch, return `false` on decode failure:

```typescript
function isValidReturnUrl(url: string): boolean {
  try {
    const decoded = decodeURIComponent(url);
    if (!decoded.startsWith('/')) return false;
    if (decoded.startsWith('//')) return false;
    if (decoded.includes('://')) return false;
    return true;
  } catch {
    return false;
  }
}
```

**Note:** The PLAN.md (Task 2E) specified this exact try-catch pattern, but it was not implemented in the final code.

---

### WR-02: Double URL decoding in `getRedirectPath` may cause unexpected redirect

- **Severity:** Warning
- **File:** `src/components/auth/SignInForm.tsx`
- **Line:** 67
- **Category:** Security (defense-in-depth)

**Issue:** `getRedirectPath` calls `decodeURIComponent(returnUrl)` on line 67, but `isValidReturnUrl` already decoded the same URL on line 49. This double-decode means:

1. `isValidReturnUrl` receives `%2f%2fevil.com` → decodes to `//evil.com` → rejected ✓
2. But `getRedirectPath` receives the **original** `%2f%2fevil.com` → decodes to `//evil.com` → redirects to protocol-relative URL ✗

In practice, `useSearchParams().get()` already returns decoded values, so this double-decode path is unlikely to be exploited. However, the inconsistency between what `isValidReturnUrl` checks and what `getRedirectPath` actually redirects to is a defense-in-depth concern.

```typescript
// Current (line 65-71)
function getRedirectPath(userRole: string): string {
  if (returnUrl && isValidReturnUrl(returnUrl)) {
    return decodeURIComponent(returnUrl);  // ← double decode
  }
  const rolePath = ROLE_ROUTES[userRole] || '/dashboard';
  return `/${locale}${rolePath}`;
}
```

**Fix:** Remove the extra `decodeURIComponent` since the value is already validated (and `searchParams.get()` returns decoded values):

```typescript
function getRedirectPath(userRole: string): string {
  if (returnUrl && isValidReturnUrl(returnUrl)) {
    return returnUrl;  // already decoded by searchParams.get()
  }
  const rolePath = ROLE_ROUTES[userRole] || '/dashboard';
  return `/${locale}${rolePath}`;
}
```

---

### IN-01: `ROLE_ROUTES` constant defined inside component body

- **Severity:** Info
- **File:** `src/components/auth/SignInForm.tsx`
- **Line:** 57-63
- **Category:** Performance (minor)

**Issue:** `ROLE_ROUTES` is a static object recreated on every render. Since it never changes, it should be defined at module scope.

**Fix:** Move `ROLE_ROUTES` above the component function:

```typescript
const ROLE_ROUTES: Record<string, string> = {
  Customer: '/dashboard',
  Specialist: '/specialist',
  Reviewer: '/reviewer',
  Coordinator: '/admin/dashboard',
  Partner: '/partner/dashboard',
};

export default function SignInForm() {
  // ...
}
```

---

## Positive Highlights

- ✓ **No Ant Design imports** — fully migrated to custom Tailwind CSS
- ✓ **shadcn/ui pattern** followed correctly for Input component
- ✓ **Open redirect protection** — 3-layer validation (starts with `/`, not `//`, no `://`)
- ✓ **Demo credentials guarded** — only pre-filled in `NODE_ENV === 'development'`
- ✓ **Accessibility** — proper `aria-invalid`, `aria-describedby`, `role="alert"` attributes
- ✓ **Test coverage** — 27 tests covering rendering, validation, auth flow, role redirects, locale, security, and accessibility
- ✓ **Role-based routing** — all 5 roles mapped correctly with fallback to `/dashboard`

---

*Review completed: 2026-06-20*
*Depth: standard*
