# Phase 74: Sign-In — Specification

**Created:** 2026-06-20
**Ambiguity score:** 0.19 (gate: ≤ 0.20)
**Requirements:** 6 locked

## Goal

Sign-in form authenticate user qua Better Auth, hiển thị error khi sai credentials, redirect đến trang đúng theo role với locale prefix được bảo toàn.

## Background

Form hiện tại (`src/components/auth/SignInForm.tsx`, 98 dòng) đang dùng Ant Design Form + Better Auth `authClient.signIn.email()`. Page wrapper (`src/app/[locale]/sign-in/page.tsx`, 15 dòng) render `<SignInForm />`.

**Current implementation (Ant Design — sẽ được rewrite):**
- Email/password fields với Ant Design Form validation
- Authentication qua `authClient.signIn.email()`
- Error message qua Ant Design `message.error()`
- Button loading state
- `returnUrl` query param support

**Gaps cần fix:**
- Redirect hardcode `/vi/dashboard` — thiếu role-based routing cho 5 roles (AUTH-04)
- Locale prefix hardcode `/vi/` — thiếu dynamic locale preservation (AUTH-06)
- Demo credentials pre-fill vô điều kiện — cần giới hạn `NODE_ENV === 'development'`
- `returnUrl` không validate internal path — lỗ hổng open redirect
- **KHÔNG sử dụng Ant Design** — phải rewrite sang custom Tailwind CSS components (constraint từ Phase 73)

**Tech stack:**
- `authClient` từ `@/lib/auth-client` — Better Auth client (signIn, useSession)
- `routing.ts` — 4 locales: vi, en, zh, ja; defaultLocale: vi
- `middleware.ts` — auth guard redirect non-authenticated users to `/vi/sign-in?returnUrl=...`
- `useLocale()` hook từ `next-intl` — dynamic locale detection
- **Custom Tailwind CSS components** — không dùng Ant Design (per Phase 73 constraint)
- Role route pages đã tồn tại cho cả 5 roles

## Requirements

1. **Sign-in form fields**: Form hiển thị email và password fields với validation.
   - Current: Form dùng Ant Design Form (sẽ được rewrite sang custom Tailwind)
   - Target: Custom Tailwind form với email (required + email format) và password (required) validation
   - Acceptance: Submit với email trống → error "emailRequired"; submit với email invalid format → error "emailInvalid"; submit với password trống → error "passwordRequired"

2. **Authentication via Better Auth**: User đăng nhập qua `authClient.signIn.email()` với email/password.
   - Current: `onFinish` gọi `authClient.signIn.email()` và xử lý error/success
   - Target: Giữ nguyên authentication flow — chỉ thay UI layer
   - Acceptance: Submit với credentials hợp lệ → `authClient.signIn.email()` return không có error; submit với credentials sai → return có error

3. **Error display**: Error message hiển thị cho invalid credentials.
   - Current: Ant Design `message.error()` (sẽ được replace)
   - Target: Custom Tailwind toast notification (top-right, error type) với i18n text
   - Acceptance: Submit với wrong credentials → custom Tailwind toast error message hiển thị với text từ i18n key `Auth.invalidCredentials`

4. **Role-based redirect**: Sau khi login thành công, redirect đến trang đúng theo user role.
   - Current: Hardcode redirect `/vi/dashboard` cho tất cả roles
   - Target: Role-based routing map:
     - Customer → `/{locale}/dashboard`
     - Specialist → `/{locale}/specialist`
     - Reviewer → `/{locale}/reviewer`
     - Coordinator → `/{locale}/admin/dashboard`
     - Partner → `/{locale}/partner/dashboard`
   - Acceptance: Login với Customer user → redirect đến `/{locale}/dashboard`; login với Specialist user → redirect đến `/{locale}/specialist`; login với Reviewer user → redirect đến `/{locale}/reviewer`; login với Coordinator user → redirect đến `/{locale}/admin/dashboard`; login với Partner user → redirect đến `/{locale}/partner/dashboard`

5. **Inline form validation**: Form validate email format và password inline trước khi submit.
   - Current: Ant Design Form rules validate on blur và on submit (sẽ được rewrite)
   - Target: Custom Tailwind form validation — validate on blur và on submit
   - Acceptance: Nhập email invalid → error hiện ngay dưới field; nhập password empty → error hiện ngay dưới field; form không submit khi có validation errors

6. **Locale prefix preservation**: Locale prefix được bảo toàn trong tất cả redirects sau login.
   - Current: Hardcode `/vi/` prefix trong redirect
   - Target: Sử dụng `useLocale()` từ `next-intl` để detect current locale; tất cả redirects dùng `/{locale}/...` prefix
   - Acceptance: Login từ `/en/sign-in` → redirect đến `/en/dashboard` (hoặc role-specific path); login từ `/vi/sign-in` → redirect đến `/vi/dashboard`; locale prefix trong URL sau redirect match locale trước khi login

## Boundaries

**In scope:**
- Enhance `SignInForm.tsx` — role-based redirect logic + locale-aware redirects
- Conditional demo credentials pre-fill (development only)
- `returnUrl` validation — chỉ accept internal paths (bắt đầu bằng `/`)
- Role routing map cho 5 roles: Customer, Specialist, Reviewer, Coordinator, Partner

**Out of scope:**
- Tạo route pages mới cho Specialist/Reviewer — đã tồn tại trong codebase, phase này chỉ redirect đến chúng
- Forgot password flow — không có trong v2.2 requirements
- Social login (Google/GitHub) — defer to future
- Password strength validation enhancement — security hardening riêng
- Sign-up form — separate concern
- Session management / token refresh — handled bởi Better Auth library
- Middleware auth guard changes — đã hoạt động, không cần sửa

## Constraints

- **KHÔNG sử dụng Ant Design components** — tất cả UI components dùng custom Tailwind CSS (constraint từ Phase 73)
- Phải sử dụng `authClient` từ `@/lib/auth-client` — không direct API call
- Phải sử dụng `useLocale()` từ `next-intl` — không parse locale từ URL thủ công
- Redirect destination phải là internal path (bắt đầu bằng `/`) — chống open redirect
- Nếu `returnUrl` query param tồn tại và valid, ưu tiên redirect về `returnUrl` thay vì role-based default
- Demo credentials pre-fill chỉ trong `NODE_ENV === 'development'`

## Acceptance Criteria

- [ ] AUTH-01: Email field hiển thị error khi trống hoặc invalid format
- [ ] AUTH-01: Password field hiển thị error khi trống
- [ ] AUTH-02: Submit credentials hợp lệ → user authenticated thành công (session created)
- [ ] AUTH-02: Submit credentials sai → authentication thất bại
- [ ] AUTH-03: Wrong credentials → custom Tailwind toast error message hiển thị với i18n text
- [ ] AUTH-04: Customer login → redirect đến `/{locale}/dashboard`
- [ ] AUTH-04: Specialist login → redirect đến `/{locale}/specialist`
- [ ] AUTH-04: Reviewer login → redirect đến `/{locale}/reviewer`
- [ ] AUTH-04: Coordinator login → redirect đến `/{locale}/admin/dashboard`
- [ ] AUTH-04: Partner login → redirect đến `/{locale}/partner/dashboard`
- [ ] AUTH-04: `returnUrl` query param (internal path) → ưu tiên redirect về returnUrl
- [ ] AUTH-05: Validation errors hiện inline dưới field trước submit
- [ ] AUTH-05: Form không submit khi có validation errors
- [ ] AUTH-06: Login từ `/en/sign-in` → redirect preserves `/en/` prefix
- [ ] AUTH-06: Login từ `/vi/sign-in` → redirect preserves `/vi/` prefix
- [ ] AUTH-06: Login từ `/zh/sign-in` → redirect preserves `/zh/` prefix
- [ ] AUTH-06: Login từ `/ja/sign-in` → redirect preserves `/ja/` prefix
- [ ] returnUrl bắt đầu bằng `http://` hoặc `//` → rejected, fallback to role-based redirect
- [ ] Demo credentials chỉ pre-fill trong `NODE_ENV === 'development'`
- [ ] Loading state hiển thị trên button khi authenticate

## Edge Coverage

**Coverage:** 3/5 applicable edges resolved · 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| empty | AUTH-03 | ✅ covered | API error response rỗng → fallback hiển thị generic error message (i18n key `Auth.genericError`) |
| encoding | AUTH-03 | ⛔ dismissed | Error message dùng i18n keys (`Auth.invalidCredentials`, `Auth.genericError`), không render raw API response text — encoding edge không tồn tại |
| adjacency | AUTH-04 | 🧪 backstop | Role routing map correctness — held-out edge test verify tất cả 5 roles map đến đúng destination paths |
| empty | AUTH-06 | ✅ covered | `useLocale()` return unknown/empty value → fallback to `routing.defaultLocale` ('vi') |
| ordering | AUTH-06 | ⛔ dismissed | Single user có exactly one role — ordering edge không applicable |

## Prohibitions (must-NOT)

**Coverage:** 1/2 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| MUST NOT use Ant Design components | All | resolved | verification: judgment — per Phase 73 constraint, all UI dùng custom Tailwind CSS |
| MUST NOT redirect to external domain via returnUrl | AUTH-04 | resolved | verification: test — validate returnUrl starts with `/` and does not start with `//`; reject external URLs |
| MUST NOT reveal whether email exists in system | AUTH-02, AUTH-03 | dismissed | Better Auth library đã dùng generic error message cho cả "email not found" và "wrong password" — OWASP canonical concern, owned by Better Auth framework, not application-level |

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                    |
|--------------------|-------|------|--------|------------------------------------------|
| Goal Clarity       | 0.85  | 0.75 | ✓      | 6 requirements rõ ràng, testable         |
| Boundary Clarity   | 0.80  | 0.70 | ✓      | Enhancement scope rõ, form đã tồn tại    |
| Constraint Clarity | 0.75  | 0.65 | ✓      | Tech stack xác định, role map finalized   |
| Acceptance Criteria| 0.80  | 0.70 | ✓      | 20 pass/fail criteria covering all reqs  |
| **Ambiguity**      | 0.19  | ≤0.20| ✓      |                                          |

## Interview Log

| Round | Perspective    | Question summary                              | Decision locked                                                    |
|-------|----------------|-----------------------------------------------|--------------------------------------------------------------------|
| —     | auto           | Phase requirements derived from ROADMAP + CONTEXT | Role-based redirect map, locale preservation strategy, demo creds dev-only |
| —     | auto (edge)    | Edge probe: 9 applicable edges                | 3 covered, 2 dismissed, 1 backstop; 4 unclassified left unresolved |
| —     | auto (prohib)  | Prohibition probe: open redirect, email enumeration | Open redirect → resolved/test; email reveal → dismissed (Better Auth handles) |

**Auto-selected decisions:**
1. **Role routing map**: Derived từ CONTEXT.md analysis + codebase route verification
2. **Locale detection**: `useLocale()` hook — standard next-intl pattern, no manual URL parsing
3. **returnUrl validation**: Must start with `/` and not `//` — prevents open redirect while allowing deep linking
4. **Demo credentials**: `NODE_ENV === 'development'` guard — security for production, convenience for dev
5. **Edge: encoding dismissed**: Error messages use i18n keys, not raw API text — no encoding edge exists
6. **Edge: ordering dismissed**: Users have exactly one role — no ordering ambiguity
7. **Prohibition: email enumeration dismissed**: Better Auth uses generic errors for both "user not found" and "wrong password" — canonical OWASP concern owned by framework

**Corrections after review:**
- Added "no Ant Design" constraint from Phase 73 — all UI components dùng custom Tailwind CSS
- Updated error display requirement from "Ant Design message.error()" to "custom Tailwind toast"
- Updated form validation requirement to reflect custom Tailwind form (not Ant Design Form)
- Added prohibition: MUST NOT use Ant Design components

---

*Phase: 74-sign-in*
*Spec created: 2026-06-20*
*Next step: /gsd-discuss-phase 74 — implementation decisions (how to implement role-based redirect, session handling, etc.)*
