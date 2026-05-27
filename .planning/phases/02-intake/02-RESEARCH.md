# Phase 2: intake - Research

**Researched:** 2026-05-27
**Domain:** Next.js App Router customer intake, Prisma structured data, RBAC workflow, private uploads
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use chat/form hybrid flow: customer experience should feel like guided chat, but implementation output must be structured fields, not raw conversation only. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-02:** Customer starts by selecting a service/matter type from a small seeded MVP catalog; unsupported/unknown service types route to human triage. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-03:** Keep Phase 2 intake focused on submission flow and status visibility. No AI legal reasoning or automatic legal conclusion. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-04:** Store intake answers as structured data tied to request plus schemaVersion so later template/document phases can snapshot exact inputs. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-05:** Each matter type has its own question schema. MVP may seed representative legal services from source docs: agency contract, labor contract, trademark registration. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-06:** Required question validation happens before intake_submitted; incomplete answers stay in draft_intake. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-07:** Preserve enough labels/metadata with answers for specialist readability, not only machine keys. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-08:** Use existing backend workflow states from Phase 1: create request in draft_intake, submit to intake_submitted, coordinator/system may move unsupported requests to triage. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-09:** Unsupported requests are not rejected automatically; mark clearly as requiring human triage. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-10:** Customer sees plain Vietnamese status labels and next-step guidance, not raw enum names. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-11:** Customer can upload supporting files during intake and attach them to the request. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-12:** Store upload records through existing request/workspace-linked VaultFile foundation model for now, with private storage semantics planned; do not expose public file URLs. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-13:** File upload actions must enforce workspace/request authorization server-side and create audit events with metadata summary only, not sensitive document contents. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-14:** OCR or automatic field extraction from uploaded files is out of scope for Phase 2. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-15:** Add customer-facing route separate from admin foundation, using existing card/table/button visual language but optimized for simple guided request submission. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-16:** Intake screens should show progress through questions, upload area, review/submit step, and submitted status view. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-17:** Customer status view must be read-only; all status changes remain backend workflow transitions. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-18:** Reuse Phase 1 server-side RBAC/workspace checks for every intake, upload, and status-read operation. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-19:** Audit important intake events: request created, intake answer saved/submitted, file uploaded, unsupported request marked for triage. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **D-20:** Avoid storing legal content in audit metadata; use identifiers, matter type, counts, filenames, hashes/summaries where needed. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]

### Claude's Discretion
- Exact UI component decomposition, form library choice, and API/server action shape may follow existing Next.js patterns. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- Exact seeded service labels/questions may be minimal but must demonstrate at least one supported service and one unsupported/triage path. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- Exact storage backend can remain local/mock-compatible if production S3/R2 integration belongs to later Vault hardening, but access semantics must stay private. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)
- Capability Matrix and specialist/reviewer assignment suggestions — Phase 3 routing. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- Template-driven document generation from intake answers — Phase 4 documents-vault. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- OCR/file content extraction from supporting documents — v2 automation. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- AI intake summarization or draft generation — v2 automation with guardrails. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- E-sign handoff after approval — v2 signature. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INT-01 | Customer can start a legal request from chat/form by selecting service type. [VERIFIED: .planning/REQUIREMENTS.md] | Service catalog model/seed plus `/intake` entry route. |
| INT-02 | System asks structured intake questions based on selected service type. [VERIFIED: .planning/REQUIREMENTS.md] | Matter-type question schema with schemaVersion and required flags. |
| INT-03 | System saves answers as structured intake data with schema version. [VERIFIED: .planning/REQUIREMENTS.md] | Prisma Json answer snapshot or related `IntakeAnswer` model tied to `LegalRequest`. |
| INT-04 | Customer can upload supporting files to a request. [VERIFIED: .planning/REQUIREMENTS.md] | Use `VaultFile` rows tied to request/workspace; no public URL. |
| INT-05 | Customer can see request status after submission. [VERIFIED: .planning/REQUIREMENTS.md] | Read-only status route guarded by `canAccessRequest`; Vietnamese status map. |
| INT-06 | System marks unsupported requests as requiring human triage. [VERIFIED: .planning/REQUIREMENTS.md] | Create draft request then transition through backend workflow to `intake_submitted` and `triage`, or create direct triage only if workflow service extended. |
</phase_requirements>

## Summary

Phase 2 should extend Phase 1 foundation, not bypass it. Existing code already provides `LegalRequest`, `RequestStatus`, `VaultFile`, `AuditEvent`, `canAccessRequest`, `canAccessVaultFile`, `recordAuditEvent`, and `transitionRequestStatus`; intake should add structured intake data around `LegalRequest` and reuse these boundaries. [VERIFIED: prisma/schema.prisma, src/lib/security/rbac.ts, src/lib/audit/audit.ts, src/lib/workflow/request-workflow.ts]

Recommended implementation: create small seeded matter/service catalog, schema-versioned question definitions, structured answer persistence, customer `/intake` and `/requests/[id]` status routes, and server-only actions/services for create draft, save answers, submit, mark unsupported, upload metadata. Keep file storage local/mock-compatible but private by design; store only `VaultFile.storageKey` and never expose direct public URL. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]

**Primary recommendation:** Use existing Next.js App Router + Prisma service modules + Phase 1 RBAC/workflow/audit; add minimal intake models and server actions, no form library unless complexity forces it. [VERIFIED: package.json, Context7 /vercel/next.js forms docs]

## Project Constraints (from CLAUDE.md)

- User-facing communication and UI copy must be Vietnamese. [VERIFIED: CLAUDE.md]
- Phase/quick slugs must be short English. [VERIFIED: CLAUDE.md]
- State assumptions and tradeoffs before implementation; ask if unclear. [VERIFIED: CLAUDE.md]
- Keep code minimal; no speculative features, abstractions, or configurability. [VERIFIED: CLAUDE.md]
- Make surgical changes only; match existing style and avoid unrelated cleanup. [VERIFIED: CLAUDE.md]
- Define success criteria and verification steps. [VERIFIED: CLAUDE.md]
- Legal content/final advice must pass reviewer before final; Phase 2 must not act as AI lawyer. [VERIFIED: CLAUDE.md]
- Files must be private, tenant/request-scoped, short-lived signed URL later, audited. [VERIFIED: CLAUDE.md]
- MVP prioritizes end-to-end workflow over OCR/e-sign/advanced AI. [VERIFIED: CLAUDE.md]
- Status changes must go through backend state machine, not frontend logic. [VERIFIED: CLAUDE.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Service/matter type catalog | API / Backend | Database / Storage | Backend owns supported/unsupported decisions; database stores seeded catalog. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md] |
| Guided chat/form intake UI | Browser / Client | Frontend Server (SSR) | Client renders progress and form state; server handles mutation and validation. [CITED: Context7 /vercel/next.js forms docs] |
| Required question validation | API / Backend | Browser / Client | Browser can guide UX, but backend must block `intake_submitted` when required answers missing. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md] |
| Structured answer storage | Database / Storage | API / Backend | Prisma data model stores answer snapshot with schemaVersion tied to request. [CITED: Context7 /prisma/web Json field docs] |
| File upload metadata | API / Backend | Database / Storage | Server authorizes request, writes private storage key and `VaultFile` row, audits metadata only. [VERIFIED: prisma/schema.prisma, src/lib/security/rbac.ts] |
| Customer status view | Frontend Server (SSR) | API / Backend | Server loads authorized request; UI maps enum to Vietnamese labels. [VERIFIED: src/lib/security/rbac.ts] |
| Unsupported triage marking | API / Backend | Database / Storage | Workflow transition service is source of truth for status. [VERIFIED: src/lib/workflow/request-workflow.ts] |
| Audit events | API / Backend | Database / Storage | Existing audit writer enforces summary shape and persists append-only rows. [VERIFIED: src/lib/audit/audit.ts] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | installed `latest`, registry current 16.2.6, published 2026-05-27 | App Router pages, server components, server actions/forms | Existing project uses Next; Context7 docs show App Router forms pass `FormData` to server functions. [VERIFIED: package.json; VERIFIED: npm registry; CITED: Context7 /vercel/next.js] |
| React | installed `latest` | Customer UI components | Required by Next project. [VERIFIED: package.json] |
| Prisma Client | installed `^6.19.0`, local 6.19.3, registry current 7.8.0, published 2026-05-19 | PostgreSQL data access and schema | Existing schema and tests use Prisma; upgrade to 7.x not required for Phase 2 unless separate dependency task. [VERIFIED: package.json; VERIFIED: local npx prisma --version; VERIFIED: npm registry] |
| PostgreSQL | configured provider | Persistent tenant/request/intake/audit data | Prisma datasource provider is PostgreSQL. [VERIFIED: prisma/schema.prisma] |
| TypeScript | installed `latest`, local/registry 6.0.3 | Type-safe service modules and UI | Existing app and tests are TypeScript. [VERIFIED: package.json; VERIFIED: npm registry] |
| node:test + assert | Node 22.22.0 built-in | Unit/e2e verification | Existing tests use `node:test` and `node:assert/strict`; no Jest/Vitest present. [VERIFIED: src/lib/foundation.e2e.test.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | installed `^4.22.3`, registry current 4.22.3 | Run TypeScript tests/scripts | Use same style as Phase 1 tests if adding test scripts. [VERIFIED: package.json; VERIFIED: npm registry] |
| lucide-react | installed `latest` | Icons | Use only if existing UI already uses icons and needed. [VERIFIED: package.json] |
| Tailwind CSS | installed `latest`; config present | Styling | Reuse card/button visual language, avoid new UI library. [VERIFIED: package.json; VERIFIED: tailwind.config.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native form + server actions | react-hook-form + zod | Extra dependencies not needed for small MVP question schemas; use only if client-side validation complexity grows. [ASSUMED] |
| Prisma Json snapshot | Fully normalized answer rows | Normalized rows improve querying/reporting later; Json snapshot is simpler for schema-versioned intake and document-generation snapshot. [CITED: Context7 /prisma/web Json docs; ASSUMED tradeoff] |
| Local/mock private storage | S3/R2 signed upload | S3/R2 belongs to later vault hardening; Phase 2 only needs private semantics and metadata. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md] |

**Installation:**
```bash
# No new packages recommended for Phase 2 core path.
npm install
```

**Version verification:**
```bash
npm view next version time.modified
npm view @prisma/client version time.modified
npm view prisma version time.modified
npm view typescript version time.modified
npm view tsx version time.modified
```
[VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Customer browser
  -> /intake service selection
  -> Server action: create/request draft
      -> RBAC active workspace/user check
      -> Prisma: LegalRequest(status=draft_intake) + Intake data
      -> Audit: request.created / intake.started
  -> Guided question steps
      -> Server action: save answers
          -> Validate question keys against selected matter schema
          -> Prisma: structured answers + schemaVersion snapshot
          -> Audit: intake.answers_saved (counts only)
  -> Upload supporting files
      -> Server action / route handler
          -> canAccessRequest(session, requestId)
          -> private storage key generation, no public URL
          -> Prisma: VaultFile(workspaceId, requestId, storageKey, filename)
          -> Audit: file.uploaded (filename/count/hash only)
  -> Review and submit
      -> Server action: submit intake
          -> Required answer validation
          -> transitionRequestStatus(draft_intake -> intake_submitted)
          -> Audit via workflow + intake.submitted
          -> If unsupported: transition intake_submitted -> triage
  -> /requests/[id]
      -> canAccessRequest(session, requestId)
      -> Vietnamese status label + next step guidance
```

### Recommended Project Structure

```text
src/
├── app/
│   ├── intake/                  # customer service selection and guided intake pages
│   └── requests/[requestId]/     # customer read-only status view
├── lib/
│   ├── intake/                  # service catalog, schemas, save/submit services, tests
│   ├── workflow/                # existing state machine; extend only if needed
│   ├── security/                # existing RBAC checks
│   └── audit/                   # existing audit writer
└── app/admin/components/ui.tsx   # existing visual primitives; reuse or move later only if needed
```
[VERIFIED: existing src layout]

### Pattern 1: Server Action Forms for Mutations
**What:** Use App Router form `action` with server function receiving `FormData`; do auth/RBAC inside server function. [CITED: Context7 /vercel/next.js forms docs]
**When to use:** service selection, save answers, submit intake, upload metadata. [ASSUMED]
**Example:**
```typescript
// Source: Context7 /vercel/next.js docs, adapted to project style
async function submitIntake(formData: FormData) {
  'use server';
  const requestId = String(formData.get('requestId') ?? '');
  // load session, canAccessRequest, validate required answers, transitionRequestStatus
}
```

### Pattern 2: Schema-Versioned Intake Snapshot
**What:** Store request-specific answers with schemaVersion and labels at submission time, not only current catalog keys. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
**When to use:** all supported service types; future document generation needs exact input snapshot. [VERIFIED: .planning/REQUIREMENTS.md]
**Recommended model direction:** add `MatterType` or static catalog plus `IntakeResponse` tied one-to-one to `LegalRequest`, with `schemaVersion String`, `matterTypeKey String`, `answers Json`, and optional `submittedAt`. Prisma supports `Json` fields in schema. [CITED: Context7 /prisma/web Json docs]

### Pattern 3: Workflow-Owned Status Submit
**What:** Submit must call `transitionRequestStatus`, not `prisma.legalRequest.update({ status })`. [VERIFIED: src/lib/workflow/request-workflow.ts]
**When to use:** draft -> submitted and submitted -> triage. [VERIFIED: src/lib/workflow/request-workflow.ts]
**Note:** Current transition service derives actor roles from workspace memberships; customer can move own request to `intake_submitted`, coordinator can move `intake_submitted` to `triage`. Unsupported auto/system triage may need explicit coordinator/system actor or service extension. [VERIFIED: src/lib/workflow/request-workflow.ts]

### Anti-Patterns to Avoid
- **Raw conversation-only intake:** breaks INT-03 and later document generation snapshot. Use structured answers with labels. [VERIFIED: .planning/REQUIREMENTS.md]
- **Frontend-only required validation:** users can bypass browser; backend must block submit. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **Direct status update in intake service:** violates FND-05 and CLAUDE workflow integrity constraint. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: CLAUDE.md]
- **Public file URL in `VaultFile`:** violates private upload semantics; store storage key only. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
- **Sensitive legal content in audit metadata:** existing audit summary is limited to string <=500 chars; keep counts/ids/filenames only. [VERIFIED: src/lib/audit/audit.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Workflow status rules | Ad hoc `if`/enum updates in UI or intake service | `transitionRequestStatus` and `REQUEST_TRANSITIONS` | Existing backend state machine records workflow transition and audit. [VERIFIED: src/lib/workflow/request-workflow.ts] |
| RBAC checks | Per-page role checks only | `canAccessRequest`, `canAccessVaultFile`, `canAccessWorkspace` | Existing checks validate active user, workspace membership, role/assignment. [VERIFIED: src/lib/security/rbac.ts] |
| Audit persistence | Custom audit table writes | `recordAuditEvent` | Existing writer maps target types and validates metadata summary. [VERIFIED: src/lib/audit/audit.ts] |
| Form mutation transport | Custom JSON API for every step | Next Server Actions/forms | App Router forms support server functions receiving `FormData`. [CITED: Context7 /vercel/next.js] |
| File exposure | Public `/uploads/*` URL | Private storage key + authorized download later | Phase 2 must not expose public URLs. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md] |

**Key insight:** Phase 2 value is trusted structured operations intake, not chat cleverness. Existing foundation owns trust boundaries; custom shortcuts will create security/workflow debt. [VERIFIED: CLAUDE.md; VERIFIED: Phase 1 context]

## Common Pitfalls

### Pitfall 1: Treating Matter Type as Plain Text Only
**What goes wrong:** Later routing/templates cannot map request to capabilities or question schema. [ASSUMED]
**Why it happens:** MVP UI asks “what do you need?” but does not persist stable key/version. [ASSUMED]
**How to avoid:** Persist `matterTypeKey`, Vietnamese label, `schemaVersion`, and answer labels with request. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
**Warning signs:** code stores only `LegalRequest.title` or one textarea. [VERIFIED: prisma/schema.prisma current lacks intake fields]

### Pitfall 2: Bypassing Workflow for Unsupported Requests
**What goes wrong:** request reaches `triage` without transition/audit trail. [VERIFIED: src/lib/workflow/request-workflow.ts]
**Why it happens:** code calls `prisma.legalRequest.update({ status: 'triage' })`. [ASSUMED]
**How to avoid:** Use `transitionRequestStatus` for status changes; if unsupported auto-triage needs system actor, plan explicit change to workflow service. [VERIFIED: src/lib/workflow/request-workflow.ts]
**Warning signs:** no row in `WorkflowTransition` for unsupported path. [VERIFIED: prisma/schema.prisma]

### Pitfall 3: Upload Authorization Drift
**What goes wrong:** customer attaches file to another workspace/request. [VERIFIED: security constraints]
**Why it happens:** upload handler trusts hidden `requestId`. [ASSUMED]
**How to avoid:** Server action loads session and calls `canAccessRequest`; create `VaultFile` with request's workspaceId, not user input workspaceId. [VERIFIED: src/lib/security/rbac.ts; prisma/schema.prisma]
**Warning signs:** handler accepts both `workspaceId` and `requestId` from form without cross-checking. [ASSUMED]

### Pitfall 4: Audit Metadata Leaks Legal Content
**What goes wrong:** sensitive company/legal details become broadly visible in audit timeline. [VERIFIED: CLAUDE.md]
**Why it happens:** developer logs full answers or document text. [ASSUMED]
**How to avoid:** Audit only action, ids, matter type key, answer count, required completeness, filename/hash; never full answer text. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]
**Warning signs:** `metadataSummary` contains partner name, contract amount, legal fact pattern, or uploaded content. [ASSUMED]

## Code Examples

### Prisma Json Field for Intake Snapshot
```prisma
// Source: Context7 /prisma/web Json field docs, adapted
model IntakeResponse {
  id            String       @id @default(cuid())
  requestId     String       @unique
  matterTypeKey String
  schemaVersion String
  answers       Json
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  request       LegalRequest @relation(fields: [requestId], references: [id])
}
```

### Next.js Server Action Form Pattern
```tsx
// Source: Context7 /vercel/next.js forms docs, adapted
export default function Page() {
  async function createRequest(formData: FormData) {
    'use server';
    const matterTypeKey = formData.get('matterTypeKey');
    // auth, RBAC, validate catalog key, create draft request
  }

  return <form action={createRequest}>{/* fields */}</form>;
}
```

### Existing Workflow Submit Pattern
```typescript
// Source: src/lib/workflow/request-workflow.ts
await transitionRequestStatus({
  requestId,
  actorId: session.userId,
  toStatus: 'intake_submitted',
  reason: 'intake submitted',
  correlationId,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API route for every form mutation | App Router server functions/actions for form mutations | Current Next App Router docs | Simpler mutation path with server-side auth in action. [CITED: Context7 /vercel/next.js] |
| Unstructured intake notes | Schema-versioned structured answer snapshots | Project decision Phase 2 | Enables later template generation and traceability. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md] |
| Public upload paths | Private storage key plus authorized access | Project security constraint | Prevents customer legal files from leaking. [VERIFIED: CLAUDE.md] |

**Deprecated/outdated:**
- Direct status mutation: replaced by backend workflow transitions. [VERIFIED: CLAUDE.md; src/lib/workflow/request-workflow.ts]
- AI/OCR-assisted intake for MVP: deferred to v2 automation. [VERIFIED: .planning/REQUIREMENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Native forms/server actions are enough; no form library needed. | Standard Stack | Planner may under-scope client-side validation if UI becomes complex. |
| A2 | Json snapshot is preferable to fully normalized answer rows for MVP. | Standard Stack / Architecture Patterns | Later analytics/filtering over answers may require migration. |
| A3 | Common pitfall mechanics like trusting hidden requestId are likely risk patterns. | Common Pitfalls | Planner may need code-specific validation once implementation starts. |

## Open Questions

1. **Unsupported auto-triage actor**
   - What we know: current workflow allows customer draft -> submitted, coordinator submitted -> triage. [VERIFIED: src/lib/workflow/request-workflow.ts]
   - What's unclear: whether unsupported path should use system actor, coordinator actor, or extend workflow permissions.
   - Recommendation: Planner should add explicit task to define unsupported triage service behavior; avoid direct DB status update.

2. **Matter type persistence shape**
   - What we know: Phase 3 requires admin-defined matter types; Phase 2 can seed MVP catalog. [VERIFIED: .planning/ROADMAP.md]
   - What's unclear: whether Phase 2 should create DB `MatterType` now or static catalog plus `matterTypeKey`.
   - Recommendation: Use DB model only if needed for seeding/status display; otherwise static catalog + stable persisted key is smaller. Flag tradeoff for planner.

3. **Physical file storage**
   - What we know: `VaultFile` stores metadata only; Phase 2 may remain local/mock-compatible. [VERIFIED: prisma/schema.prisma; .planning/phases/02-intake/02-CONTEXT.md]
   - What's unclear: whether actual byte storage must be implemented now.
   - Recommendation: Plan metadata and private key semantics; if bytes required, use non-public local path under controlled storage, no public route.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next/tsx/tests | yes | 22.22.0 | none needed [VERIFIED: local command] |
| npm | package scripts | yes | 11.12.0 | none needed [VERIFIED: local command] |
| Prisma CLI | schema/client generation | yes | 6.19.3 local, 7.8.0 registry | stay on installed 6.19.x unless upgrade task exists [VERIFIED: local command; npm registry] |
| PostgreSQL DATABASE_URL | e2e tests/data | unknown | not probed | Planner should include safe DB check like Phase 1 e2e before tests. [VERIFIED: src/lib/foundation.e2e.test.ts] |

**Missing dependencies with no fallback:**
- None verified. [VERIFIED: local commands]

**Missing dependencies with fallback:**
- Production S3/R2 not required; use local/mock-compatible private storage semantics. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Existing `AppSession` plus active user lookup; real auth provider not researched in Phase 2. [VERIFIED: src/lib/security/session.ts; src/lib/security/rbac.ts] |
| V3 Session Management | yes | Do not trust client user/workspace ids; derive from session. [VERIFIED: src/lib/security/rbac.ts] |
| V4 Access Control | yes | `canAccessWorkspace`, `canAccessRequest`, `canAccessVaultFile` server-side. [VERIFIED: src/lib/security/rbac.ts] |
| V5 Input Validation | yes | Validate matter key, question keys, required answers, file metadata server-side. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md] |
| V6 Cryptography | limited | Do not hand-roll; if hashing uploads for audit, use Node crypto. [ASSUMED] |
| V8 Data Protection | yes | Private file semantics, no public URLs, no legal content in audit metadata. [VERIFIED: CLAUDE.md; .planning/phases/02-intake/02-CONTEXT.md] |
| V10 Malicious Code | yes | File upload type/size limits and no execution/preview in Phase 2. [ASSUMED] |

### Known Threat Patterns for Next.js + Prisma Intake

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-tenant request access via guessed id | Information Disclosure | `canAccessRequest` on every read/write; never trust route param alone. [VERIFIED: src/lib/security/rbac.ts] |
| Unauthorized file attach to another request | Tampering | Load request by id after RBAC; use request.workspaceId for `VaultFile`. [VERIFIED: prisma/schema.prisma; src/lib/security/rbac.ts] |
| Workflow bypass | Tampering/Repudiation | Use `transitionRequestStatus`; verify `WorkflowTransition` and audit rows in tests. [VERIFIED: src/lib/workflow/request-workflow.ts] |
| Audit leakage of legal facts | Information Disclosure | Audit counts/ids/filenames only; `metadataSummary` <=500 chars. [VERIFIED: src/lib/audit/audit.ts] |
| Unsupported request silently dropped | Repudiation | Persist request and mark triage with audit event; show Vietnamese status guidance. [VERIFIED: .planning/phases/02-intake/02-CONTEXT.md] |

## Validation Architecture

Skipped because `.planning/config.json` has `workflow.nyquist_validation: false`. [VERIFIED: .planning/config.json]

Recommended verification anyway:
- `npm run typecheck` [VERIFIED: package.json]
- `npx tsx src/lib/intake/intake.test.ts` or equivalent node:test file [VERIFIED: existing test style]
- `npx tsx src/lib/intake/intake.e2e.test.ts` with safe DATABASE_URL guard copied from foundation e2e [VERIFIED: src/lib/foundation.e2e.test.ts]
- Manual UI smoke: customer selects service, answers required questions, uploads metadata/file, submits, sees Vietnamese status; unsupported path shows triage guidance. [VERIFIED: .planning/ROADMAP.md]

## Sources

### Primary (HIGH confidence)
- `.planning/phases/02-intake/02-CONTEXT.md` — locked Phase 2 decisions and scope.
- `.planning/REQUIREMENTS.md` — INT-01 through INT-06.
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria.
- `.planning/phases/01-foundation/01-CONTEXT.md` — prior foundation decisions.
- `CLAUDE.md` — project constraints and workflow/security rules.
- `prisma/schema.prisma` — current data model.
- `src/lib/workflow/request-workflow.ts` — workflow transitions and permissions.
- `src/lib/security/rbac.ts` — RBAC checks.
- `src/lib/audit/audit.ts` — audit writer constraints.
- `package.json` — installed stack/scripts.
- Context7 `/vercel/next.js` — App Router forms/server actions guidance.
- Context7 `/prisma/web` — Prisma Json field guidance.
- npm registry — package current versions and modified timestamps.

### Secondary (MEDIUM confidence)
- Existing Phase 1 tests in `src/lib/foundation.e2e.test.ts` and `src/lib/workflow/request-workflow.test.ts` — test style and safe DB guard.

### Tertiary (LOW confidence)
- Assumed tradeoffs around Json vs normalized answers and no form library.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing package.json, local versions, and npm registry verified.
- Architecture: HIGH - Phase 1 code provides concrete RBAC/workflow/audit integration points.
- Pitfalls: MEDIUM - many are verified by code constraints, some exploit mechanics are assumed common risks.

**Research date:** 2026-05-27
**Valid until:** 2026-06-03 for package versions; architectural findings valid until Phase 1 foundation changes.
