---
phase: 15-auth
reviewed: 2026-06-05T15:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - package.json
  - .env
  - .env.example
  - prisma/schema.prisma
  - src/auth.ts
  - proxy.ts
  - src/app/api/auth/[...all]/route.ts
  - src/lib/auth-client.ts
  - src/lib/security/session.ts
  - src/app/(auth)/sign-in/page.tsx
  - src/components/auth/SignInForm.tsx
  - prisma/seed.ts
  - src/app/admin/users/page.tsx
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 15 -- Auth: Code Review Report

**Reviewed:** 2026-06-05T15:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

13 files in the auth layer were reviewed: Better Auth configuration, middleware proxy, session helper, sign-in page/form, seed script, admin users page, and supporting infrastructure.

**Key concern:** The middleware file (`proxy.ts`) is misnamed and will never execute -- there is no layer-of-defense auth gate at the request level. Additionally, `requireAppSession()` throws unadorned errors with no `error.tsx` boundary, meaning unauthenticated users hitting admin/server-component pages will see a raw 500 error page instead of a redirect to sign-in. The rest of the auth plumbing (Better Auth config, API routes, session helper) is structurally sound but has edge-case gaps.

---

## Critical Issues

### CR-01: Middleware does not execute -- `proxy.ts` is not `middleware.ts`

**File:** `/mnt/d/PhapChe/proxy.ts:1`

**Issue:** Next.js requires middleware to be named `middleware.ts` and placed at the project root or under `src/`. This file is named `proxy.ts`, so Next.js completely ignores it. No other file imports or references `proxy.ts`.

The intended matcher pattern (`/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)`) would have protected all non-public routes from unauthenticated access at the request level. Because it never runs, there is zero middleware-layer auth protection. Every protected route relies solely on individual `requireAppSession()` calls inside page/action handlers, which is brittle -- one forgotten check creates a gap.

Even if the file were renamed, the `handler` function signature does not follow Next.js middleware conventions:
- Line 7: calls `auth.api.getSession({ headers: request.headers })` -- Next.js middleware receives `NextRequest`, not `Request`, and the headers may not contain cookies at the middleware layer depending on deployment.
- The function is `async` but the error is caught and redirected to sign-in, which is correct behavior.

**Fix:** Rename to `src/middleware.ts` and verify the signature uses `NextRequest`:

```typescript
// src/middleware.ts
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico).*)"],
};
```

---

### CR-02: Live secrets exposed in `.env`

**File:** `/mnt/d/PhapChe/.env:10,29,46`

**Issue:** The `.env` file contains live secrets for the local development environment:

- Line 10: `TELEGRAM_BOT_TOKEN=8407337226:AAEbVcn9p6D3jbshboie29lrcGs3YclbP9I` -- A Telegram bot token that can control the bot
- Line 29: `ANTHROPIC_API_KEY=sk_9router` -- API key for Claude
- Line 46: `BETTER_AUTH_SECRET="cccc40c6104a82a921b7fd5a6e32ab063512201f8ed30c7744693d0e8b2acb5c"` -- Secret used to sign auth session cookies

While `.env` is gitignored and not in the repository, these secrets are visible in the working directory. If this machine is compromised, shared, or if these files are accidentally committed (e.g., via `git add -f` or a future `.gitignore` change), the secrets would be exposed.

**Fix:** 
- Rotate the Telegram bot token immediately if the bot is used outside local dev
- Use a unique Better Auth secret per developer/environment
- Consider using a `.env.local` file pattern and keeping `.env` as a template-only file (already present as `.env.example`)

---

## Warnings

### WR-01: No `error.tsx` boundary -- `requireAppSession()` crashes produce raw 500

**File:** `/mnt/d/PhapChe/src/lib/security/session.ts:14-15`

**Issue:** `requireAppSession()` throws `new Error('UNAUTHENTICATED')` when no valid session exists. In a Next.js server component, unhandled errors render the nearest `error.tsx` boundary. There is no `error.tsx` anywhere in `src/app/` (confirmed by glob search). This means:

1. An unauthenticated user hitting `/admin/users` (or any page calling `requireAppSession()`) will see a generic Next.js 500 error page instead of being redirected to `/sign-in`.
2. For server actions, the thrown error propagates to the client as an unhandled exception, causing the Action to fail without a user-friendly message.

**Fix:** Create a root `src/app/error.tsx` that catches unauthenticated errors and redirects:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    if (error.message === 'UNAUTHENTICATED') {
      router.push('/sign-in');
    }
  }, [error, router]);

  return null;
}
```

For a more robust approach, differentiate `requireAppSession` errors by error type (e.g., `UnauthenticatedError` class) so the boundary can pattern-match reliably.

---

### WR-02: `requireAppSession()` picks first workspace membership non-deterministically

**File:** `/mnt/d/PhapChe/src/lib/security/session.ts:25-31`

**Issue:** The function queries active memberships and takes `memberships[0]` (line 31) without an `orderBy` clause. If a user belongs to multiple workspaces, Prisma returns rows in an unspecified order (typically PK order, but not guaranteed). This means:

- A user with `customer` in workspace A and `coordinator_admin` in workspace B could see either role depending on database row order.
- The `take: 1` on line 26 restricts to one result, making this non-deterministic behavior invisible.

**Fix:** Add an explicit `orderBy` to ensure deterministic behavior, or remove `take: 1` and let the caller decide:

```typescript
memberships: {
  where: { isActive: true, workspace: { isActive: true } },
  select: { workspaceId: true, role: true },
  orderBy: { createdAt: 'asc' },
  take: 1,
},
```

Alternatively, accept that each user should have exactly one active workspace at the app layer and validate that assumption during membership creation.

---

### WR-03: `SignInForm` does not reset loading state on all paths

**File:** `/mnt/d/PhapChe/src/components/auth/SignInForm.tsx:26-28`

**Issue:** In the `onFinish` handler, `setLoading(false)` is only called inside the `if (error)` branch. The `else` branch (success) calls `router.push('/intake')` without resetting loading. While the navigation will likely unmount the component, there are scenarios where this creates a problem:

1. If `router.push()` fails silently or is intercepted, the button stays in loading state and the user has no way to retry without refreshing the page.
2. The `callbackURL: '/intake'` in the `signIn.email` call (line 20) may already cause Better Auth to perform a server-side redirect. Combined with the client-side `router.push('/intake')`, this creates a double-redirect race condition that could result in cookies not being set properly on the final page.

**Fix:** Move `setLoading(false)` into a `finally` block:

```typescript
const onFinish = async (values: { email: string; password: string }) => {
  setLoading(true);
  try {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      message.error('Email hoac mat khau khong dung');
    } else {
      router.push('/intake');
    }
  } catch (e) {
    message.error('Co loi xay ra, vui long thu lai');
    console.error(e);
  } finally {
    setLoading(false);
  }
};
```

Also consider removing `callbackURL` from the client call since the redirect is handled client-side via `router.push()`.

---

### WR-04: Seed script silently swallows all Better Auth errors

**File:** `/mnt/d/PhapChe/prisma/seed.ts:28-32`

**Issue:** The `catch` block inside `ensureUser()` catches ALL errors from `auth.api.signUpEmail()` and silently ignores them:

```typescript
try {
  await auth.api.signUpEmail({ body: { email, name, password } });
} catch {
  // User already exists in Better Auth but has no credential account yet;
  // skip -- Better Auth may have rejected duplicate signup
}
```

If `auth.api.signUpEmail` throws for a reason other than duplicate-user (e.g., network error, validation failure, configuration error), the error is swallowed. The function then continues to `prisma.user.findUniqueOrThrow` (line 34), which will throw a completely unrelated `NotFoundError` if the user was never created.

This makes seed-time failures hard to diagnose -- the developer sees "User not found" instead of the root cause.

**Fix:** Log the error even when swallowing:

```typescript
try {
  await auth.api.signUpEmail({ body: { email, name, password } });
} catch (err) {
  console.warn(`signUpEmail failed for ${email} (likely duplicate, skipping):`, err);
}
```

Or better: check for user existence first with `prisma.account.findFirst` before attempting signup:

```typescript
const existingAccount = await prisma.account.findFirst({
  where: { userId: existing.id, providerId: 'credential' },
});
if (!existingAccount) {
  console.log(`Creating credential account for existing user ${email}...`);
  // Handle this case -- Better Auth might need a different API
}
```

---

### WR-05: Admin sidebar shows links that non-admin users cannot access

**File:** `/mnt/d/PhapChe/src/app/admin/layout.tsx:14-20`

**Issue:** The admin layout renders navigation items (Users, Workspace, Requests, Operations, Audit, Vault) for every user who can navigate to `/admin/*`. However, individual admin pages (e.g., `/admin/users` on line 28 of `users/page.tsx`) use `notFound()` to reject non-admin users. This means:

- A `customer` who somehow reaches `/admin/users` sees a 404 (intentional, security-through-obscurity).
- But the sidebar still shows admin navigation links, creating a confusing UX where links lead to 404 pages.
- The `customer` user would see admin menu items even though they have no access. The admin layout only checks membership exists, not role.

Note: This is not a security bypass because the page-level `requireAppSession()` + role check catches unauthorized users. But it's a usability issue that exposes admin functionality to the wrong users.

**Fix:** Either:
- Move role-based menu filtering into the layout using a session check, or
- Accept the 404 approach and just note it's by-design (but document the tradeoff).

---

## Info

### IN-01: `seed.ts` uses `as unknown` type assertion to bypass Prisma types

**File:** `/mnt/d/PhapChe/prisma/seed.ts:53`

**Issue:** Line 53 declares `matterTypes` via a type assertion:
```typescript
const matterTypes = prisma.matterType as unknown as {
  upsert(input: unknown): Promise<unknown>;
};
```

This bypasses all TypeScript type safety for the `upsert` call on line 56-74. The full Prisma client `prisma.matterType.upsert()` is likely available but was replaced with this assertion, probably due to TypeScript compatibility issues (the `questionSchema` field is `Json` and Prisma may require strict types). This makes the code fragile -- if the catalog data shape changes, there are no compiler warnings.

**Suggestion:** Investigate why the assertion was needed. If it's a JSON type issue, use `Prisma.InputJsonValue` or the generated Prisma types directly:

```typescript
import { Prisma } from '@prisma/client';
// Then use
await prisma.matterType.upsert({
  where: { workspaceId_key: { workspaceId: workspace.id, key: matterType.key } },
  update: {
    questionSchema: matterType.questions as Prisma.InputJsonValue,
    // ... other fields
  },
  create: { /* ... */ },
});
```

---

### IN-02: `proxy.ts` is dead code -- no imports reference it

**File:** `/mnt/d/PhapChe/proxy.ts:1`

**Issue:** No file in the project imports from `proxy.ts`. It exports a `default` handler and a `config` object, but nothing consumes them. The file was likely intended as middleware but was never wired in (see CR-01).

**Suggestion:** Delete `proxy.ts` and replace with `src/middleware.ts` as described in CR-01.

---

### IN-03: Double redirect on successful sign-in

**File:** `/mnt/d/PhapChe/src/components/auth/SignInForm.tsx:20,27`

**Issue:** The `signIn.email` call passes `callbackURL: '/intake'` (line 20), which tells Better Auth to redirect the user to `/intake` after a successful server-side sign-in. Simultaneously, the `onFinish` handler calls `router.push('/intake')` (line 27) on the client side after the API call returns.

If Better Auth performs its own redirect based on `callbackURL`, the client-side `router.push` runs first (or simultaneously), creating a race condition. The user may end up on `/intake` before Better Auth has finished writing session cookies, causing the page's own `requireAppSession()` to fail and redirect back to sign-in.

**Suggestion:** Remove one of the two redirect mechanisms. Either:
- Remove `callbackURL` from the client call and rely completely on `router.push('/intake')`:
  ```typescript
  const { error } = await authClient.signIn.email({
    email: values.email,
    password: values.password,
    // no callbackURL -- handled by client push
  });
  ```
- Or remove the client-side `router.push` and let Better Auth handle the redirect:
  ```typescript
  // Do nothing on success -- Better Auth handles redirect via callbackURL
  if (error) {
    message.error('Email hoac mat khau khong dung');
    setLoading(false);
  }
  ```

---

_Reviewed: 2026-06-05T15:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
