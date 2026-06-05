# Phase 15: Auth - Research

**Researched:** 2026-06-05
**Domain:** Authentication system (login page, session management, auth provider)
**Confidence:** HIGH (stack choice verified via official docs and npm registry)

## Summary

This phase replaces the stub auth system (`APP_SESSION_USER_ID` env var + `requireAppSession()`) with a real authentication system. The project ships with Next.js 16.2.6 and React 19.2.6, and has 46 files consuming the current session pattern.

**Critical finding:** Auth.js/NextAuth has been merged into **Better Auth** (v1.6.14). The NextAuth README explicitly states: "Auth js is now part of Better Auth. We recommend new projects to start with Better Auth unless there are some very specific feature gaps." Better Auth supports Next.js 16 natively, has a Prisma adapter compatible with @prisma/client ^6, and provides email/password authentication out of the box with scrypt hashing.

**Primary recommendation:** Use **Better Auth v1.6.14** with Prisma adapter, email/password provider, and JWT sessions. This is the current ecosystem recommendation and avoids adopting a deprecated library.

**Migration challenge:** The existing Prisma `User` model has `email @unique` and `name String` (non-nullable), while Better Auth expects `email String` (no unique shown in schema but implied by signup flow), `name String?` (optional), plus `emailVerified Boolean`. The existing `WorkspaceMembership` system must remain intact and be linked to the Better Auth User model. The stub `requireAppSession()` returns `{ userId, activeWorkspaceId, roles }` -- this shape must be preserved or adapted to avoid breaking 46 call sites.

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase -- this is a greenfield phase. The only constraint is the project description: "Implement real authentication system -- login page, session management, NextAuth.js or equivalent provider."
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User login / logout | API / Backend | Browser / Client | Better Auth handles form POST at `/api/auth/*`; client SDK triggers signIn/signOut |
| Session validation | API / Backend | Frontend Server (RSC) | `auth.api.getSession()` in server components and API routes; client reads session cookie only |
| Session refresh | API / Backend | -- | Better Auth auto-rotates session cookies; proxy/middleware calls `getSession` periodically |
| Route protection | Frontend Server (RSC) | API / Backend | middleware/proxy for optimistic redirect; Server Components call `getSession` for real auth |
| Password hashing | API / Backend | -- | Better Auth uses scrypt by default; hashed in Account table under `providerId: "credential"` |
| RBAC / workspace access | API / Backend | -- | Existing `src/lib/security/rbac.ts` uses `AppSession` shape -- needs adaptation but logic stays |
| User registration | API / Backend | -- | `authClient.signUp.email()` or admin creates users via existing `createAdminUser` service |
| Login page UI | Browser / Client | -- | Ant Design form renders in browser; calls `signIn("credentials", ...)` client-side |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | ^1.6.14 | Authentication framework (replaces next-auth) | Ecosystem standard; NextAuth maintainers recommend it; supports Next.js 16, Prisma, email/password |
| @prisma/client | ^6.19.0 (existing) | Database ORM (already installed) | Required by better-auth Prisma adapter |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcryptjs | ^3.0.3 | Password hashing (already in project? not listed but npm has v3.0.3) | Only if custom password hashing needed outside Better Auth; Better Auth uses scrypt by default |
| antd | ^6.4.3 (existing) | Login form UI components | Sign-in page, user profile, session indicator |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | next-auth@latest (v4.24.14) | Stable but deprecated path; maintainers recommend Better Auth |
| Better Auth | next-auth@beta (v5.0.0-beta.31) | Still in beta; maintainers recommend Better Auth instead |
| Better Auth | Custom JWT + bcrypt + cookies | Massive scope; hand-rolling session management, CSRF, rotation |

**Installation:**
```bash
npm install better-auth
```

**Version verification:**
```bash
npm view better-auth version          # 1.6.14 [VERIFIED: npm registry 2026-06-05]
npm view better-auth peerDependencies # Compatible with next ^14||^15||^16 [VERIFIED]
```

## Architecture Patterns

### System Architecture Diagram

```
Browser (Client)                Next.js Server                  Database (PostgreSQL)
    |                               |                               |
    |-- GET /sign-in --------------->|                               |
    |<-- Ant Design Login Form ------|                               |
    |                               |                               |
    |-- POST credentials ----------->|                               |
    |   (authClient.signIn.email)    |-- auth.api.signInEmail() ---->|
    |                               |<-- validate + set cookies -----|
    |<-- redirect + session cookie --|                               |
    |                               |                               |
    |-- GET /admin/* --------------->|                               |
    |   (browser sends cookie)       |-- proxy.ts checks cookie ---->|  (optimistic)
    |                               |-- layout/page calls ---------->|
    |                               |   auth.api.getSession()        |  (real validation)
    |                               |<-- session data --------------|
    |<-- page renders or redirect ---|                               |
    |                               |                               |
    |-- Server Action --------------->|                               |
    |   (form POST)                  |-- auth.api.getSession() ----->|  (real validation)
    |                               |-- existing requireAppSession-->|  (adapted wrapper)
    |                               |<-- session + workspace -------|
```

### Component Responsibilities

| Component | What It Does |
|-----------|-------------|
| `auth.ts` (root or src/ lib/) | Better Auth instance config: Prisma adapter, email/password provider, session options |
| `proxy.ts` (root) | Next.js 16 proxy middleware: optimistic cookie check, redirect unauthenticated users |
| `app/api/auth/[...all]/route.ts` | Better Auth route handler: exports GET, POST |
| `lib/auth-client.ts` (client) | `createAuthClient()` with `signIn`, `signUp`, `useSession` |
| `app/(auth)/sign-in/page.tsx` | Server component with Ant Design login form, renders `<SignInForm>` |
| `components/SignInForm.tsx` | Client component: Ant Design form, calls `authClient.signIn.email()` |
| `lib/security/session.ts` | **Adapted** `requireAppSession()` -- now wraps `auth.api.getSession()` + reads WorkspaceMembership |
| `lib/security/rbac.ts` | **No change needed** -- already uses `AppSession { userId, activeWorkspaceId, roles }` |

### Recommended Project Structure

```
root/
├── auth.ts                          # Better Auth instance (config)
├── proxy.ts                         # Next.js 16+ proxy for session cookie check
├── lib/
│   ├── auth-client.ts               # Better Auth client SDK (React)
│   └── security/
│       ├── session.ts               # ADAPTED: requireAppSession() wraps Better Auth
│       └── rbac.ts                  # UNCHANGED: uses AppSession shape
├── components/
│   └── auth/
│       └── SignInForm.tsx           # Client component: Ant Design login form
├── app/
│   ├── api/auth/[...all]/route.ts   # Better Auth handler
│   ├── (auth)/
│   │   └── sign-in/
│   │       └── page.tsx             # Public login page
│   └── layout.tsx                   # Optional: wrap children with <SessionProvider>
└── prisma/
    └── schema.prisma                # ADD: Account, Session, Verification models
```

### Pattern 1: Better Auth Instance + Session Wrapper

**What:** The canonical Better Auth setup for Next.js 16 with Prisma and email/password.

**When to use:** This is the standard pattern for all authentication in this project.

**auth.ts:**
```typescript
// Source: [VERIFIED: better-auth docs + npm registry]
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh every 24h
  },
});
```

**Route handler** (`app/api/auth/[...all]/route.ts`):
```typescript
// Source: [VERIFIED: better-auth docs]
import { auth } from "@/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

**proxy.ts** (Next.js 16+):
```typescript
// Source: [VERIFIED: better-auth docs]
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (request) => {
  const session = request.auth; // from proxy
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)"],
};
```

**Adapted session.ts** (preserves AppSession shape for 46 callers):
```typescript
// ADAPTED from stub -- wraps Better Auth session
// All 46 callers of requireAppSession() keep working unchanged
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AppRole = 'customer' | 'specialist' | 'reviewer' | 'coordinator_admin' | 'super_admin';

export type AppSession = {
  userId: string;
  activeWorkspaceId?: string | null;
  roles: AppRole[];
};

export async function requireAppSession(): Promise<AppSession> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error('UNAUTHENTICATED');

  const userId = session.user.id;
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      memberships: {
        where: { isActive: true, workspace: { isActive: true } },
        select: { workspaceId: true, role: true },
        take: 1,
      },
    },
  });

  const membership = user?.memberships[0];
  if (!user || !membership) throw new Error('UNAUTHENTICATED');

  return {
    userId: user.id,
    activeWorkspaceId: membership.workspaceId,
    roles: [membership.role],
  };
}
```

### Anti-Patterns to Avoid

- **Cookie-only middleware without server-side session check**: The docs explicitly warn `getSessionCookie` "does **not** validate" the session. Always pair with `auth.api.getSession()` in protected server components.
- **Using Better Auth's built-in User model as-is without custom fields**: The project needs `isActive` on User, plus the existing `WorkspaceMembership` relations. Configure `additionalFields` for `isActive` and keep the existing model structure.
- **Replacing `requireAppSession` calls in all 46 files at once**: Better to adapt the `requireAppSession()` wrapper to read from Better Auth, keeping the AppSession return type unchanged. Zero changes needed at call sites.
- **Two separate User models**: Do NOT create a new User table for Better Auth. Merge schemas: Better Auth's core fields go into the existing `User` model. Remove the Better Auth `Account.password` field if not needed (Better Auth stores password hashes in the Account table by default).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT + cookies + CSRF | Better Auth | Session rotation, cookie security, CSRF-by-default, client SDK |
| Password hashing | Custom scrypt/bcrypt/argon2 | Better Auth (built-in scrypt) | Already handles salt rounds, timing attacks, migration |
| OAuth/SSO | Custom OAuth client | Better Auth social providers | Provider auto-detection from env vars, token refresh |
| Email verification | Custom email + token table | Better Auth (plugin or built-in) | Verification token management, expiration |

**Key insight:** Authentication has deep security surface area -- session rotation, CSRF tokens, timing-safe comparison, cookie flags, token theft mitigation. Better Auth handles all of this. A custom implementation for a legal document platform would be irresponsible.

## Common Pitfalls

### Pitfall 1: Session Not Available in Server Components
**What goes wrong:** `auth.api.getSession({ headers: await headers() })` returns null in Server Components.
**Why it happens:** The `nextCookies()` plugin is not configured in auth.ts, so Better Auth doesn't read cookies automatically.
**How to avoid:** Always use the `nextCookies()` plugin in auth.ts when running in Next.js:
```typescript
import { nextCookies } from "better-auth/next-js";
// In auth config:
plugins: [nextCookies()],
```
**Warning signs:** Auth works in client components but fails in server components and server actions.

### Pitfall 2: Schema Mismatch with Existing User Model
**What goes wrong:** Prisma migration fails because Better Auth's expected User schema conflicts with the existing User model.
**Why it happens:** The existing User has `name String` (non-nullable), `isActive Boolean`, and `WorkspaceMembership` relations. Better Auth expects `name String?` (nullable), `emailVerified Boolean`, plus `Account[]`, `Session[]`, `Verification[]` relations.
**How to avoid:** Manually merge schemas. Keep `email @unique`, `name String` (not null), `isActive`. Add `emailVerified Boolean @default(false)`. Do NOT use Better Auth's `npx auth@latest generate` -- it would overwrite the existing schema. Declare the core fields manually.
**Warning signs:** Migration errors about missing tables or conflicting field types.

### Pitfall 3: Breaking 46 Call Sites
**What goes wrong:** Changing the `requireAppSession()` signature or return type breaks 46 files across the codebase.
**Why it happens:** The stub returns `{ userId, activeWorkspaceId, roles }`. If the wrapper is rewritten to return a different shape, every call site must be updated.
**How to avoid:** Keep the `AppSession` type entirely unchanged. The adapted `requireAppSession()` internally calls `auth.api.getSession()` then builds the same `AppSession` object from the result. The 46 call sites receive identical data.
**Warning signs:** TypeScript errors in the 46 files after the session.ts change.

### Pitfall 4: Password Hash Location Confusion
**What goes wrong:** The project already has a `User` model. Better Auth's Prisma adapter uses a separate `Account` table with a `password` field (providerId: "credential") for password hashes. Developers might try to add `passwordHash` to the User model instead.
**Why it happens:** Different auth libraries store password hashes differently (next-auth doesn't support credentials natively vs Better Auth uses Account table).
**How to avoid:** Follow Better Auth's schema -- password hashes go in the `Account` table under `providerId: "credential"`. The User model stays clean. When looking up a user for credentials login, Better Auth handles this internally.
**Warning signs:** Login fails with "user not found" even though email exists.

### Pitfall 5: Proxy/Middleware with Next.js 16
**What goes wrong:** Creating `middleware.ts` instead of `proxy.ts` causes session mismanagement or errors.
**Why it happens:** Next.js 16 renamed middleware to proxy for certain use cases. Better Auth documents `proxy.ts` for Next.js 16+.
**How to avoid:** Use `proxy.ts` pattern from Better Auth docs exactly. Test that session refreshes work after the proxy runs.
**Warning signs:** Session expires prematurely, or cookies not set correctly.

## Code Examples

### Sign-In Page with Ant Design
```typescript
// app/(auth)/sign-in/page.tsx -- server component
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return <SignInForm />;
}

// components/auth/SignInForm.tsx -- client component
'use client';

import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const { Title } = Typography;

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: true,
      callbackURL: '/intake',
    });

    if (error) {
      message.error('Email hoac mat khau khong dung');
      setLoading(false);
    } else {
      router.push('/intake');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F0F2F5' }}>
      <Card style={{ width: 420 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          GitNexus Legal
        </Title>
        <Form name="signin" layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Email la bat buoc' },
              { type: 'email', message: 'Email khong hop le' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Mat khau la bat buoc' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mat khau" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Dang nhap
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient();
export const { signIn, signUp, useSession } = authClient;
```

### Prisma Schema Changes (Add to existing User model, create Account/Session/Verification)
```prisma
// ADD to existing User model:
// emailVerified Boolean @default(false)
// accounts Account[]
// sessions Session[]

// NEW models:
model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
}

model Session {
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique
  expiresAt  DateTime
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**IMPORTANT:** The existing User model has `memberships WorkspaceMembership[]` which must be preserved alongside the new `accounts Account[]` and `sessions Session[]` relations. Merge, do not replace.

### Sign-Up via Admin (Admin creates user with hashed password)
```typescript
// app/admin/users/actions.ts (adaptation of existing createAdminUser)
// Better Auth API for server-side user creation:
import { auth } from "@/auth";

async function createUserWithPassword(email: string, name: string, password: string) {
  // Better Auth handles password hashing internally via its API
  const user = await auth.api.signUpEmail({
    body: {
      email,
      name,
      password,
      // additionalFields will be populated from config
    },
  });
  return user;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth.js v4 (next-auth) | Better Auth v1.x | Auth.js merged into Better Auth (2025) | All new projects should use Better Auth |
| APP_SESSION_USER_ID env var session stub | Better Auth with Prisma + JWT sessions | Phase 15 | 46 call sites transparently updated via adapted wrapper |
| `requireAppSession()` reads env var | `requireAppSession()` wraps `auth.api.getSession()` | Phase 15 | Same AppSession shape, callers don't change |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Better Auth supports Next.js 16 proxy pattern (`proxy.ts`) | Standard Stack | MEDIUM -- verified from docs for Next.js 14-16 but Next.js 16 proxy is newer; test proxy.ts behavior with a sanity check |
| A2 | Better Auth's Prisma adapter works with the existing `User` model having custom fields (`isActive`, `memberships`) | Architecture Patterns | MEDIUM -- Better Auth uses `additionalFields` for custom columns; the workspace membership is a separate model not touched by Better Auth |
| A3 | The 46 callers of `requireAppSession()` need zero changes | Common Pitfalls | LOW -- verified by reading return type; the adapted wrapper preserves `AppSession` exactly |

## Open Questions (RESOLVED)

1. **Should admin user creation route through Better Auth API or stay in existing `createAdminUser`?**
   - **RESOLVED:** For MVP, admin creates user via existing `createAdminUser` (email only, no password). Newly created users get a "set password" flow triggered by admin (Better Auth magic link or reset password). The Phase 15 focus is login for existing users + seed data. Admin user creation with password flow is deferred.
   - What we know: Existing `createAdminUser` in `src/lib/admin/users.ts` creates User + WorkspaceMembership in a transaction. It does NOT set a password.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Prisma / Better Auth | Via Docker | postgresql://localhost:5433 (from .env) | -- |
| Node.js | Next.js 16 / Better Auth | ✓ | v18+ (project uses latest) | -- |
| npm | Package install | ✓ | (from workspace) | -- |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright ^1.60.0 (existing in package.json) |
| Config file | Not found -- see Phase 1 foundation |
| Quick run command | `npx playwright test -g "auth"` |
| Full suite command | `npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| (implied) | Login page renders | e2e | `npx playwright test tests/auth/login-page.spec.ts` | ❌ Wave 0 |
| (implied) | Valid credentials -> redirect to /intake | e2e | `npx playwright test tests/auth/login-flow.spec.ts` | ❌ Wave 0 |
| (implied) | Invalid credentials -> error message | e2e | `npx playwright test tests/auth/login-flow.spec.ts` | ❌ Wave 0 |
| (implied) | Unauthenticated user -> redirected to /sign-in | e2e | `npx playwright test tests/auth/protection.spec.ts` | ❌ Wave 0 |
| (implied) | Existing requireAppSession() still works | unit | `node --test src/lib/security/session.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run auth e2e tests
- **Per wave merge:** Full Playwright suite
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/auth/login-page.spec.ts` -- renders sign-in form, tests form validation
- [ ] `tests/auth/login-flow.spec.ts` -- successful login, failed login, error messages
- [ ] `tests/auth/protection.spec.ts` -- /admin/* redirects to /sign-in when unauthenticated
- [ ] `tests/auth/session-consistency.spec.ts` -- adapted requireAppSession returns correct AppSession shape

*(No existing test infrastructure for auth -- all files are Wave 0)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Better Auth email/password with scrypt hashing |
| V3 Session Management | yes | Better Auth JWT sessions with rotation |
| V4 Access Control | yes | Existing RBAC in src/lib/security/rbac.ts (unmodified) |
| V5 Input Validation | yes | Zod validation in Better Auth + Ant Design form validation |
| V6 Cryptography | yes | Better Auth scrypt (built-in) or bcryptjs if custom path used |
| V8 Data Protection | yes | Session cookies (HttpOnly, Secure, SameSite) handled by Better Auth |

### Known Threat Patterns for Auth

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Brute force login | Tampering | Better Auth rate limiting (check docs for built-in or plugin) |
| Session hijacking | Elevation of Privilege | Better Auth JWT with short expiry + rotation |
| Weak password hash | Information Disclosure | Better Auth scrypt (configurable rounds) |
| CSRF on auth endpoints | Spoofing | Better Auth handles CSRF by default |
| Enumeration (known email) | Information Disclosure | Better Auth `requireEmailVerification` or `autoSignIn: false` to suppress 200 vs 400 differences |

## Sources

### Primary (HIGH confidence)
- [better-auth npm registry](https://www.npmjs.com/package/better-auth) -- v1.6.14, peer deps, keywords [VERIFIED: npm view 2026-06-05]
- [better-auth installation docs](https://www.better-auth.com/docs/installation) -- Setup steps, auth.ts, Prisma adapter, env vars [VERIFIED: WebFetch 2026-06-05]
- [better-auth next integration](https://www.better-auth.com/docs/integrations/next) -- proxy/middleware, server-side session, cookie-only check [VERIFIED: WebFetch 2026-06-05]
- [better-auth email/password](https://www.better-auth.com/docs/authentication/email-password) -- signIn, signUp API methods, client SDK [VERIFIED: WebFetch 2026-06-05]
- [better-auth database / core schema](https://www.better-auth.com/docs/concepts/database) -- User, Session, Account, Verification models [VERIFIED: WebFetch 2026-06-05]
- [GitHub nextauthjs/next-auth](https://github.com/nextauthjs/next-auth) -- README confirms Auth.js joined Better Auth, recommends Better Auth for new projects [VERIFIED: WebFetch 2026-06-05]
- [npm view next-auth@beta] -- v5.0.0-beta.31, still in beta [VERIFIED: 2026-06-05]
- [next-auth peerDeps] -- Compatible with next ^12.2.5..^16 [VERIFIED: 2026-06-05]

### Secondary (MEDIUM confidence)
- [better-auth Prisma adapter reference](https://www.better-auth.com/docs/integrations/prisma) -- adapter usage with PrismaClient [VERIFIED: WebFetch 2026-06-05, though 404 on detailed page]

### Tertiary (LOW confidence)
- None -- all key claims verified via npm registry or better-auth official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - better-auth v1.6.14 verified from npm; docs show full Next.js support
- Architecture: HIGH - adapted `requireAppSession()` preserves 46 call sites; patterns verified from official docs
- Pitfalls: HIGH - session wrapper pattern, schema merge, and proxy.ts issues all verified against actual codebase and better-auth docs

**Research date:** 2026-06-05
**Valid until:** 2026-07-05 (30 days for stable packages; shorter if better-auth v2 or breaking change emerges)
