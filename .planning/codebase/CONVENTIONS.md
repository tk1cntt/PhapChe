# Coding Conventions

**Analysis Date:** 2026-06-18

## Naming Patterns

### Files

- **Components:** PascalCase (e.g., `StatCard.tsx`, `Button.tsx`)
- **Utilities/Services:** camelCase (e.g., `utils.ts`, `vault-service.ts`)
- **Types/Constants:** PascalCase (e.g., `types.ts`, `session.ts`)
- **Tests:** Same as source + `.test.ts` suffix (e.g., `vault-service.test.ts`)

### Functions

- **Service functions:** camelCase, descriptive verbs (e.g., `getMatterType`, `recordAuditEvent`, `createAdminUser`)
- **Helper functions:** camelCase (e.g., `assertAdmin`, `assertSafeDatabaseUrl`)
- **Private/internal:** Prefix with underscore for unused parameters: `_` (e.g., `_tx`)

### Variables

- **Session objects:** `actor`, `session` (e.g., `actor: AppSession`)
- **Database references:** `db`, `tx` (e.g., `db = prisma`)
- **Correlation IDs:** `correlationId` (for audit tracking)
- **Workspace context:** `workspaceId`, `activeWorkspaceId`

### Types

- **Enum-like constants:** UPPER_SNAKE_CASE with `as const` assertion (e.g., `REQUEST_STATUS`, `ROLE`)
- **Type aliases:** PascalCase (e.g., `type RequestStatus`, `type AppSession`)
- **Database types:** Prisma namespace (e.g., `Prisma.TransactionClient`)

```typescript
// Example from src/lib/types.ts
export const REQUEST_STATUS = {
  DRAFT_INTAKE: 'draft_intake',
  INTAKE_SUBMITTED: 'intake_submitted',
  // ...
} as const;
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];
```

## Code Style

### Formatting

- **Tool:** ESLint + Prettier (via `next lint`)
- **Configuration:** `.eslintrc.js` with Next.js TypeScript rules

### Linting

**Key rules from `.eslintrc.js`:**

```javascript
{
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
  'import/order': ['warn', {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    'newlines-between': 'always',
    alphabetize: { order: 'asc' }
  }],
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'prefer-const': 'warn',
  'no-var': 'error'
}
```

### Import Organization

Order (groups):
1. `builtin` - Node.js built-ins
2. `external` - npm packages
3. `internal` - `@/` path aliases
4. `parent` - `../` imports
5. `sibling` - `./` imports
6. `index` - `./index` barrel exports

```typescript
// Example from src/lib/admin/users.ts
import type { Prisma } from '@prisma/client';         // external
import type { Role } from '@/lib/types';               // internal
import { prisma } from '@/lib/prisma';                  // internal
import { recordAuditEvent } from '@/lib/audit/audit';  // internal
import type { AppSession } from '@/lib/security/session';
```

### Path Aliases

- `@/` maps to `./src/` (configured in `tsconfig.json` and `vitest.config.ts`)

## Error Handling

### Error Code Pattern

Service functions throw errors with string codes (not Error subclasses):

```typescript
// Example from src/lib/security/session.ts
if (!session?.user?.id) throw new Error('UNAUTHENTICATED');

// Example from src/lib/admin/users.ts
if (!actor.roles.some((role) => adminRoles.includes(role as ...))) {
  throw new Error('FORBIDDEN');
}
```

**Common error codes:**
- `UNAUTHENTICATED` - No valid session
- `FORBIDDEN` - Insufficient permissions
- `INVALID_ROLE` - Role not in allowlist
- `REQUEST_NOT_FOUND` - Resource not found
- `FINAL_DOCUMENT_REQUIRED` - Delivery validation
- `CLOSE_REASON_REQUIRED` - Missing required field

### Error Testing

```typescript
// Example from src/lib/admin/users.test.ts
await assert.rejects(
  createAdminUser({ actor: customer, input: {...}, db }),
  /FORBIDDEN/,
);
```

## Comments

### JSDoc Style

```typescript
/**
 * Matter type catalog for intake form
 * Backward compatibility layer using seed-multilingual data
 */
export type MatterCatalogItem = {
  key: string;
  // ...
};
```

### Inline Comments

- Minimal inline comments; code should be self-documenting
- Complex logic gets brief explanation (1-2 lines)

## Function Design

### Parameters

- **Session as first parameter:** `{ session: AppSession }` or `{ actor: AppSession }`
- **Input data:** `{ input: SomeInput }` pattern for mutations
- **Database:** `db = prisma` default for testability

```typescript
// Example from src/lib/documents/vault-service.ts
export async function requestVaultFileAccess(
  session: AppSession,
  vaultFileId: string,
  correlationId: string
): Promise<VaultAccessResult>
```

### Return Values

- Return full objects for reads (not partial)
- Throw on errors rather than returning null
- Async/await preferred over raw promises

### Function Size

- Target: <50 lines per function
- Complex functions should be split into helper functions
- State mutations isolated to dedicated mutation functions

## Module Design

### Exports

- Named exports preferred for utilities
- Type exports via `export type { ... }`
- Barrel exports in `index.ts` files for domains

```typescript
// Example from src/lib/intake/catalog.ts
export function getMatterType(matterTypeKey: string): MatterCatalogItem | null
export function getMatterQuestions(matterTypeKey: string): IntakeQuestion[]
export { SEED_MATTER_TYPES } from '../i18n/seed-multilingual';
```

### Barrel Files

- `src/lib/types/index.ts` - Type constants and exports
- `src/lib/api/index.ts` - API client exports
- `src/lib/intake/catalog.ts` - Re-exports multilingual data

## Component Conventions

### Naming

Custom ESLint rule (`src/lib/rules/no-duplicate-component.js`) enforces:

1. No duplicate names with shared components
2. No generic names (Card, Table, Form, etc.)
3. Shared components should be in `src/components/shared/ui/`

**Shared component hierarchy:**
- **Atoms:** Button, Input, Select, Badge, Avatar, Icon, Tooltip, Tag
- **Molecules:** StatCard, StatusBadge, EmptyState, LoadingSkeleton, Pagination
- **Organisms:** DataTable, AuditTimeline, RequestTable, VaultFileTable

### File Location

- **Shared UI:** `src/components/shared/ui/`
- **Feature components:** `src/components/{feature}/`
- **Layouts:** `src/components/layout/`

## Security Patterns

### Input Validation

- Validate inputs at API route boundary
- Service functions assert preconditions

```typescript
// API route validates before calling service
export async function GET() {
  try {
    const session = await requireAppSession();
    // service call
  } catch {
    return NextResponse.json({ error: '...' }, { status: 500 });
  }
}
```

### Authorization

- Roles checked via session: `session.roles.includes('role_name')`
- Workspace-specific: Query with workspace filter

---

*Convention analysis: 2026-06-18*
