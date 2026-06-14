# API Registry

**Purpose:** Central documentation of all API endpoints to prevent duplication

**Last Updated:** 2026-06-14

---

## Overview

This document catalogs all API endpoints in the GitNexus Legal platform.

## Core APIs

### Requests

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/requests | List all requests | ?page, ?pageSize, ?status, ?type, ?search |
| GET | /api/requests/:id | Get request detail | - |
| POST | /api/requests | Create new request | body |
| PUT | /api/requests/:id | Update request | body |
| DELETE | /api/requests/:id | Soft delete | - |
| GET | /api/requests/:id/workflow | Get workflow status | - |
| POST | /api/requests/:id/workflow/transition | Execute transition | body |
| GET | /api/requests/:id/messages | List messages | - |
| POST | /api/requests/:id/messages | Add message | body |
| GET | /api/requests/:id/documents | List documents | - |
| POST | /api/requests/:id/documents | Upload document | multipart |
| GET | /api/requests/:id/audit | Get audit log | - |

### Users

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/admin/users | List all users | ?page, ?search, ?role |
| GET | /api/admin/users/:id | Get user detail | - |
| POST | /api/admin/users | Create user | body |
| PUT | /api/admin/users/:id | Update user | body |
| DELETE | /api/admin/users/:id | Deactivate user | - |
| PUT | /api/admin/users/:id/role | Change user role | body |

### Workspaces

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/workspaces | List workspaces | ?page, ?search |
| GET | /api/workspaces/:id | Get workspace detail | - |
| POST | /api/workspaces | Create workspace | body |
| PUT | /api/workspaces/:id | Update workspace | body |
| DELETE | /api/workspaces/:id | Delete workspace | - |
| GET | /api/workspaces/:id/members | List members | - |
| POST | /api/workspaces/:id/invite | Invite member | body |
| DELETE | /api/workspaces/:id/members/:userId | Remove member | - |

### Messages

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/messages | List threads | ?requestId |
| GET | /api/messages/:threadId | Get thread messages | - |
| POST | /api/messages/send | Send message | body |
| GET | /api/messages/poll | Poll for new messages | ?requestId |
| PUT | /api/messages/:id/read | Mark as read | - |

### Vault (Document Storage)

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/vault | List files | ?folderId, ?tagId, ?search |
| GET | /api/vault/:id | Get file metadata | - |
| POST | /api/vault/upload | Upload file | multipart |
| DELETE | /api/vault/:id | Delete file | - |
| GET | /api/vault/:id/download | Download file (signed URL) | - |
| POST | /api/vault/:id/tags | Add tags | body |
| DELETE | /api/vault/:id/tags/:tagId | Remove tag | - |
| GET | /api/vault/folders | List folders | ?parentId |
| POST | /api/vault/folders | Create folder | body |
| PUT | /api/vault/folders/:id | Rename folder | body |
| DELETE | /api/vault/folders/:id | Delete folder | - |

### Settings

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/settings/profile | Get profile | - |
| PUT | /api/settings/profile | Update profile | body |
| PUT | /api/settings/password | Change password | body |
| GET | /api/settings/notifications | Get notification prefs | - |
| PUT | /api/settings/notifications | Update notification prefs | body |
| GET | /api/settings/audit | Get personal audit log | ?page |

### Authentication

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| POST | /api/auth/login | Login | body |
| POST | /api/auth/logout | Logout | - |
| GET | /api/auth/session | Get current session | - |
| POST | /api/auth/refresh | Refresh token | - |

### Admin

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/admin/dashboard | Dashboard stats | - |
| GET | /api/admin/stats | Platform statistics | ?period |
| GET | /api/admin/audit | Global audit log | ?page, ?actor, ?action |

### Intakes

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/intake/forms | List form definitions | - |
| GET | /api/intake/forms/:code | Get form by code | - |
| POST | /api/intake/submit | Submit intake form | body |

### Workflows

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/workflows | List workflow definitions | - |
| GET | /api/workflows/:code | Get workflow by code | - |
| POST | /api/workflows | Create workflow | body |
| PUT | /api/workflows/:id | Update workflow | body |

### Templates

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/templates | List templates | - |
| GET | /api/templates/:code | Get template by code | - |
| POST | /api/templates | Create template | body |
| PUT | /api/templates/:id | Update template | body |
| POST | /api/templates/:id/render | Render template | body |

## Reusable Patterns

### Pagination

```
GET /api/[resource]?page=1&pageSize=20
```

### Filtering

```
?status=draft_intake
?type=employment_contract
?assignedTo=user_id
```

### Sorting

```
?sort=createdAt&order=desc
?sort=priority&order=asc
```

### Combined

```
GET /api/requests?page=1&pageSize=20&status=in_progress&sort=createdAt&order=desc
```

## Naming Conventions

- **Plural nouns:** `/api/requests` not `/api/request`
- **REST methods:** GET, POST, PUT, PATCH, DELETE
- **Consistent IDs:** UUID v4 for all entity IDs
- **Timestamps:** ISO 8601 format (`2024-12-31T23:59:59Z`)

## Response Format

```typescript
// Success
{
  "data": T | T[],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150
  }
}

// Error
{
  "error": "error_code",
  "detail": "Human-readable message"
}
```

## Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (delete) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Server Error |

---

*Document: API_REGISTRY.md*
*Part of: Phase 55 - Architecture Standards*
