---
phase: 15-auth
created: 2026-06-05
version: 1.0
status: draft
---

# Phase 15: auth — Validation Strategy

## Test Infrastructure

### Unit Tests
- **auth wrapper test** — `src/lib/security/session.test.ts`: test adapted `requireAppSession()` returns correct `AppSession` shape with mocked Better Auth session
- **sign-in form test** — `src/components/auth/SignInForm.test.tsx`: test form validation, error states, redirect on success

### Integration Tests
- **Auth flow test** — `src/lib/auth.e2e.test.ts`: sign-up with email/password, sign-in, session persists, sign-out clears session, protected route redirects

### Verification Points
1. Login page renders at `/sign-in` with email + password fields and Ant Design styling
2. Valid credentials redirect to `/intake`
3. Invalid credentials show error message (no redirect)
4. Unauthenticated access to `/admin/*` redirects to `/sign-in`
5. `requireAppSession()` returns `AppSession` with `userId`, `activeWorkspaceId`, `roles`
6. Seed users can sign in with their seeded password
7. Admin users page shows real DB users (not mock data)

## Test Data
- Seed script creates 5 users mirroring existing mock data, with passwords via `auth.api.signUpEmail()`
- Test database uses existing e2e seed pattern (prefix-based cleanup)
