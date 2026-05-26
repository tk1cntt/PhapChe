# Phase 01: foundation - Research

**Researched:** 2026-05-26
**Domain:** Next.js modular monolith, PostgreSQL/Prisma, Auth.js RBAC, tenant isolation, workflow state machine, append-only audit
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Product Boundary
- **D-01:** Build greenfield modular monolith foundation. No existing `src/` or `app/` code found. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-02:** Keep foundation scope narrow: auth/RBAC, tenant/workspace model, request shell, workflow state machine, audit events. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

#### Roles and Workspaces
- **D-03:** Support five roles from day one: `customer`, `specialist`, `reviewer`, `coordinator_admin`, `super_admin`. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-04:** Model every SME as separate customer workspace/organization. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-05:** Internal users access request data only through assignment or admin-level permission. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

#### Authorization
- **D-06:** Enforce authorization server-side for every request, document, review, and vault file access path. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-07:** Frontend role checks are UX only, not security. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-08:** Use least-privilege defaults: customer sees own workspace, specialist sees assigned work, reviewer sees review-assigned work, coordinator/admin manages operations, super admin manages system setup. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

#### Workflow State
- **D-09:** Request status changes go through backend workflow transitions only. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-10:** Initial request states: `draft_intake`, `intake_submitted`, `triage`, `assigned`, `in_progress`, `pending_review`, `revision_required`, `approved`, `delivered`, `closed`, `cancelled`. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-11:** Every transition records actor, timestamp, from-state, to-state, and optional reason. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

#### Audit Trail
- **D-12:** Audit log must be append-only from Phase 1. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-13:** Audit events include actor, workspace/customer, action, target type/id, timestamp, request correlation id, and metadata summary. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-14:** Phase 1 audits user/role changes, request creation/status changes, and assignment-related changes; later phases extend file/document/review/delivery actions. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-15:** Do not store unnecessary sensitive legal content in audit metadata; store identifiers, summaries, hashes, or references. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

#### Technical Direction
- **D-16:** Follow project stack direction unless research/planning finds blocker: Next.js + TypeScript modular monolith, PostgreSQL + Prisma, S3/R2-style storage later, worker later. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **D-17:** Prioritize clean domain model and enforceable server-side boundaries over polished UI. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

### Claude's Discretion
- Exact auth provider selection may be researched/planned, but must preserve roles, workspace isolation, and server-side permission checks. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- Exact table/type naming can follow framework conventions as long as role/workspace/request/audit/workflow concepts stay explicit. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- Exact admin UI styling can use standard shadcn/Tailwind patterns if used. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)
- Chat/form intake UI and structured intake questions — Phase 2 `intake`. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- Capability Matrix details and assignment queues — Phase 3 `routing`. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- Document templates, Legal Vault files, document versioning — Phase 4 `documents-vault`. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- Reviewer split view and QC checklist — Phase 5 `review`. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- Secure signed download links and customer delivery — Phase 6 `delivery`. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- SLA/workload dashboard — Phase 7 `ops`. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- OCR, e-sign, AI draft/risk flags, compliance calendar, billing automation — v2/deferred. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | Admin can manage customer, specialist, reviewer, coordinator, and super admin users. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md] | Use Auth.js user base plus app-owned `UserRole`/`WorkspaceMembership` tables and admin server actions. [CITED: Context7 /nextauthjs/next-auth] |
| FND-02 | System enforces server-side RBAC for requests, documents, reviews, and vault files. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md] | Centralize `requirePermission()` in server-only authz layer; route handlers/server actions call it before Prisma access. [CITED: Context7 /vercel/next.js] |
| FND-03 | System records append-only audit events for all critical actions. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md] | `AuditEvent` insert-only table; write inside same Prisma transaction as mutation. [CITED: Context7 /prisma/prisma] |
| FND-04 | System isolates each SME in its own customer workspace. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md] | `Workspace` scoped foreign keys on requests, document shells, review shells, vault file shells. [ASSUMED] |
| FND-05 | Request status changes only through backend workflow transitions. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md] | Domain service validates transition map and records `RequestStatusTransition`. [ASSUMED] |
</phase_requirements>

## Summary

Phase 1 should create minimal secure modular monolith foundation: Next.js App Router + TypeScript, Auth.js/Auth.js Prisma adapter, PostgreSQL + Prisma, Zod validation, Tailwind/shadcn minimal admin UI. Package versions were verified from npm on 2026-05-26: Next.js `16.2.6`, TypeScript `6.0.3`, Prisma `7.8.0`, `@prisma/client` `7.8.0`, `next-auth` `4.24.14`, `@auth/prisma-adapter` `2.11.2`, Zod `4.4.3`, Vitest `4.1.7`, Playwright `1.60.0`, Tailwind CSS `4.3.0`, shadcn `4.8.0`. [VERIFIED: npm registry]

Use backend-first security. Browser role checks only hide/show UI; every route handler/server action must load current actor, workspace membership, role, and assignment, then call shared authorization predicates before Prisma queries/mutations. Next.js Route Handlers live under `app` and use standard Web Request/Response APIs; Auth.js supports Prisma persistence and role exposure through callbacks; Prisma schema/migrations model PostgreSQL data and Prisma Client handles typed access. [CITED: Context7 /vercel/next.js] [CITED: Context7 /nextauthjs/next-auth] [CITED: Context7 /prisma/prisma]

Keep MVP narrow. Build shells for request/document/review/vault access boundaries, not vault storage, template generation, reviewer checklist, delivery, OCR, e-sign, AI, billing, or workflow builder. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

**Primary recommendation:** Use Next.js server actions/route handlers as thin adapters over domain services: `authz`, `users`, `workspaces`, `requests`, `workflow`, `audit`; all mutations run in Prisma transactions with audit insert. [CITED: Context7 /vercel/next.js] [CITED: Context7 /prisma/prisma]

## Project Constraints (from CLAUDE.md)

- All user-facing exchange must use Vietnamese. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Phase/quick slugs must be short English. [VERIFIED: D:\PhapChe\CLAUDE.md]
- State assumptions before implementation; ask when unclear. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Prefer minimum code; no speculative features, single-use abstractions, or unrequested configurability. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Touch only required files; do not refactor adjacent code. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Define verifiable goals and tests/checks for multi-step work. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Legal content must pass reviewer before final. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Legal files are sensitive: private files, tenant/request permissions, short-lived signed URLs later, full audit. [VERIFIED: D:\PhapChe\CLAUDE.md]
- MVP prioritizes end-to-end workflow over OCR/e-sign/advanced AI. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Template governance requires versioned approved/published/deprecated lifecycle in later phase. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Status changes must use backend state machine, not frontend hard-coded logic. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Review must bind to document version later; Phase 1 should preserve boundary. [VERIFIED: D:\PhapChe\CLAUDE.md]
- Before editing code, start through GSD command; this research was invoked by GSD phase research context. [VERIFIED: D:\PhapChe\CLAUDE.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Authentication session | Frontend Server (SSR) | API / Backend | Auth.js session and callbacks run server-side; UI consumes session only for UX. [CITED: Context7 /nextauthjs/next-auth] |
| RBAC and tenant authorization | API / Backend | Database / Storage | Server must enforce every access path before data read/write; DB schema reinforces workspace scoping. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| User/role admin | API / Backend | Browser / Client | Admin UI submits changes; server validates coordinator/super admin authority and writes audit. [ASSUMED] |
| Workspace isolation | Database / Storage | API / Backend | Workspace foreign keys and membership rows define isolation; API filters by permitted workspace/request. [ASSUMED] |
| Request shell | API / Backend | Database / Storage | Request lifecycle and access rules are domain logic; persistence stores status and workspace. [ASSUMED] |
| Workflow transitions | API / Backend | Database / Storage | Backend transition service owns state map; DB stores current status and transition history. [VERIFIED: D:\PhapChe\CLAUDE.md] |
| Append-only audit | API / Backend | Database / Storage | Mutation service writes audit events; DB stores insert-only event log. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| Minimal admin UI | Browser / Client | Frontend Server (SSR) | UI lists forms/tables; security remains server-side. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.6 [VERIFIED: npm registry] | App Router UI, server actions, route handlers | Route Handlers use standard Web Request/Response APIs in `app`; good modular monolith host. [CITED: Context7 /vercel/next.js] |
| TypeScript | 6.0.3 [VERIFIED: npm registry] | Static typing | Required stack direction; improves domain model and permission typing. [VERIFIED: D:\PhapChe\.planning\research\SUMMARY.md] |
| PostgreSQL | external service [ASSUMED] | Relational tenant/workflow/audit storage | Strong fit for roles, memberships, transitions, audit events, constraints. [ASSUMED] |
| Prisma | 7.8.0 [VERIFIED: npm registry] | ORM, schema, migrations | Prisma schema defines datasource/generator/models; Prisma Migrate manages schema changes. [CITED: Context7 /prisma/prisma] |
| @prisma/client | 7.8.0 [VERIFIED: npm registry] | Typed DB client | Generated typed client for domain services. [CITED: Context7 /prisma/prisma] |
| next-auth | 4.24.14 [VERIFIED: npm registry] | Auth.js for Next auth | Supports Prisma adapter and session callback exposing role. [CITED: Context7 /nextauthjs/next-auth] |
| @auth/prisma-adapter | 2.11.2 [VERIFIED: npm registry] | Auth.js Prisma persistence | Requires User, Account, Session, VerificationToken models. [CITED: Context7 /nextauthjs/next-auth] |
| zod | 4.4.3 [VERIFIED: npm registry] | Input validation | `.parse()` validates untrusted input and returns typed data; `safeParse()` returns result without throw. [CITED: Context7 /colinhacks/zod] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.3.0 [VERIFIED: npm registry] | Utility styling | Minimal admin/customer portal layout. [VERIFIED: D:\PhapChe\.planning\research\SUMMARY.md] |
| shadcn | 4.8.0 [VERIFIED: npm registry] | UI component scaffolding | Admin tables/forms without custom design system. [VERIFIED: D:\PhapChe\.planning\research\SUMMARY.md] |
| Vitest | 4.1.7 [VERIFIED: npm registry] | Unit tests | Fast tests for authz predicates, workflow transitions, audit payload builder. [ASSUMED] |
| Playwright | 1.60.0 [VERIFIED: npm registry] | E2E smoke tests | Login/admin/user management smoke paths when UI exists. [ASSUMED] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Auth.js | Clerk | Faster hosted auth; less control over app-owned roles/workspace semantics. Project allows Clerk/Auth.js, but Auth.js better for deep RBAC/data ownership. [VERIFIED: D:\PhapChe\.planning\research\SUMMARY.md] [ASSUMED] |
| Server actions | Route handlers only | Route handlers clearer API boundary; server actions simpler for admin forms. Use both thinly, sharing domain services. [CITED: Context7 /vercel/next.js] |
| Custom validation | Zod | Zod avoids hand-rolled runtime validation and keeps inferred TS types. [CITED: Context7 /colinhacks/zod] |

**Installation:**
```bash
npm install next react react-dom typescript prisma @prisma/client next-auth @auth/prisma-adapter zod tailwindcss shadcn
npm install -D vitest @testing-library/react playwright
```

**Version verification:** `npm view <package> version` run 2026-05-26 for packages above. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Browser admin/customer UI
  -> Next.js Server Components / Server Actions / Route Handlers
  -> auth() current user/session
  -> Zod input validation
  -> requirePermission(actor, action, resource)
       -> Role + workspace membership lookup
       -> Assignment lookup for specialist/reviewer
       -> Admin override check for coordinator_admin/super_admin
  -> Domain service mutation/query
       -> Prisma transaction
          -> Business row insert/update/read
          -> AuditEvent insert for critical actions
          -> RequestStatusTransition insert for workflow changes
  -> PostgreSQL
```

### Recommended Project Structure

```text
app/
├── (auth)/                    # sign-in/out routes/pages if needed
├── admin/                     # minimal admin UI
├── requests/                  # request shell UI
└── api/                       # route handlers for non-form endpoints
components/
├── ui/                        # shadcn components
└── admin/                     # tables/forms
lib/
├── auth.ts                    # Auth.js config, auth helper
├── prisma.ts                  # Prisma client singleton
├── validation/                # zod schemas
└── server-only.ts             # optional server-only guard imports
domains/
├── authz/                     # permissions, policies, requirePermission
├── users/                     # user admin services
├── workspaces/                # workspace/membership services
├── requests/                  # request shell service
├── workflow/                  # transition map/service
└── audit/                     # audit event writer
prisma/
├── schema.prisma              # models/enums
└── migrations/                # Prisma migrations
tests/
├── authz/                     # unit tests for policy matrix
├── workflow/                  # unit tests for transitions
└── audit/                     # audit insert/payload tests
```

### Pattern 1: Thin Next.js adapter over domain service
**What:** Route Handler/Server Action validates input, loads actor, checks permission, delegates to service. [CITED: Context7 /vercel/next.js]
**When to use:** Every mutation and sensitive read. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
**Example:**
```typescript
// Source: Context7 /vercel/next.js Route Handlers + /colinhacks/zod parse
export async function POST(request: Request) {
  const input = createRequestSchema.parse(await request.json())
  const actor = await requireActor()
  await requirePermission(actor, 'request:create', { workspaceId: input.workspaceId })
  const result = await createLegalRequest(actor, input)
  return Response.json(result)
}
```

### Pattern 2: Transactional mutation + audit
**What:** Mutation and audit event insert happen in one Prisma transaction. [CITED: Context7 /prisma/prisma]
**When to use:** User role changes, request creation, assignment changes, status transitions. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
**Example:**
```typescript
// Source: Context7 /prisma/prisma transactions capability
await prisma.$transaction(async (tx) => {
  const request = await tx.legalRequest.update({ where: { id }, data })
  await tx.auditEvent.create({ data: buildAudit(actor, 'request.updated', request) })
  return request
})
```

### Pattern 3: Backend workflow transition service
**What:** `transitionRequest(actor, requestId, toStatus, reason?)` loads request, validates allowed edge, checks permission, updates status, inserts transition and audit. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
**When to use:** Every request status change; never expose generic status update. [VERIFIED: D:\PhapChe\CLAUDE.md]
**Example transition map:**
```typescript
// Source: Project decisions D-09..D-11
const allowedTransitions = {
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
} as const
```

### Anti-Patterns to Avoid
- **Frontend-only RBAC:** UI role checks do not protect API or server actions; always enforce server-side. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **Generic `updateRequest({ status })`:** Bypasses workflow/audit. Use transition service only. [VERIFIED: D:\PhapChe\CLAUDE.md]
- **Audit logs with legal content:** Metadata must store IDs/summaries/hashes/references, not sensitive legal body text. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
- **Direct Prisma calls from UI components:** Hides authorization inconsistently. Use domain services. [ASSUMED]
- **Overbuilt permission engine:** Fixed roles and small policy matrix are enough for MVP; no workflow builder or custom DSL. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md]

## Data Model Guidance

### Core enums

```prisma
enum Role {
  customer
  specialist
  reviewer
  coordinator_admin
  super_admin
}

enum RequestStatus {
  draft_intake
  intake_submitted
  triage
  assigned
  in_progress
  pending_review
  revision_required
  approved
  delivered
  closed
  cancelled
}
```

### Core tables

| Model | Required fields | Notes |
|-------|-----------------|-------|
| User | Auth.js fields, `role`, timestamps | Auth.js Prisma adapter has `User`, `Account`, `Session`, `VerificationToken`; add app fields carefully. [CITED: Context7 /nextauthjs/next-auth] |
| Workspace | `id`, `name`, `type/customer`, timestamps | One SME = one workspace. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| WorkspaceMembership | `userId`, `workspaceId`, `role`, `status` | Supports customer users and internal scoped access. [ASSUMED] |
| LegalRequest | `id`, `workspaceId`, `status`, `createdById`, `assignedSpecialistId?`, `assignedReviewerId?` | Shell only; no intake answers yet. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| DocumentShell | `id`, `requestId`, `workspaceId`, `visibility`, `status` | Boundary only for FND-02; no generation/storage. [VERIFIED: D:\PhapChe\.planning\ROADMAP.md] |
| ReviewShell | `id`, `requestId`, `workspaceId`, `reviewerId?`, `documentShellId?` | Boundary only; no checklist. [VERIFIED: D:\PhapChe\.planning\ROADMAP.md] |
| VaultFileShell | `id`, `requestId`, `workspaceId`, `storageKey?`, `classification` | Boundary only; no signed URLs/storage implementation. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| RequestStatusTransition | `requestId`, `actorId`, `fromStatus`, `toStatus`, `reason`, `createdAt` | Required by D-11. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| AuditEvent | `actorId`, `workspaceId`, `action`, `targetType`, `targetId`, `requestId?`, `correlationId`, `metadata`, `createdAt` | Insert-only in app code. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |

## Permission Strategy

Use explicit action-resource checks. [ASSUMED]

| Role | Default access |
|------|----------------|
| customer | Own workspace only; own requests and allowed customer-visible shells. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| specialist | Assigned requests only; no unassigned customer data. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| reviewer | Review-assigned work only. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| coordinator_admin | Operational management across workspaces, assignments, request workflow. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| super_admin | System setup/user management across tenants. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |

Planner should create a policy matrix test for each FND-02 resource: request, document shell, review shell, vault file shell. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth/session persistence | Custom password/session tables | Auth.js + Prisma adapter | Adapter defines standard User/Account/Session/VerificationToken models. [CITED: Context7 /nextauthjs/next-auth] |
| Runtime input validation | Manual `typeof` checks everywhere | Zod schemas | `parse`/`safeParse` validate untrusted input and infer types. [CITED: Context7 /colinhacks/zod] |
| ORM/migrations | Raw SQL scattered in services | Prisma schema + Prisma Migrate | Schema defines models/datasource; Migrate manages schema changes. [CITED: Context7 /prisma/prisma] |
| Workflow engine | Configurable workflow builder | Fixed transition map/service | Requirements explicitly defer workflow builder; fixed state machine safer. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md] |
| Audit framework | Complex event bus | Simple transactional `AuditEvent` insert | Phase 1 only needs append-only critical actions. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| UI system | Custom component library | shadcn/Tailwind minimal admin UI | Research summary recommends dashboard speed; no polished UI required. [VERIFIED: D:\PhapChe\.planning\research\SUMMARY.md] |

**Key insight:** Phase 1 complexity is not UI; it is preventing data leakage through every future resource path. Build small shared server-side policy functions and test them now. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Tenant filter missing on one query
**What goes wrong:** Customer or internal user reads another SME request/document/review/vault shell. [VERIFIED: D:\PhapChe\CLAUDE.md]
**Why it happens:** Query uses resource ID only, not workspace + permission. [ASSUMED]
**How to avoid:** Domain services accept actor + resource; always check workspace/assignment before returning data. [ASSUMED]
**Warning signs:** `findUnique({ where: { id } })` followed by direct return in sensitive service. [ASSUMED]

### Pitfall 2: Role in session treated as source of truth
**What goes wrong:** Stale session role allows access after role change. [ASSUMED]
**Why it happens:** Role copied into session for UX and not rechecked against DB. [CITED: Context7 /nextauthjs/next-auth]
**How to avoid:** Use session for identity; load current DB role/memberships for authorization. [ASSUMED]
**Warning signs:** `if (session.user.role === ...)` guards server mutation without DB lookup. [ASSUMED]

### Pitfall 3: Audit written after mutation outside transaction
**What goes wrong:** Mutation succeeds but audit fails, leaving missing trail. [ASSUMED]
**Why it happens:** Audit insert not in same transaction. [ASSUMED]
**How to avoid:** Use Prisma `$transaction` for mutation + audit event. [CITED: Context7 /prisma/prisma]
**Warning signs:** Separate `await service.update()` then `await audit.create()` in caller. [ASSUMED]

### Pitfall 4: Direct status update endpoint
**What goes wrong:** Invalid status jumps, no transition reason, missing actor history. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
**Why it happens:** Generic CRUD generated for `LegalRequest`. [ASSUMED]
**How to avoid:** Only expose transition commands; make status update private inside workflow service. [VERIFIED: D:\PhapChe\CLAUDE.md]
**Warning signs:** Admin form posts arbitrary `status` value to update route. [ASSUMED]

### Pitfall 5: Audit metadata leaks legal substance
**What goes wrong:** Sensitive customer facts enter broad audit logs. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
**Why it happens:** Developers serialize full request/document payload into metadata. [ASSUMED]
**How to avoid:** Store action, IDs, old/new status/role, hashes, short summaries only. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md]
**Warning signs:** `metadata: input` for intake/document/review actions. [ASSUMED]

## Code Examples

### Permission check shape
```typescript
// Source: Project decisions D-05..D-08; implementation shape assumed
export async function requirePermission(actor: Actor, action: Action, resource: ResourceRef) {
  const allowed = await can(actor, action, resource)
  if (!allowed) throw new Error('FORBIDDEN')
}
```

### Zod validation
```typescript
// Source: Context7 /colinhacks/zod
const data = createWorkspaceSchema.parse(input)
```

### Auth.js role exposure for UI only
```typescript
// Source: Context7 /nextauthjs/next-auth role-based access control
callbacks: {
  session({ session, user }) {
    session.user.role = user.role
    return session
  },
}
```

### Prisma config
```typescript
// Source: Context7 /prisma/prisma
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js `pages/api` API Routes | App Router Route Handlers in `app` using Web Request/Response | App Router era; current docs from canary docs via Context7 [CITED: Context7 /vercel/next.js] | Plan routes under `app/api/**/route.ts`, not `pages/api`. |
| Ad hoc role checks in UI | Server-side policy layer + UI hints | Project decision Phase 1 [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] | Browser checks cannot be security boundary. |
| Editable workflow status field | Backend transition state machine | Project constraint [VERIFIED: D:\PhapChe\CLAUDE.md] | No generic status update UI/API. |
| Audit as later ops feature | Append-only audit from Phase 1 | Project decision D-12 [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] | All critical mutations need audit events now. |

**Deprecated/outdated:**
- `pages/api` first structure: use App Router route handlers for new app. [CITED: Context7 /vercel/next.js]
- Custom workflow builder: explicitly out of scope for MVP. [VERIFIED: D:\PhapChe\.planning\REQUIREMENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PostgreSQL is available/desired for implementation, not only recommendation. | Standard Stack | Planner may need Docker/Supabase setup task. |
| A2 | WorkspaceMembership table should model customer/internal scoped access. | Data Model Guidance | Simpler single role field may be enough, but membership table better future fit. |
| A3 | Vitest/Playwright are acceptable test tools. | Standard Stack | Project may prefer Jest/Cypress; adjust test plan. |
| A4 | Fixed transition map listed is acceptable initial edge policy. | Architecture Patterns | Product owner may want different allowed transitions. |
| A5 | Server services should load DB role/memberships rather than trust session role. | Pitfalls | More DB reads; can optimize later. |

## Open Questions (RESOLVED)

1. **Auth provider mode**
   - Resolution: Phase 1 plans use app-owned session/RBAC contracts and leave exact Auth.js provider wiring to implementation discretion. Auth.js remains preferred over Clerk for DB-owned roles/workspaces, but MVP does not block on OAuth/magic-link choice.
   - Planning impact: create server-side `AppSession` and RBAC helpers now; auth provider integration can plug into that contract later without weakening workspace isolation.

2. **Database availability**
   - Resolution: Phase 1 plans assume PostgreSQL + Prisma and require `.env`/`DATABASE_URL` to point to a greenfield local/dev database before `npx prisma db push`.
   - Planning impact: schema push is blocking; destructive `--accept-data-loss` is allowed only for greenfield local/dev DB, never shared/staging/production.

3. **Exact workflow edges**
   - Resolution: Use fixed D-10 status edge map from CONTEXT.md and require transition service to enforce both transition validity and actor authorization.
   - Planning impact: customer can submit/cancel own draft-style requests; coordinator_admin/super_admin can triage/assign/cancel/close; specialist can move assigned/in_progress/pending_review for assigned work; reviewer can move pending_review to revision_required/approved for assigned review. Implementation may encode conservative checks first; no generic status update endpoint.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next.js app/tooling | yes | v22.22.0 [VERIFIED: local command] | none needed |
| npm | package install/scripts | yes | 11.12.0 [VERIFIED: local command] | pnpm/yarn if project chooses later |
| git | source control | yes | 2.49.0.windows.1 [VERIFIED: local command] | none needed |
| PostgreSQL | Prisma datasource | unknown | — | Use Docker/hosted Postgres setup task [ASSUMED] |

**Missing dependencies with no fallback:**
- PostgreSQL availability not verified in this session; planner must include database provisioning/check before migrations. [ASSUMED]

**Missing dependencies with fallback:**
- None confirmed. [VERIFIED: local command]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Auth.js sessions with Prisma adapter; no custom session store. [CITED: Context7 /nextauthjs/next-auth] |
| V3 Session Management | yes | Auth.js database sessions; server-side current user lookup. [CITED: Context7 /nextauthjs/next-auth] |
| V4 Access Control | yes | Central `requirePermission()` with workspace + assignment checks. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| V5 Input Validation | yes | Zod validation for every route handler/server action input. [CITED: Context7 /colinhacks/zod] |
| V6 Cryptography | no direct Phase 1 crypto | Do not hand-roll crypto; storage signed URLs deferred. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| V7 Error Handling and Logging | yes | Avoid leaking legal content in errors/audit metadata. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| V8 Data Protection | yes | Workspace isolation, private-by-default access boundaries. [VERIFIED: D:\PhapChe\CLAUDE.md] |

### Known Threat Patterns for stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Horizontal tenant data leak | Information Disclosure | Workspace-scoped queries + authorization tests per resource. [VERIFIED: D:\PhapChe\CLAUDE.md] |
| Privilege escalation through role update | Elevation of Privilege | Only coordinator_admin/super_admin paths; audit user/role changes. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| Workflow tampering | Tampering | Backend transition service, no arbitrary status update. [VERIFIED: D:\PhapChe\CLAUDE.md] |
| Missing audit event | Repudiation | Transactional audit insert for critical mutations. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |
| Sensitive legal content in logs | Information Disclosure | Metadata allowlist with IDs/summaries/hashes only. [VERIFIED: D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md] |

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/next.js` — App Router Route Handlers, Server Actions constraints, cache revalidation examples.
- Context7 `/prisma/prisma` — Prisma schema, datasource/generator, config, migrations, transactions examples.
- Context7 `/nextauthjs/next-auth` — Prisma adapter required models, role callback/session exposure.
- Context7 `/colinhacks/zod` — `parse`, `safeParse`, TypeScript validation.
- npm registry — verified versions for Next.js, TypeScript, Prisma, Auth.js packages, Zod, Vitest, Playwright, Tailwind, shadcn.
- `D:\PhapChe\.planning\phases\01-foundation\01-CONTEXT.md` — Phase decisions and deferred scope.
- `D:\PhapChe\.planning\REQUIREMENTS.md` — FND requirements and out-of-scope list.
- `D:\PhapChe\.planning\ROADMAP.md` — Phase success criteria.
- `D:\PhapChe\.planning\research\SUMMARY.md` — stack recommendation and pitfalls.
- `D:\PhapChe\CLAUDE.md` — project constraints.

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- Assumptions listed in Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified through npm registry; package roles verified through Context7/project docs.
- Architecture: HIGH — constrained by explicit Phase 1 decisions and framework docs.
- Pitfalls: MEDIUM — core pitfalls verified by project constraints; some implementation warning signs assumed from standard app security practice.

**Research date:** 2026-05-26
**Valid until:** 2026-06-25 for stack versions; re-run `npm view` before implementation if delayed.
