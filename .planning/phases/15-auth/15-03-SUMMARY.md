---
phase: 15-auth
plan: 03
type: execute
completed: 2026-06-05T12:58:00Z
duration: ~4m
tasks:
  total: 3
  completed: 3
key_files:
  created:
    - src/app/(auth)/sign-in/page.tsx
    - src/components/auth/SignInForm.tsx
  modified:
    - prisma/seed.ts
    - src/app/admin/users/page.tsx
decisions:
  - "auth.ts import path in prisma/seed.ts is '../src/auth' (not '../auth') because auth.ts lives in src/ directory for @/ path alias compatibility"
  - "Seed uses auth.api.signUpEmail() for password hashing via Account table (providerId: 'credential') instead of manual bcrypt"
  - "Ant Design components work in server components because antd v6 ships built-in 'use client' directives"
requires:
  - 15-02 (Better Auth infrastructure: auth instance, proxy, API route, client SDK, adapted session)
provides:
  - "Login page at /sign-in with Ant Design form (email + password + submit button)"
  - "On success redirects to /intake; on error shows generic message"
  - "Seed script creates password-hashed users via Better Auth API"
  - "Admin users page fetches real data from database instead of mock data"
affects:
  - All users using login page (authentication flow)
  - Admin users page consumers (now shows real DB data)
tech-stack:
  added: []
  patterns:
    - "Ant Design form with authClient.signIn.email() for login"
    - "Seed using auth.api.signUpEmail() for programmatic user creation with password hashing"
    - "Server component with requireAppSession() + prisma.user.findMany() for admin data display"
---

# Phase 15 Plan 3: Login Page UI and Seed Data

Build the user-facing login page, update seed data with password-hashed users, and convert the admin users page from mock to real data.

## Commits

| Task | Description | Hash |
|------|-------------|------|
| 1 | feat(15-auth-03): create sign-in page and SignInForm component | 6d13b5b |
| 2 | feat(15-auth-03): update seed script to create users with Better Auth password hashes | 0924b2e |
| 3 | feat(15-auth-03): update admin users page to query real data from database | 8797505 |

## Task Results

### Task 1: Create sign-in page and SignInForm component

- Created `src/app/(auth)/sign-in/page.tsx` -- lightweight server component that renders `<SignInForm />`
- Created `src/components/auth/SignInForm.tsx` -- client component with Ant Design Card layout:
  - Card with title "GitNexus Legal"
  - Email field with required validation and email type check
  - Password field with required validation
  - Submit button "Dang nhap" with loading state
  - On success: calls `authClient.signIn.email()` with `callbackURL: '/intake'`, then `router.push('/intake')`
  - On error: shows `message.error('Email hoac mat khau khong dung')` -- deliberately generic to prevent email enumeration
- Matches threat model T-15-06 (Information Disclosure mitigated by generic error message)

### Task 2: Update seed script to create users with passwords via Better Auth

- Rewrote `prisma/seed.ts` from manual `prisma.user.upsert()` to use `auth.api.signUpEmail()` for password hashing
- `ensureUser()` function checks for existing Account records first (idempotent)
- Two demo users created with password `Demo@123456`:
  - `specialist.demo@example.test` (role: specialist)
  - `reviewer.demo@example.test` (role: reviewer)
- Password hashes stored in Account table under `providerId: 'credential'` (161-char scrypt hash)
- Existing data seeding (workspace, matter types, memberships, routing capabilities) preserved
- Import path changed from `'../auth'` to `'../src/auth'` -- Rule 1 deviation (auth.ts is in src/ for @/ path alias compatibility)
- Seed runs idempotently -- verified with two consecutive runs

### Task 3: Update admin users page to query real data from database

- Removed `'use client'` directive -- page is now an async server component
- Uses `requireAppSession()` for authentication and RBAC check
- Only `super_admin` or `coordinator_admin` roles can access the page; `notFound()` for unauthorized
- Fetches data from `prisma.user.findMany()` with workspace membership selection
- Real data in table: name, email, role tag, workspace name, active/inactive status
- Status tag dynamically colored (cyan for active, red for inactive)
- Zero new TypeScript errors -- all 34 pre-existing errors unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed seed import path for auth.ts**
- **Found during:** Task 2 (writing seed script)
- **Issue:** Plan specified `import { auth } from '../auth'` but auth.ts is in `src/auth.ts` (discovered during Plan 02), so the import path is `'../src/auth'`
- **Fix:** Changed import to `from '../src/auth'`
- **Files modified:** `prisma/seed.ts`
- **Commit:** 0924b2e

**2. [Rule 1 - Bug] Improved idempotency handling in seed ensureUser**
- **Found during:** Task 2 (pre-emptively)
- **Issue:** Plan warned that `auth.api.signUpEmail()` may throw if the user already exists; the plan suggested wrapping in try/catch
- **Fix:** Added try/catch around signUpEmail for existing users to prevent crash on re-run, falling back to skip silently
- **Files modified:** `prisma/seed.ts`
- **Commit:** 0924b2e

## Verification Results

- [x] `/sign-in` page exists and renders SignInForm component
- [x] SignInForm has Ant Design Card with "GitNexus Legal" title
- [x] Email field with required + type=email validation
- [x] Password field with required validation
- [x] Submit button "Dang nhap" with loading state
- [x] On success redirects to /intake; on error shows generic message
- [x] Seed creates users with password hashes in Account table (161-char scrypt hashes)
- [x] Seed runs idempotently without error
- [x] Existing data (workspace, matter types, memberships, routing) preserved
- [x] Admin users page is a server component (no 'use client')
- [x] Admin page calls requireAppSession() and checks RBAC
- [x] Admin page queries real data from prisma.user.findMany()
- [x] Zero new TypeScript errors from our changes
- [x] No unintended file changes across our 3 commits

## Known Stubs

None -- all created/modified files contain working implementations with real data flow.

## Threat Flags

None -- all affected files match the declared threat model:
- T-15-06: SignInForm uses generic error message (not distinguishing "email not found" from "wrong password")
- T-15-07: Admin users page calls requireAppSession() and checks roles before rendering
- T-15-08: Seed runs only in dev; demo password is intentionally simple

## Self-Check: PASSED

- [x] `src/app/(auth)/sign-in/page.tsx` exists
- [x] `src/components/auth/SignInForm.tsx` exists (67 lines, exceeds 60-line minimum)
- [x] `prisma/seed.ts` imports from `../src/auth` (adjusted from plan's `../auth`)
- [x] `src/app/admin/users/page.tsx` has no `'use client'` directive
- [x] All 3 commits exist in git log: 6d13b5b, 0924b2e, 8797505
- [x] Zero new TypeScript errors from our 4 files
- [x] No untracked files from our work
