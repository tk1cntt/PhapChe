# Architecture

**Analysis Date:** 2026-06-14

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                          │
│                   `[src/app/]` - Pages & API Routes                  │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│  [locale] Pages     │   API Routes        │    Middleware           │
│  `[app/[locale]/]`  │  `[app/api/]`       │  `[middleware.ts]`      │
│  - sign-in          │  - intake           │  - i18n routing         │
│  - cases            │  - messages         │  - auth protection      │
│  - create           │  - vault            │                         │
│  - workspace        │  - admin            │                         │
│  - admin            │  - settings         │                         │
└──────────┬──────────┴──────────┬─────────┴─────────────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Service Layer `[src/lib/]`                       │
├──────────────┬───────────────┬───────────────┬──────────────────────┤
│   Workflow   │   Intake      │   Documents   │   Reviews           │
│  `[workflow]`│  `[intake]`    │  `[documents]`│  `[reviews]`        │
│  - state     │  - create     │  - vault      │  - checklist        │
│  - transitions│  - validate   │  - templates  │  - review service    │
│              │  - submit     │  - drafts     │                      │
├──────────────┴───────────────┴───────────────┴──────────────────────┤
│                    Security & Infrastructure                         │
│  `[security/]`            `[audit/]`           `[ops/]`              │
│  - RBAC                  - audit logging      - operations          │
│  - Session               - event recording    - stats               │
└─────────────────────────┬───────────────────┴──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Prisma ORM `[src/lib/prisma.ts]`                  │
│                    SQLite (dev) / PostgreSQL (prod)                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Workflow State Machine | Request status transitions, RBAC for status changes | `src/lib/workflow/request-workflow.ts` |
| Intake Service | Draft creation, answer validation, submission | `src/lib/intake/intake-service.ts` |
| Vault Service | Secure file storage, signed URL access, RBAC | `src/lib/documents/vault-service.ts` |
| RBAC Security | Workspace/request access control | `src/lib/security/rbac.ts` |
| Session Management | Auth session extraction, workspace context | `src/lib/security/session.ts` |
| Audit Logging | Event recording for all state changes | `src/lib/audit/audit.ts` |
| Auth | Better-Auth integration with Prisma adapter | `src/auth.ts` |
| i18n Routing | Locale prefix routing, preference cookies | `src/routing.ts` |

## Pattern Overview

**Overall:** Next.js App Router with Service Layer and State Machine

**Key Characteristics:**
- API routes delegate to service layer (not direct DB access in routes)
- Status transitions enforced server-side via state machine
- Audit events recorded for every state change
- RBAC checked at service entry points
- Session carries workspace context and roles
- Vault files never expose storageKey, only signed URLs

## Layers

**Presentation Layer (Next.js App Router):**
- Purpose: Render pages, handle HTTP requests
- Location: `src/app/`
- Contains: Pages (`.tsx`), API routes (`.ts`), layouts
- Depends on: Service layer, hooks
- Used by: Browser, mobile clients

**API Routes:**
- Location: `src/app/api/**/route.ts`
- Pattern: Validate input, call service, return JSON response
- Error handling: Map service errors to HTTP status codes

**Service Layer:**
- Purpose: Business logic, data validation, authorization
- Location: `src/lib/**/`
- Contains: Intake service, vault service, review service, workflow
- Depends on: Prisma, types
- Used by: API routes

**Data Access Layer:**
- Purpose: Database queries via Prisma
- Location: `src/lib/prisma.ts` (singleton)
- Contains: PrismaClient instance
- Depends on: Database (SQLite/PostgreSQL)

## Data Flow

### Primary Request Path (Intake to Delivery)

1. **Create Request** (`src/app/api/intake/create-draft/route.ts:POST`)
   - User submits matter type
   - Calls `createDraftIntake()` in intake-service
   - Creates LegalRequest with draft_intake status
   - Records audit event

2. **Submit Intake** (`src/app/api/intake/submit/route.ts:POST`)
   - User submits answers
   - Validates required fields
   - Calls `submitIntake()` in intake-service
   - Transitions to `intake_submitted`
   - Auto-triages if matter type is unsupported

3. **Triage** (`src/lib/workflow/request-workflow.ts:transitionRequestStatus`)
   - Coordinator assigns specialist/reviewer
   - Transitions to `triage` -> `assigned`

4. **In Progress** (`src/lib/workflow/request-workflow.ts`)
   - Specialist works on request
   - Creates documents, receives reviews

5. **Review** (`src/lib/reviews/review-service.ts`)
   - Reviewer approves/rejects document versions
   - Checklist answers recorded

6. **Deliver** (`src/lib/documents/vault-service.ts`)
   - Files stored in vault with RBAC
   - Customer can only download delivered/closed files

7. **Close** (`src/lib/workflow/request-workflow.ts`)
   - Request closed, final state reached

### Authentication Flow

1. **Middleware** (`src/middleware.ts`)
   - Intercepts all requests
   - Checks for better-auth session cookie
   - Redirects unauthenticated users to sign-in

2. **Session Extraction** (`src/lib/security/session.ts`)
   - `requireAppSession()` reads auth headers
   - Returns AppSession with userId, workspaceId, roles
   - First active workspace membership is activeWorkspaceId

### Vault Access Flow

1. **Request Access** (`src/lib/documents/vault-service.ts:requestVaultFileAccess`)
   - RBAC check: user must have request access
   - Customer: only delivered/closed files, must own request
   - Generates HMAC-signed URL with 15-minute TTL

2. **Download** (`src/app/api/vault/[vaultFileId]/download/route.ts`)
   - Verifies signature and expiration
   - Streams file from storage

**State Management:**
- Server state: Prisma + Better-Auth session
- Client state: React Query for data fetching
- Workspace context: Passed via session

## Key Abstractions

**Request Workflow State Machine:**
- Purpose: Enforces valid status transitions
- Examples: `src/lib/workflow/request-workflow.ts`
- Pattern: `REQUEST_TRANSITIONS` map + `canTransitionRequestStatus()` + `transitionRequestStatus()`

**Vault File Access:**
- Purpose: Secure file download with signed URLs
- Examples: `src/lib/documents/vault-service.ts`
- Pattern: HMAC signature, TTL, RBAC check

**RBAC Permission Checks:**
- Purpose: Control access to workspaces, requests, documents
- Examples: `src/lib/security/rbac.ts`
- Pattern: `canAccessX(session, id)` functions returning boolean

**Audit Event Recording:**
- Purpose: Immutable audit trail for all actions
- Examples: `src/lib/audit/audit.ts`
- Pattern: `recordAuditEvent()` with required correlationId

## Entry Points

**Web Application:**
- Location: `src/app/[locale]/`
- Triggers: User navigation
- Responsibilities: Render pages, handle forms

**API Routes:**
- Location: `src/app/api/**/route.ts`
- Triggers: Client fetch calls, webhooks
- Responsibilities: Validate, authorize, execute, respond

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every HTTP request
- Responsibilities: i18n routing, auth protection

**Background Jobs:**
- Location: Not implemented (MVP scope)
- Responsibilities: Future automation

## Architectural Constraints

- **Threading:** Node.js single-threaded event loop, no worker threads
- **Global state:** Prisma singleton via `globalForPrisma`
- **Circular imports:** Service layer may import from `lib/types.ts`
- **Auth:** Better-Auth only, no custom auth implementation

## Anti-Patterns

### Direct Prisma Access in Routes

**What happens:** Some API routes use `prisma` directly instead of calling service layer
**Why it's wrong:** Bypasses business logic, validation, audit logging
**Do this instead:** Create service methods in `src/lib/` and call from routes

### Magic Strings for Status

**What happens:** Status strings like `'draft_intake'` scattered in components
**Why it's wrong:** No type safety, typos not caught
**Do this instead:** Use `REQUEST_STATUS` constants from `src/lib/types.ts`

### Inline Error Messages

**What happens:** Error strings like `'FORBIDDEN'` defined in services and routes
**Why it's wrong:** Inconsistent, hard to localize, duplicate definitions
**Do this instead:** Centralize error definitions in constants or error catalog

## Error Handling

**Strategy:** Service layer throws named errors, API routes map to HTTP responses

**Patterns:**
- Service errors: `throw new Error('ERROR_CODE')` with descriptive code
- API error handling: `try/catch` with error message inspection
- No error codes enum - relies on string matching

## Cross-Cutting Concerns

**Logging:** `console.error` for errors in API routes
**Validation:** Per-service input validation, no shared validation framework
**Authentication:** Better-Auth middleware + session extraction
**Authorization:** RBAC service layer functions

---

*Architecture analysis: 2026-06-14*
