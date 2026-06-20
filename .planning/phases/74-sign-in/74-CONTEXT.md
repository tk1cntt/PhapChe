# Phase 74: Sign-In — Context

**Created:** 2026-06-20  
**Discussed with:** --auto mode  
**Ambiguity resolved:** All gray areas auto-selected

## Domain

Authentication entry point for all user roles (Customer, Specialist, Reviewer, Coordinator Admin, Partner). Form hiện tại dùng Ant Design cần được rewrite sang custom Tailwind CSS components (per Phase 73 constraint) với role-based redirect và locale preservation.

## Locked Requirements (from SPEC.md)

- **AUTH-01**: Form displays email/password fields with validation
- **AUTH-02**: User signs in via Better Auth `authClient.signIn.email()`
- **AUTH-03**: Error message displays for invalid credentials
- **AUTH-04**: Role-based redirect after login (Customer→dashboard, Specialist→specialist, Reviewer→reviewer, Coordinator→admin, Partner→partner)
- **AUTH-05**: Inline form validation on blur/submit
- **AUTH-06**: Locale prefix preserved in all redirects using `useLocale()` hook

**Spec file:** `.planning/phases/74-sign-in/74-SPEC.md` (locked requirements — MUST read before planning)

## Prior Decisions (Carried Forward)

### From Phase 73: Shared Foundation

- ✅ **UI Framework**: Remove Ant Design dependency — project chuyển hoàn toàn sang custom Tailwind CSS components
- ✅ **Toast Notifications**: Custom Tailwind component (`react-hot-toast` library), NOT Ant Design `message.error()`
- ✅ **i18n**: 4 languages (VI/EN/ZH/JA) via next-intl
- ✅ **Better Auth**: Session management với `useSession()` hook
- ✅ **API Client**: Auto-retry 3x with exponential backoff
- ✅ **Error Handling**: Automatic redirect to `/login` on 401 responses
- ✅ **React Query**: Centralized QueryClientProvider with array-based query keys

### From Codebase Discovery

- ✅ **shadcn/ui button**: Already exists at `src/components/ui/button.tsx` — Radix UI + CVA pattern
- ✅ **Shared Skeletons**: ErrorBoundary, LoadingSkeleton, EmptyState exist in `src/components/shared/`
- ✅ **useAuth hook**: Exists at `src/hooks/useAuth.ts`
- ✅ **react-hot-toast**: Library already installed and ready for toast notifications
- ✅ **next-intl routing**: Configured with locales [vi, en, zh, ja], defaultLocale 'vi'
- ✅ **Middleware**: Auth guard already implemented in `src/middleware.ts`

## Canonical References

- `.planning/phases/74-sign-in/74-SPEC.md` — Locked requirements
- `.planning/phases/73-shared-foundation/73-SPEC.md` — Constraint: no Ant Design
- `.planning/phases/73-shared-foundation/73-CONTEXT.md` — Toast strategy, shared components
- `src/components/ui/button.tsx` — shadcn/ui button component (Radix + CVA)
- `src/components/shared/ErrorBoundary.tsx` — Error boundary implementation
- `src/components/shared/LoadingSkeleton.tsx` — Loading skeletons
- `src/components/shared/EmptyState.tsx` — Empty state template
- `src/hooks/useAuth.ts` — useAuth hook implementation
- `src/lib/auth-client.ts` — Better Auth client wrapper
- `src/middleware.ts` — i18n routing + auth guard
- `src/routing.ts` — next-intl routing configuration

## Gray Areas Resolved (--auto Selected)

### 1. Form Component Strategy

**Question:** Should the sign-in form continue using Ant Design or migrate to custom Tailwind components?

**Auto-selection:** ✅ Migrate to custom Tailwind components

**Rationale:**
- Phase 73 lock: "Remove Ant Design dependency — project sẽ chuyển hoàn toàn sang custom Tailwind CSS components"
- Ant Design imports in context.md are outdated per Phase 73 SPEC constraint
- Codebase already has shadcn/ui pattern working (`button.tsx` using Radix + CVA)
- Consistency goal: All v2.2 phases must use same UI system

**Implementation Notes:**
- Reuse shadcn/ui `button.tsx` pattern for form submission button
- Build custom Input component following same Radix + CVA pattern
- Form validation rules can stay same structure but implement without Ant Design Form

### 2. Toast/Notification Library

**Question:** Which toast library should be used for error/success messages?

**Auto-selection:** ✅ `react-hot-toast` (already installed)

**Rationale:**
- Installed in package.json (`react-hot-toast@^2.6.0`)
- Phased 73 CONTEXT.md documented this choice
- No need to add new dependency

**Implementation Notes:**
- Use `toast.error()`, `toast.success()` from react-hot-toast
- Position: top-right (default react-hot-toast behavior)
- Types: success, error, info, warning (all supported by library)

### 3. Input Component Replacement

**Question:** How to replace Ant Design Input components for email/password fields?

**Auto-selection:** ✅ Custom input components using Radix UI primitives + Tailwind

**Rationale:**
- Ant Design Input must be replaced per Phase 73 constraint
- shadcn/ui provides proven Radix pattern (see `button.tsx`)
- Follow domain-probe: Input component needs accessible, styled wrapper

**Implementation Notes:**
- Create `src/components/ui/Input.tsx` following button.tsx pattern
- Use Radix UI slots (Slot component) for flexibility
- Apply CVA variants for size/variant states
- Support error state styling (aria-invalid)

### 4. Form Validation Library

**Question:** Should form validation continue with inline rules or adopt a form library like react-hook-form?

**Auto-selection:** ⚠️ Keep simple inline validation (no react-hook-form needed yet)

**Rationale:**
- Simple form: only 2 fields (email, password)
- Adding react-hook-form would over-engineer for minimal complexity
- Inline validation with React state is sufficient
- Future complex forms (create request wizard) may benefit from react-hook-form then

**Implementation Notes:**
- Use controlled inputs with `useState` for each field
- Validate on blur event for immediate feedback
- Validate on submit for final check
- Store errors in object: `{ email?: string, password?: string }`

### 5. Demo Credentials Pre-fill

**Question:** Should demo credentials pre-fill the form on mount?

**Auto-selection:** ✅ Conditional pre-fill in development only

**Implementation:**
```typescript
const isDev = process.env.NODE_ENV === 'development';

useEffect(() => {
  if (isDev) {
    setEmail('customer.demo@example.test');
    setPassword('Demo@123456');
  }
}, []);
```

**Rationale:**
- Development: convenient for quick testing
- Production: security best practice — don't hardcode credentials
- Matches requirement AUTH-05 acceptance criteria

### 6. Redirect After Login

**Question:** How to implement role-based redirect with locale preservation?

**Auto-selection:** ✅ Dynamic role map + useLocale() hook

**Mapping:**
| Role | Destination Pattern |
|------|---------------------|
| Customer | `/{locale}/dashboard` |
| Specialist | `/{locale}/specialist` |
| Reviewer | `/{locale}/reviewer` |
| Coordinator Admin | `/{locale}/admin/dashboard` |
| Partner | `/{locale}/partner/dashboard` |

**Implementation Notes:**
- Import `useLocale()` from `next-intl`
- Get current user from `useSession()` after signIn success
- Map `user.role` → destination using lookup object
- Fallback to `/vi/dashboard` if role not recognized
- If `returnUrl` query param exists AND starts with `/` (not `//`), prioritize that

### 7. returnUrl Open-Redirect Protection

**Question:** How to safely handle returnUrl from query params?

**Auto-selection:** ✅ Strict whitelist: internal paths starting with `/` but NOT `//`

**Implementation:**
```typescript
if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
  return router.push(returnUrl);
} else {
  // fallback to role-based redirect
}
```

**Rationale:**
- `//example.com` is valid URL path that browsers interpret as external
- Must reject any external redirect attempts
- Only allow relative internal paths

## Implementation Gaps (to be addressed in plan-phase)

1. **Form Component Creation**: Build custom Input component following shadcn/ui pattern
2. **Validation Logic**: Convert Ant Design Form rules to inline validation
3. **Role Map Definition**: Create role-to-destination mapping object
4. **ReturnUrl Validation**: Implement open redirect protection logic
5. **Testing Strategy**: Test all 5 roles × 4 locales = 20 redirect scenarios

## Deferred Ideas (Scope Creep)

The following were mentioned but OUT OF SCOPE for Phase 74:

- **Forgot Password Link**: Would require password reset flow — separate phase
- **Social Login (Google/GitHub)**: OAuth providers — separate backlog item
- **Password Strength Meter**: Security enhancement — defer to future phase
- **"Remember Me" Checkbox**: Persistent session preference — separate concern

## Code Context Summary

### Existing Files to Leverage

- `src/components/ui/button.tsx` — Pattern for custom components
- `src/components/shared/ErrorFallback.tsx` — Error display pattern
- `src/hooks/useAuth.ts` — Auth state access pattern
- `src/lib/auth-client.ts` — Better Auth integration
- `src/middleware.ts` — Auth guard patterns

### Patterns to Avoid

- ❌ Ant Design components (`import { ... } from 'antd'`)
- ❌ Direct session storage access from components
- ❌ Hardcoded locale strings (always use `useLocale()`)
- ❌ Unvalidated returnUrl redirects (open redirect risk)

## Next Steps

1. **Plan-phase**: Break down into tasks (form creation, validation, redirect logic, tests)
2. **Execute**: Implement custom Tailwind form components
3. **Test**: Verify all 6 requirements pass, including edge cases

---

*Phase: 74-sign-in*  
*Context created: 2026-06-20 (auto-discuss mode)*  
*Next step: /gsd-plan-phase 74*
