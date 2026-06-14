# API Standards

**Purpose:** Document API conventions and response envelope patterns

**Last Updated:** 2026-06-14

---

## Overview

All APIs follow consistent conventions for request/response format, naming, and error handling.

## Response Envelope

### Success Response

```typescript
// Single item
{
  data: T
}

// With pagination
{
  data: T[],
  meta?: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number
  }
}

// With metadata
{
  data: T,
  meta?: {
    createdAt: string,
    version: number
  }
}
```

### Error Response

```typescript
{
  error: string,        // Machine-readable error code
  detail?: string,      // Human-readable message
  field?: string,       // For validation errors (field name)
  stack?: string        // Only in development
}
```

## HTTP Status Codes

| Code | Usage | When to Use |
|------|-------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (new resource) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, state conflict |
| 422 | Unprocessable Entity | Business logic validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Naming Conventions

### URL Structure

```
/api/[resource]
/api/[resource]/:id
/api/[resource]/:id/[sub-resource]
```

### HTTP Methods

| Method | Usage | Idempotent |
|--------|-------|------------|
| GET | Retrieve resource(s) | Yes |
| POST | Create new resource | No |
| PUT | Replace entire resource | Yes |
| PATCH | Update specific fields | No |
| DELETE | Remove resource | Yes |

### Examples

```
GET    /api/requests           # List requests
GET    /api/requests/:id       # Get single request
POST   /api/requests           # Create request
PUT    /api/requests/:id       # Replace request
PATCH  /api/requests/:id       # Update request fields
DELETE /api/requests/:id       # Delete request

GET    /api/requests/:id/messages      # List messages for request
POST   /api/requests/:id/messages    # Add message to request
GET    /api/requests/:id/documents    # List documents for request
```

## Request Conventions

### Query Parameters

```typescript
// Pagination
?page=1&pageSize=20

// Filtering
?status=draft_intake
?type=employment_contract
?assignedTo=550e8400-e29b-41d4-a716-446655440000

// Sorting
?sort=createdAt&order=desc
?sort=priority&order=asc

// Search
?search=Nguyễn Văn A
?q=company

// Combined
GET /api/requests?page=1&pageSize=20&status=in_progress&sort=createdAt&order=desc
```

### Request Body

```typescript
// JSON content type required
Content-Type: application/json

// Create
POST /api/requests
{
  "title": "Yêu cầu hợp đồng lao động",
  "matterTypeId": "...",
  "priority": "medium",
  "description": "..."
}

// Update
PATCH /api/requests/:id
{
  "priority": "high",
  "assignedTo": "..."
}
```

## Authentication

### Session-based (Primary)

```typescript
// Cookie-based authentication
credentials: 'include'  // in fetch

// Session cookie set by /api/auth/login
```

### Token-based (API Keys)

```typescript
// For programmatic access
Authorization: Bearer <token>

// Or
X-API-Key: <api_key>
```

## Pagination

### Standard Pagination

```typescript
// Request
GET /api/requests?page=1&pageSize=20

// Response
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Cursor-based Pagination (for large datasets)

```typescript
// Request
GET /api/vault/files?cursor=abc123&limit=50

// Response
{
  "data": [...],
  "meta": {
    "nextCursor": "def456",
    "hasMore": true
  }
}
```

## Rate Limiting

```typescript
// Response headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000

// When exceeded
HTTP 429
{
  "error": "rate_limit_exceeded",
  "detail": "Too many requests. Please wait 60 seconds."
}
```

## API Versioning

Current version: v1 (no version in URL)

Future versioning strategy:
```
/api/v1/requests    # v1
/api/v2/requests    # v2
```

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| UNAUTHORIZED | 401 | Not logged in |
| FORBIDDEN | 403 | Not allowed to access |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| INVALID_STATE | 422 | Invalid workflow state |
| INTERNAL_ERROR | 500 | Server error |

## Request Logging

All API requests are logged for audit:

```typescript
interface AuditLog {
  action: string;        // "requests.create", "requests.update"
  actorId?: string;     // User ID
  actorEmail?: string;
  targetType: string;   // "request", "user"
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

---

*Document: API_STANDARDS.md*
*Part of: Phase 55 - Architecture Standards*
