# GitNexus Legal - Specification Index

**Purpose:** Central reference document for AI agents working on the GitNexus Legal platform.  
**Last Updated:** 2026-06-19  
**Milestone:** v2.2 Legacy UI Enhancement (Phase 73-84)

---

## Quick Start

### Architecture Standards (src/docs/)
All development MUST follow these 12 core documents:

1. **[DOMAIN_STRUCTURE.md](../src/docs/DOMAIN_STRUCTURE.md)** - Folder organization, component granularity (4 levels), domain modules
2. **[API_STANDARDS.md](../src/docs/API_STANDARDS.md)** - Response envelope, HTTP status codes, pagination, error handling
3. **[API_REGISTRY.md](../src/docs/API_REGISTRY.md)** - Central catalog of all API endpoints by domain
4. **[SERVICE_LAYER.md](../src/docs/SERVICE_LAYER.md)** - Service responsibilities, validation patterns, transaction/audit wrappers
5. **[CODE_STANDARDS.md](../src/docs/CODE_STANDARDS.md)** - Naming conventions, TypeScript patterns, import order, React conventions
6. **[I18N_RULES.md](../src/docs/I18N_RULES.md)** - next-intl patterns, component-first i18n, decision matrix
7. **[FORM_DEFINITION.md](../src/docs/FORM_DEFINITION.md)** - Dynamic form schema, FormRenderer, validation flow
8. **[WORKFLOW_DEFINITION.md](../src/docs/WORKFLOW_DEFINITION.md)** - State machine pattern, transitions, role-based permissions
9. **[TEMPLATE_ENGINE.md](../src/docs/TEMPLATE_ENGINE.md)** - {{variable}} syntax, render API, versioning
10. **[SEED_DATA.md](../src/docs/SEED_DATA.md)** - Seed data organization, transaction rollback, cascade delete, topological sort
11. **[REACT_QUERY.md](../src/docs/REACT_QUERY.md)** - React Query patterns, per-entity staleTime, query key conventions, cache invalidation
12. **[SHARED_COMPONENTS.md](../src/docs/SHARED_COMPONENTS.md)** - Shared UI components, pure Tailwind CSS, react-hot-toast, i18n namespace

---

## Project Overview

### What This Is
Legal-as-a-Service platform for Vietnamese SMEs. Customers submit legal requests via chat/form, coordinators assign specialists, specialists draft documents, reviewers approve, and documents are delivered via secure vault.

### Core Value
**SMEs submit legal requests as simply as messaging and receive quality-controlled documents with full process traceability.**

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Prisma + SQLite (dev), PostgreSQL (prod)
- **UI:** Ant Design 6, Tailwind CSS
- **Auth:** Better Auth (session-based)
- **i18n:** next-intl (4 languages: VI, EN, ZH, JA)
- **Testing:** Vitest (unit), Playwright (E2E)

---

## Domain Model

### Core Entities
- **Tenant** - Top-level platform tenant
- **Organization** - Business organization (belongs to tenant)
- **Workspace** - Work unit (belongs to organization)
- **Partner** - External legal partner organization
- **User** - Platform users (customers, specialists, reviewers, admins, partners)
- **LegalRequest** - Legal service request with workflow state
- **Engagement** - Partner-organization relationship with service scopes
- **VaultFile** - Secure document storage
- **AuditEvent** - Immutable audit trail

### User Roles
| Role | Scope | Permissions |
|------|-------|-------------|
| `customer` | Own requests | Create requests, view status, download documents |
| `specialist` | Assigned requests | Draft documents, submit for review |
| `reviewer` | All requests | Approve/reject documents |
| `coordinator_admin` | Workspace | Assign specialists, manage workflow |
| `platform_admin` | Platform | Full access to all features |
| `partner` | Engagement scope | View assigned requests, upload documents |

---

## Workflow States

Legal requests follow this state machine:

```
draft_intake → intake_submitted → triage → assigned → in_progress → 
pending_review → [approved | revision_required] → delivered → closed
                                                                    ↘ cancelled
```

### State Transitions
| From | To | Allowed Roles | Action |
|------|----|--------------|-------|
| draft_intake | intake_submitted | customer | Submit request |
| intake_submitted | triage | coordinator_admin | Accept request |
| triage | assigned | coordinator_admin | Assign specialist |
| assigned | in_progress | specialist | Start work |
| in_progress | pending_review | specialist | Submit for review |
| pending_review | approved | reviewer | Approve document |
| pending_review | revision_required | reviewer | Request revision |
| revision_required | in_progress | specialist | Revise and resubmit |
| approved | delivered | coordinator_admin, specialist | Deliver to customer |
| delivered | closed | customer, coordinator_admin | Close request |
| draft_intake | cancelled | customer | Cancel request |

---

## API Patterns

### Response Envelope
```typescript
// Success
{
  data: T | T[],
  meta?: { page, pageSize, total, totalPages }
}

// Error
{
  error: string,        // Machine-readable code
  detail?: string,      // Human-readable message
  field?: string        // For validation errors
}
```

### HTTP Status Codes
- **200 OK** - Successful GET, PUT, PATCH
- **201 Created** - Successful POST
- **204 No Content** - Successful DELETE
- **400 Bad Request** - Validation error
- **401 Unauthorized** - Not authenticated
- **403 Forbidden** - Not authorized
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Duplicate or state conflict
- **422 Unprocessable** - Business logic validation failed
- **500 Internal Server Error** - Server error

### Common Query Parameters
```
?page=1&pageSize=20                    # Pagination
?status=draft_intake                   # Filter by status
?type=employment_contract              # Filter by type
?sort=createdAt&order=desc             # Sorting
?search=Nguyễn Văn A                   # Search
```

---

## Service Layer Pattern

### Structure
```typescript
// src/lib/[domain]/services/[action].ts
export async function createRequest(input: CreateRequestInput, userId: string) {
  // 1. Validate input
  validateCreateRequestInput(input);
  
  // 2. Check permissions
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('UNAUTHORIZED');
  
  // 3. Execute business logic
  const request = await db.legalRequest.create({ data: {...} });
  
  // 4. Audit log
  await createAuditEntry({
    action: 'request.created',
    actorId: userId,
    targetType: 'request',
    targetId: request.id,
    metadata: {...}
  });
  
  return request;
}
```

### Cross-Cutting Concerns
```typescript
// Transaction wrapper
async function withTransaction<T>(fn: () => Promise<T>): Promise<T>

// Audit wrapper
async function withAudit<T>(action: string, fn: () => Promise<T>, metadata?): Promise<T>

// Permission wrapper
async function withPermission<T>(requiredRole: Role, fn: () => Promise<T>): Promise<T>
```

---

## Component Hierarchy

### Level 1: Atoms
Basic UI primitives (Button, Input, Select, Checkbox, Badge, etc.)

### Level 2: Molecules
Composed patterns (StatCard, StatusBadge, SLABar, EmptyState, etc.)

### Level 3: Organisms
Complex sections (DataTable, RequestTable, FormRenderer, Modal, etc.)

### Level 4: Templates
Full page layouts (AppLayout, AdminLayout, UserLayout, Sidebar, etc.)

---

## i18n Strategy

### Key Naming
```
Component.element.action
- Button.save: "Lưu"
- StatusBadge.draft_intake: "Bản nháp"
- RequestList.title: "Danh sách yêu cầu"
```

### Decision Matrix
| What | i18n? | Reason |
|------|-------|--------|
| UI text (components) | ✅ Yes | Reusable across pages |
| UI text (pages) | ✅ Yes | Page-specific context |
| User-generated content | ❌ No | Stored as-is |
| Database values | ❌ No | Stored as-is |
| Error codes | ❌ No | Technical identifiers |

---

## Testing Requirements

### Per-Feature Coverage
| Type | Description | Target |
|------|-------------|--------|
| **Whitebox** | Unit tests for services, repositories | ≥80% line coverage |
| **Blackbox** | Integration tests for API endpoints | ≥90% endpoint coverage |
| **Abnormal** | Edge cases, boundary conditions | All user flows |
| **Error** | Error boundaries, fallback logic | All error paths |
| **E2E** | Full user flows UI → API → DB | All critical paths |

### Data Rules
- ✅ All sample data inserted via Prisma seed scripts
- ✅ Display from database queries
- ❌ No hardcoded values in components
- ❌ No mock data in components (only in unit tests)

---

## v2.2 Milestone: Legacy UI Enhancement

### Goal
Complete backend integration for 12 phases (73-84) that have UI from v2.0 but only 30-50% implementation. Transform mock UI into production-ready with full business logic, workflow, permissions, and data model.

### Critical Constraint
**MUST follow all 9 architecture documents in src/docs/**

### Methodology
Specification-first approach for each phase:
1. **System Discovery** - Analyze existing code
2. **UI Analysis** - Analyze mockup screens
3. **Gap Analysis** - Compare existing vs new UI
4. **Target System Design** - Functional spec, domain model, permissions, workflows
5. **API Design** - Endpoint spec, validation rules
6. **Frontend Architecture** - Component strategy, state management
7. **Implementation Plan** - Epic → Feature → Task
8. **Implementation** - DB → Backend → API → Frontend → Tests

### Phases
| # | Name | Requirements | Status |
|---|------|--------------|--------|
| 73 | Settings (User) | SET-01 to SET-06 | Pending |
| 74 | User Management (Admin) | ADM-USER-01 to ADM-USER-09 | Pending |
| 75 | Create Request (User) | CREQ-01 to CREQ-10 | Pending |
| 76 | My Cases (User) | MYCASE-01 to MYCASE-09 | Pending |
| 77 | Dashboard (User) | U-DASH-01 to U-DASH-08 | Pending |
| 78 | Request Management (Admin) | ADM-REQ-01 to ADM-REQ-09 | Pending |
| 79 | Admin Dashboard | ADM-DASH-01 to ADM-DASH-08 | Pending |
| 80 | Operations (Admin) | ADM-OPS-01 to ADM-OPS-07 | Pending |
| 81 | Messages (User) | MSG-01 to MSG-08 | Pending |
| 82 | Audit (Admin) | ADM-AUD-01 to ADM-AUD-10 | Pending |
| 83 | Workspace Management (Admin) | ADM-WS-01 to ADM-WS-08 | Pending |
| 84 | Vault (Admin) | VAULT-01 to VAULT-12 | Pending |

---

## Common Patterns

### Form Definition
```typescript
interface FormDefinition {
  id: string;
  code: string;           // "employment_contract"
  name: string;           // "Hợp đồng lao động"
  fields: FormField[];
  version: number;
  status: 'draft' | 'published' | 'deprecated';
}
```

### Template Engine
```typescript
// Syntax: {{variable_name}}
// Nested: {{company.name}}
// Conditional: {{#if urgent}}...{{/if}}
// List: {{#each employees}}...{{/each}}
```

### Audit Log
```typescript
interface AuditEvent {
  id: string;
  actorId: string;
  action: string;         // "request.created", "request.assigned"
  targetType: string;     // "request", "user", "document"
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase.tsx | `StatCard.tsx` |
| Files | kebab-case.ts | `user-service.ts` |
| Functions | camelCase | `getUserById` |
| Constants | UPPER_SNAKE_CASE | `REQUEST_STATUS` |
| Types | PascalCase | `UserProfile` |
| Directories | kebab-case | `user-management` |

---

## Import Order

```typescript
// 1. React / Next.js
import { useState } from 'react';
import { useRouter } from 'next/router';

// 2. External libraries
import { z } from 'zod';
import { Button, Card } from 'antd';

// 3. Internal absolute imports
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from '@/components/shared/ui/StatCard';

// 4. Relative imports
import { UserAvatar } from './UserAvatar';
import './styles.css';
```

---

## Constraints

- **Legal accuracy:** Content must pass reviewer before final delivery
- **Security:** Files private, tenant-scoped permissions, signed URLs with expiry, full audit trail
- **MVP scope:** Prioritize end-to-end workflow over advanced AI features
- **Template governance:** Templates versioned with approved/published/deprecated states
- **Workflow integrity:** Status changes via backend state machine, not frontend
- **Traceability:** Reviews linked to specific document versions

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Legal operations cockpit, not AI lawyer | Reduce legal risk, focus on core value | ✅ Good |
| Chat/form hybrid with structured output | Raw chat hard to route and review | ✅ Good |
| Reviewer QC mandatory before delivery | Legal quality is core trust | ✅ Good |
| Rule-based capability matrix first | Avoid overbuild without operational data | ✅ Good |
| Versioned vault with audit from start | Legal documents need traceability | ✅ Good |
| Better Auth for v1.1 | Password hashing, session management | ✅ Good |
| Multi-tenant architecture v2.1 | Separate Tenant → Organization → Workspace → Partner | ✅ Good |
| Specification-first for v2.2 | Follow src/docs/ to ensure AI agents understand business logic | — Pending |

---

## References

- **Milestones:** [.planning/MILESTONES.md](../.planning/MILESTONES.md)
- **Roadmap:** [.planning/ROADMAP.md](../.planning/ROADMAP.md)
- **Requirements:** [.planning/REQUIREMENTS.md](../.planning/REQUIREMENTS.md)
- **Project:** [.planning/PROJECT.md](../.planning/PROJECT.md)
- **State:** [.planning/STATE.md](../.planning/STATE.md)

---

*This document serves as the single source of truth for AI agents working on GitNexus Legal. Always reference this before making architectural decisions.*
