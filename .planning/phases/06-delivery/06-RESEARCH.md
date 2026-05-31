# Phase 06: delivery - Research

**Researched:** 2026-05-31
**Domain:** secure final-document delivery, signed download boundary, email notification, workflow closure
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Customer Portal
- **D-01:** Add dedicated customer request detail route at `/customer/requests/[requestId]` for delivered/final document access, rather than adding delivery into internal specialist/reviewer/admin UI.
- **D-02:** Customer portal must use server-side session/RBAC checks and only show requests where the customer is the request creator in the same active workspace.
- **D-03:** UI should reuse existing Card/Button/Badge/PageHeader visual language with Vietnamese copy and minimal customer-facing workflow language.

### Final Document Visibility
- **D-04:** Customer sees only `DocumentVersion` records with status `final` and related `VaultFile` artifacts for their own request.
- **D-05:** Hide all draft, `submitted_for_review`, reviewer checklist/comment, internal notes, template input snapshots, and specialist workbench data from customer routes and APIs.
- **D-06:** Do not rely on frontend filtering for secrecy. Filtering must happen in server-side queries/services before data reaches UI.

### Signed Download Links
- **D-07:** Replace the current `requestVaultFileAccess()` stub with a real signed URL abstraction boundary. It may use an MVP local/dev fallback, but production path must not expose raw `storageKey`.
- **D-08:** Signed URL TTL is 15 minutes. Download responses should make expiry clear to customer.
- **D-09:** Add server-side download API route such as `/api/vault/[vaultFileId]/download` that validates `canAccessVaultFile`, verifies final-document visibility for customers, records audit, then returns or redirects to signed URL.
- **D-10:** Audit download/access events with identifiers and safe metadata only: vault file id, request id, actor id, action, expiry timestamp. Do not log legal content or raw storage key.

### Ready Notification
- **D-11:** MVP notification channel is email, using a lightweight provider abstraction. Resend is acceptable if dependency/config already fits, but planner may choose minimal adapter/stub if no email provider is configured.
- **D-12:** Notification triggers when request transitions to `delivered`, not merely when reviewer approves. Approval means final-ready; delivery means customer should be told.
- **D-13:** Email content includes request title, document filenames/list, customer portal link or download action link, and 15-minute expiry warning. Keep content simple; no complex template builder.
- **D-14:** No notification preferences or opt-out in MVP.

### Delivery and Close Flow
- **D-15:** Delivery transition remains backend workflow state machine: `approved` → `delivered` → `closed`.
- **D-16:** Specialist assigned to the request or coordinator/admin can mark an approved request as delivered if final documents exist.
- **D-17:** Specialist or coordinator/admin can close a delivered request. Customer download confirmation is not required before closure.
- **D-18:** Close action requires a reason and records audit/workflow transition. Delivery action should also create delivery audit event.
- **D-19:** Frontend can show allowed actions, but backend validates role, assignment, current status, final document existence, and transition legality.

### Claude's Discretion
- Exact download button placement may be inline in document list for simplicity.
- Exact close confirmation UI may use existing form/action patterns as long as reason is captured.
- Exact provider module names may follow existing `src/lib/documents` / `src/lib/*` style.
- Exact email text can be concise Vietnamese copy.

### Folded Todos
None.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

### Ideas Noted for Later
- E-sign integration — v2 signature flow after delivery stabilizes.
- In-app notification center — future customer communication phase; email-only for MVP.
- Customer download tracking/confirmation — useful analytics/audit enhancement, not required for DLV-05 closure.
- Notification preferences/opt-out — post-MVP customer settings.

### Reviewed Todos (not folded)
None — no matching pending todos for Phase 6.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DLV-01 | Customer can view approved final documents for own requests. | Use customer route plus server query filtering to `DocumentVersionStatus.final` and own `LegalRequest.createdById`. [VERIFIED: .planning/REQUIREMENTS.md + 06-CONTEXT.md + prisma/schema.prisma] |
| DLV-02 | Customer can download final documents through short-lived signed links. | Use `/api/vault/[vaultFileId]/download` Route Handler, 15-minute TTL, no raw `storageKey` in UI/API payload. [VERIFIED: 06-CONTEXT.md + src/lib/documents/vault-service.ts] [CITED: nextjs.org/docs/app/api-reference/file-conventions/route] |
| DLV-03 | System hides internal notes, reviewer-only comments, and unapproved drafts from customers. | Build customer-specific final-document service selecting only safe fields; never reuse specialist detail query. [VERIFIED: src/app/specialist/requests/[requestId]/page.tsx currently selects all versions/generated content/storageKey for internal view] |
| DLV-04 | System notifies customer when document is ready. | Trigger email on `approved -> delivered`, using adapter/stub if `RESEND_API_KEY` absent. [VERIFIED: 06-CONTEXT.md] [CITED: resend.com/docs/send-with-nextjs] |
| DLV-05 | Coordinator or specialist can close request after final delivery. | Extend workflow authorization for assigned specialist + coordinator/admin close, require reason and final-document existence checks in service layer. [VERIFIED: src/lib/workflow/request-workflow.ts] |
</phase_requirements>

## Summary

Phase 06 should add customer-facing delivery without exposing internal document/review data. Existing Prisma schema already has `RequestStatus.approved/delivered/closed`, `DocumentVersionStatus.final`, `VaultFile.documentVersionId`, and audit models, so this phase is mostly service/query hardening, workflow authorization extension, API route addition, and UI surface. [VERIFIED: prisma/schema.prisma]

Most important planning rule: do not reuse specialist request detail data shape for customer route. Current specialist page selects vault `storageKey`, all document versions, and generated content for internal workbench; customer route must use separate server-side query/service that returns only final document metadata and download action. [VERIFIED: src/app/specialist/requests/[requestId]/page.tsx]

**Primary recommendation:** Build thin delivery service boundary: `getCustomerFinalDocuments()`, `requestFinalDocumentDownload()`, `markRequestDelivered()`, `closeDeliveredRequest()`, and `sendDeliveryReadyEmail()`; keep route/UI dumb and enforce all secrecy/transition checks server-side. [VERIFIED: 06-CONTEXT.md + codebase patterns]

## Project Constraints (from CLAUDE.md)

- All communication and customer-facing copy should be Vietnamese. [VERIFIED: CLAUDE.md]
- Phase/quick slugs must be short English. [VERIFIED: CLAUDE.md]
- State assumptions explicitly before implementation; ask when unclear. [VERIFIED: CLAUDE.md]
- Prefer minimum code solving requested scope; no speculative features. [VERIFIED: CLAUDE.md]
- Make surgical changes only; do not refactor adjacent code. [VERIFIED: CLAUDE.md]
- Legal documents must pass reviewer before final. [VERIFIED: CLAUDE.md]
- Legal files are sensitive: private files, tenant/request RBAC, short-lived signed URLs, full audit. [VERIFIED: CLAUDE.md]
- MVP prioritizes end-to-end workflow over OCR/e-sign/advanced AI. [VERIFIED: CLAUDE.md]
- Workflow status changes must go through backend state machine, not frontend hard-coded logic. [VERIFIED: CLAUDE.md]
- Review must bind to exact document version for traceability. [VERIFIED: CLAUDE.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Customer final document visibility | API / Backend | Frontend Server (SSR) | Backend query must enforce creator/workspace/final-status filtering before UI sees data. [VERIFIED: 06-CONTEXT.md] |
| Signed download generation | API / Backend | Storage | Route Handler validates access and asks storage signer/local fallback for short-lived URL. [VERIFIED: src/lib/documents/vault-service.ts] |
| Ready notification | API / Backend | External email provider | Delivery transition owns event trigger; email provider only sends message. [CITED: resend.com/docs/send-with-nextjs] |
| Delivery/close workflow | API / Backend | Database | State machine validates status/role/final-document existence and writes transition/audit atomically. [VERIFIED: src/lib/workflow/request-workflow.ts] |
| Customer route rendering | Frontend Server (SSR) | Browser / Client | Server component loads safe view model; browser only renders metadata/buttons. [CITED: nextjs.org/docs/app/guides/forms] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | installed `latest`; npm current `16.2.6`, modified 2026-05-30 | App Router server components, Route Handlers, Server Actions | Existing app uses Next App Router; Route Handlers support GET and dynamic params as Promise in v15+. [VERIFIED: package.json + npm registry] [CITED: nextjs.org/docs/app/api-reference/file-conventions/route] |
| React / React DOM | installed `latest` | Server/client UI rendering, form state if needed | Existing dependency; Next forms docs describe Server Actions and `useFormStatus`/`useActionState` for pending/errors. [VERIFIED: package.json] [CITED: nextjs.org/docs/app/guides/forms] |
| Prisma Client | installed `^6.19.0`; npm current `7.8.0`, modified 2026-05-19 | DB access, transactions, relations | Existing central persistence; interactive transactions fit read-check-write-audit flow. [VERIFIED: package.json + npm registry + prisma/schema.prisma] [CITED: prisma.io/docs/orm/prisma-client/queries/transactions] |
| TypeScript | installed `latest` | Type-safe service/route code | Existing project stack and tests are TypeScript. [VERIFIED: package.json + src/**/*.ts] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Resend | npm current `6.12.4`, modified 2026-05-25 | Production email provider | Use only if adding real email dependency/config; needs `RESEND_API_KEY` and verified domain. [VERIFIED: npm registry] [CITED: resend.com/docs/send-with-nextjs] |
| node:test | Node `v22.22.2` available | Unit/e2e tests | Existing tests use `node:test`; no separate test framework package detected. [VERIFIED: environment + src/lib/*.test.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | Minimal no-op/logging adapter | Fits MVP if no provider configured; must not pretend email sent in production. [VERIFIED: 06-CONTEXT.md says adapter/stub acceptable] |
| Object storage signed URL | Local/dev download fallback | Acceptable only for MVP local/dev; production path must not expose raw `storageKey`. [VERIFIED: 06-CONTEXT.md] |
| Server Actions for downloads | Route Handler GET redirect/response | Route Handler better matches file download/link semantics and official API route pattern. [CITED: nextjs.org/docs/app/api-reference/file-conventions/route] |

**Installation:**
```bash
# Only if real email provider chosen
npm install resend
```

**Version verification:**
- `npm view next version time.modified` → `16.2.6`, `2026-05-30T23:59:47.514Z`. [VERIFIED: npm registry]
- `npm view @prisma/client version time.modified` → `7.8.0`, `2026-05-19T15:54:52.804Z`; project currently pins `^6.19.0`, so planner should not upgrade Prisma in this phase unless separately requested. [VERIFIED: npm registry + package.json]
- `npm view resend version time.modified` → `6.12.4`, `2026-05-25T18:39:44.568Z`. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Customer browser
  -> /customer/requests/[requestId]
  -> requireAppSession()
  -> canAccessRequest() + request.createdById/session.userId + active workspace check
  -> getCustomerFinalDocuments(requestId)
       -> LegalRequest(status, creator, workspace)
       -> Document -> DocumentVersion(status='final')
       -> VaultFile(documentVersionId != null)
       -> safe view model: filename, version, createdAt, vaultFileId only
  -> render final document list + download buttons

Download click
  -> GET /api/vault/[vaultFileId]/download
  -> requireAppSession()
  -> canAccessVaultFile()
  -> customer final-document visibility check
  -> requestVaultFileAccess() / storage signer
  -> record audit: vault file id, request id, actor id, expiry
  -> redirect/return signed URL or dev fallback response

Internal delivery action
  -> markRequestDelivered(requestId)
  -> validate actor role/assignment + status='approved' + final docs exist
  -> transitionRequestStatus(approved -> delivered)
  -> audit delivery
  -> sendDeliveryReadyEmail(customer, request, documents)

Internal close action
  -> closeDeliveredRequest(requestId, reason)
  -> validate actor role/assignment + status='delivered' + non-empty reason
  -> transitionRequestStatus(delivered -> closed)
  -> audit close/reason via workflow transition
```

### Recommended Project Structure

```text
src/
├── app/customer/requests/[requestId]/page.tsx      # customer-safe request detail
├── app/api/vault/[vaultFileId]/download/route.ts   # signed download endpoint
├── lib/delivery/delivery-service.ts                # final docs, deliver, close orchestration
├── lib/delivery/notification-service.ts            # email adapter/stub boundary
├── lib/documents/vault-service.ts                  # signed URL abstraction hardening
└── lib/workflow/request-workflow.ts                # role authorization extension
```

### Pattern 1: Customer-safe view model service

**What:** Query only final versions and safe vault metadata, then return DTO without `storageKey`, `generatedContent`, `inputSnapshot`, review comments, or checklist answers. [VERIFIED: prisma/schema.prisma + 06-CONTEXT.md]

**When to use:** Every customer delivery page/API path. [VERIFIED: 06-CONTEXT.md]

**Example:**
```typescript
// Source: codebase pattern + Prisma schema verified in prisma/schema.prisma
await prisma.legalRequest.findFirst({
  where: {
    id: requestId,
    workspaceId: session.activeWorkspaceId ?? undefined,
    createdById: session.userId,
  },
  select: {
    id: true,
    title: true,
    status: true,
    documents: {
      select: {
        id: true,
        title: true,
        documentVersions: {
          where: { status: 'final' },
          select: {
            id: true,
            templateVersion: true,
            createdAt: true,
          },
        },
      },
    },
  },
});
```

### Pattern 2: Route Handler for download

**What:** Use App Router `route.ts` GET handler; Next docs state Route Handlers use Web Request/Response APIs and dynamic `params` is a Promise. [CITED: nextjs.org/docs/app/api-reference/file-conventions/route]

**When to use:** `/api/vault/[vaultFileId]/download`. [VERIFIED: 06-CONTEXT.md]

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
export async function GET(
  request: Request,
  { params }: { params: Promise<{ vaultFileId: string }> },
) {
  const { vaultFileId } = await params;
  // require session, validate final-document visibility, audit, return Response/redirect
}
```

### Pattern 3: Server Action form with authorization inside action

**What:** Next forms docs warn to verify authentication and authorization inside each Server Action. [CITED: nextjs.org/docs/app/guides/forms]

**When to use:** Deliver/close forms in internal request detail pages. [VERIFIED: 06-CONTEXT.md]

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/forms
async function closeRequest(formData: FormData) {
  'use server';
  const session = await requireAppSession();
  const reason = String(formData.get('reason') ?? '').trim();
  // validate role/assignment/status/final docs, then transition
}
```

### Anti-Patterns to Avoid

- **Frontend-only secrecy:** Hidden JSX is not security; filter server-side before data reaches UI. [VERIFIED: 06-CONTEXT.md]
- **Reusing specialist detail query for customer page:** Current specialist page selects `storageKey`, all versions, and internal content; unsafe for customers. [VERIFIED: src/app/specialist/requests/[requestId]/page.tsx]
- **Email attachments for legal documents:** Send portal/download link only; attachments broaden data exposure and bypass signed-link TTL. [ASSUMED]
- **Network email call inside DB transaction:** Prisma docs advise keeping interactive transactions short and avoiding slow work inside transactions. [CITED: prisma.io/docs/orm/prisma-client/queries/transactions]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Workflow state validation | Frontend status mutation | Existing `transitionRequestStatus()` state machine | Existing function checks allowed transitions, access, and writes workflow/audit. [VERIFIED: src/lib/workflow/request-workflow.ts] |
| RBAC base checks | Inline role checks everywhere | `canAccessRequest()` / `canAccessVaultFile()` plus customer final-doc checks | Existing functions verify active user/membership and request assignment/creator; delivery needs extra final visibility. [VERIFIED: src/lib/security/rbac.ts] |
| Signed URL TTL math scattered | Ad hoc query params in UI | Hardened `requestVaultFileAccess()`/storage signer boundary | Current stub centralizes 15-minute expiry; production must not expose raw `storageKey`. [VERIFIED: src/lib/documents/vault-service.ts + 06-CONTEXT.md] |
| Email provider logic in action | Direct Resend calls in workflow action | Lightweight notification service/adapter | Keeps provider optional and testable; Resend needs API key/domain. [CITED: resend.com/docs/send-with-nextjs] |
| Audit inserts manually copied | Raw `prisma.auditEvent.create` in each feature | `recordAuditEvent()` | Existing helper maps target types and validates correlation/metadata length. [VERIFIED: src/lib/audit/audit.ts] |

**Key insight:** Delivery is security boundary, not UI list. Planner must assign most work to backend service/API validation, then add minimal UI.

## Common Pitfalls

### Pitfall 1: Customer sees non-final versions
**What goes wrong:** Drafts, submitted versions, generated content, or input snapshots appear in customer page/API. [VERIFIED: 06-CONTEXT.md]
**Why it happens:** Reusing internal specialist data queries that fetch all versions. [VERIFIED: src/app/specialist/requests/[requestId]/page.tsx]
**How to avoid:** Dedicated customer-safe service selecting only `DocumentVersion.status = final` and only safe fields. [VERIFIED: prisma/schema.prisma]
**Warning signs:** Query includes `generatedContent`, `inputSnapshot`, `reviews`, `checklistAnswers`, or `storageKey` in customer route. [VERIFIED: prisma/schema.prisma]

### Pitfall 2: `canAccessVaultFile()` alone is too broad for customer downloads
**What goes wrong:** Customer can access supporting uploads/internal vault files for own request, not only final deliverables. [VERIFIED: src/lib/security/rbac.ts delegates vault file access through request access]
**Why it happens:** Request-level access is necessary but not enough for delivery. [VERIFIED: 06-CONTEXT.md]
**How to avoid:** After `canAccessVaultFile()`, check vault file belongs to a `DocumentVersion.status='final'` for same request before generating signed URL for customer role. [VERIFIED: prisma/schema.prisma]
**Warning signs:** Download route calls only `canAccessVaultFile()` then signs URL. [VERIFIED: src/lib/documents/vault-service.ts current stub]

### Pitfall 3: Workflow authorization currently misses Phase 06 roles
**What goes wrong:** Assigned specialist cannot deliver/close, coordinator can close but may not deliver. [VERIFIED: src/lib/workflow/request-workflow.ts lines 50-56]
**Why it happens:** Existing state machine has transitions but older `canTransitionRequestStatus()` role allow-list excludes `delivered` for coordinator/specialist and excludes `closed` for specialist. [VERIFIED: src/lib/workflow/request-workflow.ts]
**How to avoid:** Extend authorization per D-16/D-17 and keep status legality in `REQUEST_TRANSITIONS`. [VERIFIED: 06-CONTEXT.md]
**Warning signs:** Tests only assert transition graph, not actor authorization for delivery/close. [VERIFIED: src/lib/workflow/request-workflow.test.ts grep]

### Pitfall 4: Delivery email fires on approval
**What goes wrong:** Customer notified before coordinator/specialist intentionally delivers. [VERIFIED: 06-CONTEXT.md]
**Why it happens:** Confusing `approved` with customer delivery. [VERIFIED: 06-CONTEXT.md]
**How to avoid:** Trigger notification only after successful `approved -> delivered` transition and final-doc existence validation. [VERIFIED: 06-CONTEXT.md]
**Warning signs:** Email call in reviewer approval path. [VERIFIED: 06-CONTEXT.md]

### Pitfall 5: Transaction includes email send
**What goes wrong:** Slow provider call extends DB lock time or rollback semantics become unclear. [CITED: prisma.io/docs/orm/prisma-client/queries/transactions]
**Why it happens:** Orchestrating transition/audit/email in one function. [ASSUMED]
**How to avoid:** Commit DB transition/audit first; then send email and audit/record failure separately if desired. [CITED: prisma.io/docs/orm/prisma-client/queries/transactions]
**Warning signs:** `resend.emails.send()` inside `prisma.$transaction()`. [CITED: prisma.io/docs/orm/prisma-client/queries/transactions + resend.com/docs/send-with-nextjs]

## Code Examples

### Resend send call shape
```typescript
// Source: https://resend.com/docs/send-with-nextjs
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await resend.emails.send({
  from: 'Acme <onboarding@resend.dev>',
  to: ['delivered@resend.dev'],
  subject: 'Hello world',
  html: '<p>Hello</p>',
});
```

### Prisma transaction guidance for transition + audit
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
await prisma.$transaction(async (tx) => {
  await tx.legalRequest.updateMany({ where: { id, status: 'approved' }, data: { status: 'delivered' } });
  await tx.workflowTransition.create({ data: transitionData });
  await recordAuditEvent(auditData, tx);
});
```

### Next route handler params
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
export async function GET(
  request: Request,
  { params }: { params: Promise<{ vaultFileId: string }> },
) {
  const { vaultFileId } = await params;
  return Response.json({ vaultFileId });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next route handler params as plain object | `context.params` is Promise | Next `v15.0.0-RC` | Phase route handlers should `await params`. [CITED: nextjs.org/docs/app/api-reference/file-conventions/route] |
| GET Route Handlers static by default | GET default caching changed to dynamic | Next `v15.0.0-RC` | Download route still should avoid caching signed responses via headers/route config if returning sensitive response. [CITED: nextjs.org/docs/app/api-reference/file-conventions/route] |
| Direct email in route/action | Provider SDK with env API key + verified domain | Current Resend docs 2026-05-31 fetch | Production requires `RESEND_API_KEY` and verified sender domain. [CITED: resend.com/docs/send-with-nextjs] |

**Deprecated/outdated:**
- Plain `params` object in route handlers is outdated for Next v15+. Use Promise form. [CITED: nextjs.org/docs/app/api-reference/file-conventions/route]
- Current `requestVaultFileAccess()` token=`stub` is not production-signed; replace/harden boundary. [VERIFIED: src/lib/documents/vault-service.ts + 06-CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Email attachments should be avoided for legal documents; portal/download link only. | Anti-Patterns | If business requires attachments, notification design changes and security review needed. |
| A2 | Transaction/email orchestration risk comes from slow network inside transaction. | Common Pitfalls | If implementation never puts provider call in transaction, risk irrelevant. |

## Open Questions (RESOLVED)

1. **Production storage signer exists? — RESOLVED**
   - What we know: `VaultFile.storageKey` exists; `requestVaultFileAccess()` currently returns stub URL and does not select `storageKey`. [VERIFIED: src/lib/documents/vault-service.ts]
   - Decision for planning: no production storage provider is configured in this repo, so plan a storage signer boundary plus local/dev server-mediated download fallback. Do not add S3/R2 dependency in Phase 06. Production provider integration remains behind the same signer interface.
   - Required planner behavior: DLV-02 must still deliver an actual downloadable response in local/dev fallback; JSON-only success messages are not acceptable.

2. **Email provider configured? — RESOLVED**
   - What we know: Resend is not installed; `RESEND_API_KEY` requirement exists in docs. [VERIFIED: package.json] [CITED: resend.com/docs/send-with-nextjs]
   - Decision for planning: use lightweight notification adapter with provider stub/no-op fallback. Do not install `resend` unless environment/config already proves provider availability during execution.
   - Required planner behavior: email body builder must include request title, document filenames/list, customer portal or download action link, and 15-minute expiry warning.

3. **Exact internal UI placement for deliver/close actions? — RESOLVED**
   - What we know: customer route is dedicated; close is specialist/coordinator only; UI spec has close dialog copy. [VERIFIED: 06-CONTEXT.md + 06-UI-SPEC.md]
   - Decision for planning: add delivery/close actions to existing specialist request detail/workbench first because it already exists and is assigned-specialist scoped. Avoid creating a new admin/coordinator surface unless required by tests or existing route patterns.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next app/tests/scripts | ✓ | v22.22.2 | — |
| npm/npx | package install/version verification | ✓ | npm 10.9.7 / npx 10.9.7 | — |
| PostgreSQL | Prisma datasource | Unknown at research time | — | Existing tests likely require DATABASE_URL; planner should verify before execution. [VERIFIED: prisma/schema.prisma] |
| Resend API key/domain | Production email | ✗ not detected in package/config | — | Minimal adapter/stub per D-11. [VERIFIED: package.json + 06-CONTEXT.md] |
| Object storage signer | Production signed URLs | ✗ not detected in package/config | — | Local/dev fallback with no raw `storageKey` exposure per D-07. [VERIFIED: package.json + 06-CONTEXT.md] |

**Missing dependencies with no fallback:**
- None for MVP if local/dev signed URL fallback and email stub are accepted. [VERIFIED: 06-CONTEXT.md]

**Missing dependencies with fallback:**
- Resend provider config: use adapter/stub. [VERIFIED: 06-CONTEXT.md]
- Production storage signer: use hardened local/dev fallback behind signer boundary. [VERIFIED: 06-CONTEXT.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireAppSession()` on pages/actions/routes. [VERIFIED: src/lib/security/session.ts] |
| V3 Session Management | yes | Existing env-backed session helper for MVP; every action must re-check session. [VERIFIED: src/lib/security/session.ts] [CITED: nextjs.org/docs/app/guides/forms] |
| V4 Access Control | yes | `canAccessRequest()`, `canAccessVaultFile()`, plus customer final-document visibility checks. [VERIFIED: src/lib/security/rbac.ts] |
| V5 Input Validation | yes | Server-side reason presence check; route param lookup; no untrusted hidden-field trust. [CITED: nextjs.org/docs/app/guides/forms] |
| V6 Cryptography | yes | Do not hand-roll cryptographic signing; use storage/provider signer or minimal server-mediated fallback. [ASSUMED] |
| V7 Error Handling and Logging | yes | Audit safe metadata only; do not log legal content/raw storage key. [VERIFIED: 06-CONTEXT.md] |
| V9 Communications | yes | Short-lived download URLs and no raw key exposure. [VERIFIED: 06-CONTEXT.md] |
| V12 File and Resources | yes | Private vault file access through RBAC and signed download route. [VERIFIED: CLAUDE.md + 06-CONTEXT.md] |

### Known Threat Patterns for Next.js/Prisma delivery stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Insecure direct object reference on `vaultFileId` | Elevation of Privilege / Information Disclosure | Check session, request access, customer ownership, workspace, and final-document linkage before signing. [VERIFIED: src/lib/security/rbac.ts + 06-CONTEXT.md] |
| Draft/internal data leakage via reused query | Information Disclosure | Separate customer-safe DTO; do not select internal fields. [VERIFIED: src/app/specialist/requests/[requestId]/page.tsx] |
| Stale/long-lived download URLs | Information Disclosure | 15-minute TTL and visible expiry copy. [VERIFIED: 06-CONTEXT.md] |
| Sensitive audit logs | Information Disclosure | Log identifiers and expiry only; no legal content/raw storage key. [VERIFIED: 06-CONTEXT.md] |
| Unauthorized closure | Tampering | Backend validates role, assignment, status, final documents, and non-empty reason. [VERIFIED: 06-CONTEXT.md + src/lib/workflow/request-workflow.ts] |
| Double delivery/close race | Tampering | Conditional status update with current status and transaction; existing code uses `updateMany` with status guard. [VERIFIED: src/lib/workflow/request-workflow.ts] |

## Sources

### Primary (HIGH confidence)
- `/mnt/d/PhapChe/.claude/worktrees/agent-aa5ce4ff2e0fc6c55/.planning/phases/06-delivery/06-CONTEXT.md` — locked decisions, scope, canonical refs. [VERIFIED]
- `/mnt/d/PhapChe/.claude/worktrees/agent-aa5ce4ff2e0fc6c55/.planning/REQUIREMENTS.md` — DLV-01..DLV-05. [VERIFIED]
- `/mnt/d/PhapChe/.claude/worktrees/agent-aa5ce4ff2e0fc6c55/CLAUDE.md` — project constraints. [VERIFIED]
- `/mnt/d/PhapChe/.claude/worktrees/agent-aa5ce4ff2e0fc6c55/prisma/schema.prisma` — models/enums/relations. [VERIFIED]
- `/mnt/d/PhapChe/.claude/worktrees/agent-aa5ce4ff2e0fc6c55/src/lib/security/rbac.ts` — RBAC patterns. [VERIFIED]
- `/mnt/d/PhapChe/.claude/worktrees/agent-aa5ce4ff2e0fc6c55/src/lib/workflow/request-workflow.ts` — state machine and current auth gap. [VERIFIED]
- `/mnt/d/PhapChe/.claude/worktrees/agent-aa5ce4ff2e0fc6c55/src/lib/documents/vault-service.ts` — vault listing/access stub. [VERIFIED]
- `/mnt/d/PhapChe/.claude/worktrees/agent-aa5ce4ff2e0fc6c55/src/lib/audit/audit.ts` — audit helper. [VERIFIED]
- `https://nextjs.org/docs/app/api-reference/file-conventions/route` — Route Handler facts, params Promise, redirect/Response. [CITED]
- `https://nextjs.org/docs/app/guides/forms` — Server Actions/forms/auth warning. [CITED]
- `https://www.prisma.io/docs/orm/prisma-client/queries/transactions` — transaction guidance. [CITED]
- `https://resend.com/docs/send-with-nextjs` — Resend setup/API/env. [CITED]
- npm registry via `npm view` — Next/Prisma/Resend current versions. [VERIFIED]

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- Assumptions listed in Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package.json, npm registry, and official docs checked.
- Architecture: HIGH — constrained by locked CONTEXT decisions and existing service/schema patterns.
- Pitfalls: HIGH — most pitfalls verified against current code gaps; two operational recommendations marked assumed.

**Research date:** 2026-05-31
**Valid until:** 2026-06-07 for npm/framework versions; 2026-06-30 for local architecture findings.
