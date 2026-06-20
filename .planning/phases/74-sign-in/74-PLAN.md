---
wave: 1
depends_on: []
files_modified:
  - src/components/ui/input.tsx
  - src/components/auth/SignInForm.tsx
  - src/app/[locale]/sign-in/page.tsx
autonomous: true
---

# Phase 74: Sign-In — Implementation Plan

**Wave:** 1 of 2  
**Depends on:** Phase 73 (Shared Foundation)  
**Requirements:** AUTH-01 to AUTH-06

---

## Must Haves

1. **NO Ant Design**: All UI components must use custom Tailwind CSS per Phase 73 constraint
2. **Role-based redirect**: Customer→`/{locale}/dashboard`, Specialist→`/{locale}/specialist`, Reviewer→`/{locale}/reviewer`, Coordinator→`/{locale}/admin/dashboard`, Partner→`/{locale}/partner/dashboard`
3. **Locale preservation**: Use `useLocale()` from next-intl, never hardcode `/vi/` prefix
4. **returnUrl validation**: Strict whitelist—starts with `/` AND does NOT start with `//` AND does NOT include `://`
5. **Demo credentials dev-only**: Pre-fill only when `NODE_ENV === 'development'`
6. **Toast notifications**: Use `react-hot-toast` (`toast.error()`, `toast.success()`)
7. **Inline validation**: Validate email format and password length on blur and submit

---

## Artifacts this phase produces

1. **New component**: `src/components/ui/input.tsx` — Custom input following shadcn/ui pattern
2. **Rewritten form**: `src/components/auth/SignInForm.tsx` — From Ant Design to custom Tailwind
3. **Page update**: `src/app/[locale]/sign-in/page.tsx` — Remove inline styles, use Tailwind
4. **Validation logic**: Email regex + password required validation functions
5. **Redirect logic**: Role map + returnUrl validator + locale-aware path builder

---

## Tasks

### Task 1: Create Custom Input Component

**read_first:**
- `src/components/ui/button.tsx` — Follow same shadcn/ui pattern (forwardRef, cva variants, Slot)
- `src/lib/utils.ts` — Import `cn` utility for class merging

**action:**
- Create new file `src/components/ui/input.tsx` at line 1:
```typescript
'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**acceptance_criteria:**
- Source: File `src/components/ui/input.tsx` exists with forwardRef export
- Behavior: Input accepts `className`, `type`, and all standard HTML input attributes
- Test: Can import `Input` component and render without TypeScript errors
- Verification: `npx tsc --noEmit src/components/ui/input.tsx` returns no errors

**verify:** Run command `cat src/components/ui/input.tsx` to confirm file content matches specification.

---

### Task 2: Rewrite SignInForm — Replace Ant Design with Tailwind Components

**read_first:**
- `src/components/auth/SignInForm.tsx` (current implementation with Ant Design)
- `src/components/ui/button.tsx` (existing button component to reuse)
- `src/lib/auth-client.ts` (authClient.signIn.email method signature)
- `src/routing.ts` (locale configuration)

**action:**
- Completely rewrite `src/components/auth/SignInForm.tsx` with these changes:

**A. Import replacements (lines 1-10):**
```typescript
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routing } from "@/routing";
```

**B. State declarations (after imports):**
```typescript
const DEFAULT_EMAIL = "customer.demo@example.test";
const DEFAULT_PASSWORD = "Demo@123456";

export function SignInForm() {
  const t = useTranslations("Auth");
  const locale = useLocale() || routing.defaultLocale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
```

**C. Conditional demo credentials pre-fill:**
```typescript
  // Conditional pre-fill only in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setEmail(DEFAULT_EMAIL);
      setPassword(DEFAULT_PASSWORD);
    }
  }, []);
```

**D. Validation functions:**
```typescript
  const validateEmail = (value: string): string | undefined => {
    if (!value) return t("emailRequired");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t("emailInvalid");
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return t("passwordRequired");
    return undefined;
  };

  const handleBlur = () => {
    setErrors({
      email: validateEmail(email),
      password: validatePassword(password),
    });
  };
```

**E. returnUrl validation (open redirect protection):**
```typescript
  const isValidReturnUrl = (url: string | null): boolean => {
    if (!url) return false;
    try {
      const decoded = decodeURIComponent(url);
      if (!decoded.startsWith("/")) return false;
      if (decoded.startsWith("//")) return false;
      if (decoded.includes("://")) return false;
      return true;
    } catch {
      return false;
    }
  };
```

**F. Role-based redirect mapping:**
```typescript
  const ROLE_ROUTES: Record<string, string> = {
    Customer: "/dashboard",
    Specialist: "/specialist",
    Reviewer: "/reviewer",
    Coordinator: "/admin/dashboard",
    Partner: "/partner/dashboard",
  };

  const getRedirectPath = (userRole: string): string => {
    if (isValidReturnUrl(returnUrl)) {
      return decodeURIComponent(returnUrl);
    }
    return `/${locale}${ROLE_ROUTES[userRole] || "/dashboard"}`;
  };
```

**G. Form submission handler:**
```typescript
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate on submit
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(t("invalidCredentials"));
      } else {
        toast.success(t("loginSuccess") || t("signIn"));
        const redirectPath = getRedirectPath("Customer"); // TODO: Fetch user role after signIn
        router.push(redirectPath);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("genericError"));
    } finally {
      setLoading(false);
    }
  };
```

**H. JSX rendering (replace entire return statement):**
```typescript
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-8">{t("appName")}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 block"
            >
              {t("email")}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleBlur}
              placeholder={t("email")}
              className={errors.email ? "border-red-500" : ""}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={loading}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-500" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 block"
            >
              {t("password")}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handleBlur}
              placeholder={t("password")}
              className={errors.password ? "border-red-500" : ""}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={loading}
            />
            {errors.password && (
              <p
                id="password-error"
                className="text-sm text-red-500"
                role="alert"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : null}
            {t("signIn")}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**acceptance_criteria:**
- Source: No imports contain `'antd'` or `'@ant-design/icons'`
- Behavior: Form displays email/password fields using custom Input components
- Test: Submit with empty email shows `errors.email` under field
- Test: Submit with invalid email format shows "Invalid email format" error
- Test: Submit with empty password shows `errors.password` under field
- Test: Loading state disables button and inputs during authentication
- Verification: Component renders without any Ant Design dependencies

**verify:** Run command `grep -r "from 'antd'" src/components/auth/SignInForm.tsx || echo "No Ant Design imports found"`

---

### Task 3: Fetch User Role After Authentication for Proper Redirect

**read_first:**
- `src/lib/auth-client.ts` (check if signIn.email returns session with user.role)
- `src/hooks/useAuth.ts` (how useSession is structured)
- `src/components/auth/SignInForm.tsx` (current handleSubmit implementation)

**action:**
- Update handleSubmit in SignInForm to fetch user role after successful sign in:

**Current code (Task 2 G):**
```typescript
if (error) {
  toast.error(t("invalidCredentials"));
} else {
  toast.success(t("loginSuccess") || t("signIn"));
  const redirectPath = getRedirectPath("Customer"); // TODO: Fetch user role
  router.push(redirectPath);
}
```

**Replace with:**
```typescript
if (error) {
  toast.error(t("invalidCredentials"));
} else {
  toast.success(t("loginSuccess") || t("signIn"));

  // Fetch session to get user role
  const { data: session } = await authClient.getSession();
  const userRole = session?.user?.role || "Customer";

  const redirectPath = getRedirectPath(userRole);
  router.push(redirectPath);
}
```

**acceptance_criteria:**
- Source: `signIn.email` call followed by `authClient.getSession()` call before redirect
- Behavior: Session data includes `user.role` property
- Test: Login as Customer user → redirect to `/{locale}/dashboard`
- Test: Login as Specialist user → redirect to `/{locale}/specialist`
- Test: Login as Reviewer user → redirect to `/{locale}/reviewer`
- Test: Login as Coordinator user → redirect to `/{locale}/admin/dashboard`
- Test: Login as Partner user → redirect to `/{locale}/partner/dashboard`
- Verification: Role detection fallback to "Customer" if role not present

**verify:** Manually test login with different roles from seed data and verify redirect paths match requirement.

---

### Task 4: Update Page Wrapper with Tailwind Styling

**read_first:**
- `src/app/[locale]/sign-in/page.tsx` (current inline style implementation)

**action:**
- Replace inline styles with Tailwind classes:

**Before:**
```typescript
<div style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: '#F0F2F5'
}}>
  <SignInForm />
</div>
```

**After:**
```typescript
export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
      <SignInForm />
    </div>
  );
}
```

**acceptance_criteria:**
- Source: No inline style objects in page wrapper
- Behavior: Same visual appearance (centered form on gray background)
- Test: Page renders centered form matching previous design
- Verification: `grep -E "style=\{" src/app/\[locale\]/sign-in/page.tsx` returns empty

**verify:** Run command `grep -E "style=\{" src/app/[locale]/sign-in/page.tsx || echo "No inline styles found"`

---

### Task 5: Verify Locale Preservation in Redirects

**read_first:**
- `src/app/[locale]/sign-in/page.tsx` (ensure i18n provider configured)
- `src/routing.ts` (locale definitions)
- `src/components/auth/SignInForm.tsx` (locale usage)

**action:**
- Add Toaster component to root layout if not present (for react-hot-toast):

**If layout doesn't have toaster, add to `src/app/layout.tsx`:**
```typescript
import { Toaster } from "react-hot-toast";

// In your layout component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

**acceptance_criteria:**
- Source: `<Toaster>` component present in layout or SignInForm
- Behavior: Toast notifications appear at top-right corner
- Test: Send toast from browser console: `toast.success("test")` → visible toast appears
- Test: Login with valid credentials → success toast appears before redirect
- Test: Login with invalid credentials → error toast appears
- Verification: Toast duration ~4 seconds (default react-hot-toast behavior)

**verify:** Run `npm run dev` and check browser console for `toast` object availability.

---

## Acceptance Summary

| Requirement | Status | Verification Command |
|-------------|--------|---------------------|
| AUTH-01: Email/password fields with validation | Pending | `grep -E "validateEmail|validatePassword" src/components/auth/SignInForm.tsx` |
| AUTH-02: POST /api/auth/sign-in via authClient | Pending | `grep "authClient.signIn.email" src/components/auth/SignInForm.tsx` |
| AUTH-03: Error message for invalid credentials | Pending | `grep "toast.error.*invalidCredentials" src/components/auth/SignInForm.tsx` |
| AUTH-04: Role-based redirect | Pending | `grep "ROLE_ROUTES" src/components/auth/SignInForm.tsx` |
| AUTH-05: Inline validation on blur/submit | Pending | `grep "handleBlur|validateEmail|validatePassword" src/components/auth/SignInForm.tsx` |
| AUTH-06: Locale preserved via useLocale() | Pending | `grep "useLocale()" src/components/auth/SignInForm.tsx` |

---

## Testing Strategy

### Whitebox Tests
- `validateEmail()` with valid emails: `user@example.com`, `test.user@domain.co.uk`
- `validateEmail()` with invalid emails: `invalid`, `@missing-local.com`, `no-tld@domain`
- `validatePassword()` with empty string
- `isValidReturnUrl()` with `/dashboard`, `//evil.com`, `https://malicious.com`, `http://localhost:3000`
- `getRedirectPath()` with each of 5 roles → expected paths

### Blackbox Tests
- Submit form with valid credentials → success redirect
- Submit form with wrong credentials → error toast
- Submit form with empty fields → validation errors displayed
- Submit form with returnUrl param → redirect to returnUrl
- Login from `/en/sign-in` → redirect preserves `/en/` prefix

### Abnormal Tests
- External returnUrl: `?returnUrl=https://evil.com` → rejected, fallback to role-based
- Protocol-relative returnUrl: `?returnUrl=//evil.com/path` → rejected
- URL-encoded malicious returnUrl: `?returnUrl=%2f%2fevil.com` → rejected after decode
- Network failure during sign in → generic error toast displayed

### Error Tests
- API returns 500 → generic error toast
- Session fetch fails → fallback to Customer role
- Locale detection fails → fallback to 'vi'

---

*Plan created: 2026-06-20*
*Next step: Wave 1 execution (tasks 1-4), then Wave 2 for validation and testing*
