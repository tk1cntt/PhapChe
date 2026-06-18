<!-- refreshed: 2026-06-18 -->
# Architecture

**Analysis Date:** 2026-06-18

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│                  `[src/app]` (Pages)                         │
├──────────────────┬──────────────────┬───────────────────────┤
│  [locale] pages  │   admin pages    │    API routes        │
│  `/[locale]/*`   │  `/[locale]/`    │  `/api/*`            │
└────────┬─────────┴────────┬─────────┴──────────┬──────────┘
         │                   │                     │
         ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                           │
│   `[src/components]` - Shared UI, Admin, Messages, etc.      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                              │
│   `[src/lib]` - Core business logic, workflow, RBAC          │
│   ├── workflow/    - Request state machine                   │
│   ├── routing/     - Specialist/reviewer assignment          │
│   ├── documents/   - Vault, drafts, templates                │
│   ├── reviews/     - Quality control checklist              │
│   ├── delivery/    - Document delivery & notifications       │
│   ├── audit/       - Event logging                          │
│   └── security/    - RBAC, session management               │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                 │
│           Prisma ORM + SQLite/PostgreSQL                     │
│                    `[prisma/schema.prisma]`                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| RequestWorkflow | State machine for request lifecycle | `src/lib/workflow/request-workflow.ts` |
| RoutingService | Specialist/reviewer assignment logic | `src/lib/routing/routing-service.ts` |
| VaultService | Secure file storage with signed URLs | `src/lib/documents/vault-service.ts` |
| ReviewService | Quality control checklist review | `src/lib/reviews/review-service.ts` |
| DeliveryService | Document delivery and notifications | `src/lib/delivery/delivery-service.ts` |
| RBAC | Role-based access control | `src/lib/security/rbac.ts` |
| Audit | Event logging for all operations | `src/lib/audit/audit.ts` |

## Pattern Overview

**Overall:** Layered Next.js with Service-Oriented Business Logic

**Key Characteristics:**
- Next.js App Router with locale-based routing (`/[locale]`)
- Better Auth for authentication with Prisma adapter
- Service layer isolation from API routes
- Prisma ORM for database access
- State machine for request workflow
- RBAC-based authorization
- Audit event logging for all mutations

## Layers

**UI Layer (Next.js Pages):**
- Purpose: Render pages with locale support
- Location: `src/app/[locale]/*`
- Contains: Page components, layouts
- Depends on: API routes, client hooks
- Used by: Browser

**API Layer (Next.js Route Handlers):**
- Purpose: HTTP endpoints for client communication
- Location: `src/app/api/*`
- Contains: Route handlers (GET, POST, etc.)
- Depends on: Service layer
- Used by: Client hooks, external clients

**Service Layer:**
- Purpose: Business logic, state management, authorization
- Location: `src/lib/*`
- Contains: Workflow, routing, vault, reviews, delivery, audit, security
- Depends on: Prisma, types
- Used by: API routes

**Data Layer:**
- Purpose: Database schema, ORM operations
- Location: `prisma/schema.prisma`
- Contains: All data models
- Depends on: Database (SQLite/PostgreSQL)
- Used by: Service layer

## Data Flow

### Primary Request Lifecycle

1. **Intake** - Customer submits request via `/api/intake/submit` route
   - `src/app/api/intake/submit/route.ts`
2. **Triage** - Coordinator triages via `/api/admin/requests/triage` route
   - `src/lib/routing/routing-service.ts:assignRequest()`
3. **Assignment** - Specialist/reviewer assigned with routing capability check
   - `src/lib/routing/routing-service.ts:assignRequest()`
4. **Progress** - Specialist works on document, creates draft versions
   - `src/lib/documents/draft-service.ts`
5. **Review** - Reviewer quality-checks with checklist
   - `src/lib/reviews/review-service.ts:approveReview()`
6. **Delivery** - Coordinator marks delivered, sends notification
   - `src/lib/delivery/delivery-service.ts:markRequestDelivered()`
7. **Closure** - Customer receives final documents, request closed
   - `src/lib/delivery/delivery-service.ts:closeDeliveredRequest()`

### Status Transition Flow

```
draft_intake → intake_submitted → triage → assigned → in_progress
                                                    ↓
                                          pending_review → approved → delivered → closed
                                                    ↓
                                          revision_required → in_progress
```

### Vault File Access Flow

1. User requests file access via `/api/vault/route.ts`
2. `requestVaultFileAccess()` generates signed URL with HMAC signature
3. `verifyVaultFileAccessSignature()` validates signature on download
4. Storage key never exposed to client

## Key Abstractions

**Request Workflow State Machine:**
- Purpose: Enforce valid status transitions
- Examples: `src/lib/workflow/request-workflow.ts`
- Pattern: Transition function validates actor permissions before change

**RBAC Authorization:**
- Purpose: Check if user can access resources
- Examples: `src/lib/security/rbac.ts`
- Pattern: Functions like `canAccessRequest()`, `canAccessVaultFile()`

**Audit Event Recording:**
- Purpose: Log all significant operations
- Examples: `src/lib/audit/audit.ts`
- Pattern: Service functions call `recordAuditEvent()` with action, target, metadata

**Session Management:**
- Purpose: Provide authenticated user context
- Examples: `src/lib/security/session.ts`
- Pattern: `requireAppSession()` extracts user, workspace, roles

## Entry Points

**Auth Handler:**
- Location: `src/app/api/auth/[...all]/route.ts`
- Triggers: All auth API calls (sign-in, sign-out, session)
- Responsibilities: Delegate to better-auth

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every request
- Responsibilities: i18n routing, auth protection for non-API routes

**API Routes:**
- Location: `src/app/api/*/route.ts`
- Triggers: Client HTTP requests
- Responsibilities: Request validation, call service, return response

## Architectural Constraints

- **Threading:** Node.js single-threaded event loop (Next.js standard)
- **Global state:** Prisma client singleton at `src/lib/prisma.ts`
- **Circular imports:** Service layer has no circular dependencies (verified via architecture)
- **Database:** SQLite dev / PostgreSQL production via Prisma adapter
- **i18n:** next-intl with locale prefix on all routes

## Anti-Patterns

### Direct Prisma in API Routes

**What happens:** Some API routes query Prisma directly instead of using services
**Why it's wrong:** Bypasses service layer authorization, audit logging
**Do this instead:** Use service functions like `routingService.assignRequest()`

```typescript
// Anti-pattern in src/app/api/requests/route.ts:42
prisma.legalRequest.findMany({ where })

// Correct: src/lib/routing/routing-service.ts:223
export async function assignRequest(input: AssignRequestInput)
```

### Status Hardcoding in API Routes

**What happens:** Some routes set request status directly
**Why it's wrong:** Bypasses workflow state machine validation
**Do this instead:** Use `transitionRequestStatus()` from workflow service

## Error Handling

**Strategy:** Service functions throw typed errors, routes catch and return HTTP responses

**Patterns:**
- Service throws: `throw new Error('REQUEST_NOT_FOUND')`
- Route catches: `try { ... } catch { return NextResponse.json({ error: ... }, { status: 400 }) }`

## Cross-Cutting Concerns

**Logging:** Audit events via `recordAuditEvent()` for all mutations
**Validation:** Input validation in service layer (requireText pattern)
**Authentication:** Better Auth with Prisma adapter at `src/auth.ts`
**Authorization:** RBAC functions in `src/lib/security/rbac.ts`
**i18n:** Locale prefix routing via next-intl middleware

---

*Architecture analysis: 2026-06-18*
