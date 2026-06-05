# Phase 06: delivery - Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 8
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/customer/requests/[requestId]/page.tsx` | component | request-response | `src/app/requests/[requestId]/page.tsx` | exact |
| `src/app/api/vault/[vaultFileId]/download/route.ts` | route | request-response + file-I/O | `src/lib/documents/vault-service.ts` | partial |
| `src/lib/delivery/delivery-service.ts` | service | CRUD + request-response | `src/lib/documents/draft-service.ts` | role-match |
| `src/lib/delivery/notification-service.ts` | service | event-driven | `src/lib/audit/audit.ts` | partial |
| `src/lib/documents/vault-service.ts` | service | file-I/O + request-response | `src/lib/documents/vault-service.ts` | exact |
| `src/lib/workflow/request-workflow.ts` | service | event-driven + CRUD | `src/lib/workflow/request-workflow.ts` | exact |
| `src/app/specialist/requests/[requestId]/actions.ts` | server action | request-response | `src/app/specialist/requests/[requestId]/actions.ts` | exact |
| `src/lib/delivery/delivery-service.test.ts` / related tests | test | CRUD + request-response | `src/lib/documents/vault-service.test.ts` | role-match |

## Pattern Assignments

### `src/app/customer/requests/[requestId]/page.tsx` (component, request-response)

**Analog:** `src/app/requests/[requestId]/page.tsx`

**Imports pattern** (lines 1-5):
```typescript
import { notFound } from 'next/navigation';
import type { RequestStatus } from '@prisma/client';
import { Badge, Card, PageHeader } from '@/app/admin/components/ui';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';
```

**Server session/RBAC pattern** (lines 21-25):
```typescript
export default async function RequestStatusPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const session = await requireAppSession();
  if (!(await canAccessRequest(session, requestId))) notFound();
```

**Safe page layout pattern** (lines 40-56):
```tsx
return (
  <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
    <PageHeader title="Đã gửi yêu cầu" description="Trạng thái do hệ thống xử lý cập nhật. Bạn không cần thao tác thêm ở bước này." />

    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Mã hồ sơ</p>
          <h1 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{request.id}</h1>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
```

**Do not copy unsafe internal query:** `src/app/specialist/requests/[requestId]/page.tsx` lines 56-68 select `storageKey`, all versions, and `generatedContent`; customer page must use delivery service safe DTO instead.
```typescript
vaultFiles: { select: { id: true, filename: true, storageKey: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
documents: {
  select: {
    id: true,
    documentVersions: {
      select: {
        id: true,
        templateId: true,
        templateVersion: true,
        status: true,
        generatedContent: true,
        createdAt: true,
```

---

### `src/app/api/vault/[vaultFileId]/download/route.ts` (route, request-response + file-I/O)

**Analog:** no existing `src/app/api/**/route.ts`; combine Next route-handler research with vault-service access patterns.

**Session + vault access pattern** from `src/lib/documents/vault-service.ts` lines 121-139:
```typescript
export async function requestVaultFileAccess(
  session: AppSession,
  vaultFileId: string,
  correlationId?: string,
): Promise<RequestVaultFileAccessResult> {
  if (!(await canAccessVaultFile(session, vaultFileId))) throw new Error('FORBIDDEN');

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: {
      id: true,
      requestId: true,
      workspaceId: true,
      filename: true,
    },
  });

  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');
```

**Signed URL TTL + audit pattern** from `src/lib/documents/vault-service.ts` lines 141-157:
```typescript
const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
const accessUrl = `/api/vault/${vaultFileId}/download?token=stub&expires=${expiresAt.getTime()}`;

await recordAuditEvent({
  actorId: session.userId,
  workspaceId: vaultFile.workspaceId,
  action: 'vault.access_requested',
  targetType: 'VAULT_FILE',
  targetId: vaultFileId,
  requestId: vaultFile.requestId,
  correlationId: correlationId ?? `vault-access-${vaultFileId}`,
  metadataSummary: `vaultFileId=${vaultFileId}; action=access_request`,
});

return { accessUrl, expiresAt };
```

**Route handler signature** from research lines 240-246:
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ vaultFileId: string }> },
) {
  const { vaultFileId } = await params;
  // require session, validate final-document visibility, audit, return Response/redirect
}
```

**Extra required check:** after `canAccessVaultFile()`, verify customer request creator/workspace and `DocumentVersion.status === 'final'`; `canAccessVaultFile()` alone only delegates to request access.

---

### `src/lib/delivery/delivery-service.ts` (service, CRUD + request-response)

**Analog:** `src/lib/documents/draft-service.ts`

**Imports pattern** (lines 1-7):
```typescript
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest } from '@/lib/security/rbac';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import { getTemplatesForGeneration } from './template-service';
import type { AppSession } from '@/lib/security/session';
```

**Role/assignment authorization pattern** (lines 55-72):
```typescript
const request = await prisma.legalRequest.findUnique({
  where: { id: requestId },
  select: {
    id: true,
    workspaceId: true,
    status: true,
    assignedSpecialistId: true,
  },
});

if (!request) throw new Error('REQUEST_NOT_FOUND');

const isAssignedSpecialist = request.assignedSpecialistId === session.userId;
const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');

if (!isAssignedSpecialist && !isAdmin) throw new Error('FORBIDDEN');
```

**Transaction + audit pattern** (lines 125-175):
```typescript
const docVersion = await prisma.$transaction(async (tx) => {
  const created = await tx.documentVersion.create({
    data: {
      documentId: document!.id,
      templateId: template.id,
      templateVersion: template.version,
      status: 'draft',
      inputSnapshot: {
        variables,
        intakeAnswers: intake?.answers ?? {},
        intakeAnswerLabels: intake?.answerLabels ?? {},
      },
      generatedContent,
    },
  });

  await recordAuditEvent(
    {
      actorId: session.userId,
      workspaceId: request.workspaceId,
      action: 'document.draft_generated',
      targetType: 'DOCUMENT',
      targetId: created.id,
      requestId,
      correlationId: correlationId ?? `draft-generate-${created.id}`,
      metadataSummary: `docVersionId=${created.id}; templateId=${templateId}; templateVersion=${template.version}; matterTypeKey=${template.matterTypeKey}`,
    },
    tx,
  );

  return created;
});
```

**Workflow transition pattern** (lines 282-290):
```typescript
await transitionRequestStatus({
  requestId: docVersion.document.requestId,
  actorId: session.userId,
  toStatus: 'pending_review',
  reason: transitionReason,
  correlationId: correlationId ?? `submit-review-${documentVersionId}`,
});
```

**Customer final-document query must avoid** `inputSnapshot`, `generatedContent`, `reviews`, checklist answers, and `storageKey`. Use `select` whitelist only.

---

### `src/lib/delivery/notification-service.ts` (service, event-driven)

**Analog:** `src/lib/audit/audit.ts` for small provider boundary and validation; research gives Resend call shape.

**Small service validation pattern** from `src/lib/audit/audit.ts` lines 58-66:
```typescript
export async function recordAuditEvent(input: RecordAuditEventInput, db: AuditDb = prisma) {
  if (!input.workspaceId.trim()) throw new Error('AUDIT_WORKSPACE_REQUIRED');
  if (!input.action.trim()) throw new Error('AUDIT_ACTION_REQUIRED');
  if (!input.targetId.trim()) throw new Error('AUDIT_TARGET_REQUIRED');
  if (!input.correlationId.trim()) throw new Error('AUDIT_CORRELATION_REQUIRED');
  if (input.metadataSummary != null && typeof input.metadataSummary !== 'string') throw new Error('metadataSummary must be a string');
  if (input.metadataSummary && input.metadataSummary.length > 500) throw new Error('metadataSummary must be 500 characters or fewer');
```

**Provider call shape** from research lines 321-330:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await resend.emails.send({
  from: 'Acme <onboarding@resend.dev>',
  to: ['delivered@resend.dev'],
  subject: 'Hello world',
  html: '<p>Hello</p>',
});
```

**Planning constraint:** Resend not installed in `package.json`; if no dependency/config, use minimal adapter/stub. Do not send email inside Prisma transaction.

---

### `src/lib/documents/vault-service.ts` (service, file-I/O + request-response)

**Analog:** same file.

**Metadata boundary pattern** (lines 39-63):
```typescript
// listVaultFiles: list vault files for a request without exposing storageKey
export async function listVaultFiles(
  session: AppSession,
  requestId: string,
  options?: ListVaultFilesOptions,
): Promise<VaultFileMetadata[]> {
  if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');

  const vaultFiles = await prisma.vaultFile.findMany({
    where: {
      requestId,
      ...(options?.fileKind ? { fileKind: options.fileKind } : {}),
    },
    select: {
      id: true,
      filename: true,
      fileKind: true,
      source: true,
      documentVersionId: true,
      createdAt: true,
      size: true,
      contentType: true,
      // Explicitly exclude storageKey - never return it
    },
    orderBy: { createdAt: 'desc' },
  });
```

**Store file + audit pattern** (lines 160-205):
```typescript
export async function storeVaultFile(input: StoreVaultFileInput) {
  const { session, requestId, storageKey, filename, fileKind, source, documentVersionId, size, contentType, correlationId } = input;

  if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { id: true, workspaceId: true },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');

  const vaultFile = await prisma.$transaction(async (tx) => {
    const created = await tx.vaultFile.create({
      data: {
        requestId,
        workspaceId: request.workspaceId,
        actorId: session.userId,
        filename,
        storageKey,
        fileKind: fileKind ?? null,
        source: source ?? null,
        documentVersionId: documentVersionId ?? null,
        size: size ?? null,
        contentType: contentType ?? null,
      },
    });
```

---

### `src/lib/workflow/request-workflow.ts` (service, event-driven + CRUD)

**Analog:** same file.

**Transition graph pattern** (lines 6-18):
```typescript
export const REQUEST_TRANSITIONS = {
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
} as const satisfies Record<RequestStatus, readonly RequestStatus[]>;
```

**Authorization extension point** (lines 50-56):
```typescript
if (hasRole('coordinator_admin')) {
  return ['triage', 'assigned', 'cancelled', 'closed'].includes(toStatus);
}

if (hasRole('specialist') && isAssignedSpecialist) {
  return ['in_progress', 'pending_review'].includes(toStatus);
}
```

**Conditional update + workflow audit pattern** (lines 100-136):
```typescript
return prisma.$transaction(async (tx) => {
  const updated = await tx.legalRequest.updateMany({
    where: { id: input.requestId, status: request.status },
    data: { status: input.toStatus },
  });

  if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');

  const updatedRequest = await tx.legalRequest.findUniqueOrThrow({
    where: { id: input.requestId },
    select: { id: true, status: true },
  });

  await tx.workflowTransition.create({
    data: {
      requestId: input.requestId,
      actorId: input.actorId,
      fromStatus: request.status,
      toStatus: input.toStatus,
      reason: input.reason ?? null,
    },
  });

  const auditInput = {
    actorId: input.actorId,
    workspaceId: request.workspaceId,
    action: 'request.status_changed',
    targetType: 'REQUEST' as const,
    targetId: input.requestId,
    requestId: input.requestId,
    correlationId: input.correlationId,
    metadataSummary: `${request.status} -> ${input.toStatus}`,
  };

  await recordAuditEvent(auditInput, tx);
```

---

### `src/app/specialist/requests/[requestId]/actions.ts` (server action, request-response)

**Analog:** same file + `src/app/admin/routing/actions.ts` for FormData validation.

**Thin action wrapper pattern** (lines 1-18):
```typescript
'use server';

import { requireAppSession } from '@/lib/security/session';
import { generateDraft as generateDraftService } from '@/lib/documents/draft-service';
import { submitForReview as submitForReviewService } from '@/lib/documents/draft-service';

export async function generateDraftAction(input: {
  requestId: string;
  templateId: string;
  variables: Record<string, unknown>;
}) {
  const session = await requireAppSession();
  return generateDraftService({
    session,
    requestId: input.requestId,
    templateId: input.templateId,
    variables: input.variables,
  });
}
```

**FormData reason validation pattern** from `src/app/admin/routing/actions.ts` lines 19-24 and 73-78:
```typescript
function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

async function assign(formData: FormData): Promise<RoutingActionResult> {
  const assigneeId = stringValue(formData, 'assigneeId');
  const reason = stringValue(formData, 'reason');
  if (!reason) return { ok: false, message: 'Nhập lý do phân công trước khi lưu.' };
  if (!assigneeId) return { ok: false, message: 'Chọn người xử lý trước khi lưu phân công.' };
```

**Revalidation + catch pattern** from `src/app/admin/routing/actions.ts` lines 79-94:
```typescript
try {
  const session = await requireAppSession();
  await assignRequest({
    requestId: stringValue(formData, 'requestId'),
    workspaceId: session.activeWorkspaceId || '',
    actorId: session.userId,
    kind: routingKind(stringValue(formData, 'kind')),
    assigneeId,
    reason,
    correlationId: correlationId(),
  });
  revalidatePath('/admin/routing');
  return { ok: true, message: successMessage };
} catch {
  return { ok: false, message: errorMessage };
}
```

---

### `src/lib/delivery/delivery-service.test.ts` / related tests (test, CRUD + request-response)

**Analog:** `src/lib/documents/vault-service.test.ts`

**Safe DB guard pattern** (lines 22-37):
```typescript
function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for vault service test');

  const url = new URL(databaseUrl);
  const databaseName = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run vault service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}
```

**Seed/cleanup wrapper pattern** (lines 140-149):
```typescript
async function withVaultSeed(run: (seed: VaultSeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: VaultSeed | null = null;

  try {
    seed = await seedVaultTest();
    await run(seed);
  } finally {
    await cleanupVaultTest(seed);
  }
}
```

**Assertions for storageKey secrecy + audit** (lines 213-226):
```typescript
test('requestVaultFileAccess returns access URL without storageKey', async () => {
  await withVaultSeed(async (seed) => {
    const files = await listVaultFiles(specialistSession(seed), seed.requestId);
    const vaultFileId = files[0].id;

    const result = await requestVaultFileAccess(specialistSession(seed), vaultFileId, `${seed.correlationPrefix}_access`);

    assert.ok(result.accessUrl.includes(`/api/vault/${vaultFileId}/download`));
    assert.ok(result.accessUrl.includes('token='));
    assert.ok(result.expiresAt instanceof Date);

    // Verify storageKey not in response
    assert.doesNotMatch(JSON.stringify(result), /storageKey/);
  });
});
```

## Shared Patterns

### Authentication / RBAC
**Source:** `src/lib/security/rbac.ts`
**Apply to:** customer page, download route, delivery service, close action
```typescript
export async function canAccessRequest(session: AppSession | null | undefined, requestId: string): Promise<boolean> {
  if (!requestId || !(await hasActiveUser(session))) return false;

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      workspaceId: true,
      createdById: true,
      assignedSpecialistId: true,
      assignedReviewerId: true,
    },
  });

  if (!request) return false;
  if (hasRole(session, 'super_admin')) return true;

  const typedSession = session as AppSession;
  const hasMembership = await hasActiveMembership(typedSession, request.workspaceId);
  if (!hasMembership) return false;

  if (hasRole(typedSession, 'coordinator_admin')) return true;
  if (hasRole(typedSession, 'customer') && request.createdById === typedSession.userId) return true;
  if (hasRole(typedSession, 'specialist') && request.assignedSpecialistId === typedSession.userId) return true;
  if (hasRole(typedSession, 'reviewer') && request.assignedReviewerId === typedSession.userId) return true;

  return false;
}
```

### Session loading
**Source:** `src/lib/security/session.ts`
**Apply to:** server pages, route handlers, server actions
```typescript
export async function requireAppSession(): Promise<AppSession> {
  const userId = process.env.APP_SESSION_USER_ID?.trim();
  if (!userId) throw new Error('UNAUTHENTICATED');

  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      memberships: {
        where: { isActive: true, workspace: { isActive: true } },
        select: { workspaceId: true, role: true },
        take: 1,
      },
    },
  });
```

### Audit safe metadata
**Source:** `src/lib/audit/audit.ts`
**Apply to:** download access, delivery, closure, notification outcomes
```typescript
if (input.metadataSummary && input.metadataSummary.length > 500) throw new Error('metadataSummary must be 500 characters or fewer');

return db.auditEvent.create({
  data: {
    actorId: input.actorId ?? null,
    workspaceId: input.workspaceId,
    action: input.action,
    targetType: targetTypeMap[input.targetType],
    targetId: input.targetId,
    requestId: input.requestId ?? null,
    correlationId: input.correlationId,
    metadataSummary: input.metadataSummary ?? null,
  },
});
```

### UI primitives
**Source:** `src/app/admin/components/ui.tsx`
**Apply to:** customer delivery page and internal deliver/close forms
```tsx
export function Button({ children, variant = 'primary', type = 'button', disabled = false }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-[14px] font-semibold leading-[1.4] transition focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6 ${className}`}>{children}</section>;
}
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | — | — | Every planned file has exact, role-match, or partial codebase analog. |

## Metadata

**Analog search scope:** `src/app/**`, `src/lib/**`, `prisma/schema.prisma`, Phase 06 context/research
**Files scanned:** 18
**Pattern extraction date:** 2026-05-31
