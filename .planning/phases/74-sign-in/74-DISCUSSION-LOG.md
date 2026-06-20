# Phase 74: Sign-In — Discussion Log

**Date:** 2026-06-20
**Mode:** discuss (with auto-recommendations)

---

## Gray Areas Discussed

### 1. Error Message Display Strategy

**Options Presented:**
- A. Toast notification (Ant Design message.error)
- B. Inline validation dưới mỗi field
- C. Summary banner ở đầu form
- D. Hybrid approach

**Decision:** A — Ant Design `message.error()`

**Rationale:**
- Already implemented trong code hiện tại
- Consistent với Ant Design migration (Phase 10)
- Non-intrusive UX phù hợp Vietnamese users
- No rework needed

---

### 2. Redirect After Login

**Options Presented:**
- A. Single destination (hardcode /dashboard)
- B. Role-based routing (different destinations per role)
- C. Let user choose destination
- D. Always use returnUrl query param

**Decision:** B — Role-based routing + locale preservation

**Mapping:**
- Customer → `/[locale]/dashboard`
- Specialist → `/[locale]/specialist` (verify route exists)
- Reviewer → `/[locale]/reviewer` (verify route exists)
- Coordinator Admin → `/[locale]/admin/dashboard`
- Partner → `/[locale]/partner/dashboard`

**Rationale:**
- Meets AUTH-04 requirement (role-based redirect)
- Meets AUTH-06 requirement (locale prefix)
- Better UX — user lands on relevant dashboard immediately
- returnUrl query param vẫn được ưu tiên nếu có (deep linking)

---

### 3. Form Validation Rules

**Options Presented:**
- A. Real-time validation (onBlur)
- B. Submit-only validation
- C. Hybrid approach

**Decision:** A — Ant Design Form rules (real-time)

**Rationale:**
- Already implemented với Ant Design Form
- Standard pattern cho form validation
- User-friendly: errors hiện ngay dưới field
- Covers required + email format + password length

---

### 4. Loading State Management

**Options Presented:**
- A. Button spinner (loading prop)
- B. Full-page overlay
- C. Skeleton card
- D. No explicit loading

**Decision:** A — Button loading prop

**Rationale:**
- Already implemented trong SignInForm
- Simple, non-blocking UX
- Ant Design Button handles accessibility
- Fast auth flow (< 1s typical)

---

### 5. Demo Credentials Handling

**Options Presented:**
- A. Always pre-fill (current behavior)
- B. Never pre-fill
- C. Conditional pre-fill (dev mode only)

**Decision:** C — Conditional pre-fill

**Rationale:**
- Development: tiện lợi cho testing với seed data
- Production: security, không expose demo credentials
- Standard practice cho authentication forms

---

### 6. Locale Detection and Preservation

**Options Presented:**
- A. Hardcode /vi/ prefix
- B. Dynamic detection via useLocale()
- C. Browser language detection

**Decision:** B — Dynamic detection via `useLocale()` hook

**Rationale:**
- Supports all 4 languages (VI/EN/ZH/JA)
- Leverages next-intl infrastructure
- Locale preserved throughout user journey
- Meets AUTH-06 requirement

---

## Deferred Ideas

**Noted for future phases:**
- Password strength validation — security hardening có thể thêm sau
- "Forgot password" link — feature chưa có trong v2.2 requirements
- Social login (Google/GitHub) — out of scope, defer to v2.3+
- Remember me checkbox — nice-to-have, defer if scope creeps

---

## Codebase Findings

**Existing Implementation (98 lines):**
- File: `src/components/auth/SignInForm.tsx`
- Uses Ant Design Form, Better Auth, next-intl
- Status: 80% complete, working but needs polish

**Integration Points:**
- `authClient` từ `@/lib/auth-client`
- `useSession()` hook from Better Auth
- `useLocale()` hook from next-intl
- `useRouter()` and `useSearchParams()` from next/navigation

**Role Routes (needs verification in planning):**
- Customer dashboard: ✅ exists
- Specialist workbench: ⚠️ verify path
- Reviewer portal: ⚠️ verify path
- Admin dashboard: ✅ exists
- Partner dashboard: ✅ exists (v2.1)

---

## Summary

**Phase 74 là enhancement phase, không phải new build.**

**Completed:**
- 4/6 requirements đã working (AUTH-01, 02, 03, 05)
- Form validation, error handling, loading state

**Gaps to fix:**
- AUTH-04: Role-based redirect logic
- AUTH-06: Locale prefix preservation

**Additional improvements:**
- Demo credentials: conditional pre-fill (dev only)
- Better integration với next-intl locale system

**Estimated effort:** Small — mostly adding logic to existing implementation
