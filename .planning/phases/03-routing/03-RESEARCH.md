# Phase 03: routing - Research

**Researched:** 2026-05-28
**Domain:** Internal legal request routing, capability matrix, manual assignment, RBAC, audit
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Treat `MatterType` as the shared routing taxonomy. Reuse intake matter types where they exist and let coordinator/admin manage active matter types for routing. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-02:** Capability matrix is rule-based in MVP: users with `specialist` or `reviewer` role are eligible when their configured capabilities include the request matter type. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-03:** Keep availability simple for MVP. Eligibility should consider active user and active workspace membership; advanced workload balancing and SLA prioritization belong to later ops/automation work. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-04:** Suggestions should show eligible specialists and reviewers separately, with clear reason text such as matching matter type/capability and role. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-05:** Coordinator/admin remains final decision maker. System suggests candidates but does not auto-assign. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-06:** Assignment/reassignment must update `LegalRequest.assignedSpecialistId` and `LegalRequest.assignedReviewerId`, create `RequestAssignment` history rows, require a reason, and write audit events. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-07:** Assignment should move requests through the backend workflow state machine from `triage` or `intake_submitted` toward `assigned` only through allowed backend transitions. Frontend must not hard-code status changes. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-08:** Add internal coordinator/admin routing screen using existing admin card/table/button/badge visual language. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-09:** Coordinator UI should prioritize actionable lists: submitted/triage requests, current assignees, matter type, suggested specialist/reviewer, and assignment/reassignment action with required reason. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-10:** Use Vietnamese labels for UI copy and human-readable reasons; keep enum/storage keys in English. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-11:** Specialist gets an assigned queue showing only requests assigned to them through server-side authorization. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-12:** Specialist request detail should expose intake summary and supporting file metadata needed to start work, but no document drafting features yet. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-13:** Reviewer assignment may be configured during routing for future review phase, but reviewer queue/review UI remains Phase 5. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-14:** Reuse server-side RBAC/workspace checks for all routing reads and writes. Coordinator/admin can manage assignments within workspace; specialist sees only assigned requests; reviewer sees assigned review-related requests when relevant. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-15:** Audit routing actions with metadata summary only: assignment kind, assignee id, request id, matter type, and reason presence/short reason. Do not store sensitive legal answer content in audit metadata. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **D-16:** Preserve append-only assignment history; reassignment creates new history rows rather than overwriting audit trail. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]

### Claude's Discretion
- Exact Prisma model shape for capability records may follow existing schema style, as long as it supports role-specific capabilities per workspace/user/matter type. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- Exact route names and component split may follow existing Next.js App Router/admin patterns. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- Exact suggestion ordering may be simple and deterministic for MVP. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- Exact seed capabilities may be minimal but must demonstrate one specialist and one reviewer eligible for at least one seeded matter type. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)
- Auto-routing without coordinator approval — later automation after enough operational data. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- Workload/SLA scoring and dashboard counts — Phase 7 ops. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- Reviewer queue and QC checklist UI — Phase 5 review. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- Document generation or draft workbench — Phase 4 documents-vault. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- AI matter type detection from uploads/intake — v2 automation. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RTE-01 | Admin can define matter types. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse `MatterType`; admin edits `label`, `description`, `questionSchema`, `schemaVersion`, `isActive`; keep `key` English/stable. [VERIFIED: prisma/schema.prisma] |
| RTE-02 | Admin can define specialist and reviewer capabilities. [VERIFIED: .planning/REQUIREMENTS.md] | Add `UserCapability`-style model linked to `workspaceId`, `userId`, `matterTypeKey`, `kind`; filter by active user and active membership. [VERIFIED: prisma/schema.prisma; .planning/phases/03-routing/03-CONTEXT.md] |
| RTE-03 | System suggests eligible specialists and reviewers from capability matrix. [VERIFIED: .planning/REQUIREMENTS.md] | Query capabilities by request `IntakeSubmission.matterTypeKey`, role/kind, active membership, active user; return separate arrays with reason text. [VERIFIED: prisma/schema.prisma; .planning/phases/03-routing/03-CONTEXT.md] |
| RTE-04 | Coordinator can assign or reassign requests with audit reason. [VERIFIED: .planning/REQUIREMENTS.md] | Transaction: authorize coordinator/admin, validate reason, update assignee fields, append `RequestAssignment`, transition status through workflow when allowed, record audit. [VERIFIED: src/lib/workflow/request-workflow.ts; src/lib/audit/audit.ts] |
| RTE-05 | Specialist can see assigned queue and request details. [VERIFIED: .planning/REQUIREMENTS.md] | Server-side query must constrain `assignedSpecialistId=session.userId`; request detail can reuse `canAccessRequest`. [VERIFIED: src/lib/security/rbac.ts] |
</phase_requirements>

## Summary

Phase 3 should be planned as backend-owned routing with thin admin/specialist UI. Existing schema already has `MatterType`, `LegalRequest.assignedSpecialistId`, `LegalRequest.assignedReviewerId`, `RequestAssignment`, `AssignmentKind`, `WorkspaceMembership`, workflow transitions, and audit events, so plan should add only missing capability persistence plus routing service/UI. [VERIFIED: prisma/schema.prisma]

Core invariant: frontend never changes status directly. Assignment service owns assignment transaction and calls existing workflow rules or equivalent allowed-transition guard before moving to `assigned`. [VERIFIED: src/lib/workflow/request-workflow.ts]

**Primary recommendation:** Build `src/lib/routing/routing-service.ts` as domain boundary, add minimal Prisma capability model, then add coordinator routing page/actions and specialist queue/details on top. [VERIFIED: existing App Router/server service patterns in src/lib and src/app]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Matter type administration | API / Backend | Database / Storage | `MatterType` persistence and validation belong server-side; UI only submits forms. [VERIFIED: prisma/schema.prisma] |
| Capability matrix | API / Backend | Database / Storage | Eligibility depends on workspace, role, active user, active membership, and matter type. [VERIFIED: src/lib/security/rbac.ts; prisma/schema.prisma] |
| Routing suggestions | API / Backend | Browser / Client | Backend owns trusted filtering; UI displays suggested people and reasons. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md] |
| Assignment/reassignment | API / Backend | Database / Storage | Needs transaction, authorization, history append, workflow transition, audit event. [VERIFIED: src/lib/workflow/request-workflow.ts; src/lib/audit/audit.ts] |
| Specialist assigned queue | API / Backend | Browser / Client | Server query must filter by `assignedSpecialistId`; UI cannot be access-control boundary. [VERIFIED: src/lib/security/rbac.ts] |
| Coordinator UI | Browser / Client | API / Backend | UI shows action lists and submits reasons; backend owns mutations and security. [VERIFIED: src/app/admin/requests/page.tsx] |

## Project Constraints (from CLAUDE.md)

- All user-facing communication must be Vietnamese. [VERIFIED: CLAUDE.md]
- Phase/quick slugs must be short English. [VERIFIED: CLAUDE.md]
- State assumptions explicitly; ask when unclear. [VERIFIED: CLAUDE.md]
- Prefer minimum code; no speculative features or abstractions. [VERIFIED: CLAUDE.md]
- Touch only necessary files; match existing style; do not refactor unrelated code. [VERIFIED: CLAUDE.md]
- Define success criteria and verify with tests/checks. [VERIFIED: CLAUDE.md]
- Legal content/documents must pass reviewer before final in broader product, but Phase 3 does not build review UI. [VERIFIED: CLAUDE.md; .planning/phases/03-routing/03-CONTEXT.md]
- Sensitive legal files require private access, tenant/request authorization, short-lived signed URLs, and audit in broader product; Phase 3 must not weaken RBAC/audit. [VERIFIED: CLAUDE.md]
- Status changes must go through backend state machine; frontend must not hard-code workflow logic. [VERIFIED: CLAUDE.md; src/lib/workflow/request-workflow.ts]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.6 published/modified 2026-05-28 | App Router pages and server-side UI/actions | Existing project uses Next app directory and admin pages. [VERIFIED: npm registry; package.json; src/app/admin/requests/page.tsx] |
| React | latest in project package.json | UI rendering | Existing Next app depends on React and React DOM. [VERIFIED: package.json] |
| Prisma Client | 7.8.0 registry current; local/project installed 6.19.3 | Typed database access and transactions | Existing schema and services use Prisma models and transactions. [VERIFIED: npm registry; npx prisma --version; prisma/schema.prisma] |
| PostgreSQL | configured datasource | Persistent routing data | Prisma datasource provider is `postgresql`. [VERIFIED: prisma/schema.prisma] |
| TypeScript | 6.0.3 registry/local | Static typing | Existing codebase uses `.ts/.tsx`; local TypeScript is 6.0.3. [VERIFIED: npm registry; npx prisma --version; package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | latest in project package.json | Icons | Use only if existing admin UI already uses icons on new page. [VERIFIED: package.json] |
| tsx | 4.22.3 in package.json | Run TypeScript test scripts | Existing tests are executable TypeScript files, not Jest/Vitest suites. [VERIFIED: package.json; src/lib/workflow/request-workflow.test.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Rule-based capability matrix | Auto-routing/scoring | Out of scope by locked decision; would add opacity and ops complexity. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md] |
| Prisma relational model | JSON capability blob on user | Relational model supports filtering by workspace, role/kind, matter type, active state, and indexes. [VERIFIED: prisma/schema.prisma] |
| Backend service transaction | UI-only assignment update | UI-only would violate workflow integrity and audit constraints. [VERIFIED: CLAUDE.md; src/lib/workflow/request-workflow.ts] |
| New UI kit | Existing admin `Card/Table/Button/Badge` | Existing visual language is locked for coordinator UI. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md; src/app/admin/components/ui.tsx] |

**Installation:** No new runtime packages required. [VERIFIED: package.json]

```bash
npm install
```

**Version verification:**
- `npm view next version time.modified --json` returned `16.2.6`, modified `2026-05-28T11:55:26.060Z`. [VERIFIED: npm registry]
- `npm view @prisma/client version time.modified --json` returned `7.8.0`, modified `2026-05-19T15:54:52.804Z`. [VERIFIED: npm registry]
- `npm view prisma version time.modified --json` returned `7.8.0`, modified `2026-05-19T15:55:31.856Z`. [VERIFIED: npm registry]
- `npm view typescript version time.modified --json` returned `6.0.3`, modified `2026-04-16T23:38:28.092Z`. [VERIFIED: npm registry]
- Local `npx prisma --version` reports Prisma and `@prisma/client` 6.19.3 because installed lock/dependency differs from registry current. [VERIFIED: local CLI]

## Architecture Patterns

### System Architecture Diagram

```text
Coordinator/Admin opens routing page
  -> Server reads submitted/triage LegalRequest rows + IntakeSubmission matter type
  -> Routing service loads active MatterType catalog and current assignees
  -> Suggestion engine queries UserCapability + active User + active WorkspaceMembership
      -> branch: kind=specialist -> eligible specialist suggestions + reason
      -> branch: kind=reviewer -> eligible reviewer suggestions + reason
  -> UI renders Vietnamese action table with required reason form
  -> Assignment server action submits requestId, kind, assigneeId, reason
  -> Routing service authorizes coordinator/admin in workspace
  -> DB transaction:
      -> update LegalRequest.assignedSpecialistId / assignedReviewerId
      -> append RequestAssignment history row
      -> if current status allows assigned, use backend workflow transition to assigned
      -> write AuditEvent with metadata summary only
  -> Specialist queue server route queries LegalRequest where assignedSpecialistId=session.userId
  -> Specialist detail uses canAccessRequest and shows intake summary + file metadata
```

### Recommended Project Structure

```text
prisma/
├── schema.prisma                 # Add capability model and relations
src/
├── lib/routing/
│   ├── routing-service.ts         # Matter types, capabilities, suggestions, assignment transaction
│   └── routing-service.test.ts    # Domain tests for RTE-01..RTE-05
├── app/admin/routing/
│   ├── page.tsx                   # Coordinator routing queue
│   └── actions.ts                 # Server actions call routing service
├── app/specialist/requests/
│   ├── page.tsx                   # Assigned specialist queue
│   └── [requestId]/page.tsx       # Assigned request detail
└── app/admin/components/          # Reuse existing UI components only
```

### Pattern 1: Capability Model
**What:** Add relational model like `RoutingCapability` or `UserCapability` with `workspaceId`, `userId`, `matterTypeKey`, `kind`, `isActive`, timestamps, relations, and unique tuple. [VERIFIED: prisma/schema.prisma]
**When to use:** Required for RTE-02 and RTE-03. [VERIFIED: .planning/REQUIREMENTS.md]
**Recommended shape:**
```prisma
model RoutingCapability {
  id            String         @id @default(cuid())
  workspaceId   String
  userId        String
  matterTypeKey String
  kind          AssignmentKind
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  workspace      Workspace  @relation(fields: [workspaceId], references: [id])
  user           User       @relation(fields: [userId], references: [id])
  matterType     MatterType @relation(fields: [matterTypeKey], references: [key])

  @@unique([workspaceId, userId, matterTypeKey, kind])
  @@index([workspaceId, matterTypeKey, kind, isActive])
  @@index([userId])
}
```
Source: existing Prisma relational style uses cuid IDs, timestamps, relations, uniques, and indexes. [VERIFIED: prisma/schema.prisma]

### Pattern 2: Suggestion Query
**What:** Load request matter type from `IntakeSubmission.matterTypeKey`, then find active capabilities matching same workspace/matter type/kind with active user and active membership role. [VERIFIED: prisma/schema.prisma; src/lib/security/rbac.ts]
**When to use:** Coordinator routing page and assignment modal. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
**Example:**
```typescript
const capabilities = await prisma.routingCapability.findMany({
  where: {
    workspaceId,
    matterTypeKey,
    kind,
    isActive: true,
    user: { isActive: true },
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          where: { workspaceId, role: kind, isActive: true },
          select: { id: true },
        },
      },
    },
  },
  orderBy: [{ user: { name: 'asc' } }, { userId: 'asc' }],
});
```
Source: relation filters follow existing Prisma relation usage in codebase; role value can align with `AssignmentKind` names `specialist`/`reviewer`. [VERIFIED: prisma/schema.prisma; src/lib/security/rbac.ts]

### Pattern 3: Assignment Transaction
**What:** Assignment/reassignment must be atomic. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
**When to use:** Every coordinator assignment action. [VERIFIED: RTE-04]
**Example:**
```typescript
await prisma.$transaction(async (tx) => {
  await tx.legalRequest.update({
    where: { id: requestId },
    data: kind === 'specialist'
      ? { assignedSpecialistId: assigneeId }
      : { assignedReviewerId: assigneeId },
  });

  const assignment = await tx.requestAssignment.create({
    data: { requestId, userId: assigneeId, kind, reason, createdById: actorId },
  });

  await recordAuditEvent({
    actorId,
    workspaceId,
    action: 'request.assigned',
    targetType: 'ASSIGNMENT',
    targetId: assignment.id,
    requestId,
    correlationId,
    metadataSummary: `${kind} assigned; assignee=${assigneeId}; matter=${matterTypeKey}; reasonProvided=true`,
  }, tx);
});
```
Source: existing code uses `$transaction`, `RequestAssignment`, and `recordAuditEvent`. [VERIFIED: src/lib/workflow/request-workflow.ts; src/lib/audit/audit.ts; prisma/schema.prisma]

### Pattern 4: Backend Workflow Transition Only
**What:** Assignment service must check current status and move to `assigned` only if backend transition allows it. [VERIFIED: src/lib/workflow/request-workflow.ts]
**When to use:** After first valid specialist assignment for `triage`; for `intake_submitted`, current state machine only allows `triage`, not direct `assigned`. [VERIFIED: src/lib/workflow/request-workflow.ts]
**Planning note:** Planner must decide whether assignment from `intake_submitted` first transitions to `triage` then `assigned`, or updates workflow rules to allow direct `intake_submitted -> assigned`; locked D-07 says allowed backend transitions only. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md; src/lib/workflow/request-workflow.ts]

### Anti-Patterns to Avoid
- **Auto-assigning eligible candidate:** Violates D-05; coordinator remains decision maker. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **Filtering specialist queue in browser only:** Violates server-side authorization; backend query must constrain access. [VERIFIED: src/lib/security/rbac.ts]
- **Overwriting assignment history:** Violates append-only assignment history; create new `RequestAssignment` row. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- **Putting intake answers in audit metadata:** Violates audit metadata summary constraint and sensitive legal-data guidance. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md; CLAUDE.md]
- **Adding workload/SLA scoring now:** Deferred to Phase 7. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status flow | Custom status writes in UI/actions | `getAllowedTransitions`, `canTransitionRequestStatus`, `transitionRequestStatus` | Existing backend state machine already protects workflow. [VERIFIED: src/lib/workflow/request-workflow.ts] |
| Authorization | Per-page ad hoc role checks | `canAccessWorkspace`, `canAccessRequest`, active membership checks | Existing RBAC handles workspace, role, and assigned user access. [VERIFIED: src/lib/security/rbac.ts] |
| Audit recording | Direct audit row insert everywhere | `recordAuditEvent` | Existing function validates workspace/action/target/correlation/metadata length. [VERIFIED: src/lib/audit/audit.ts] |
| Matter taxonomy | Separate routing matter table | Existing `MatterType` | Locked decision says shared taxonomy; intake already uses it. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md; prisma/schema.prisma] |
| UI components | New admin table/card/button system | `src/app/admin/components/ui.tsx` | Locked decision says reuse existing admin visual language. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md] |

**Key insight:** Phase 3 is glue around existing foundation/intake primitives, not new routing platform. [VERIFIED: prisma/schema.prisma; .planning/phases/03-routing/03-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: `intake_submitted` cannot transition directly to `assigned`
**What goes wrong:** Assignment service updates assignee and tries direct status transition to `assigned`, but workflow rejects it. [VERIFIED: src/lib/workflow/request-workflow.ts]
**Why it happens:** Current `REQUEST_TRANSITIONS.intake_submitted` is `['triage', 'cancelled']`; `triage` is only state with `assigned` next. [VERIFIED: src/lib/workflow/request-workflow.ts]
**How to avoid:** Plan explicit path: either route queue first moves submitted requests to `triage`, or modify state machine/tests intentionally. [VERIFIED: src/lib/workflow/request-workflow.test.ts]
**Warning signs:** Tests fail with `INVALID_REQUEST_TRANSITION`. [VERIFIED: src/lib/workflow/request-workflow.ts]

### Pitfall 2: Capability says user eligible but membership inactive
**What goes wrong:** Suggestions include inactive users or users no longer active in workspace. [VERIFIED: D-03; src/lib/security/rbac.ts]
**Why it happens:** Query only checks capability row and misses `User.isActive` / `WorkspaceMembership.isActive`. [VERIFIED: prisma/schema.prisma]
**How to avoid:** Query through active user and active membership role in same workspace. [VERIFIED: src/lib/security/rbac.ts]
**Warning signs:** Deactivated user appears in coordinator suggestions. [ASSUMED]

### Pitfall 3: Reviewer routing bleeds into Phase 5 scope
**What goes wrong:** Planner adds reviewer queue/QC checklist while building reviewer assignment. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
**Why it happens:** Reviewer assignee field already exists and can tempt UI expansion. [VERIFIED: prisma/schema.prisma]
**How to avoid:** Allow reviewer assignment and suggestions only; reviewer queue/review UI waits until Phase 5. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
**Warning signs:** New `/reviewer` queue or checklist components in Phase 3 plan. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]

### Pitfall 4: Audit metadata leaks legal intake content
**What goes wrong:** Assignment reason or audit summary includes detailed legal facts from answers. [VERIFIED: D-15; CLAUDE.md]
**Why it happens:** Developers concatenate request context into metadata for convenience. [ASSUMED]
**How to avoid:** Store only kind, IDs, matter type, and short reason/presence; detailed reason can live in assignment row if product accepts it, but audit summary must stay concise. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md; src/lib/audit/audit.ts]
**Warning signs:** `metadataSummary` contains answer text or exceeds 500 chars. [VERIFIED: src/lib/audit/audit.ts]

## Code Examples

### Existing workflow source of truth
```typescript
export const REQUEST_TRANSITIONS = {
  draft_intake: ['intake_submitted', 'cancelled'],
  intake_submitted: ['triage', 'cancelled'],
  triage: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
} as const satisfies Record<RequestStatus, readonly RequestStatus[]>;
```
Source: `src/lib/workflow/request-workflow.ts`. [VERIFIED: codebase]

### Existing RBAC assigned specialist access
```typescript
if (hasRole(typedSession, 'specialist') && request.assignedSpecialistId === typedSession.userId) return true;
if (hasRole(typedSession, 'reviewer') && request.assignedReviewerId === typedSession.userId) return true;
```
Source: `src/lib/security/rbac.ts`. [VERIFIED: codebase]

### Existing audit limit
```typescript
if (input.metadataSummary && input.metadataSummary.length > 500) throw new Error('metadataSummary must be 500 characters or fewer');
```
Source: `src/lib/audit/audit.ts`. [VERIFIED: codebase]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard-coded frontend status dropdown | Backend state machine plus UI rendering allowed transitions | Existing Phase 1/2 foundation | Phase 3 must route through backend workflow, not direct frontend status writes. [VERIFIED: CLAUDE.md; src/lib/workflow/request-workflow.ts] |
| Separate legal service categories per module | Shared `MatterType` taxonomy | Locked Phase 3 decision | Routing should reuse intake matter keys. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md] |
| Black-box matching/scoring | Explainable rule-based capability match | MVP locked decision | Suggestion reason can be deterministic and human-readable. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md] |
| Assignment overwrite | Append-only `RequestAssignment` history | Existing schema plus locked decision | Reassignment adds rows and audit; no history mutation. [VERIFIED: prisma/schema.prisma; .planning/phases/03-routing/03-CONTEXT.md] |

**Deprecated/outdated:**
- Auto-routing: out of scope until later automation. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
- Workload/SLA scoring: out of scope until Phase 7 ops. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Deactivated user appearing in suggestions is likely warning sign. | Common Pitfalls | Low; tests can directly encode expected inactive filtering from D-03. |
| A2 | Developers may accidentally concatenate request context into audit metadata for convenience. | Common Pitfalls | Medium; planner should add audit metadata test to prevent leakage. |

## Open Questions

1. **How should `intake_submitted` assignment reach `assigned`?**
   - What we know: Current transitions allow `intake_submitted -> triage` and `triage -> assigned`, not direct `intake_submitted -> assigned`. [VERIFIED: src/lib/workflow/request-workflow.ts]
   - What's unclear: Whether Phase 3 should add direct transition or require coordinator triage first. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
   - Recommendation: Preserve existing state machine unless planner explicitly updates tests and transition table; safest plan routes submitted items through `triage` before assignment. [VERIFIED: src/lib/workflow/request-workflow.test.ts]

2. **Should capability admin create inactive users/memberships?**
   - What we know: Eligibility requires active user and active membership. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md]
   - What's unclear: Whether admin UI should block creating capability rows for inactive users or allow rows that do not suggest. [ASSUMED]
   - Recommendation: UI should list only active workspace members for MVP. [VERIFIED: D-03]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next/Prisma tooling | ✓ | v22.22.0 | — [VERIFIED: local CLI] |
| npm | package scripts/version checks | ✓ | 11.12.0 | — [VERIFIED: local CLI] |
| Prisma CLI | schema generation/db push | ✓ | 6.19.3 local | Use existing npm scripts. [VERIFIED: local CLI; package.json] |
| PostgreSQL | Runtime DB | Unknown | configured only | Planner should verify `DATABASE_URL`/DB before executing migrations. [VERIFIED: prisma/schema.prisma] |

**Missing dependencies with no fallback:**
- PostgreSQL availability not probed; `DATABASE_URL` runtime state not inspected to avoid secret exposure. [VERIFIED: prisma/schema.prisma]

**Missing dependencies with fallback:**
- None identified. [VERIFIED: package.json]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing env-backed session layer; do not change globally in Phase 3. [VERIFIED: .planning/phases/03-routing/03-CONTEXT.md] |
| V3 Session Management | yes | Existing `AppSession` active workspace/roles; server actions must read session server-side. [VERIFIED: src/lib/security/session.ts referenced in code; src/lib/security/rbac.ts] |
| V4 Access Control | yes | `canAccessWorkspace`, `canAccessRequest`, active membership/role checks. [VERIFIED: src/lib/security/rbac.ts] |
| V5 Input Validation | yes | Validate request ID, assignee ID, kind, matter type key, and non-empty reason server-side. [VERIFIED: RTE-04; src/lib/audit/audit.ts] |
| V6 Cryptography | no new crypto | Phase 3 should not create crypto/signing code. [VERIFIED: phase boundary] |
| V7 Error Handling/Logging | yes | Use controlled errors like existing workflow service; audit critical routing actions. [VERIFIED: src/lib/workflow/request-workflow.ts; src/lib/audit/audit.ts] |
| V8 Data Protection | yes | Audit metadata summary must avoid sensitive legal answer content. [VERIFIED: D-15; CLAUDE.md] |
| V10 Malicious Code | no new dynamic execution | No plugin/rule DSL; rule-based DB filters only. [VERIFIED: D-02] |

### Known Threat Patterns for Next.js + Prisma routing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Horizontal tenant access to other workspace requests | Information Disclosure / Elevation | Always scope routing reads/writes by `workspaceId` and active membership; use `canAccessRequest`. [VERIFIED: src/lib/security/rbac.ts] |
| Specialist sees unassigned request by guessed ID | Information Disclosure | Detail page must call `canAccessRequest`; queue query must filter `assignedSpecialistId=session.userId`. [VERIFIED: src/lib/security/rbac.ts] |
| Coordinator assigns inactive or wrong-role user | Tampering | Assignment service validates active user, active membership, role matching assignment kind, and capability. [VERIFIED: D-02; D-03] |
| Audit trail tampering by overwrite | Repudiation | Append `RequestAssignment`; never update old history rows for reassignment. [VERIFIED: D-16; prisma/schema.prisma] |
| Sensitive legal content in audit summary | Information Disclosure | Metadata summary only with IDs/kind/matter/reason presence or short reason. [VERIFIED: D-15; src/lib/audit/audit.ts] |
| Race condition on status update | Tampering | Use transaction and existing status conflict pattern (`updateMany` with current status) when changing status. [VERIFIED: src/lib/workflow/request-workflow.ts] |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/03-routing/03-CONTEXT.md` — locked decisions, phase boundary, reusable assets, deferred items. [VERIFIED: codebase]
- `.planning/REQUIREMENTS.md` — RTE-01 through RTE-05. [VERIFIED: codebase]
- `.planning/STATE.md` — project state/history. [VERIFIED: codebase]
- `CLAUDE.md` — project constraints and security/workflow directives. [VERIFIED: codebase]
- `prisma/schema.prisma` — existing models/enums/relations/indexes. [VERIFIED: codebase]
- `src/lib/workflow/request-workflow.ts` — workflow transitions and status mutation pattern. [VERIFIED: codebase]
- `src/lib/security/rbac.ts` — workspace/request/document/review/vault authorization. [VERIFIED: codebase]
- `src/lib/audit/audit.ts` — audit event API and metadata limit. [VERIFIED: codebase]
- `src/lib/intake/catalog.ts` — seeded matter types. [VERIFIED: codebase]
- `package.json` and local CLI outputs — package scripts/dependencies/tool versions. [VERIFIED: codebase/local CLI]
- npm registry — Next/Prisma/TypeScript current versions and modified dates. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- None. WebFetch to official Next/Prisma docs was blocked by domain verification; Context7 CLI fallback was affected by Git Bash path rewriting for leading slash library IDs. [VERIFIED: tool output]

### Tertiary (LOW confidence)
- Assumptions A1-A2 only. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — derived from package.json, npm registry, and local CLI. [VERIFIED]
- Architecture: HIGH — phase is constrained by existing schema/services and locked decisions. [VERIFIED]
- Pitfalls: HIGH for workflow/RBAC/audit scope; MEDIUM for human-error pitfalls marked assumed. [VERIFIED/ASSUMED]

**Research date:** 2026-05-28
**Valid until:** 2026-06-27 for project-specific architecture; 2026-06-04 for npm latest versions. [ASSUMED]
