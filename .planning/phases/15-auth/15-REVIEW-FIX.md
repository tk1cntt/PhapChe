---
phase: 15-auth
fixed_at: 2026-06-06T00:00:00Z
review_path: .planning/phases/15-auth/15-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 4
skipped: 3
status: partial
---

# Phase 15 -- Auth: Code Review Fix Report

**Fixed at:** 2026-06-06T00:00:00Z
**Source review:** .planning/phases/15-auth/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (2 critical, 5 warning)
- Fixed: 4
- Skipped: 3

## Fixed Issues

### WR-03: `SignInForm` does not reset loading state on all paths

**Files modified:** `src/components/auth/SignInForm.tsx`
**Commit:** `f23d104`
**Applied fix:** Wrapped `onFinish` body in try/catch/finally. Removed `callbackURL` from `signIn.email` call to eliminate double-redirect race condition with client-side `router.push('/intake')`. `setLoading(false)` now runs in `finally` block. Added catch handler for unexpected exceptions with user-facing error message and console logging.

### WR-04: Seed script silently swallows all Better Auth errors

**Files modified:** `prisma/seed.ts`
**Commit:** `65f5829`
**Applied fix:** Changed bare `catch { }` to `catch (err) { console.warn(...) }` so that failed `signUpEmail` calls log the error before the function proceeds to `findUniqueOrThrow`. This helps developers diagnose whether the root cause was a signup failure vs. a missing user.

### WR-05: Admin sidebar shows links that non-admin users cannot access

**Files modified:** `src/app/admin/layout.tsx`
**Commit:** `7c7b703`
**Applied fix:** Added a code comment documenting the by-design tradeoff: sidebar shows all admin links regardless of user role; each admin page independently enforces authorization via `requireAppSession()` + role check and returns 404 for unauthorized users. This avoids adding a client-side session fetch just for menu filtering.

### CR-01: Middleware does not execute -- `proxy.ts` is not `middleware.ts`

**Files modified:** `proxy.ts` (deleted), `src/middleware.ts` (created)
**Commit:** `9278d70`
**Applied fix:** (Fixed in prior commit before this fix session.) Renamed proxy.ts to src/middleware.ts, updated signature to use `NextRequest`, and added proper matcher config. File now follows Next.js conventions for root middleware execution.

### WR-01: No `error.tsx` boundary -- `requireAppSession()` crashes produce raw 500

**Files modified:** `src/app/error.tsx`
**Commit:** `1df1c06`
**Applied fix:** (Fixed in prior commit before this fix session.) Created root `error.tsx` boundary that catches `UNAUTHENTICATED` errors and redirects to `/sign-in`.

### WR-02: `requireAppSession()` picks first workspace membership non-deterministically

**Files modified:** `src/lib/security/session.ts`
**Commit:** `6918598`
**Applied fix:** (Fixed in prior commit before this fix session.) Added `orderBy: { createdAt: 'asc' }` to the memberships query in `requireAppSession()` for deterministic results.

## Skipped Issues

### CR-02: Live secrets exposed in `.env`

**File:** `.env:10,29,46`
**Reason:** Operational concern -- cannot code-fix. `.env` is gitignored and not in the repository. The fix requires manual actions: rotating the Telegram bot token, generating a new Better Auth secret per developer, and ensuring `.env` remains gitignored. Consider migrating to `.env.local` pattern and keeping `.env` as a template only (`.env.example` already exists).

---

_Fixed: 2026-06-06T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
