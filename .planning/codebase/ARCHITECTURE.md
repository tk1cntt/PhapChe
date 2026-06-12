<!-- refreshed: 2026-06-12 -->
# Architecture

**Analysis Date:** 2026-06-12

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
│                    `src/app/[locale]/`                       │
├──────────────────┬──────────────────┬───────────────────────┤
│   Admin Portal   │   Customer UX    │    Specialist UX       │
│  `admin/*/page`  │`customer/*/page` │  `specialist/*/page`  │
│  `admin/*/page`  │                  │                       │
├──────────────────┴──────────────────┴───────────────────────┤
│                    API Routes (Server Actions)               │
│                  `src/app/api/**/route.ts`                   │
│                  `src/app/**/actions.ts`                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (lib/)                       │
│                                                              │
│  ┌──────────────┬──────────────┬──────────────┬────────────┐ │
│  │   routing/   │   intake/    │  documents/  │  reviews/  │ │
│  │routing-service│intake-service│vault-service│review-service│
│  ├──────────────┼──────────────┼──────────────┼────────────┤ │
│  │   security/  │   audit/     │  delivery/   │   lib/     │ │
│  │     rbac     │   audit.ts   │notification-service│prisma.ts│
│  └──────────────┴──────────────┴──────────────┴────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Prisma ORM + SQLite Database                    │
│                     `prisma/schema.prisma`                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `auth.ts` | Better Auth setup, session management | `src/auth.ts` |
| `lib/prisma.ts` | Singleton Prisma client | `src/lib/prisma.ts` |
| `routing/` | Assign specialists/reviewers to requests | `src/lib/routing/routing-service.ts` |
| `intake/` | Capture customer requests, validate schema | `src/lib/intake/intake-service.ts` |
| `documents/` | Template rendering, vault storage | `src/lib/documents/vault-service.ts`, `src/lib/documents/template-service.ts` |
| `reviews/` | Checklist-based quality control | `src/lib/reviews/review-service.ts` |
| `workflow/` | Request state machine, status transitions | `src/lib/workflow/request-workflow.ts` |
| `security/` | RBAC permissions | `src/lib/security/rbac.ts` |
| `audit/` | Immutable event log | `src/lib/audit/audit.ts` |
| `delivery/` | Customer notifications | `src/lib/delivery/notification-service.ts` |

## Pattern Overview

**Overall:** Layered Next.js App Router with Service Layer Pattern

**Key Characteristics:**
- Next.js App Router with React Server Components (RSC)
- Server Actions for form mutations (hybrid approach)
- Type-safe Prisma ORM with SQLite
- Service layer abstraction over database operations
- Role-based access control (RBAC) enforced at service layer
- Immutable audit log for all state changes
- State machine for request workflow transitions

## Layers

**UI Layer (Next.js Pages):**
- Purpose: Render pages, handle forms, collect user input
- Location: `src/app/[locale]/`, `src/app/[locale]/admin/`, `src/app/[locale]/customer/`, `src/app/[locale]/specialist/`, `src/app/[locale]/reviewer/`
- Contains: Page components, Server Actions (`actions.ts`), API routes (`route.ts`)
- Depends on: Service layer
- Used by: Browser client

**Service Layer (lib/):**
- Purpose: Business logic, validation, RBAC, state machine operations
- Location: `src/lib/`
- Contains: `routing-service.ts`, `intake-service.ts`, `vault-service.ts`, `review-service.ts`, `draft-service.ts`, `template-service.ts`
- Depends on: Prisma, types
- Used by: API routes, Server Actions

**Data Layer (Prisma):**
- Purpose: Database access, schema management
- Location: `prisma/schema.prisma`
- Contains: Models for User, Workspace, LegalRequest, Document, Review, VaultFile, etc.
- Depends on: SQLite database
- Used by: Service layer

## Data Flow

### Primary Request Flow (Intake to Delivery)

1. **Customer submits intake** (`src/app/intake/actions.ts`) - Captures answers, creates LegalRequest in `draft_intake` status
2. **Coordinator triages** (`src/lib/routing/routing-service.ts:assignRequest`) - Assigns specialist and reviewer, transitions to `assigned`
3. **Specialist works** (`src/lib/documents/draft-service.ts`) - Generates document drafts from templates
4. **Specialist submits for review** - Transitions request to `pending_review`
5. **Reviewer approves/rejects** (`src/lib/reviews/review-service.ts`) - Uses checklist, transitions to `approved` or `revision_required`
6. **Document finalized** - `DocumentVersion` marked as `final`
7. **Delivery** (`src/lib/delivery/delivery-service.ts`) - Customer notified, vault files accessible
8. **Request closed** - Final state

### Status State Machine

```
draft_intake → intake_submitted → triage → assigned → in_progress → pending_review
                                                                            ↓
                                               revision_required ←→ approved
                                                                            ↓
                                                                        delivered
                                                                            ↓
                                                                        closed
```

### Document Review Flow

1. Specialist creates `Document` with `DocumentVersion`
2. Specialist submits version for review (`submitted_for_review`)
3. Reviewer starts review (`in_progress`)
4. Reviewer answers checklist items
5. Reviewer approves → version becomes `final`, request → `approved`
6. Reviewer rejects → version → `draft`, request → `revision_required`

**State Management:**
- Request status stored in `LegalRequest.status`
- Document versions have independent `DocumentVersion.status`
- Reviews have `Review.status` and `Review.decision`
- Workflow transitions logged in `WorkflowTransition`

## Key Abstractions

**AppSession:**
- Purpose: Represents authenticated user with roles and workspace context
- Examples: `src/lib/security/session.ts`
- Pattern: Passed through service methods for authorization

**LegalRequest:**
- Purpose: Core entity representing a customer's legal request
- Examples: `prisma/schema.prisma` - `LegalRequest` model
- Pattern: Status-based workflow, assigned users, linked documents

**DocumentVersion:**
- Purpose: Immutable snapshot of a document at a point in time
- Examples: `prisma/schema.prisma` - `DocumentVersion` model
- Pattern: Versioned, linked to template, has approval status

**AuditEvent:**
- Purpose: Immutable log of all significant actions
- Examples: `src/lib/audit/audit.ts`
- Pattern: Actor, target, action, metadataSummary, correlationId

## Entry Points

**Customer Intake:**
- Location: `src/app/[locale]/intake/page.tsx`
- Triggers: GET `/[locale]/intake`, POST via Server Action
- Responsibilities: Render intake form, call `intake-service.ts` to save/submit

**Admin Routing:**
- Location: `src/app/[locale]/admin/routing/page.tsx`
- Triggers: GET admin route
- Responsibilities: List requests, assign specialists/reviewers

**API Routes:**
- Location: `src/app/api/**/route.ts`
- Triggers: HTTP requests
- Responsibilities: Validate session, delegate to service layer

**Server Actions:**
- Location: `src/app/**/actions.ts`
- Triggers: Form submissions, button clicks
- Responsibilities: Collect form data, call service layer, return result

## Architectural Constraints

- **Threading:** Node.js single-threaded event loop; async/await for I/O operations
- **Global state:** Prisma client singleton in `src/lib/prisma.ts` (avoids connection exhaustion)
- **Circular imports:** No known circular dependency chains; lib services are stateless
- **Locale routing:** Next-intl with `[locale]` dynamic segment; all pages under `src/app/[locale]/`
- **Tenant isolation:** All queries scoped by `workspaceId`; no cross-tenant data access

## Anti-Patterns

### Direct Prisma Access in Pages

**What happens:** Page components query Prisma directly instead of using service layer
**Why it's wrong:** Bypasses RBAC checks, duplicates business logic, inconsistent error handling
**Do this instead:** Create service methods in `src/lib/` and call them from pages/API routes

### Hardcoded Status Strings

**What happens:** Using raw strings like `'pending_review'` instead of type constants
**Why it's wrong:** No type safety, easy to misspell, IDE autocomplete unavailable
**Do this instead:** Use constants from `src/lib/types.ts`:
```typescript
import { REQUEST_STATUS } from '@/lib/types';
const status = REQUEST_STATUS.PENDING_REVIEW;
```

## Error Handling

**Strategy:** Service functions throw typed error codes as strings; callers catch and convert to HTTP responses or UI messages

**Patterns:**
```typescript
// Service throws error code
if (!request) throw new Error('REQUEST_NOT_FOUND');

// API route catches and returns 404
if (error.message === 'REQUEST_NOT_FOUND') {
  return Response.json({ error: 'Not found' }, { status: 404 });
}
```

## Cross-Cutting Concerns

**Logging:** Console.log for development; no structured logging framework detected

**Validation:** Service-layer validation with typed error codes; no schema validation library

**Authentication:** Better Auth with Prisma adapter; session stored in cookie via `nextCookies()` plugin

**Authorization:** RBAC service (`src/lib/security/rbac.ts`) checks user roles and request ownership

---

*Architecture analysis: 2026-06-12*
