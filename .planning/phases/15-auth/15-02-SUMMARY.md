---
phase: 15-auth
plan: 02
type: execute
completed: 2026-06-05T12:45:00Z
duration: ~15m
tasks:
  total: 3
  completed: 3
key_files:
  created:
    - src/auth.ts
    - proxy.ts
    - src/app/api/auth/[...all]/route.ts
    - src/lib/auth-client.ts
  modified:
    - src/lib/security/session.ts
    - proxy.ts
decisions:
  - "auth.ts must be in src/ directory (not root) because tsconfig @/* alias maps to ./src/*"
  - "proxy.ts uses auth.api.getSession() instead of calling auth() directly because Better Auth v1.6.14 returns an object (not callable)"
requires:
  - 15-01 (Better Auth foundation: package, schema, env vars, DB tables)
provides:
  - "Better Auth instance at @/auth (src/auth.ts) with Prisma adapter, email/password, nextCookies"
  - "proxy.ts: session check + redirect for unauthenticated requests"
  - "API route at /api/auth/[...all] for Better Auth HTTP endpoints"
  - "Client SDK at @/lib/auth-client with signIn, signUp, useSession"
  - "Adapted requireAppSession() wrapping Better Auth session, preserving AppSession shape"
affects:
  - All files importing from @/lib/security/session (43 call sites)
tech-stack:
  added:
    - "better-auth v1.6.14 (runtime auth instance)"
  patterns:
    - "auth.ts at src/auth.ts (not root) for @/ path alias compatibility"
    - "proxy.ts uses auth.api.getSession() for session check in Next.js 16 proxies"
    - "Session wrapper pattern: external AppSession shape unchanged, internal calls auth.api.getSession()"
---

# Phase 15 Plan 2: Better Auth Infrastructure

Wire up Better Auth into the Next.js app: auth instance, proxy middleware, API route handler, client SDK, and adapted session wrapper.

## Commits

| Task | Description | Hash |
|------|-------------|------|
| 1 | feat(15-auth-02): create Better Auth instance configuration | 7a3cb40 |
| 2 | feat(15-auth-02): create proxy middleware, API route handler, and client SDK | d41b87b |
| 3 | feat(15-auth-02): adapt requireAppSession() and fix auth.ts location | b74edc6 |

## Task Results

### Task 1: Create auth.ts -- Better Auth instance configuration
- Created `src/auth.ts` (moved from root during Task 3)
- Configured better-auth with Prisma adapter (PostgreSQL), email/password provider, session expiry (7d), update age (24h), and nextCookies plugin
- TypeScript compiles without errors from this file

### Task 2: Create proxy.ts, API route handler, and client SDK
- `proxy.ts`: Next.js 16 proxy middleware that checks session via `auth.api.getSession()` and redirects unauthenticated users to `/sign-in`
- Matcher excludes `/api/auth`, `/sign-in`, and static assets to prevent redirect loops
- `src/app/api/auth/[...all]/route.ts`: exports GET and POST via `toNextJsHandler(auth)`
- `src/lib/auth-client.ts`: exports authClient, signIn, signUp, useSession
- All three files verified on disk

### Task 3: Adapt requireAppSession() to use Better Auth
- Rewrote `src/lib/security/session.ts` to use `auth.api.getSession({ headers: await headers() })` instead of `APP_SESSION_USER_ID` env var
- Preserved exact AppSession shape: `{ userId, activeWorkspaceId, roles }`
- Preserved all exports: `AppRole`, `AppSession`, `requireAppSession`
- 43 call sites across the codebase import from `@/lib/security/session` -- zero changes needed
- Query logic identical to stub: user lookup with `isActive: true`, first active workspace membership
- Error string `'UNAUTHENTICATED'` preserved

## Deviations from Plan

### Rule 3 -- Blocking: auth.ts location

- **Found during:** Task 3 (TypeScript compilation)
- **Issue:** `import { auth } from "@/auth"` failed with TS2307 (cannot find module) because the tsconfig `@/*` alias maps to `./src/*`, but auth.ts was at the project root
- **Fix:** Moved `auth.ts` from root to `src/auth.ts`. The `@/auth` import now correctly resolves to `./src/auth.ts`
- **Files modified:** `auth.ts` renamed to `src/auth.ts`, import paths in `proxy.ts`, `route.ts`, and `session.ts` remain `@/auth` (they already used the path alias correctly)
- **Commit:** b74edc6

### Rule 3 -- Blocking: proxy.ts auth() not callable in Better Auth v1.6.14

- **Found during:** Task 3 TypeScript compilation
- **Issue:** The plan specified `export default auth(async (request) => { ... })`, but in Better Auth v1.6.14, `betterAuth()` returns an object (not a function). The `Auth` type has no call signatures -- it has `handler: (request) => Response` and `api` properties.
- **Fix:** Rewrote proxy.ts to call `auth.api.getSession({ headers: request.headers })` directly in an async handler function. This is the correct pattern for v1.6.14.
- **Files modified:** `proxy.ts`
- **Commit:** b74edc6

## Verification Results

- [x] `src/auth.ts` exports configured Better Auth instance with Prisma adapter, email/password, nextCookies
- [x] `proxy.ts` redirects unauthenticated requests to `/sign-in` (excluding auth endpoints and sign-in page)
- [x] API route at `/api/auth/[...all]` handles Better Auth POST/GET requests
- [x] `src/lib/auth-client.ts` provides authClient with signIn, signUp, useSession
- [x] `src/lib/security/session.ts` exports AppRole, AppSession, requireAppSession with exactly same shape
- [x] 43 call sites compile without changes (zero new TypeScript errors)
- [x] TypeScript compilation: 34 total errors, all pre-existing

## Known Stubs

None -- all created files contain working implementations with real data flow.

## Threat Flags

None -- all affected files match the declared threat model:
- T-15-02: proxy.ts checks session existence optimistically; actual validation happens in requireAppSession()
- T-15-03: auth.ts uses Better Auth default scrypt hashing and CSRF protection
- T-15-04: session.ts validates token server-side via auth.api.getSession()
- T-15-05: proxy matcher excludes public paths

## Self-Check: PASSED

- [x] `src/auth.ts` exists and exports `auth`
- [x] `proxy.ts` exists with `export default async function handler` and `export const config`
- [x] `/src/app/api/auth/[...all]/route.ts` exists and imports from `@/auth`
- [x] `src/lib/auth-client.ts` exists and imports from `better-auth/react`
- [x] `src/lib/security/session.ts` exists with all three exports (AppRole, AppSession, requireAppSession)
- [x] 43 call sites import from `@/lib/security/session` (unchanged import path)
- [x] Commit hashes verified in git log: 7a3cb40, d41b87b, b74edc6
- [x] No new TypeScript errors from our changes
- [x] No untracked files from our work
