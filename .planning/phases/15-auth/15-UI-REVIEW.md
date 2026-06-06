# Phase 15 — UI Review

**Audited:** 2026-06-06
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md exists)
**Screenshots:** Not captured (no dev server running)
**Audit type:** Code-only audit

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Vietnamese labels consistent but "Tao nguoi dung" button has no handler, dead UI element |
| 2. Visuals | 3/4 | Clean card layout but inline background color `#F0F2F5` differs from theme `#F8FAFC` |
| 3. Color | 3/4 | Hardcoded hex values in admin layout and sign-in form override theme tokens |
| 4. Typography | 4/4 | Consistent use of Ant Design Typography system, no font sprawl across auth scope |
| 5. Spacing | 3/4 | Inline pixel spacing without theme token references, no project spacing scale |
| 6. Experience Design | 3/4 | Loading state on submit; but dead button, no admin page loading skeleton, no empty state |

**Overall: 19/24**

---

## Top 3 Priority Fixes

1. **"Tao nguoi dung" button has no onClick handler** — Admin users page renders a submit-style primary button that does nothing on click. User clicks and no action occurs, causing confusion. Fix: wire up a modal/form flow, or remove the button until the feature is implemented. (`src/app/admin/users/page.tsx:131`)

2. **Hardcoded colors inconsistent with theme tokens** — SignInForm uses `background: '#F0F2F5'` while theme configures `colorBgLayout: '#F8FAFC'`. Admin layout hardcodes `#0F766E`, `#E2E8F0`, `#F8FAFC` inline. These should reference the ConfigProvider theme or CSS variables. Fix: replace all inline hex colors with semantic theme references. (`src/components/auth/SignInForm.tsx:37`, `src/app/admin/layout.tsx:33-70`, `src/app/admin/users/page.tsx:95-98`)

3. **No loading skeleton for admin users async page** — The admin/users page is an async server component that fetches from Prisma, but neither a `loading.tsx` nor a streaming Suspense boundary exists. Users see a blank page during fetch. Fix: add `loading.tsx` in `src/app/admin/users/` with Ant Design Skeleton or Spin component.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Findings:**

- **SignInForm uses appropriate Vietnamese labels throughout** — "Dang nhap" (button), "Email la bat buoc", "Mat khau la bat buoc", "Email khong hop le". All validation messages are user-friendly and in Vietnamese. Good. (`src/components/auth/SignInForm.tsx:46-47, 54, 60`)
- **Deliberately generic error message** — "Email hoac mat khau khong dung" does not distinguish "email not found" from "wrong password", mitigating enumeration attacks (T-15-06). Good. (`src/components/auth/SignInForm.tsx:24`)
- **Catch-all error** — "Co loi xay ra, vui long thu lai" handles unexpected exceptions gracefully. (`src/components/auth/SignInForm.tsx:29`)
- **Admin page title and column headers** — "Quan ly nguoi dung", "Ten", "Email", "Vai tro", "Workspace", "Trang thai" all in clear Vietnamese. Good. (`src/app/admin/users/page.tsx:56-90`)
- **Concern: "Tao nguoi dung" button has no onClick** — Renders as a primary button but no handler is attached. This is a dead UI element — users will click it expecting a creation flow and nothing happens. (`src/app/admin/users/page.tsx:131`)
- **Concern: Footer description references internal function names** — "Thay doi user/role/workspace goi createAdminUser, updateAdminUserRole, deactivateAdminUser, assignUserToWorkspace va duoc ghi audit" contains code-level function references that an admin user would not understand. Rewrite as user-facing instructions. (`src/app/admin/users/page.tsx:116`)

### Pillar 2: Visuals (3/4)

**Findings:**

- **SignInForm has clean centered card layout** — Card at 420px width, vertically centered on a light background. Logical form flow: title, email field, password field, submit button. Good visual hierarchy. (`src/components/auth/SignInForm.tsx:36-65`)
- **Icon prefixes on inputs** — `MailOutlined` and `LockOutlined` provide visual cues for field purpose. Good. (`src/components/auth/SignInForm.tsx:50, 56`)
- **Admin page has clear sectioning** — Title + subtitle at top, system roles info card, user data table, action button at bottom. Proper visual grouping. (`src/app/admin/users/page.tsx:92-133`)
- **Role tags with distinct colors** — Five role colors (default, blue, orange, cyan, red) make role types scannable. Good. (`src/app/admin/users/page.tsx:70-72`)
- **Concern: Background color inconsistency** — SignInForm uses `background: '#F0F2F5'` but the project theme configures `colorBgLayout: '#F8FAFC'`. These should match. (`src/components/auth/SignInForm.tsx:37`)
- **Concern: Admin sidebar has no collapse affordance** — The Sider supports `collapsedWidth={64}` (responsive breakpoint `lg`), but there is no visible collapse button or tooltip on collapsed icons, making navigation less obvious on small screens. (`src/app/admin/layout.tsx:34-37`)
- **No brand imagery** — The sign-in card uses plain text "GitNexus Legal" with no logo or icon. Acceptable for MVP but visually minimal.

### Pillar 3: Color (3/4)

**Findings:**

The Ant Design theme defines a clean palette (`src/app/providers/antd-provider.tsx:8-23`):
- Primary: `#0F766E` (teal-700) — appropriate for a legal/trust brand
- Layout bg: `#F8FAFC` (slate-50)
- Text: `#0F172A` (slate-900)
- Secondary: `#475569` (slate-600)
- Border: `#E2E8F0` (slate-200)

- **Role color mapping is semantic** — neutral (default), info (blue), warning (orange), accent (cyan), destructive (red) map to distinct Ant Design Tag colors. Clear intent. (`src/app/admin/users/page.tsx:14-19`)
- **Status tag uses semantic colors** — cyan for active, red for inactive. Good. (`src/app/admin/users/page.tsx:86`)
- **Concern: Hardcoded hex overrides in admin layout** — Border color `#E2E8F0`, brand color `#0F766E`, background `#F8FAFC` and `#FFFFFF` are all hardcoded in inline styles rather than referencing theme tokens. (`src/app/admin/layout.tsx:38, 41, 55, 68`)
- **Concern: SignInForm background differs from theme** — Uses `#F0F2F5` instead of theme's `colorBgLayout: '#F8FAFC'`. (`src/components/auth/SignInForm.tsx:37`)
- **Concern: Admin users page uses inline hex for descriptions** — `color: '#475569'` on Paragraph elements instead of Ant Design's `type="secondary"` prop. (`src/app/admin/users/page.tsx:98, 115`)
- **Concern: Primary button uses theme token correctly** — The submit button `type="primary"` picks up theme primary color `#0F766E`. This is the correct pattern. The sidebar brand text hardcodes `#0F766E` instead of using the same token. (`src/app/admin/layout.tsx:41`)

### Pillar 4: Typography (4/4)

**Findings:**

- **Consistent Ant Design Typography usage** — `Typography.Title` with levels 3 and 4 are the only typographic elements. No manual font-size sprawl within the auth scope. Good. (`src/components/auth/SignInForm.tsx:39`, `src/app/admin/users/page.tsx:95, 105`)
- **Admin page overrides Title font sizes** — `fontSize: 30` overrides Title level 3 default; `fontSize: 20` overrides Title level 4 default. While not harmful, this mixes the Typography hierarchy with inline overrides, reducing the value of using semantic levels. (`src/app/admin/users/page.tsx:95, 105`)
- **Font stack** — Uses system UI font stack from globals.css (`ui-sans-serif, system-ui, -apple-system, ...`). Performant and consistent. (`src/app/globals.css:12-14`)
- **No custom fonts** — Acceptable for MVP. No font loading overhead.

### Pillar 5: Spacing (3/4)

**Findings:**

- **SignInForm centered layout** — Uses flexbox centering with `justifyContent: center`, `alignItems: center`. Good structural approach. (`src/components/auth/SignInForm.tsx:37`)
- **Admin page uses Ant Design spacing components** — Flex with `gap={4}` for title area, `gap={8}` for tag wrapping, Space with `size={16}` for card content. Consistent internal spacing. (`src/app/admin/users/page.tsx:94, 103, 108`)
- **Concern: All spacing values are hardcoded pixels** — `marginBottom: 32`, `marginBottom: 16`, `marginTop: 16`, `padding: 24`, `padding: '16px'` — no reference to a spacing scale or theme token. If the design system changes token values, these won't update. (`src/components/auth/SignInForm.tsx:39`, `src/app/admin/users/page.tsx:94, 103, 130`, `src/app/admin/layout.tsx:40, 57, 67`)
- **Concern: No spacing token reuse** — The project's Ant Design theme does not define custom spacing tokens, and inline values don't reference any CSS custom properties or Tailwind spacing scale. Spacing is implicitly the Ant Design defaults plus arbitrary pixel values.

### Pillar 6: Experience Design (3/4)

**Findings:**

- **SignInForm loading state** — Submit button shows loading spinner during async auth call, prevents double-submit. Good. (`src/components/auth/SignInForm.tsx:12, 59`)
- **Try/catch error handling** — Network/unexpected errors are caught with user-friendly message and console.error for debugging. Good. (`src/components/auth/SignInForm.tsx:28-31`)
- **Global error.tsx handles UNAUTHENTICATED** — Redirects to /sign-in. Covers the case where session expires mid-session. Good architectural choice. (`src/app/error.tsx:10-12`)
- **Proxy middleware redirects** — Unauthenticated users get redirected to /sign-in via middleware. Good. (`src/middleware.ts:4-6`)
- **Admin page RBAC** — Server-side role check calls `notFound()` for unauthorized users. Defense-in-depth. (`src/app/admin/users/page.tsx:28`)
- **Concern: No loading.tsx for admin users page** — Async server component fetches all users from Prisma before rendering. No loading skeleton, spinner, or Suspense fallback exists. User sees blank page during fetch. Fix: add `src/app/admin/users/loading.tsx`.
- **Concern: "Tao nguoi dung" button is decorative** — Primary button with no onClick handler. User expects a user creation flow but gets no feedback. (`src/app/admin/users/page.tsx:131`)
- **Concern: No empty state for users table** — If no users exist, the table renders with headers only and zero rows. No message like "Chua co nguoi dung nao" (No users yet). Ant Design Table shows no built-in empty fallback configured. (`src/app/admin/users/page.tsx:121-128`)
- **Concern: No password visibility toggle on sign-in** — Ant Design `Input.Password` has a built-in show/hide toggle via `iconRender`, but it is rendered without custom configuration. The default toggle may be present depending on Ant Design version; should verify at runtime. (`src/components/auth/SignInForm.tsx:56`)
- **Note: No "remember me" or "forgot password"** — Acceptable for MVP. The `rememberMe` parameter from the PLAN was omitted in the actual `authClient.signIn.email()` call. (`src/components/auth/SignInForm.tsx:18-20`)

---

## Registry Safety Audit

**Status:** Skipped — no `components.json` found (shadcn not initialized in this project).

---

## Files Audited

- `src/app/(auth)/sign-in/page.tsx` — 5 lines, server component wrapping SignInForm
- `src/components/auth/SignInForm.tsx` — 67 lines, Ant Design login form with email/password
- `src/app/admin/users/page.tsx` — 135 lines, server component with real DB data + RBAC
- `src/middleware.ts` — 14 lines, auth proxy redirect middleware
- `src/app/providers/antd-provider.tsx` — 85 lines, Ant Design theme configuration
- `src/app/admin/layout.tsx` — 78 lines, admin layout with sidebar navigation
- `src/app/error.tsx` — 17 lines, global error boundary
- `src/app/globals.css` — 38 lines, base CSS reset and font stack
- `src/lib/security/session.ts` — 40 lines, adapted requireAppSession() with Better Auth
