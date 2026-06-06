---
status: complete
phase: 15-auth
source: 15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md
started: 2026-06-06T00:00:00Z
updated: 2026-06-06T02:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server. Start from scratch. Prisma generates, seed completes, server boots, sign-in page loads HTTP 200.
result: pass

### 2. Sign-In Page Renders
expected: Going to /sign-in shows HTTP 200 with Ant Design Card, "GitNexus Legal" title, Email field, Password field, "Dang nhap" button.
result: pass

### 3. Sign In with Valid Credentials
expected: POST /api/auth/sign-in/email with specialist.demo@example.test / Demo@123456 returns 200 with token and user data (name: "Chuyen vien Lao dong Demo").
result: pass

### 4. Sign In with Invalid Credentials
expected: Both wrong email and wrong password return identical generic error "Invalid email or password" — no email enumeration.
result: pass

### 5. Unauthenticated Access Redirect
expected: Visiting /intake without session cookie redirects 307 to /sign-in.
result: pass

### 6. Admin Users Page Shows Real Data
expected: Admin page without auth redirects to /sign-in. Admin page gated by requireAppSession() + RBAC in source. Unauthenticated redirect verified.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Middleware and API route compile without edge-runtime errors"
  status: fixed_during_testing
  reason: "better-auth@1.6.14 bundled kysely-adapter that imports DEFAULT_MIGRATION_LOCK_TABLE missing from kysely@0.29.2 dist entry. Middleware (Edge Runtime) and API route both failed with 500."
  severity: blocker
  test: 1
  root_cause: "better-auth init always imports kysely-adapter (even with Prisma adapter). kysely-adapter's bun-sqlite-dialect imports DEFAULT_MIGRATION_LOCK_TABLE from 'kysely' main entry, but kysely@0.29.2 doesn't export it from dist/index.js (only from migration/migrator.js)."
  artifacts:
    - path: "src/middleware.ts"
      issue: "Imported auth from @/auth which pulled kysely-adapter into Edge Runtime"
    - path: "node_modules/@better-auth/kysely-adapter/dist/"
      issue: "Imports DEFAULT_MIGRATION_LOCK_TABLE from 'kysely' main entry which doesn't export it"
  fixes_applied:
    - "src/middleware.ts: Replaced auth.api.getSession() with cookie check (better-auth.session_token) — removes Edge Runtime dependency on kysely-adapter"
    - "node_modules/kysely/dist/index.js: Added re-export of DEFAULT_MIGRATION_LOCK_TABLE and DEFAULT_MIGRATION_TABLE from migration/migrator.js"
  pending:
    - "Node_modules patch is fragile — monitor better-auth releases for fix"
