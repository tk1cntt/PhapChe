# Phase 2: intake - Pattern Map

**Mapped:** 2026-05-27
**Files analyzed:** 10
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` | exact |
| `src/lib/intake/catalog.ts` | utility | transform | `src/lib/workflow/request-workflow.ts` | role-match |
| `src/lib/intake/intake.ts` | service | CRUD + request-response | `src/lib/workflow/request-workflow.ts` | exact |
| `src/lib/intake/uploads.ts` | service | file-I/O + CRUD | `src/lib/security/rbac.ts` + `src/lib/audit/audit.ts` | role-match |
| `src/lib/intake/status.ts` | utility | transform | `src/app/admin/requests/page.tsx` | exact |
| `src/app/intake/page.tsx` | component/route | request-response | `src/app/admin/requests/page.tsx` | role-match |
| `src/app/intake/components.tsx` | component | request-response | `src/app/admin/components/ui.tsx` | exact |
| `src/app/requests/[requestId]/page.tsx` | route/component | request-response | `src/app/admin/requests/page.tsx` | role-match |
| `src/lib/intake/intake.test.ts` | test | transform | `src/lib/workflow/request-workflow.test.ts` | role-match |
| `src/lib/intake/intake.e2e.test.ts` | test | CRUD + file-I/O | `src/lib/foundation.e2e.test.ts` | exact |

## Pattern Assignments

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `prisma/schema.prisma`

**Enum/status pattern** (lines 17-29):
```prisma
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

**LegalRequest relation/index pattern** (lines 97-123):
```prisma
model LegalRequest {
  id                   String               @id @default(cuid())
  workspaceId          String
  title                String
  status               RequestStatus        @default(draft_intake)
  createdById          String
  assignedSpecialistId String?
  assignedReviewerId   String?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  workspace            Workspace            @relation(fields: [workspaceId], references: [id])
  createdBy            User                 @relation("RequestCreator", fields: [createdById], references: [id])
  assignedSpecialist   User?                @relation("AssignedSpecialist", fields: [assignedSpecialistId], references: [id])
  assignedReviewer     User?                @relation("AssignedReviewer", fields: [assignedReviewerId], references: [id])
  assignments          RequestAssignment[]
  documents            Document[]
  reviews              Review[]
  vaultFiles            VaultFile[]
  workflowTransitions  WorkflowTransition[]
  auditEvents          AuditEvent[]

  @@index([workspaceId])
  @@index([createdById])
  @@index([assignedSpecialistId])
  @@index([assignedReviewerId])
  @@index([status])
}
```

**VaultFile private metadata pattern** (lines 176-189):
```prisma
model VaultFile {
  id          String       @id @default(cuid())
  workspaceId String
  requestId   String
  storageKey  String
  filename    String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  workspace   Workspace    @relation(fields: [workspaceId], references: [id])
  request     LegalRequest @relation(fields: [requestId], references: [id])

  @@index([workspaceId])
  @@index([requestId])
}
```

**Apply:** Add intake response/model relations with `requestId @unique`, `schemaVersion`, `matterTypeKey`, `answers Json`, indexes. Do not add public URL fields.

---

### `src/lib/intake/catalog.ts` (utility, transform)

**Analog:** `src/lib/workflow/request-workflow.ts`

**Typed constant map pattern** (lines 6-18):
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

**Pure getter pattern** (lines 20-22):
```typescript
export function getAllowedTransitions(status: RequestStatus): RequestStatus[] {
  return [...REQUEST_TRANSITIONS[status]];
}
```

**Apply:** Define seeded matter catalog/questions as `as const`; export pure lookup helpers returning copies/snapshots. Include Vietnamese labels and stable keys for `agency_contract`, `labor_contract`, `trademark_registration`, `unsupported`.

---

### `src/lib/intake/intake.ts` (service, CRUD + request-response)

**Analog:** `src/lib/workflow/request-workflow.ts`

**Imports pattern** (lines 0-4):
```typescript
import type { LegalRequest, RequestStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';
```

**Validation/auth/error pattern** (lines 86-99):
```typescript
if (!request) throw new Error('REQUEST_NOT_FOUND');

const actor: AppSession = {
  userId: input.actorId,
  activeWorkspaceId: request.workspaceId,
  roles: request.workspace.memberships.map((membership) => membership.role),
};

const allowedTransitions = getAllowedTransitions(request.status);

if (!allowedTransitions.includes(input.toStatus)) throw new Error('INVALID_REQUEST_TRANSITION');
if (!(await canAccessRequest(actor, input.requestId))) throw new Error('FORBIDDEN');
if (!canTransitionRequestStatus(actor, request, input.toStatus)) throw new Error('FORBIDDEN');
```

**Transaction + audit pattern** (lines 100-137):
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

  return updatedRequest;
});
```

**Workflow submit call pattern** (research lines 281-291):
```typescript
await transitionRequestStatus({
  requestId,
  actorId: session.userId,
  toStatus: 'intake_submitted',
  reason: 'intake submitted',
  correlationId,
});
```

**Apply:** Create draft request, save structured answers, submit via `transitionRequestStatus`. Required validation must run before submit. Unsupported triage must not use direct status update.

---

### `src/lib/intake/uploads.ts` (service, file-I/O + CRUD)

**Analog:** `src/lib/security/rbac.ts` + `src/lib/audit/audit.ts` + `prisma/schema.prisma`

**RBAC request guard pattern** (`src/lib/security/rbac.ts` lines 38-64):
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

**Audit writer pattern** (`src/lib/audit/audit.ts` lines 54-74):
```typescript
export async function recordAuditEvent(input: RecordAuditEventInput, db: AuditDb = prisma) {
  if (!input.workspaceId.trim()) throw new Error('AUDIT_WORKSPACE_REQUIRED');
  if (!input.action.trim()) throw new Error('AUDIT_ACTION_REQUIRED');
  if (!input.targetId.trim()) throw new Error('AUDIT_TARGET_REQUIRED');
  if (!input.correlationId.trim()) throw new Error('AUDIT_CORRELATION_REQUIRED');
  if (input.metadataSummary != null && typeof input.metadataSummary !== 'string') throw new Error('metadataSummary must be a string');
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
}
```

**VaultFile create data shape** (`src/lib/foundation.e2e.test.ts` lines 127-134):
```typescript
const vaultFile = await prisma.vaultFile.create({
  data: {
    workspaceId: workspace.id,
    requestId: request.id,
    storageKey: `${FOUNDATION_E2E_PREFIX}/${suffix}/contract.pdf`,
    filename: `contract-${suffix}.pdf`,
  },
});
```

**Apply:** Load request server-side after `canAccessRequest`; use request workspaceId, generated private `storageKey`, `filename`/size summary only. No public URL. Audit `file.uploaded` with identifiers/filename only.

---

### `src/lib/intake/status.ts` (utility, transform)

**Analog:** `src/app/admin/requests/page.tsx`

**Status map pattern** (lines 5-17):
```typescript
const statusLabels: Record<RequestStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Nháp tiếp nhận', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi tiếp nhận', tone: 'info' },
  triage: { label: 'Đang phân loại', tone: 'warning' },
  assigned: { label: 'Đã phân công', tone: 'info' },
  in_progress: { label: 'Đang xử lý', tone: 'info' },
  pending_review: { label: 'Chờ review', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa', tone: 'destructive' },
  approved: { label: 'Đã duyệt', tone: 'accent' },
  delivered: { label: 'Đã giao', tone: 'outline' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'destructive' },
};
```

**Apply:** Create customer-facing Vietnamese status labels: `draft_intake` = `Đang nhập thông tin`, `intake_submitted` = `Đã gửi yêu cầu`, `triage` = `Cần chuyên viên phân loại`. Include next-step guidance body. Never display raw enum.

---

### `src/app/intake/page.tsx` (component/route, request-response)

**Analog:** `src/app/admin/requests/page.tsx`

**Imports pattern** (lines 0-3):
```typescript
import type { RequestStatus } from '@prisma/client';
import { getAllowedTransitions } from '@/lib/workflow/request-workflow';
import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';
```

**Page composition pattern** (lines 25-65):
```tsx
export default function RequestsPage() {
  const allowedTransitions = getAllowedTransitions(sampleStatus);

  return (
    <AdminShell>
      <PageHeader
        title="Hồ sơ yêu cầu"
        description="Trạng thái hồ sơ được hiển thị từ backend-owned workflow, không chỉnh sửa trực tiếp bằng raw dropdown."
        action={<Button>Tạo hồ sơ yêu cầu</Button>}
      />

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2]">Chuyển trạng thái hợp lệ</h2>
        <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
          Trạng thái này chỉ có thể thay đổi qua quy trình hợp lệ trên máy chủ.
        </p>
```

**Form field style pattern** (lines 48-50):
```tsx
<label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
  <span>Lý do chuyển trạng thái</span>
  <textarea className="min-h-24 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
</label>
```

**Apply:** Build customer route without AdminShell sidebar. Mirror PageHeader/Card/Button style. Use server actions/forms for create/save/submit. UI flow: service selection -> questions -> upload -> review.

---

### `src/app/intake/components.tsx` (component, request-response)

**Analog:** `src/app/admin/components/ui.tsx`

**Button pattern** (lines 11-35):
```tsx
const buttonStyles = {
  primary: 'bg-[#0F766E] text-white shadow-sm hover:bg-teal-800 hover:shadow',
  secondary: 'bg-white text-[#0F172A] border border-[#CBD5E1] shadow-sm hover:bg-[#F8FAFC] hover:border-[#94A3B8]',
  destructive: 'bg-[#DC2626] text-white shadow-sm hover:bg-red-700 hover:shadow',
  ghost: 'bg-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]',
} as const;

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
```

**Badge/Card/PageHeader pattern** (lines 37-78):
```tsx
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof badgeStyles }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[13px] font-semibold leading-[1.3] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${badgeStyles[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6 ${className}`}>{children}</section>;
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white/80 p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="space-y-2">
        <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#0F172A]">{title}</h1>
        <p className="max-w-3xl text-[16px] font-normal leading-[1.6] text-[#475569]">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
```

**Apply:** Prefer importing existing primitives if path acceptable. If decomposing customer components, copy exact color/spacing/focus patterns. Service cards must be keyboard reachable and accent-selected.

---

### `src/app/requests/[requestId]/page.tsx` (route/component, request-response)

**Analog:** `src/app/admin/requests/page.tsx` + `src/lib/security/rbac.ts`

**Read-only status UI pattern** (`src/app/admin/requests/page.tsx` lines 54-63):
```tsx
<Table headers={['Mã hồ sơ', 'Workspace', 'Trạng thái', 'Thao tác hợp lệ']}>
  {requests.map((request) => (
    <tr key={request.code} className="hover:bg-[#F1F5F9]">
      <td className="whitespace-nowrap px-4 py-3 text-[16px] font-normal leading-[1.5]">{request.code}</td>
      <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{request.workspace}</td>
      <td className="whitespace-nowrap px-4 py-3"><Badge tone={statusLabels[request.status].tone}>{statusLabels[request.status].label}</Badge></td>
      <td className="px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">Dùng getAllowedTransitions(status) trước khi render nút chuyển trạng thái.</td>
    </tr>
  ))}
</Table>
```

**Access guard source** (`src/lib/security/rbac.ts` lines 38-40):
```typescript
export async function canAccessRequest(session: AppSession | null | undefined, requestId: string): Promise<boolean> {
  if (!requestId || !(await hasActiveUser(session))) return false;
```

**Apply:** Server-load request by route param; call `canAccessRequest` before rendering. Render `StatusCard` only, no mutation controls. Use customer status map from `src/lib/intake/status.ts`.

---

### `src/lib/intake/intake.test.ts` (test, transform)

**Analog:** `src/lib/workflow/request-workflow.test.ts`

**Type coverage pattern** (lines 0-8):
```typescript
import type { RequestStatus } from '@prisma/client';
import { getAllowedTransitions, REQUEST_TRANSITIONS } from './request-workflow';

type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type TransitionStatus = keyof typeof REQUEST_TRANSITIONS;
type _AllStatusesCovered = Assert<Equal<TransitionStatus, RequestStatus>>;
```

**Pure assertion loop pattern** (lines 23-37):
```typescript
for (const status of Object.keys(expectedTransitions) as RequestStatus[]) {
  const allowed = getAllowedTransitions(status);

  if (Object.is(allowed, REQUEST_TRANSITIONS[status])) {
    throw new Error(`${status} returned mutable transition source`);
  }

  if (allowed.join(',') !== expectedTransitions[status].join(',')) {
    throw new Error(`${status} transitions mismatch`);
  }
}
```

**Apply:** Unit-test catalog required fields, unsupported option, answer validation, status label coverage, immutable returned arrays/snapshots.

---

### `src/lib/intake/intake.e2e.test.ts` (test, CRUD + file-I/O)

**Analog:** `src/lib/foundation.e2e.test.ts`

**Imports/test framework pattern** (lines 0-8):
```typescript
import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { createAdminUser, updateAdminUserRole, deactivateAdminUser, assignUserToWorkspace } from '@/lib/admin/users';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessDocument, canAccessRequest, canAccessReview, canAccessVaultFile, canAccessWorkspace } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';
import { getAllowedTransitions, transitionRequestStatus } from '@/lib/workflow/request-workflow';
```

**Safe DB guard pattern** (lines 29-44):
```typescript
function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for foundation e2e test');

  const url = new URL(databaseUrl);
  const databaseName = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run foundation e2e test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}
```

**Seed/cleanup pattern** (lines 46-89, 154-186):
```typescript
async function seedFoundationE2E(): Promise<FoundationSeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const correlationPrefix = `${FOUNDATION_E2E_PREFIX}_${suffix}`;
  const workspace = await prisma.workspace.create({
    data: {
      name: `Foundation E2E ${suffix}`,
      slug: `${FOUNDATION_E2E_PREFIX}-${suffix}`,
    },
  });

  const [customer, specialist, reviewer, coordinatorAdmin, superAdmin] = await Promise.all(
    (['customer', 'specialist', 'reviewer', 'coordinator_admin', 'super_admin'] as const).map((role) =>
      prisma.user.create({
        data: {
          email: `${FOUNDATION_E2E_PREFIX}_${role}_${suffix}@example.test`,
          name: `Foundation E2E ${role}`,
          memberships: {
            create: {
              workspaceId: workspace.id,
              role,
            },
          },
        },
      }),
    ),
  );
```

```typescript
async function cleanupFoundationE2E(seed: FoundationSeed | null) {
  if (!seed) return;

  // Cleanup stays scoped to seeded ids/prefix; broad model-wide deletes are forbidden.
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { workspaceId: seed.workspaceId },
        { targetId: { in: [seed.workspaceId, seed.requestId, seed.documentId, seed.reviewId, seed.vaultFileId, ...seed.userIds] } },
        { correlationId: { startsWith: seed.correlationPrefix } },
      ],
    },
  });
```

**Session pattern** (lines 220-228):
```typescript
function sessions(seed: FoundationSeed) {
  return {
    customer: { userId: seed.customerId, activeWorkspaceId: seed.workspaceId, roles: ['customer'] } satisfies AppSession,
    specialist: { userId: seed.specialistId, activeWorkspaceId: seed.workspaceId, roles: ['specialist'] } satisfies AppSession,
    reviewer: { userId: seed.reviewerId, activeWorkspaceId: seed.workspaceId, roles: ['reviewer'] } satisfies AppSession,
    coordinator: { userId: seed.coordinatorAdminId, activeWorkspaceId: seed.workspaceId, roles: ['coordinator_admin'] } satisfies AppSession,
    superAdmin: { userId: seed.superAdminId, activeWorkspaceId: seed.workspaceId, roles: ['super_admin'] } satisfies AppSession,
    unrelated: { userId: seed.unrelatedUserId, activeWorkspaceId: null, roles: ['customer'] } satisfies AppSession,
  };
}
```

**Apply:** E2E should verify draft creation, answer persistence with schemaVersion, submit transition/audit, unsupported triage path, upload authorization, cross-tenant denial, no public URL fields.

## Shared Patterns

### Authentication/RBAC
**Source:** `src/lib/security/rbac.ts`
**Apply to:** intake create/save/submit/upload/status read
```typescript
if (!requestId || !(await hasActiveUser(session))) return false;
...
if (hasRole(typedSession, 'customer') && request.createdById === typedSession.userId) return true;
```

### Workflow integrity
**Source:** `src/lib/workflow/request-workflow.ts`
**Apply to:** submit intake, unsupported triage marking
```typescript
if (!allowedTransitions.includes(input.toStatus)) throw new Error('INVALID_REQUEST_TRANSITION');
if (!(await canAccessRequest(actor, input.requestId))) throw new Error('FORBIDDEN');
if (!canTransitionRequestStatus(actor, request, input.toStatus)) throw new Error('FORBIDDEN');
```

### Audit safety
**Source:** `src/lib/audit/audit.ts`
**Apply to:** request created, answers saved/submitted, file uploaded, triage marked
```typescript
if (input.metadataSummary && input.metadataSummary.length > 500) throw new Error('metadataSummary must be 500 characters or fewer');
```
Audit metadata must use ids, matter type key, counts, filenames/hashes only. No legal answer text.

### UI primitives and focus
**Source:** `src/app/admin/components/ui.tsx`
**Apply to:** customer intake components/status page
```tsx
className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-[14px] font-semibold leading-[1.4] transition focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyles[variant]}`}
```

### Test safety
**Source:** `src/lib/foundation.e2e.test.ts`
**Apply to:** intake e2e
```typescript
assert.ok(safe, `Refusing to run foundation e2e test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | Existing foundation has close analogs for UI, workflow, RBAC, audit, schema, tests. |

## Metadata

**Analog search scope:** `src/**/*.ts`, `src/**/*.tsx`, `prisma/schema.prisma`
**Files scanned:** 16 source files + Prisma schema
**Pattern extraction date:** 2026-05-27
