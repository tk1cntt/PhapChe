# Phase 74: Sign-In — Research

**Created:** 2026-06-20  
**Status:** Research Complete  
**Phase:** 74-sign-in

## Tóm tắt

Phase 74 yêu cầu rewrite `SignInForm.tsx` từ Ant Design sang custom Tailwind CSS components, tích hợp role-based redirect, bảo toàn locale prefix, và validate `returnUrl` để chống open redirect attacks. Dưới đây là phân tích kỹ thuật chi tiết cho từng yêu cầu.

---

## 1. Ant Design Replacement Strategy

### 1.1. Current Implementation Analysis

File `src/components/auth/SignInForm.tsx` (98 dòng) đang sử dụng:

- **Ant Design Components:**
  - `Form`, `Form.Item` — form container và validation wrapper
  - `Input`, `Input.Password` — email và password fields
  - `Button` — submit button
  - `Card`, `Typography.Title` — layout và styling
  - `message.error()` — toast notifications
  
- **Ant Design Icons:**
  - `MailOutlined`, `LockOutlined` — prefix icons

- **Ant Design Form Features:**
  - `Form.useForm()` — form instance management
  - `form.setFieldsValue()` — programmatic field updates
  - `form` prop trên `<Form>` — controlled form
  - `rules` prop trên `<Form.Item>` — validation rules
  - `onFinish` callback — submit handler

### 1.2. Replacement Strategy

**Approach:** Replace từng component một với custom Tailwind equivalents, giữ nguyên logic authentication.

#### 1.2.1. Form Container

**Ant Design:**
```tsx
<Form form={form} name="signin" layout="vertical" onFinish={onFinish}>
  <Form.Item name="email" rules={[...]}>
    <Input />
  </Form.Item>
</Form>
```

**Tailwind Replacement:**
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <label htmlFor="email" className="text-sm font-medium">
      {t('email')}
    </label>
    <Input id="email" type="email" value={email} onChange={...} />
    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
  </div>
</form>
```

**Pattern:** Use native HTML `<form>` với controlled inputs (React state), không cần form library.

#### 1.2.2. Input Component

**Ant Design:**
```tsx
<Input prefix={<MailOutlined />} placeholder={t('email')} size="large" />
<Input.Password prefix={<LockOutlined />} placeholder={t('password')} size="large" />
```

**Tailwind Replacement:**
```tsx
// Create src/components/ui/input.tsx following shadcn/ui pattern
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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

**Password Input:** Use native `<input type="password">` hoặc tạo wrapper component với toggle visibility button.

**Icons:** Replace Ant Design icons với Lucide React icons (nếu cần) hoặc remove icons để đơn giản hóa.

#### 1.2.3. Button Component

**Ant Design:**
```tsx
<Button type="primary" htmlType="submit" loading={loading} block size="large">
  {t('signIn')}
</Button>
```

**Tailwind Replacement:**
```tsx
// Reuse existing src/components/ui/button.tsx
import { Button } from "@/components/ui/button"

<Button type="submit" disabled={loading} className="w-full" size="lg">
  {loading ? <LoadingSpinner /> : t('signIn')}
</Button>
```

**Loading State:** Create simple spinner component hoặc dùng SVG animation.

#### 1.2.4. Layout Components

**Ant Design:**
```tsx
<Card style={{ width: 420 }}>
  <Title level={3} style={{ textAlign: 'center' }}>
    {t('appName')}
  </Title>
  ...
</Card>
```

**Tailwind Replacement:**
```tsx
<div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-center mb-8">
    {t('appName')}
  </h1>
  ...
</div>
```

**Pattern:** Use Tailwind utility classes thay vì inline styles.

---

## 2. Toast Notification Implementation

### 2.1. Current Implementation

```tsx
import { message } from 'antd';

message.error(t('invalidCredentials'));
message.error(t('genericError'));
```

### 2.2. Replacement with react-hot-toast

**Library:** `react-hot-toast@^2.6.0` (đã cài đặt)

**API:**
```tsx
import toast from 'react-hot-toast';

// Error notification
toast.error(t('invalidCredentials'));

// Success notification
toast.success(t('loginSuccess'));

// Info notification
toast(t('infoMessage'), { icon: 'ℹ️' });
```

**Configuration:**
```tsx
// Optional: Configure toast position and styling
import { Toaster } from 'react-hot-toast';

// Add to layout.tsx or SignInForm.tsx
<Toaster
  position="top-right"
  toastOptions={{
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
    },
    success: {
      duration: 3000,
      iconTheme: {
        primary: 'green',
        secondary: 'white',
      },
    },
  }}
/>
```

**Pattern:** Replace `message.error()` với `toast.error()`, giữ nguyên i18n keys.

---

## 3. Role-Based Redirect Implementation

### 3.1. Current Implementation

```tsx
const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/vi/dashboard';
router.push(redirectTo);
```

**Problems:**
- Hardcode `/vi/dashboard` cho tất cả roles
- Locale prefix hardcode `/vi/`
- Không có role-based routing

### 3.2. Role-Based Redirect Strategy

**Implementation:**
```tsx
import { useLocale } from 'next-intl';

// Role-to-destination mapping
const ROLE_ROUTES: Record<string, string> = {
  Customer: '/dashboard',
  Specialist: '/specialist',
  Reviewer: '/reviewer',
  Coordinator: '/admin/dashboard',
  Partner: '/partner/dashboard',
};

function getRedirectPath(userRole: string, locale: string, returnUrl?: string | null): string {
  // Priority 1: Valid returnUrl (internal path)
  if (returnUrl && isValidInternalPath(returnUrl)) {
    return returnUrl;
  }
  
  // Priority 2: Role-based route
  const rolePath = ROLE_ROUTES[userRole] || '/dashboard';
  return `/${locale}${rolePath}`;
}

function isValidInternalPath(path: string): boolean {
  // Must start with / but not //
  return path.startsWith('/') && !path.startsWith('//');
}

// Usage in onFinish:
const locale = useLocale();
const session = await authClient.getSession();
const userRole = session.data?.user?.role || 'Customer';
const redirectPath = getRedirectPath(userRole, locale, returnUrl);
router.push(redirectPath);
```

**Role Detection:**
```tsx
// After successful signIn, get session
const { data: session } = await authClient.getSession();
const userRole = session?.user?.role;
```

**Fallback:** Nếu role không recognized, default to `/dashboard`.

---

## 4. Locale Preservation

### 4.1. Current Implementation

```tsx
const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/vi/dashboard';
```

**Problem:** Hardcode `/vi/` prefix.

### 4.2. Locale Preservation Strategy

**Implementation:**
```tsx
import { useLocale } from 'next-intl';

function SignInForm() {
  const locale = useLocale(); // Returns 'vi', 'en', 'zh', or 'ja'
  
  // Use locale in all redirects
  const redirectPath = `/${locale}/dashboard`;
  router.push(redirectPath);
}
```

**Hook:** `useLocale()` từ `next-intl` tự động detect current locale từ URL pathname.

**Fallback:** Nếu `useLocale()` return undefined hoặc invalid, fallback to `routing.defaultLocale` ('vi').

```tsx
import { routing } from '@/routing';

const locale = useLocale() || routing.defaultLocale;
```

---

## 5. returnUrl Validation (Open Redirect Protection)

### 5.1. Current Implementation

```tsx
const returnUrl = searchParams.get('returnUrl');
const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/vi/dashboard';
```

**Security Issue:** Không validate `returnUrl`, có thể redirect đến external domain.

**Attack Vector:**
```
/sign-in?returnUrl=https://malicious.com/phishing
```

### 5.2. Validation Strategy

**Implementation:**
```tsx
function isValidReturnUrl(url: string): boolean {
  // Decode URL-encoded characters
  const decoded = decodeURIComponent(url);
  
  // Must start with / (internal path)
  if (!decoded.startsWith('/')) {
    return false;
  }
  
  // Must NOT start with // (protocol-relative URL)
  if (decoded.startsWith('//')) {
    return false;
  }
  
  // Must NOT start with /\ (backslash variant)
  if (decoded.startsWith('/\\')) {
    return false;
  }
  
  // Additional check: reject if contains protocol
  if (decoded.includes('://') || decoded.includes(':\\\\')) {
    return false;
  }
  
  return true;
}

// Usage:
const returnUrl = searchParams.get('returnUrl');
if (returnUrl && isValidReturnUrl(returnUrl)) {
  router.push(decodeURIComponent(returnUrl));
} else {
  // Fallback to role-based redirect
  router.push(getRedirectPath(userRole, locale));
}
```

**Test Cases:**
- ✅ `/dashboard` → valid
- ✅ `/vi/dashboard` → valid
- ✅ `/cases/123` → valid
- ❌ `https://evil.com` → invalid (external domain)
- ❌ `//evil.com` → invalid (protocol-relative)
- ❌ `/\evil.com` → invalid (backslash variant)
- ❌ `http://localhost:3000` → invalid (contains protocol)

---

## 6. Form Validation Implementation

### 6.1. Current Implementation

```tsx
<Form.Item
  name="email"
  rules={[
    { required: true, message: t('emailRequired') },
    { type: 'email', message: t('emailInvalid') },
  ]}
>
  <Input />
</Form.Item>
```

**Ant Design Form Features:**
- Automatic validation on blur và submit
- Error message display dưới field
- Form state management

### 6.2. Custom Validation Strategy

**Implementation:**
```tsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

// Email validation
function validateEmail(value: string): string | undefined {
  if (!value) {
    return t('emailRequired');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return t('emailInvalid');
  }
  return undefined;
}

// Password validation
function validatePassword(value: string): string | undefined {
  if (!value) {
    return t('passwordRequired');
  }
  return undefined;
}

// Validate on blur
function handleEmailBlur() {
  const error = validateEmail(email);
  setErrors(prev => ({ ...prev, email: error }));
}

function handlePasswordBlur() {
  const error = validatePassword(password);
  setErrors(prev => ({ ...prev, password: error }));
}

// Validate on submit
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  
  setErrors({ email: emailError, password: passwordError });
  
  if (emailError || passwordError) {
    return; // Don't submit if validation fails
  }
  
  // Proceed with authentication
  onFinish({ email, password });
}
```

**UI Display:**
```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium text-gray-700">
    {t('email')}
  </label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    onBlur={handleEmailBlur}
    className={errors.email ? 'border-red-500' : ''}
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <p id="email-error" className="text-sm text-red-500" role="alert">
      {errors.email}
    </p>
  )}
</div>
```

**Pattern:** Controlled inputs với React state, validate on blur và submit, display errors inline.

---

## 7. Demo Credentials Pre-fill

### 7.1. Current Implementation

```tsx
useEffect(() => {
  form.setFieldsValue({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
  });
}, [form]);
```

**Problem:** Pre-fill vô điều kiện, không an toàn cho production.

### 7.2. Conditional Pre-fill Strategy

**Implementation:**
```tsx
const DEFAULT_EMAIL = 'customer.demo@example.test';
const DEFAULT_PASSWORD = 'Demo@123456';

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    setEmail(DEFAULT_EMAIL);
    setPassword(DEFAULT_PASSWORD);
  }
}, []);
```

**Pattern:** Chỉ pre-fill trong development environment, production để trống.

---

## 8. Code Patterns to Follow

### 8.1. Component Structure

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import toast from 'react-hot-toast';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { routing } from '@/routing';

export function SignInForm() {
  const t = useTranslations('Auth');
  const locale = useLocale() || routing.defaultLocale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  
  // Conditional demo credentials
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setEmail('customer.demo@example.test');
      setPassword('Demo@123456');
    }
  }, []);
  
  // Validation functions
  function validateEmail(value: string): string | undefined { ... }
  function validatePassword(value: string): string | undefined { ... }
  
  // Handlers
  function handleEmailBlur() { ... }
  function handlePasswordBlur() { ... }
  
  async function handleSubmit(e: React.FormEvent) { ... }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-8">
          {t('appName')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          {/* Password field */}
          {/* Submit button */}
        </form>
      </div>
    </div>
  );
}
```

### 8.2. Styling Patterns

- Use Tailwind utility classes thay vì inline styles
- Follow shadcn/ui color scheme (CSS variables)
- Use `cn()` utility để merge classes
- Responsive design với Tailwind breakpoints

### 8.3. Error Handling Pattern

```tsx
try {
  const { error } = await authClient.signIn.email({ email, password });
  
  if (error) {
    toast.error(t('invalidCredentials'));
  } else {
    // Success: redirect
    toast.success(t('loginSuccess'));
    router.push(redirectPath);
  }
} catch (e) {
  console.error(e);
  toast.error(t('genericError'));
}
```

---

## 9. Integration Points

### 9.1. Better Auth

- **File:** `src/lib/auth-client.ts`
- **Methods:**
  - `authClient.signIn.email({ email, password })` — authenticate user
  - `authClient.getSession()` — get current session after login
- **Return Type:** `{ data, error }`

### 9.2. next-intl

- **Hooks:**
  - `useLocale()` — get current locale from URL
  - `useTranslations('Auth')` — get i18n translations
- **Configuration:** `src/routing.ts` (locales: vi, en, zh, ja)

### 9.3. Next.js Navigation

- **Hooks:**
  - `useRouter()` — programmatic navigation
  - `useSearchParams()` — read query parameters
- **Method:** `router.push(path)` — navigate to path

### 9.4. Middleware

- **File:** `src/middleware.ts`
- **Behavior:** Redirect non-authenticated users to `/vi/sign-in?returnUrl=...`
- **Impact:** SignInForm cần handle `returnUrl` query param

---

## 10. Potential Challenges

### 10.1. Role Detection After Login

**Challenge:** `authClient.signIn.email()` return `{ data, error }`, nhưng `data` có thể không chứa user role.

**Solution:**
```tsx
const { error } = await authClient.signIn.email({ email, password });

if (!error) {
  // Fetch session to get user role
  const { data: session } = await authClient.getSession();
  const userRole = session?.user?.role || 'Customer';
  
  // Redirect based on role
  const redirectPath = getRedirectPath(userRole, locale, returnUrl);
  router.push(redirectPath);
}
```

**Alternative:** Nếu `signIn.email()` return user object với role, dùng trực tiếp.

### 10.2. Loading State Management

**Challenge:** Cần disable form và show loading indicator trong khi authenticate.

**Solution:**
```tsx
const [loading, setLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Authentication logic
  } finally {
    setLoading(false);
  }
}

// Disable button
<Button type="submit" disabled={loading}>
  {loading ? <LoadingSpinner /> : t('signIn')}
</Button>

// Disable inputs
<Input disabled={loading} />
```

### 10.3. Error State Styling

**Challenge:** Cần highlight invalid fields với red border và show error message.

**Solution:**
```tsx
<Input
  className={cn(
    "flex h-10 w-full rounded-md border",
    errors.email ? "border-red-500" : "border-gray-300"
  )}
  aria-invalid={!!errors.email}
/>
```

### 10.4. i18n Key Availability

**Challenge:** Đảm bảo tất cả i18n keys tồn tại trong translation files.

**Keys Required:**
- `Auth.appName`
- `Auth.email`
- `Auth.password`
- `Auth.signIn`
- `Auth.emailRequired`
- `Auth.emailInvalid`
- `Auth.passwordRequired`
- `Auth.invalidCredentials`
- `Auth.genericError`
- `Auth.loginSuccess` (optional)

**Solution:** Kiểm tra `messages/{locale}/Auth.json` trước khi implement.

### 10.5. Accessibility

**Challenge:** Form cần accessible cho screen readers.

**Solution:**
```tsx
<label htmlFor="email" className="text-sm font-medium">
  {t('email')}
</label>
<Input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert">
    {errors.email}
  </p>
)}
```

**Pattern:** Use `aria-invalid`, `aria-describedby`, và `role="alert"` cho error messages.

---

## 11. Recommended Implementation Strategy

### 11.1. Task Breakdown

**Task 1: Create Input Component**
- File: `src/components/ui/input.tsx`
- Pattern: Follow shadcn/ui button.tsx structure
- Features: Forward ref, className merging, error state styling

**Task 2: Rewrite SignInForm**
- File: `src/components/auth/SignInForm.tsx`
- Steps:
  1. Remove Ant Design imports
  2. Add Tailwind component imports
  3. Replace Form/Form.Item với native `<form>`
  4. Replace Input/Input.Password với custom Input
  5. Replace Button với shadcn/ui Button
  6. Replace Card/Title với Tailwind div/h1
  7. Implement controlled inputs với useState
  8. Implement validation logic
  9. Replace message.error() với toast.error()

**Task 3: Implement Role-Based Redirect**
- Create `ROLE_ROUTES` mapping
- Create `getRedirectPath()` function
- Create `isValidReturnUrl()` function
- Integrate vào handleSubmit

**Task 4: Implement Locale Preservation**
- Import `useLocale()` từ next-intl
- Use locale trong tất cả redirects
- Add fallback to `routing.defaultLocale`

**Task 5: Conditional Demo Credentials**
- Add `process.env.NODE_ENV === 'development'` check
- Pre-fill credentials chỉ trong dev mode

**Task 6: Testing**
- Unit tests cho validation functions
- Integration tests cho authentication flow
- E2E tests cho role-based redirects
- Security tests cho returnUrl validation

### 11.2. File Changes

**Create:**
- `src/components/ui/input.tsx` — custom Input component

**Modify:**
- `src/components/auth/SignInForm.tsx` — rewrite từ Ant Design sang Tailwind
- `src/app/[locale]/sign-in/page.tsx` — remove inline styles, use Tailwind

**Optional:**
- `src/app/layout.tsx` — add `<Toaster>` component nếu chưa có

### 11.3. Testing Strategy

**Whitebox Tests:**
- `validateEmail()` function với valid/invalid emails
- `validatePassword()` function với empty password
- `isValidReturnUrl()` function với internal/external URLs
- `getRedirectPath()` function với all roles

**Blackbox Tests:**
- Submit form với valid credentials → success redirect
- Submit form với invalid credentials → error toast
- Submit form với empty fields → validation errors
- Submit form với returnUrl → redirect to returnUrl

**Abnormal Tests:**
- Submit form với malformed email → validation error
- Submit form với external returnUrl → fallback to role-based redirect
- Submit form với protocol-relative returnUrl (`//evil.com`) → rejected

**Error Tests:**
- Network error trong authentication → generic error toast
- Session fetch error → fallback to default role
- Locale detection error → fallback to 'vi'

**E2E Tests:**
- Login as Customer → redirect to `/{locale}/dashboard`
- Login as Specialist → redirect to `/{locale}/specialist`
- Login as Reviewer → redirect to `/{locale}/reviewer`
- Login as Coordinator → redirect to `/{locale}/admin/dashboard`
- Login as Partner → redirect to `/{locale}/partner/dashboard`
- Login từ `/en/sign-in` → preserve `/en/` prefix
- Login với returnUrl → redirect to returnUrl

### 11.4. Coverage Target

**Target:** ≥90% line coverage

**Breakdown:**
- Validation functions: 100% coverage
- Authentication flow: 95% coverage
- Redirect logic: 100% coverage (all roles × all locales)
- Error handling: 90% coverage

---

## 12. Summary

### 12.1. Key Decisions

1. **No Ant Design:** Replace tất cả Ant Design components với custom Tailwind CSS
2. **react-hot-toast:** Use `toast.error()` và `toast.success()` thay vì `message.error()`
3. **Controlled Inputs:** Use React state thay vì form library
4. **Inline Validation:** Validate on blur và submit, display errors dưới fields
5. **Role-Based Redirect:** Map user role → destination path với locale prefix
6. **Locale Preservation:** Use `useLocale()` hook từ next-intl
7. **returnUrl Validation:** Strict whitelist — internal paths only, reject `//` và external URLs
8. **Conditional Demo:** Pre-fill credentials chỉ trong development mode

### 12.2. Implementation Effort

**Estimated:** 2-3 hours

**Breakdown:**
- Create Input component: 30 minutes
- Rewrite SignInForm: 1 hour
- Implement redirect logic: 30 minutes
- Testing: 1 hour

### 12.3. Risks

**Low Risk:**
- Input component creation (follows established pattern)
- Toast notification replacement (simple API)
- Form validation (standard React pattern)

**Medium Risk:**
- Role detection after login (depends on Better Auth response structure)
- returnUrl validation (security-critical, needs thorough testing)

**Mitigation:**
- Test role detection với actual Better Auth response
- Write comprehensive tests cho returnUrl validation
- Manual testing với all 5 roles trước khi commit

---

## RESEARCH COMPLETE

**Next Step:** Run `/gsd-plan-phase 74` để tạo detailed implementation plan với task breakdown, verification steps, và test cases.
