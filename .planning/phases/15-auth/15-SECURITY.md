---
phase: 15-auth
slug: auth
status: verified
threats_open: 0
asvs_level: 2
created: 2026-06-06
updated: 2026-06-06
---

# Phase 15 — Auth: Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Process -> Database | Prisma schema modifications cross into database; schema push creates new tables | Account, Session, Verification tables |
| Browser -> Next.js Server | User submits login credentials over HTTPS | Email + password (plaintext over TLS) |
| Next.js Server -> Database | Auth queries (getSession, user lookup) hit Prisma | Session token, user ID, role |
| Server Component -> API | `auth.api.getSession()` reads session cookie from request headers | Session cookie |
| Browser -> Better Auth API | Login credentials submitted via `authClient.signIn.email()` | Email + password |
| Better Auth API -> Database | Password validation queries Account table; session created | Password hash, session token |
| Admin Page -> Prisma | Authenticated admin queries all users from database | User records with roles |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-15-01 | Tampering | prisma/schema.prisma | mitigate | Schema changes are additive only (new tables: Account, Session, Verification; new column: emailVerified on User). Existing models/enums preserved unchanged. | closed |
| T-15-02a | Information Disclosure | .env (BETTER_AUTH_SECRET) | mitigate | Secret added to .env (already gitignored). .env.example documents the var without real value. | closed |
| T-15-02b | Elevation of Privilege | src/middleware.ts | mitigate | Middleware checks session existence optimistically (cookie check); actual auth validation happens in `requireAppSession()` via `auth.api.getSession()` -- middleware is optimistic only, not the real auth gate. | closed |
| T-15-03 | Spoofing | src/auth.ts (email/password) | mitigate | Better Auth uses scrypt hashing, CSRF protection by default. | closed |
| T-15-04 | Tampering | src/lib/security/session.ts (requireAppSession) | mitigate | `auth.api.getSession()` validates token server-side, not just cookie parse; session rotation handled by Better Auth. | closed |
| T-15-05 | Information Disclosure | src/middleware.ts matcher | accept | Matcher excludes public paths (/sign-in, /api/auth, /_next/static, /_next/image, favicon.ico) -- unauthenticated access to these does not leak data. | closed |
| T-15-06 | Information Disclosure | SignInForm error message | accept | Error message 'Email hoac mat khau khong dung' is deliberately generic to prevent email enumeration (does not distinguish "email not found" from "wrong password"). | closed |
| T-15-07 | Elevation of Privilege | src/app/admin/users/page.tsx | mitigate | Server component calls `requireAppSession()` and checks for `super_admin` or `coordinator_admin` role; returns `notFound()` if unauthorized. | closed |
| T-15-08 | Tampering | prisma/seed.ts | accept | Seed runs only in dev; demo password Demo@123456 is intentionally simple for development. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-15-01 | T-15-05 | Matcher excludes public paths (/sign-in, /api/auth, /_next/static, /_next/image, favicon.ico). Unauthenticated access to excluded paths does not leak sensitive data. Path-based matcher is a well-established Next.js pattern. | Phase architect | 2026-06-06 |
| R-15-02 | T-15-06 | Generic error message 'Email hoac mat khau khong dung' prevents email enumeration. This is an intentional UX trade-off: slightly worse user experience (cannot tell if email exists) for security benefit (attacker cannot probe registered emails). | Phase architect | 2026-06-06 |
| R-15-03 | T-15-08 | Seed script uses password Demo@123456 for both demo users. This runs only in development against local database. Production would use a separate onboarding flow. Intentionally simple to enable quick local testing. | Phase architect | 2026-06-06 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-06 | 9 | 9 | 0 | gsd-security-auditor (Claude) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-06
