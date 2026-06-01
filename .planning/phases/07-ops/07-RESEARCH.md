# Phase 07: ops - Research

**Researched:** 2026-06-01
**Domain:** Next.js App Router admin operations dashboard, Prisma aggregation/filtering, RBAC-safe audit timeline
**Confidence:** HIGH

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Dashboard metrics
- **D-01:** Build MVP operational counts by request status, assigned specialist, assigned reviewer, and aging. This directly covers OPS-01 and roadmap success criteria.
- **D-02:** Prefer plain admin cards/tables over analytics-heavy charts. Charts may be added only if already cheap from existing data, not as separate scope.
- **D-03:** Counts must be derived from backend data (`LegalRequest`, assignments, workflow timestamps), not hard-coded fixtures or frontend-only state.

#### Request filtering
- **D-04:** Implement admin-facing server-side filters for customer/workspace, matter type, status, assignee, reviewer, and date range.
- **D-05:** Filters should compose together with AND semantics. No saved views, faceted search, or fuzzy search in MVP.
- **D-06:** Filtering must respect server-side RBAC. Admin visibility comes from `coordinator_admin` / `super_admin`; frontend navigation hiding is UX only.

#### Workload view
- **D-07:** Show simple workload counts per specialist and reviewer, split by active request statuses where useful.
- **D-08:** Do not build capacity scoring, availability scheduling, or auto-balancing in Phase 7. Phase 3 already deferred workload/SLA scoring to ops; ops MVP should keep it readable and evidence-based.
- **D-09:** Workload source of truth is `LegalRequest.assignedSpecialistId`, `LegalRequest.assignedReviewerId`, and `RequestAssignment` history where needed.

#### SLA timestamps and aging
- **D-10:** Track basic SLA timestamps by deriving milestone times from request lifecycle fields and `WorkflowTransition.createdAt`.
- **D-11:** Display aging in human-operational terms: created age, time in current status, pending review age, delivered/closed timing when available.
- **D-12:** No SLA policy engine, breach escalation automation, business-hours calendar, or configurable SLA thresholds in MVP unless already trivial.

#### Audit timeline
- **D-13:** Admin can view chronological timeline for a single request using safe audit events and workflow transitions.
- **D-14:** Timeline should show time, actor, action/status change, target, correlation id, reason, and `metadataSummary` where present.
- **D-15:** Do not expose raw legal content, full document text, internal reviewer-only comments, or sensitive file contents in timeline. Use identifiers and safe summaries only.

### Claude's Discretion
- Exact card layout, table grouping, badge colors, and empty/loading states may follow existing admin UI patterns.
- Exact query decomposition may be chosen by planner/researcher, as long as server-side filtering/RBAC and simple MVP scope remain intact.

### Deferred Ideas (OUT OF SCOPE)
- Advanced SLA breach policy/escalation — future phase after basic timestamps prove useful.
- Productivity/performance analytics — future phase; avoid turning MVP ops into employee scoring.
- Customer download analytics — explicitly deferred from Phase 6 and not required for OPS-01..OPS-05.
- Saved filter views, fuzzy search, CSV/PDF export — useful later, not Phase 7 MVP.

## Project Constraints (from CLAUDE.md)

- All communication must be Vietnamese. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- Phase/quick slugs must be short English slugs. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- State assumptions explicitly, surface tradeoffs, and ask when unclear. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- Prefer minimum code; do not add speculative features, single-use abstractions, or unrequested configurability. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- Make surgical changes only, match existing style, and do not refactor adjacent code. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- Legal accuracy requires reviewer before final output; ops views must not weaken review workflow. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- Security requires private legal files, tenant/request authorization, short-lived signed URLs, and audit. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- MVP scope prioritizes end-to-end workflow over advanced automation. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- Workflow status changes must go through backend state machine, not frontend hard-coded logic. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]
- Traceability requires review/document-version linkage; ops timeline should preserve this model. [VERIFIED: /mnt/d/PhapChe/CLAUDE.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPS-01 | Admin can view dashboard counts by status, specialist, reviewer, and aging. | Use Prisma `groupBy()`/`count()` on `LegalRequest` and derived `WorkflowTransition` ages. [VERIFIED: prisma/schema.prisma] [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing] |
| OPS-02 | Admin can filter requests by customer, matter type, status, assignee, reviewer, and date. | Use server-rendered `searchParams` and Prisma `where` with AND-composed filters and relation filters. [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting] |
| OPS-03 | Admin can view workload per specialist and reviewer. | Source counts from `LegalRequest.assignedSpecialistId`, `assignedReviewerId`, optionally `RequestAssignment` history. [VERIFIED: prisma/schema.prisma] |
| OPS-04 | System tracks basic SLA timestamps. | Derive lifecycle milestones from `LegalRequest.createdAt/updatedAt` and `WorkflowTransition.createdAt`; no policy engine. [VERIFIED: prisma/schema.prisma] [VERIFIED: src/lib/workflow/request-workflow.ts] |
| OPS-05 | Admin can view audit timeline for a request. | Merge safe `AuditEvent` and `WorkflowTransition` rows for request-scoped chronology. [VERIFIED: prisma/schema.prisma] [VERIFIED: src/lib/audit/audit.ts] |
</phase_requirements>

## Summary

Phase 7 should be implemented as a simple server-rendered admin operations cockpit under the existing admin namespace, reusing `AdminShell`, `Card`, `Table`, `Badge`, `Button`, and `PageHeader`. [VERIFIED: src/app/admin/components/admin-shell.tsx] [VERIFIED: src/app/admin/components/ui.tsx] The core work is backend query composition over existing models, not new analytics infrastructure. [VERIFIED: prisma/schema.prisma]

Use Prisma `count()` and `groupBy()` for dashboard/workload counts, and use explicit Prisma `where` filters for the request list. [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing] [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting] SLA should remain derived/basic: created age, current-status age from latest workflow transition, pending-review age from transition into `pending_review`, and delivered/closed timing where transitions exist. [VERIFIED: prisma/schema.prisma]

**Primary recommendation:** Create a small `src/lib/ops/ops-service.ts` that centralizes RBAC-safe Prisma queries, then render `/admin/ops` with server `searchParams` and existing admin UI primitives. [VERIFIED: existing Next.js admin page patterns]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dashboard counts | API / Backend | Frontend Server (SSR) | Counts must come from Prisma/backend data and not frontend fixtures. [VERIFIED: 07-CONTEXT.md] |
| Request filters | API / Backend | Frontend Server (SSR) | RBAC and AND-composed filters must be enforced server-side; SSR reads query string for UX. [VERIFIED: 07-CONTEXT.md] [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] |
| Workload view | API / Backend | Frontend Server (SSR) | Workload derives from assignment fields/history, not UI state. [VERIFIED: prisma/schema.prisma] |
| SLA timestamps/aging | API / Backend | Database / Storage | Timestamps are stored in `LegalRequest` and `WorkflowTransition`; backend computes human-readable ages. [VERIFIED: prisma/schema.prisma] |
| Audit timeline | API / Backend | Database / Storage | Timeline must enforce safe fields and RBAC before UI display. [VERIFIED: src/lib/security/rbac.ts] [VERIFIED: src/lib/audit/audit.ts] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.6 current npm; project uses `latest` | App Router server-rendered admin pages | Existing admin pages live under `src/app/admin/*/page.tsx`; `page.tsx` Server Components can read `searchParams` as promises. [VERIFIED: npm registry] [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] |
| React | 19.2.6 current npm; project uses `latest` | Render admin UI components | Required by Next.js project dependency. [VERIFIED: npm registry] [VERIFIED: package.json] |
| Prisma Client | 7.8.0 current npm; project pinned `^6.19.0`, installed 6.19.3 | Database querying, filtering, grouping | Existing schema/client uses Prisma; `groupBy`, `count`, `where`, relation filters are standard for metrics and filters. [VERIFIED: npm registry] [VERIFIED: local `npx prisma --version`] [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing] |
| TypeScript | 6.0.3 current npm/local | Type-safe services and pages | Project scripts use `tsc --noEmit`; local TypeScript is 6.0.3. [VERIFIED: npm registry] [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node built-in test runner | Node 22.22.2 local | Service unit tests with `node:test` and `assert` | Existing tests use `node:test`; no Jest/Vitest config detected. [VERIFIED: src/lib/audit/audit.test.ts] [VERIFIED: local `node --version`] |
| lucide-react | `latest` in project | Optional icons | Use only if already consistent/cheap; do not introduce charting. [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain cards/tables | Chart library | Out of scope for MVP and contradicts D-02 unless already trivial. [VERIFIED: 07-CONTEXT.md] |
| Prisma `groupBy()` | Raw SQL | Raw SQL is unnecessary for current indexed count/filter needs and increases safety/maintenance burden. [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing] |
| URL `searchParams` | Client-only filter state | Client-only state would not satisfy server-side filtering/RBAC and loses shareable filter URLs. [VERIFIED: 07-CONTEXT.md] |

**Installation:**
```bash
# No new runtime dependencies required for Phase 7 MVP.
# If package drift must be locked later, do it explicitly outside this phase.
```

**Version verification:** `npm view next version` returned 16.2.6; `npm view @prisma/client version` returned 7.8.0; `npm view react version` returned 19.2.6; `npm view typescript version` returned 6.0.3. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Admin visits /admin/ops with query string filters
        |
        v
Next.js App Router page (Server Component)
        |
        |-- await searchParams -> normalize filters (workspace, matterType, status, assignee, reviewer, date)
        |
        v
ops-service.ts
        |
        |-- authorize admin role: coordinator_admin or super_admin
        |       |-- denied -> no sensitive data returned
        |
        |-- build Prisma WHERE with AND semantics
        |-- query dashboard counts: count/groupBy LegalRequest
        |-- query workload: groupBy assignedSpecialistId / assignedReviewerId
        |-- query SLA aging: LegalRequest + WorkflowTransition milestones
        |-- query audit timeline: AuditEvent + WorkflowTransition by requestId
        |
        v
Prisma/PostgreSQL models
        |
        v
Safe DTOs only: counts, IDs, labels, timestamps, metadataSummary
        |
        v
Admin UI cards/tables/timeline with existing components
```

### Recommended Project Structure

```text
src/
├── app/admin/ops/page.tsx              # Server-rendered ops dashboard and filter UI
├── app/admin/ops/[requestId]/page.tsx  # Optional request-specific audit/SLA timeline drill-in
├── lib/ops/ops-service.ts              # RBAC-safe Prisma queries and SLA derivation
└── lib/ops/ops-service.test.ts         # node:test coverage for filters, counts, timeline safety
```

### Pattern 1: Server-rendered filter page
**What:** Use App Router `searchParams` as the source of filter input, normalize to a typed filter object, then call backend service functions. [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page]
**When to use:** OPS-02 request filtering and ops dashboard query URLs.
**Example:**
```typescript
// Source: Next.js page docs; adapted to project pattern.
export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  // normalize query, then call ops service
}
```

### Pattern 2: Prisma grouped counts for dashboards
**What:** Use `count()` for totals and `groupBy()` for per-status/per-assignee counts. [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing]
**When to use:** OPS-01 and OPS-03.
**Example:**
```typescript
// Source: Prisma aggregation/groupBy docs; fields verified in schema.prisma.
await prisma.legalRequest.groupBy({
  by: ['status'],
  _count: { _all: true },
  where: buildAdminRequestWhere(filters),
});
```

### Pattern 3: Safe request timeline DTO
**What:** Return only timestamp, actor identity, action/status change, target identifiers, reason, correlation ID, and `metadataSummary`; never return raw document text/comments/file content. [VERIFIED: src/lib/audit/audit.ts] [VERIFIED: 07-CONTEXT.md]
**When to use:** OPS-05 request timeline.
**Example:**
```typescript
// Source: AuditEvent and WorkflowTransition models verified in schema.prisma.
type OpsTimelineItem = {
  at: Date;
  actorLabel: string;
  kind: 'audit' | 'workflow';
  action: string;
  target: string;
  correlationId?: string | null;
  reason?: string | null;
  metadataSummary?: string | null;
};
```

### Anti-Patterns to Avoid
- **Frontend-only filtering:** Violates server-side RBAC and D-06; always filter in Prisma/backend. [VERIFIED: 07-CONTEXT.md]
- **Hard-coded metric fixtures:** Violates D-03; all counts must derive from persisted models. [VERIFIED: 07-CONTEXT.md]
- **New SLA policy engine:** Explicitly deferred by D-12; compute timestamps/ages only. [VERIFIED: 07-CONTEXT.md]
- **Raw audit metadata exposure:** `metadataSummary` is capped and string-only; do not expose full metadata/content. [VERIFIED: src/lib/audit/audit.ts]
- **Employee scoring/capacity balancing:** Explicitly deferred by D-08 and deferred ideas. [VERIFIED: 07-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Aggregated counts | Custom in-memory scans over all requests | Prisma `count()` / `groupBy()` | Database aggregation is simpler and avoids loading sensitive rows into UI code. [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing] |
| Server filters | Manual string-concatenated SQL | Prisma `where` with typed fields and relation filters | Reduces injection risk and matches existing Prisma stack. [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting] |
| Timeline audit model | New timeline storage table | Existing `AuditEvent` + `WorkflowTransition` | Existing append-only audit and workflow transition tables already hold the required data. [VERIFIED: prisma/schema.prisma] |
| SLA engine | Configurable thresholds, business-hours calendars, escalation jobs | Derived timestamp/age functions | MVP requires basic timestamps only; advanced SLA automation is deferred. [VERIFIED: 07-CONTEXT.md] |
| UI component library | New dashboard/chart kit | Existing admin components | Existing `Card`, `Table`, `Badge`, `Button`, `PageHeader` are sufficient. [VERIFIED: src/app/admin/components/ui.tsx] |

**Key insight:** Phase 7 is operational visibility over existing workflow state, not a new analytics product. [VERIFIED: 07-CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Treating navigation hiding as authorization
**What goes wrong:** Non-admins can reach routes directly if service/page does not enforce role checks.
**Why it happens:** AdminShell note says UI hiding is only UX, not security. [VERIFIED: src/app/admin/components/admin-shell.tsx]
**How to avoid:** Centralize admin authorization in ops service/page and require `coordinator_admin` or `super_admin` before returning data. [VERIFIED: src/lib/security/rbac.ts]
**Warning signs:** Tests only assert nav visibility and do not call service with non-admin session.

### Pitfall 2: Incorrect filter semantics
**What goes wrong:** Filters become OR-based or client-only, producing misleading ops counts.
**Why it happens:** Query params are optional and easy to compose incorrectly.
**How to avoid:** Build one typed Prisma `where` object with AND semantics for all supplied fields. [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting]
**Warning signs:** Dashboard counts and request list use different filter builders.

### Pitfall 3: Current-status age computed from `updatedAt`
**What goes wrong:** `updatedAt` can change for non-status edits, making status age inaccurate.
**Why it happens:** `LegalRequest.updatedAt` changes on any request update. [VERIFIED: prisma/schema.prisma]
**How to avoid:** Use the latest `WorkflowTransition` to the current status; fall back to `createdAt` only when no transitions exist. [VERIFIED: prisma/schema.prisma]
**Warning signs:** SLA code never queries `WorkflowTransition`.

### Pitfall 4: Timeline leaks sensitive review/document content
**What goes wrong:** Ops timeline exposes internal reviewer comments, legal text, or file content.
**Why it happens:** Audit/timeline feels internal, but legal files are sensitive.
**How to avoid:** Return only safe identifiers and `metadataSummary`; do not include `Review.generalComment`, `DocumentVersion.generatedContent`, `VaultFile.storageKey`, or intake answer raw content. [VERIFIED: prisma/schema.prisma] [VERIFIED: src/lib/audit/audit.ts]
**Warning signs:** Timeline query includes document versions, checklist comments, or vault storage keys.

### Pitfall 5: Adding charting/export/saved views
**What goes wrong:** Phase expands beyond MVP and delays end-to-end ops visibility.
**Why it happens:** Ops dashboards invite analytics scope creep.
**How to avoid:** Use plain cards/tables and defer saved views, fuzzy search, export, and advanced analytics. [VERIFIED: 07-CONTEXT.md]
**Warning signs:** New dependencies appear in package.json for charts or CSV/PDF export.

## Code Examples

### Build AND-composed Prisma request filters
```typescript
// Source: Prisma filtering docs + project schema fields.
const where = {
  ...(workspaceId ? { workspaceId } : {}),
  ...(status ? { status } : {}),
  ...(assignedSpecialistId ? { assignedSpecialistId } : {}),
  ...(assignedReviewerId ? { assignedReviewerId } : {}),
  ...(matterTypeKey ? { intakeSubmission: { matterTypeKey } } : {}),
  ...(dateFrom || dateTo
    ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
    : {}),
};
```

### Dashboard counts by status
```typescript
// Source: Prisma groupBy docs; LegalRequest.status is indexed in schema.prisma.
const byStatus = await prisma.legalRequest.groupBy({
  by: ['status'],
  _count: { _all: true },
  where,
});
```

### Safe timeline merge
```typescript
// Source: AuditEvent and WorkflowTransition models in schema.prisma.
const timeline = [...auditItems, ...workflowItems].sort(
  (a, b) => b.at.getTime() - a.at.getTime(),
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous `searchParams` in pages | Promise-based `searchParams` with `await` in Server Components | Next.js v15.0.0-RC | Phase 7 page should type `searchParams` as a promise to avoid deprecated assumptions. [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] |
| Hand-built SQL dashboards | Prisma `count()`/`groupBy()` with `where` pre-filtering | Current Prisma docs | Simpler MVP metrics with fewer injection/maintenance risks. [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing] |

**Deprecated/outdated:**
- Treating `searchParams` as a synchronous prop is backward-compatible in Next.js 15 but documented as future-deprecated behavior. [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Ops service can obtain an `AppSession` using existing auth/session patterns not inspected in this research. [ASSUMED] | Architecture Patterns | Planner may need to locate existing session helper before implementing admin authorization. |
| A2 | `coordinator_admin` and `super_admin` are sufficient admin roles for ops visibility. [ASSUMED] | Common Pitfalls/Security | If policy differs, RBAC tests and route guards must change. |

## Open Questions

1. **Where exactly is the current session retrieval helper used by server pages?**
   - What we know: RBAC functions consume `AppSession`. [VERIFIED: src/lib/security/rbac.ts]
   - What's unclear: The canonical session helper/import path was not part of Phase 7 context.
   - Recommendation: Planner should add Wave 0 discovery for existing server-page auth/session usage before coding ops route.

2. **Should audit timeline be on `/admin/ops/[requestId]` or embedded in `/admin/ops?requestId=...`?**
   - What we know: D-13 requires admin can view chronological timeline for a single request. [VERIFIED: 07-CONTEXT.md]
   - What's unclear: Exact route is discretionary.
   - Recommendation: Prefer `/admin/ops/[requestId]` only if existing dynamic admin route patterns are present; otherwise keep a query-based drill-in for smaller MVP.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next.js build/tests | ✓ | 22.22.2 | — |
| npm | Package scripts/version checks | ✓ | 10.9.7 | — |
| Prisma CLI | Generate/query schema tooling | ✓ | 6.19.3 local via npx | Use project `prisma` devDependency |
| TypeScript | Typecheck | ✓ | 6.0.3 | — |
| PostgreSQL | Runtime datasource | Not probed | — | Existing `DATABASE_URL`; planner should avoid requiring live DB for unit tests unless integration test explicitly needs it |

**Missing dependencies with no fallback:** None confirmed.

**Missing dependencies with fallback:** PostgreSQL service availability was not probed; use mocked Prisma/service unit tests where possible and reserve real DB checks for existing e2e style. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing session/AppSession gate before admin ops data. [VERIFIED: src/lib/security/rbac.ts] |
| V3 Session Management | yes | Reuse existing server-side session retrieval; do not add client-only auth checks. [ASSUMED] |
| V4 Access Control | yes | Require `coordinator_admin` / `super_admin`; use server-side RBAC. [VERIFIED: 07-CONTEXT.md] |
| V5 Input Validation | yes | Normalize query params to known enum/status/date/user IDs before Prisma filters; Prisma typed filters for DB access. [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting] |
| V6 Cryptography | no direct new crypto | Do not touch signed URL/file crypto in ops phase. [VERIFIED: 07-CONTEXT.md] |

### Known Threat Patterns for Next.js/Prisma admin ops

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized ops data disclosure | Information Disclosure | Server-side role checks before any Prisma query returns data. [VERIFIED: src/lib/security/rbac.ts] |
| Sensitive legal content leakage in timeline | Information Disclosure | Safe DTOs: IDs, action, reason, correlation ID, metadataSummary only. [VERIFIED: src/lib/audit/audit.ts] |
| Query parameter tampering | Tampering | Parse/allowlist enum/date/user filters; ignore or reject unknown values. [CITED: https://nextjs.org/docs/app/api-reference/file-conventions/page] |
| Metrics inconsistency | Repudiation/Integrity | Derive metrics from persisted `LegalRequest`, `RequestAssignment`, `WorkflowTransition`, `AuditEvent`. [VERIFIED: prisma/schema.prisma] |

## Sources

### Primary (HIGH confidence)
- `/mnt/d/PhapChe/CLAUDE.md` - Project constraints and workflow/security rules.
- `/mnt/d/PhapChe/.claude/worktrees/agent-a4ef76cde1f46047d/.planning/phases/07-ops/07-CONTEXT.md` - Locked Phase 7 decisions.
- `/mnt/d/PhapChe/.claude/worktrees/agent-a4ef76cde1f46047d/.planning/REQUIREMENTS.md` - OPS-01..OPS-05.
- `/mnt/d/PhapChe/.claude/worktrees/agent-a4ef76cde1f46047d/prisma/schema.prisma` - Models, fields, indexes.
- `/mnt/d/PhapChe/.claude/worktrees/agent-a4ef76cde1f46047d/src/lib/security/rbac.ts` - Existing RBAC patterns.
- `/mnt/d/PhapChe/.claude/worktrees/agent-a4ef76cde1f46047d/src/lib/audit/audit.ts` - Safe audit metadata constraints.
- `/mnt/d/PhapChe/.claude/worktrees/agent-a4ef76cde1f46047d/src/lib/workflow/request-workflow.ts` - Workflow transitions and status audit.
- `/mnt/d/PhapChe/.claude/worktrees/agent-a4ef76cde1f46047d/src/app/admin/components/*` - Existing admin UI patterns.
- npm registry via `npm view` - Current package versions.

### Secondary (MEDIUM confidence)
- https://nextjs.org/docs/app/api-reference/file-conventions/page - App Router page/searchParams behavior, version 16.2.6, last updated 2026-05-31.
- https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing - Prisma groupBy/count aggregation guidance.
- https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting - Prisma filtering/sorting guidance.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package.json, npm registry, and local tool versions.
- Architecture: HIGH - Phase 7 maps directly onto existing Next.js admin pages, Prisma schema, RBAC, audit, and workflow modules.
- Pitfalls: HIGH - most pitfalls are direct consequences of locked decisions and verified code constraints.

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 for project architecture; 2026-06-08 for npm/latest-version assumptions.
