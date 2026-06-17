# Coding Conventions

**Analysis Date:** 2026-06-17

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `MyCasesClient.tsx`, `StatusBadge.tsx`)
- Services/utilities: kebab-case with descriptive suffix (e.g., `intake-service.ts`, `rbac.ts`)
- Tests: Co-located with source, same name with `.test` or `.spec` suffix
- E2E tests: Separate `tests/` directory with spec pattern (e.g., `tests/e2e/dashboard.spec.ts`)

**Directories:**
- Feature modules: lowercase, hyphenated (e.g., `src/lib/intake/`, `src/lib/reviews/`)
- Component groups: kebab-case (e.g., `components/my-cases/`, `components/admin/`)

**Functions:**
- Service functions: camelCase, action verbs (e.g., `createAdminUser`, `submitIntake`, `transitionRequestStatus`)
- Hooks: camelCase with `use` prefix (e.g., `useDebounce`, `usePaginationParams`)
- Utility functions: camelCase (e.g., `assertAdmin`, `cleanAnswers`)

**Variables:**
- camelCase for local variables and function parameters
- UPPERCASE_WITH_UNDERSCORES for constants (e.g., `ADMIN_ROLES`, `ROLE`)
- Hungarian notation avoided

**Types:**
- PascalCase for interfaces and types (e.g., `AppSession`, `AdminDb`, `CreateDraftInput`)
- Type imports from Prisma use `import type` syntax

## Code Style

**Formatting:**
- Tool: ESLint with `prefer-const`, `no-var` rules
- Tab width: 2 spaces (standard)
- Single quotes for strings
- Trailing commas in multiline

**Linting:**
- Tool: ESLint via `eslint-config-next`
- Configuration: `.eslintrc.js` with custom rules
- Import sorting: Grouped by type with `@/` path alias
- Custom rule: `no-duplicate-component` for component naming

**TypeScript:**
- Strict mode enabled via Next.js defaults
- Explicit return types for service functions
- `import type` for type-only imports to avoid runtime overhead

## Import Organization

**Order:**
1. React and Next.js core (e.g., `import React from 'react'`, `import { NextRequest, NextResponse } from 'next/server'`)
2. Third-party libraries (e.g., `import { prisma } from '@prisma/client'`)
3. Internal path aliases (e.g., `import { canAccessRequest } from '@/lib/security/rbac'`)
4. Relative imports (e.g., `import { CHECKLIST_ITEMS } from './checklist'`)

**Path Aliases:**
- `@/` maps to `src/` root
- Configured in `tsconfig.json` and `vitest.config.ts`

```typescript
// Example import order
import React, { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import type { AppSession } from '@/lib/security/session';
```

## Error Handling

**Service Layer:**
- Throw errors with string codes for validation/authorization (e.g., `throw new Error('FORBIDDEN')`, `throw new Error('INVALID_ROLE')`)
- Error codes in UPPERCASE_WITH_UNDERSCORES
- Use regex matching in tests: `assert.rejects(..., /FORBIDDEN/)`

**API Routes:**
- Try-catch with `console.error` for logging
- Return `NextResponse.json` with appropriate HTTP status codes
- Include error details in 500 responses for debugging (strip in production)

```typescript
// Service error pattern
export async function createAdminUser({ actor, input, db = prisma }) {
  assertAdmin(actor);
  assertAllowedRole(input.role);
  // ...
}

// API route error pattern
} catch (error) {
  console.error('Admin users list error:', error);
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 });
}
```

## Logging

**Framework:** console.log/console.error (no external logging library detected)

**Patterns:**
- API routes: Log errors with context before returning
- Services: No logging in business logic (audit events used instead)
- Avoid logging sensitive data (credentials, personal information)

## Comments

**When to Comment:**
- Complex business logic requires explanation
- Non-obvious workarounds or hacks
- Test structure comments (e.g., `// --- Tests ---`)

**JSDoc/TSDoc:**
- Not consistently used
- Prefer inline comments for clarity
- Function signatures are self-documenting with descriptive names

## Function Design

**Size:** Small, focused functions preferred. Complex logic broken into helper functions.

**Parameters:**
- Use object destructuring for options/config patterns
- Typed parameters with interfaces when complex
- Default values for optional parameters (e.g., `db = prisma`)

**Return Values:**
- Explicit return types for public functions
- Async functions return Promises
- Use `as const` for literal type narrowing (e.g., `targetType: 'REQUEST' as const`)

## Module Design

**Exports:**
- Named exports for utilities and services
- Default exports for React page components
- Barrel files (`index.ts`) for component groups

**Barrel Files:**
- Used in `src/components/*/index.ts` for re-exporting
- Not used in `src/lib/` (direct imports preferred)

## State Management

**Client State:** React hooks (`useState`, `useCallback`, `useMemo`)
**Server State:** TanStack Query (`@tanstack/react-query`)
**URL State:** Next.js `useSearchParams`, `useRouter`

## Transaction Patterns

**Prisma Transactions:**
```typescript
return db.$transaction(async (tx) => {
  // Operations within transaction
  await tx.user.create({ data: {...} });
  await recordAuditEvent(auditInput, tx);
  return result;
});
```

**Injectable Dependencies:**
- Allow passing `db` parameter for testing (default: `prisma`)

## RBAC Implementation

**Session Pattern:**
```typescript
type AppSession = {
  userId: string;
  activeWorkspaceId: string;
  roles: Role[];
};
```

**Authorization Pattern:**
- Check roles first (e.g., `hasRole(session, 'super_admin')`)
- Check workspace membership
- Check resource ownership/assignment

## Anti-Patterns

### Using `any` type

**What happens:** `input: any` or `const x: any = ...`
**Why it's wrong:** Bypasses TypeScript safety, introduces runtime errors
**Do this instead:** Use proper types or `unknown` with type guards

### Mutating Shared State

**What happens:** Module-level variables that change state
**Why it's wrong:** Causes unpredictable behavior across requests
**Do this instead:** Use function parameters and return values

### Synchronous DB Operations

**What happens:** Prisma queries without await
**Why it's wrong:** Unhandled promises, undefined results
**Do this instead:** Always await Prisma operations

---

*Convention analysis: 2026-06-17*
