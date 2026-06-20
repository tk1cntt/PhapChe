# Phase 74: Sign-In - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-20  
**Phase:** 74-sign-in  
**Areas discussed:** Form component strategy, Toast library, Input component, Form validation, Demo credentials, Redirect logic, returnUrl protection

---

## Form Component Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate to custom Tailwind | Replace Ant Design Form with custom components following shadcn/ui pattern | ✓ |
| Keep Ant Design Form | Continue using Ant Design for form handling | |

**User's choice:** Auto-selected "Migrate to custom Tailwind" (recommended default)

**Notes:**
- Phase 73 SPEC locked constraint: "Remove Ant Design dependency — project sẽ chuyển hoàn toàn sang custom Tailwind CSS components"
- Old CONTEXT.md incorrectly stated "Ant Design: UI component library chính" — this contradicts Phase 73
- Codebase already has working shadcn/ui pattern (`button.tsx` with Radix + CVA)
- Migration necessary for consistency across all v2.2 phases

---

## Toast/Notification Library

| Option | Description | Selected |
|--------|-------------|----------|
| react-hot-toast | Already installed, documented in Phase 73 | ✓ |
| sonner | Modern alternative, not installed | |
| react-toastify | Popular library, not installed | |

**User's choice:** Auto-selected "react-hot-toast" (recommended default)

**Notes:**
- Library already in package.json: `react-hot-toast@^2.6.0`
- Phase 73 CONTEXT.md explicitly chose this library
- No additional dependencies needed

---

## Input Component Replacement

| Option | Description | Selected |
|--------|-------------|----------|
| Custom Radix + Tailwind | Build Input component following button.tsx pattern | ✓ |
| shadcn/ui Input | Use existing shadcn/ui Input if available | |
| Native HTML input | Simple native input with Tailwind styling | |

**User's choice:** Auto-selected "Custom Radix + Tailwind" (recommended default)

**Notes:**
- Follows established pattern from `src/components/ui/button.tsx`
- Radix UI provides accessible primitives (focus management, keyboard navigation)
- CVA (class-variance-authority) enables consistent variant management

---

## Form Validation Library

| Option | Description | Selected |
|--------|-------------|----------|
| Inline validation with React state | Simple useState-based validation for 2 fields | ✓ |
| react-hook-form | Full-featured form library, not installed | |
| Formik | Another popular form library, not installed | |

**User's choice:** Auto-selected "Inline validation with React state" (recommended default)

**Notes:**
- Simple form with only email + password fields
- Adding react-hook-form would over-engineer for minimal complexity

---

## Demo Credentials Pre-fill

| Option | Description | Selected |
|--------|-------------|----------|
| Conditional (dev only) | Pre-fill only in NODE_ENV === 'development' | ✓ |
| Always pre-fill | Pre-fill in all environments | |
| Never pre-fill | Never auto-fill credentials | |

**User's choice:** Auto-selected "Conditional (dev only)" (recommended default)

---

## Redirect After Login

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic role map + useLocale() | Build role→destination map, use useLocale() hook | ✓ |
| Separate API endpoint | Create GET /api/auth/redirect-destination endpoint | |
| Hardcoded paths | Keep current hardcoded redirect logic | |

**User's choice:** Auto-selected "Dynamic role map + useLocale()" (recommended default)

**Notes:**
- Clean separation: role mapping logic in component, locale from hook
- No additional API call needed
- Follows requirement AUTH-04 and AUTH-06 specifications

---

## returnUrl Open-Redirect Protection

| Option | Description | Selected |
|--------|-------------|----------|
| Strict whitelist | Only allow paths starting with `/` (not `//`) | ✓ |
| No returnUrl support | Remove returnUrl handling entirely | |
| Full URL validation | Parse and validate against allowed domains | |

**User's choice:** Auto-selected "Strict whitelist" (recommended default)

**Notes:**
- `//example.com` is valid path that browsers treat as external
- Must prevent open redirect attacks

---

## Claude's Discretion

All decisions were auto-selected by --auto mode using recommended defaults. No user-provided clarifications.

## Deferred Ideas

The following were identified as scope creep and deferred to future phases:

- **Forgot Password Link**: Requires password reset flow with email verification — separate phase
- **Social Login (Google/GitHub)**: OAuth integration with multiple providers — separate backlog item  
- **Password Strength Meter**: Security enhancement with real-time feedback — defer to security hardening phase
- **"Remember Me" Checkbox**: Persistent session preference across browser sessions — separate UX enhancement

---

*Discussion log created: 2026-06-20*  
*Mode: --auto (fully autonomous, all gray areas auto-selected)*
