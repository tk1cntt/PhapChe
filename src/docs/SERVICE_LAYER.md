# Service Layer

**Purpose:** Document service layer boundaries and responsibilities

**Last Updated:** 2026-06-14

---

## Overview

The service layer separates business logic from API routes and UI components. Each domain has its own service module.

## Layer Responsibilities

| Layer | Responsibility | Location |
|-------|----------------|----------|
| **API Routes** | HTTP handling, input validation | `src/app/api/` |
| **Services** | Business logic, validation | `src/lib/[domain]/services/` |
| **Database** | Data persistence | `src/lib/db/` |
| **Components** | UI state, rendering | `src/components/` |
| **TanStack Query** | Server state, caching | API routes return data |

## Directory Structure

```
src/lib/
├── requests/
│   ├── services/
│   │   ├── createRequest.ts
│   │   ├── updateRequest.ts
│   │   ├── assignRequest.ts
│   │   ├── transitionWorkflow.ts
│   │   └── listRequests.ts
│   ├── validators/
│   │   └── requestValidator.ts
│   └── types/
│       └── index.ts
├── vault/
│   ├── services/
│   │   ├── uploadFile.ts
│   │   ├── downloadFile.ts
│   │   ├── deleteFile.ts
│   │   └── manageTags.ts
│   ├── storage/
│   │   ├── s3.ts
│   │   └── local.ts
│   └── types/
│       └── index.ts
├── users/
│   ├── services/
│   │   ├── createUser.ts
│   │   ├── updateUser.ts
│   │   └── listUsers.ts
│   └── types/
│       └── index.ts
├── workflow/
│   ├── services/
│   │   ├── engine.ts
│   │   └── transition.ts
│   └── definitions/
│       └── legalRequest.ts
└── templates/
    ├── services/
    │   └── render.ts
    └── engine.ts
```

## Service Example

```typescript
// src/lib/requests/services/createRequest.ts
import { db } from '@/lib/db';
import { auditLog } from '@/lib/audit';
import { createAuditEntry } from '@/lib/audit/service';
import type { CreateRequestInput } from '../types';

export async function createRequest(
  input: CreateRequestInput,
  userId: string
) {
  // Validate input
  validateCreateRequestInput(input);

  // Check user permissions
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  // Create request
  const request = await db.legalRequest.create({
    data: {
      code: generateRequestCode(),
      workspaceId: user.workspaceId,
      matterTypeId: input.matterTypeId,
      priority: input.priority,
      title: input.title,
      description: input.description,
      customerId: userId,
      status: 'draft_intake',
    },
  });

  // Audit log
  await createAuditEntry({
    action: 'request.created',
    actorId: userId,
    targetType: 'request',
    targetId: request.id,
    metadata: { matterTypeId: input.matterTypeId },
  });

  return request;
}
```

## Validation Rules

### Service-level Validation

```typescript
// src/lib/requests/validators/createRequest.ts
import { z } from 'zod';

export const createRequestSchema = z.object({
  matterTypeId: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  deadline: z.date().optional(),
});

export function validateCreateRequestInput(input: unknown) {
  const result = createRequestSchema.safeParse(input);
  if (!result.success) {
    const errors = result.error.flatten();
    throw new ValidationError('VALIDATION_ERROR', errors);
  }
  return result.data;
}
```

### Cross-cutting Concerns

```typescript
// Transaction wrapper
async function withTransaction<T>(
  fn: () => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    return fn();
  });
}

// Audit logging wrapper
async function withAudit<T>(
  action: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const result = await fn();
  await createAuditEntry({ action, metadata });
  return result;
}

// Permission check wrapper
async function withPermission<T>(
  requiredRole: Role,
  fn: () => Promise<T>
): Promise<T> {
  const user = await getCurrentUser();
  if (!hasRole(user, requiredRole)) {
    throw new ForbiddenError();
  }
  return fn();
}
```

## UI State Management

UI-specific state stays in components:

```typescript
// Components handle UI state
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItems, setSelectedItems] = useState<string[]>([]);

// Server state via TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['requests', filters],
  queryFn: () => fetchRequests(filters),
});
```

## API Route Pattern

```typescript
// src/app/api/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRequest } from '@/lib/requests/services/createRequest';
import { validateCreateRequestInput } from '@/lib/requests/validators/createRequest';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateCreateRequestInput(body);
    
    const userId = await getSessionUserId(request);
    const result = await createRequest(validated, userId);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.code, detail: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: 'Unexpected error' },
      { status: 500 }
    );
  }
}
```

## Testing Strategy

```typescript
// Unit tests for services
describe('createRequest', () => {
  it('should create request with valid input', async () => {
    const result = await createRequest(validInput, userId);
    expect(result.status).toBe('draft_intake');
  });

  it('should throw error for invalid input', async () => {
    await expect(createRequest(invalidInput, userId))
      .rejects.toThrow(ValidationError);
  });
});
```

---

*Document: SERVICE_LAYER.md*
*Part of: Phase 55 - Architecture Standards*
