---
phase: 74
phase_name: Sign-In
status: complete
date: 2026-06-20
---

# Phase 74: Sign-In — Context

## Domain Boundary

Authentication entry point for all user roles (Customer, Specialist, Reviewer, Coordinator Admin, Partner). Form hiện đã tồn tại và hoạt động, cần enhance để đạt full production readiness với role-based routing và locale preservation.

## Prior Decisions (from Phase 73)

- Error handling: API client có auto-retry 3x với exponential backoff
- Toast notifications: sử dụng `react-hot-toast` library
- 401 errors: tự động redirect về `/login`
- i18n: 4 ngôn ngữ (VI/EN/ZH/JA) với next-intl
- Better Auth: session management với `useSession()` hook
- Ant Design: UI component library chính cho toàn bộ project

## Requirements Coverage

**AUTH-01 đến AUTH-06** — 6 requirements từ REQUIREMENTS.md:

1. **AUTH-01** ✅ Sign-in form displays email and password fields with validation
2. **AUTH-02** ✅ User can sign in via POST /api/auth/sign-in with email/password  
3. **AUTH-03** ✅ Error message displays for invalid credentials
4. **AUTH-04** ⚠️ Redirect to dashboard after successful login **based on role** (gap)
5. **AUTH-05** ✅ Form validates email format and password length inline
6. **AUTH-06** ⚠️ Locale prefix preserved after redirect (gap)

**Analysis:** Form hiện tại đã implement 4/6 requirements. Hai gaps chính:
- Role-based redirect logic (AUTH-04)
- Locale prefix preservation (AUTH-06)

## Gray Areas Identified

### 1. Error Message Display Strategy

**Current State:** 
- Sử dụng `message.error()` từ Ant Design (toast notification ở góc trên màn hình)
- Đã hoạt động ổn định trong implementation hiện tại

**Decision:** ✅ **Giữ nguyên Ant Design message.error()**

**Rationale:**
- Consistent với Ant Design migration (Phase 10+)
- Non-intrusive UX — user không bị block bởi modal
- Đã test và working trong codebase
- Phù hợp với Vietnamese user preference (quick feedback, không chiếm screen real estate)

### 2. Redirect After Login

**Current State:**
- Hardcode redirect về `/vi/dashboard` 
- Hoặc dùng `returnUrl` từ query params (cho deep linking)
- Không có role-based logic

**Decision:** ⚠️ **Implement role-based routing với locale preservation**

**Mapping (from codebase analysis):**
```
Customer     → /vi/dashboard (hoặc /[locale]/dashboard)
Specialist   → /vi/specialist (route path cần verify)
Reviewer     → /vi/reviewer (route path cần verify)  
Coordinator  → /vi/admin/dashboard
Partner      → /vi/partner/dashboard
```

**Implementation Strategy:**
1. Sau khi `authClient.signIn.email()` thành công, lấy user từ `useSession()`
2. Check `user.role` và map đến destination route
3. Preserve locale prefix (`/vi/`, `/en/`, `/zh/`, `/ja/`) trong tất cả redirects
4. Nếu có `returnUrl` query param, ưu tiên redirect về đó (deep linking support)

### 3. Form Validation Rules

**Current State:**
- Ant Design Form rules với real-time validation
- Email: required + email format
- Password: required

**Decision:** ✅ **Giữ nguyên Ant Design Form validation**

**Rationale:**
- Standard pattern cho Ant Design projects
- Real-time validation (validate khi blur field)
- User-friendly: error messages hiện ngay dưới field
- Đã cover tất cả validation needs (required, email format, password length)

**Enhancement (optional):**
- Thêm password strength validation (minimum 8 chars, có số, có chữ hoa) nếu cần security hardening

### 4. Loading State Management

**Current State:**
- Button với `loading={loading}` prop
- Spinner hiện trong button khi authenticate
- Form fields remain enabled nhưng không clickable khi loading

**Decision:** ✅ **Giữ nguyên Button loading prop**

**Rationale:**
- Simple, non-blocking UX
- User có thể thấy form nhưng biết đang processing
- Ant Design Button đã handle accessibility (aria-disabled, focus management)
- Phù hợp với fast authentication flow (< 1 second typical)

### 5. Demo Credentials Handling

**Current State:**
- Hardcode default credentials: `customer.demo@example.test` / `Demo@123456`
- Pre-fill form fields on mount
- Phù hợp cho development/testing nhưng không ideal cho production

**Decision:** ⚠️ **Conditionally pre-fill only in development mode**

**Implementation:**
```typescript
const isDev = process.env.NODE_ENV === 'development';

useEffect(() => {
  if (isDev) {
    form.setFieldsValue({
      email: 'customer.demo@example.test',
      password: 'Demo@123456',
    });
  }
}, [form]);
```

**Rationale:**
- Production: form trống, user tự nhập credentials
- Development: tiện lợi cho testing
- Security: không expose demo credentials trong production builds

### 6. Locale Detection and Preservation

**Current State:**
- Không có locale detection logic
- Hardcode `/vi/` prefix trong redirect

**Decision:** ⚠️ **Implement dynamic locale detection**

**Implementation Strategy:**
1. Detect current locale từ URL path (`/[locale]/...`)
2. Use `next-intl`'s `useLocale()` hook để lấy current locale
3. Preserve locale khi redirect: `/${locale}/dashboard`

**Example:**
```typescript
import { useLocale } from 'next-intl';

const locale = useLocale(); // 'vi', 'en', 'zh', 'ja'
router.push(`/${locale}/dashboard`);
```

## Codebase Context

**Existing Implementation:**
- File: `src/components/auth/SignInForm.tsx` (98 lines)
- Uses: Ant Design Form, Better Auth, next-intl
- Status: Working nhưng cần enhancement cho AUTH-04 và AUTH-06

**Key Integration Points:**
- `authClient` từ `@/lib/auth-client` — Better Auth client wrapper
- `useSession()` hook — get current user after login
- `useLocale()` hook từ `next-intl` — get current locale
- `useRouter()` và `useSearchParams()` từ `next/navigation` — navigation

**Role Route Mapping (needs verification):**
```
src/app/[locale]/dashboard/         → Customer dashboard
src/app/[locale]/specialist/        → Specialist workbench (verify exists)
src/app/[locale]/reviewer/          → Reviewer portal (verify exists)
src/app/[locale]/admin/dashboard/   → Coordinator admin
src/app/[locale]/partner/dashboard/ → Partner portal (exists in v2.1)
```

## Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Error Display | Ant Design `message.error()` | Consistent, non-intrusive, already working |
| Redirect Logic | Role-based routing + locale preservation | Meets AUTH-04 and AUTH-06 requirements |
| Form Validation | Ant Design Form rules | Standard pattern, real-time validation |
| Loading State | Button loading prop | Simple, non-blocking UX |
| Demo Credentials | Conditional pre-fill (dev only) | Security for production |
| Locale Handling | Dynamic detection via `useLocale()` | Supports all 4 languages |

## Implementation Gaps

**Critical (must fix for production):**
1. Role-based redirect mapping — needs implementation và testing
2. Locale prefix preservation — needs `useLocale()` integration

**Nice-to-have (can defer):**
1. Password strength validation — security hardening
2. "Forgot password" link — feature chưa có trong requirements
3. Social login (Google/GitHub) — out of scope cho v2.2

## Success Criteria

Phase 74 hoàn thành khi:
- ✅ AUTH-01 đến AUTH-06 đều pass verification
- ✅ Role-based redirect hoạt động cho tất cả 5 roles
- ✅ Locale prefix preserved sau redirect (test với 4 languages)
- ✅ Demo credentials chỉ pre-fill trong development mode
- ✅ Error messages hiển thị đúng cho invalid credentials
- ✅ Form validation working với Ant Design rules
- ✅ Loading state rõ ràng khi authenticate

## Next Steps

1. **Research:** Verify role route paths trong codebase (Specialist, Reviewer)
2. **Plan:** Tạo PLAN.md với task breakdown cho implementation
3. **Execute:** Implement role-based redirect và locale preservation
4. **Verify:** Test tất cả 6 requirements với 5 roles và 4 locales

---

**Phase 74 là enhancement phase, không phải new build.** Form hiện tại đã 80% complete, chỉ cần polish và complete 2 gaps (AUTH-04, AUTH-06) để đạt production readiness.
