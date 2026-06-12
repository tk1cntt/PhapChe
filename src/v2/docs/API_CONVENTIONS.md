# API Conventions

## Overview

API routes in v2 follow consistent patterns for request handling, response formatting, and error management.

## Route Structure

```
src/v2/app/api/
├── users/
│   └── route.ts        # GET, POST /api/users
├── requests/
│   └── route.ts        # GET, POST /api/requests
└── [resource]/
    ├── route.ts        # GET, POST /api/[resource]
    └── [id]/
        └── route.ts    # GET, PUT, DELETE /api/[resource]/[id]
```

## Request Handling

### Method-Based Routing

```typescript
// src/v2/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // List items
  const items = await prisma.item.findMany()
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  // Create item
  const body = await request.json()
  const item = await prisma.item.create({ data: body })
  return NextResponse.json(item, { status: 201 })
}
```

## Response Format

### Success Response

```typescript
return NextResponse.json({
  success: true,
  data: result
})
```

### Error Response

```typescript
return NextResponse.json(
  { 
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Item not found'
    }
  },
  { status: 404 }
)
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| VALIDATION_ERROR | 400 | Invalid request data |
| INTERNAL_ERROR | 500 | Server error |

## Validation

Use Zod for request validation:

```typescript
import { z } from 'zod'

const CreateItemSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = CreateItemSchema.safeParse(body)
  
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  }
  
  // Proceed with valid data
}
```

## Authentication

Check session for protected routes:

```typescript
import { session } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await session.get()
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }
  
  // Handle request with authenticated user
}
```
