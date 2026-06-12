# Coding Conventions

**Analysis Date:** 2026-06-12

## Naming Patterns

### Files

- **React Components:** PascalCase with `.tsx` extension
  - Examples: `UserTable.tsx`, `AuditTimeline.tsx`, `AdminStatCard.tsx`
- **Service/Utility Files:** camelCase with `.ts` extension
  - Examples: `intake-service.ts`, `routing-service.ts`, `audit.ts`
- **Test Files:** Co-located with source, suffix pattern:
  - Unit tests: `.test.ts` or `.test.tsx`
  - Abnormal tests: `.abnormal.test.tsx`
  - E2E specs: `.spec.ts`
- **CSS Files:** kebab-case matching component name
  - Examples: `audit.css`, `vault.css`, `workspaces.css`

### Directories

- **Pages:** kebab-case with `[param]` for dynamic segments
  - Examples: `admin/audit/`, `specialist/requests/[requestId]/`
- **Components:** PascalCase for component folders
- **Lib/Services:** camelCase for functional modules

### Functions and Variables

- **Functions:** camelCase, verb-prefixed for actions
  - Examples: `createDraftIntake()`, `saveIntakeAnswers()`, `submitIntake()`
- **Variables:** camelCase, descriptive nouns
  - Examples: `activeWorkspaceId`, `correlationId`, `matterTypeKey`
- **Booleans:** is/has/can prefix
  - Examples: `isActive`, `hasRole`, `canTransition`

### Types and Constants

- **TypeScript Types:** PascalCase
  - Examples: `AppSession`, `RequestStatus`, `ReviewSeed`, `IntakeAnswers`
- **Enums/Constants:** UPPER_SNAKE_CASE with `as const` object
  - Examples: `REQUEST_STATUS`, `ROLE`, `TEMPLATE_STATUS`, `AUDIT_TARGET_TYPE`
  - Pattern:
    ```typescript
    export const REQUEST_STATUS = {
      DRAFT_INTAKE: 'draft_intake',
      INTAKE_SUBMITTED: 'intake_submitted',
      // ...
    } as const;
    export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];
    ```

## Code Style

### Formatting

- **Tool:** ESLint via `eslint-config-next`
- **Configuration:** Next.js defaults, no custom `.eslintrc` in project root
- **Path Alias:** `@/` maps to `./src` (configured in `tsconfig.json`)

### TypeScript

- **Strict mode:** Enabled via Next.js defaults
- **Import patterns:**
  ```typescript
  // Node.js built-ins
  import assert from 'node:assert/strict';
  import { readFileSync } from 'node:fs';
  
  // Project imports
  import { prisma } from '@/lib/prisma';
  import type { AppSession } from '@/lib/security/session';
  import { recordAuditEvent } from '@/lib/audit/audit';
  
  // External packages
  import { Tag, Card, Table } from 'antd';
  import { useTranslations } from 'next-intl';
  ```

### React Components

- **Client components:** Explicit `'use client'` directive at top
  ```typescript
  'use client';
  import { useState } from 'react';
  ```
- **Server components:** No directive (default in App Router)

## Error Handling

### Error Codes

All errors use thrown `Error` objects with UPPER_SNAKE_CASE codes:

```typescript
// Service layer errors
throw new Error('FORBIDDEN');
throw new Error('UNAUTHENTICATED');
throw new Error('MATTER_TYPE_NOT_FOUND');
throw new Error('INTAKE_SUBMISSION_NOT_FOUND');
throw new Error('REQUEST_NOT_FOUND');
throw new Error('TEMPLATE_IMMUTABLE');
throw new Error('CHECKLIST_NOT_COMPLETE');
throw new Error('REJECT_COMMENT_REQUIRED');
throw new Error('INVALID_REQUEST_TRANSITION');
```

### Assertion Patterns

```typescript
// Positive assertions
assert.equal(value, expected);
assert.ok(value);

// Negative assertions with regex
await assert.rejects(
  someAsyncFunction(),
  /FORBIDDEN/
);

// Database URL safety check
const url = new URL(databaseUrl);
const safe = hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            databaseName.includes('dev') || 
            databaseName.includes('test');
assert.ok(safe, `Refusing to run test against unsafe DATABASE_URL`);
```

## Import Organization

### Order

1. Node.js built-ins: `import assert from 'node:assert/strict'`
2. React/Next.js: `import React from 'react'`
3. Project imports: `import { x } from '@/lib/...'`
4. External packages: `import { x } from 'antd'`

### Path Aliases

- `@/` - Project root src: `src/`
- Examples: `@/lib/prisma`, `@/app/components`, `@/constants`

## Function Design

### Service Functions

```typescript
// Input types defined separately
type CreateDraftInput = {
  session: AppSession;
  matterTypeKey: string;
  correlationId: string;
};

export async function createDraftIntake(input: CreateDraftInput) {
  // Validation first
  if (!input.session.activeWorkspaceId) throw new Error('WORKSPACE_REQUIRED');
  if (!(await canAccessWorkspace(...))) throw new Error('FORBIDDEN');
  
  // Transaction-wrapped mutations
  return prisma.$transaction(async (tx) => {
    // ...
  });
}
```

### Server Actions

```typescript
export async function startReviewAction(formData: FormData) {
  // Extract and validate params
  const documentVersionId = formData.get('documentVersionId');
  if (!documentVersionId) return { ok: false, message: 'Thieu ma phien ban tai lieu.' };
  
  // Call service, map errors to Vietnamese messages
  try {
    await startReview({ ... });
    // revalidatePath/redirect...
  } catch (err) {
    if (String(err).includes('DOCUMENT_VERSION_NOT_FOUND')) {
      return { ok: false, message: 'Khong tim thay phien ban tai lieu.' };
    }
    return { ok: false, message: 'Da xay ra loi.' };
  }
}
```

## Module Design

### Barrel Exports

Service files export all public functions directly:
```typescript
export {
  createTemplate,
  updateTemplate,
  approveTemplate,
  publishTemplate,
  deprecateTemplate,
  createNewVersion,
  listTemplates,
  getTemplatesForGeneration,
} from './template-service';
```

### Type Organization

Types live in `src/lib/types.ts`:
```typescript
// Request status values
export const REQUEST_STATUS = { ... } as const;
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

// Role values
export const ROLE = { ... } as const;
export type Role = typeof ROLE[keyof typeof ROLE];
```

## Database Patterns

### Prisma Client Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Transactions

```typescript
await prisma.$transaction(async (tx) => {
  // All mutations within transaction
  const updated = await tx.intakeSubmission.update({ ... });
  await recordAuditEvent({ ... }, tx);
  return updated;
});
```

### Conflict Guards

```typescript
const updated = await tx.legalRequest.updateMany({
  where: { id: input.requestId, status: request.status },
  data: { status: input.toStatus },
});
if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');
```

## Audit Logging

```typescript
await recordAuditEvent(
  {
    actorId: input.session.userId,
    workspaceId: workspaceId,
    action: 'request.created',
    targetType: 'REQUEST',
    targetId: request.id,
    requestId: request.id,
    correlationId: input.correlationId,
    metadataSummary: `matterType=${matterType.key}; questions=${matterType.questions.length}`,
  },
  tx // Pass transaction client for atomicity
);
```

## State Management

### Workflow State Machine

State transitions defined in `src/lib/workflow/request-workflow.ts`:

```typescript
export const REQUEST_TRANSITIONS = {
  draft_intake: ['intake_submitted', 'cancelled'],
  intake_submitted: ['triage', 'cancelled'],
  triage: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['pending_review', 'cancelled'],
  pending_review: ['revision_required', 'approved'],
  revision_required: ['in_progress', 'cancelled'],
  approved: ['delivered'],
  delivered: ['closed'],
  closed: [],
  cancelled: [],
} as const satisfies Record<RequestStatus, readonly RequestStatus[]>;
```

## Security Patterns

### RBAC in Services

```typescript
function assertAdmin(actor: AppSession) {
  if (!actor.roles.some((role) => adminRoles.includes(role as ...))) {
    throw new Error('FORBIDDEN');
  }
}

export async function canAccessRequest(session: AppSession | null | undefined, requestId: string): Promise<boolean> {
  if (!requestId || !(await hasActiveUser(session))) return false;
  // ... authorization logic
}
```

## Comments

- **Test descriptions:** Vietnamese error messages for UI display
- **Code comments:** Minimal, inline only where logic is complex
- **JSDoc:** Not used; rely on TypeScript types

---

*Convention analysis: 2026-06-12*
