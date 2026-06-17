# Architecture

**Analysis Date:** 2026-06-17

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App Router                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Page Routes   │  │   API Routes    │  │  Middleware  │ │
│  │ src/app/[locale]│  │  src/app/api/    │  │ src/middleware│ │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┘ │
├───────────┼────────────────────┼───────────────────────────┤
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌──────────────┐ │
│  │  React Components│  │  Service Layer │  │   Prisma     │ │
│  │  src/components/ │  │   src/lib/     │  │  Database    │ │
│  └──────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| LocaleLayout | i18n provider, React Query wrapper | `src/app/[locale]/layout.tsx` |
| DashboardClient | Main dashboard UI | `src/components/dashboard/DashboardClient.tsx` |
| ApiClient | Central HTTP client | `src/lib/api/client.ts` |
| Auth | Authentication config | `src/auth.ts` |
| RequestWorkflow | State machine for request status | `src/lib/workflow/request-workflow.ts` |

## Pattern Overview

**Overall:** Next.js App Router with Service Layer + Prisma ORM

**Key Characteristics:**
- Server Components by default, Client Components for interactivity
- API Routes as thin HTTP layer delegating to Service Layer
- Prisma ORM for type-safe database access
- i18n routing via next-intl with locale prefix
- Authentication via better-auth with Prisma adapter

## Layers

**App Layer (Next.js App Router):**
- Purpose: HTTP endpoints and page rendering
- Location: `src/app/`
- Contains: Pages (`.tsx`), API routes (`.ts`), layouts
- Depends on: Service layer
- Used by: Browser clients

**Component Layer:**
- Purpose: Reusable UI components
- Location: `src/components/`
- Contains: Atoms, molecules, organisms, templates
- Depends on: UI libraries, types
- Used by: Pages, other components

**Service Layer:**
- Purpose: Business logic encapsulation
- Location: `src/lib/`
- Contains: Workflows, services, types, utilities
- Depends on: Prisma, database
- Used by: API routes

**Data Layer:**
- Purpose: Database access and schema
- Location: `prisma/schema.prisma`
- Contains: Models, relations, indexes
- Depends on: Database engine
- Used by: Service layer

## Data Flow

### Primary Request Path

1. **Entry** - User accesses `/[locale]/cases` page
2. **API Call** - Page component calls `/api/dashboard`
3. **API Route** - `src/app/api/dashboard/route.ts` receives request
4. **Service** - Delegates to service function in `src/lib/`
5. **Database** - Prisma queries database
6. **Response** - Data flows back to client

### Authentication Flow

1. **Login** - User submits credentials via `/api/auth/sign-in/email`
2. **Auth Handler** - `better-auth` validates credentials
3. **Session** - Creates session, stores in database, sets cookie
4. **Middleware** - `src/middleware.ts` validates session on protected routes

### Workflow Transition Flow

1. **User Action** - Specialist clicks "Mark for Review"
2. **API Call** - POST to `/api/admin/requests/[id]/status`
3. **RBAC Check** - `canAccessRequest()` validates permissions
4. **Transition Check** - `canTransitionRequestStatus()` validates state change
5. **Database** - Prisma updates request status, creates audit event
6. **Response** - Updated request returned

## Key Abstractions

**ApiClient:**
- Purpose: Centralized HTTP client with typed responses
- Examples: `src/lib/api/client.ts`
- Pattern: Singleton with domain-specific methods

**RequestWorkflow:**
- Purpose: State machine for LegalRequest status transitions
- Examples: `src/lib/workflow/request-workflow.ts`
- Pattern: Role-based transition validation with audit trail

**Better-Auth:**
- Purpose: Authentication with session management
- Examples: `src/auth.ts`
- Pattern: Prisma adapter with nextCookies plugin

## Entry Points

**Web Application:**
- Location: `src/app/[locale]/`
- Triggers: Browser navigation
- Responsibilities: Page rendering, layouts, i18n

**API Routes:**
- Location: `src/app/api/`
- Triggers: HTTP requests from client
- Responsibilities: Request validation, service delegation, response formatting

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every request
- Responsibilities: Auth validation, locale detection

## Architectural Constraints

**Threading:** Single-threaded Node.js event loop (Next.js default)

**Global State:** None detected - state managed via React Query or Context

**Circular Imports:** Not detected in codebase structure

## Anti-Patterns

### Direct API Calls in Components

**What happens:** Components make direct fetch calls instead of using ApiClient
**Why it's wrong:** Inconsistent error handling, no centralized logging, harder to test
**Do this instead:** Use `src/lib/api/client.ts` for all API calls

### Mixing Service Logic in API Routes

**What happens:** Complex business logic directly in API route handlers
**Why it's wrong:** Hard to test, violates single responsibility
**Do this instead:** Keep routes thin, delegate to service functions in `src/lib/`

## Error Handling

**Strategy:** Centralized error boundaries + try-catch in API routes

**Patterns:**
- Error boundaries in React components (`ErrorFallback.tsx`)
- Thrown errors in services caught by API routes
- Typed error responses via `ErrorResponse` type

## Cross-Cutting Concerns

**Logging:** Console-based, audit events recorded in database

**Validation:** Schema validation in API routes, type guards in services

**Authentication:** better-auth middleware with session cookies

**i18n:** next-intl with locale routing and message providers

---

*Architecture analysis: 2026-06-17*
