# Phase 07: ops - Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 4
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/admin/ops/page.tsx` | component/page | request-response | `src/app/admin/routing/page.tsx` | exact |
| `src/app/admin/ops/[requestId]/page.tsx` | component/page | request-response | `src/app/admin/audit/page.tsx` | role-match |
| `src/lib/ops/ops-service.ts` | service | CRUD/transform | `src/lib/routing/routing-service.ts` | exact |
| `src/lib/ops/ops-service.test.ts` | test | batch/transform | `src/lib/routing/routing-service.test.ts` | role-match |
| `src/app/admin/components/admin-shell.tsx` | component/layout | request-response | `src/app/admin/components/admin-shell.tsx` | modify-existing |

## Pattern Assignments

### `src/app/admin/ops/page.tsx` (component/page, request-response)

**Analog:** `src/app/admin/routing/page.tsx`

**Imports pattern** (lines 0-6):
```typescript
import type { AssignmentKind, RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getRoutingSuggestions, listRoutingCapabilities, listRoutingMatterTypes, requireRoutingAdmin } from '@/lib/routing/routing-service';
import { requireAppSession } from '@/lib/security/session';
import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';
import { assignRequestAction, saveCapabilityAction, saveMatterTypeAction } from './actions';
```

For ops, copy the same server-page import style but replace routing imports with `@/lib/ops/ops-service`; do not introduce client-side state or chart dependencies.

**Server auth/session + data load pattern** (lines 91-118):
```typescript
export default async function RoutingPage() {
  const session = await requireAppSession();
  const workspaceId = session.activeWorkspaceId || '';
  await requireRoutingAdmin(workspaceId, session.userId);

  const [requests, matterTypes, capabilities, members] = await Promise.all([
    prisma.legalRequest.findMany({
      where: { workspaceId, status: { in: ['intake_submitted', 'triage', 'assigned'] } },
      select: {
        id: true,
        title: true,
        status: true,
        createdBy: { select: { name: true, email: true } },
        assignedSpecialist: { select: { name: true, email: true } },
        assignedReviewer: { select: { name: true, email: true } },
        intakeSubmission: { select: { matterTypeKey: true, matterType: { select: { label: true } } } },
      },
      orderBy: [{ updatedAt: 'desc' }],
    }),
    listRoutingMatterTypes(workspaceId),
    listRoutingCapabilities(workspaceId),
    prisma.workspaceMembership.findMany({
      where: { workspaceId, role: { in: ['specialist', 'reviewer'] }, isActive: true, user: { isActive: true } },
      select: { userId: true, role: true, user: { select: { name: true, email: true } } },
      orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
    }),
  ]);
```

**UI card/table pattern** (lines 120-154):
```typescript
return (
  <AdminShell>
    <PageHeader title="Điều phối yêu cầu pháp lý" description="Xem yêu cầu đã gửi hoặc cần triage, kiểm tra gợi ý phù hợp và phân công người xử lý." />

    <Card className="space-y-4">
      <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Hàng chờ điều phối</h2>
      {requests.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
          <h3 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Chưa có yêu cầu cần điều phối</h3>
          <p className="mt-2 text-[16px] font-normal leading-[1.5] text-[#475569]">Khi khách hàng gửi yêu cầu mới hoặc yêu cầu cần triage, hồ sơ sẽ xuất hiện tại đây để điều phối viên phân công.</p>
        </div>
      ) : (
        <Table headers={routingHeaders}>
          {requests.map((request, index) => {
            const suggestions = suggestionRows[index] || { specialists: [], reviewers: [] };
            return (
              <tr key={request.id} className="align-top hover:bg-[#F1F5F9]">
```

Use the same `AdminShell` + `PageHeader` + `Card` + `Table` structure for metric cards, filter form, request list, and workload table.

**Status label pattern** (lines 8-20):
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

---

### `src/app/admin/ops/[requestId]/page.tsx` (component/page, request-response)

**Analog:** `src/app/admin/audit/page.tsx`

**Imports pattern** (lines 0-1):
```typescript
import { AdminShell } from '../components/admin-shell';
import { Badge, Card, PageHeader, Table } from '../components/ui';
```

For dynamic route, adjust relative path to `../../components/...` or use existing alias style if project standard permits.

**Safe audit/timeline UI pattern** (lines 24-52):
```typescript
export default function AuditPage() {
  return (
    <AdminShell>
      <PageHeader
        title="Audit"
        description="Dòng thời gian thao tác quan trọng chỉ hiển thị định danh, action, mã tương quan và tóm tắt metadata an toàn."
      />

      <Card>
        <p className="text-[14px] font-normal leading-[1.4] text-[#475569]">
          Không hiển thị nội dung pháp lý thô trong audit; dùng metadataSummary, identifier hoặc hash khi cần truy vết.
        </p>
      </Card>

      <Table headers={['Thời gian', 'Actor', 'Workspace', 'Hành động', 'Đối tượng', 'Mã tương quan', 'Tóm tắt metadata']}>
        {auditEvents.map((event) => (
          <tr key={event.correlationId} className="hover:bg-[#F1F5F9]">
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{event.time}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{event.actor}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{event.workspace}</td>
            <td className="whitespace-nowrap px-4 py-3"><Badge tone="info">{event.action}</Badge></td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{event.target}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{event.correlationId}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{event.metadataSummary}</td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
```

Copy the safe metadata warning and table columns. Replace fixture `auditEvents` with service DTO from `getOpsRequestTimeline`.

---

### `src/lib/ops/ops-service.ts` (service, CRUD/transform)

**Analog:** `src/lib/routing/routing-service.ts`

**Imports pattern** (lines 0-3):
```typescript
import type { AssignmentKind, Prisma, RequestStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { getAllowedTransitions } from '@/lib/workflow/request-workflow';
```

For ops, import `Role`, `RequestStatus`, `Prisma` as needed; likely no `recordAuditEvent` because ops is read-only visibility.

**Input validation helpers** (lines 70-78):
```typescript
function requireText(value: string, errorCode: string) {
  if (!value.trim()) throw new Error(errorCode);
  return value.trim();
}

function requireRoutingKind(kind: AssignmentKind) {
  if (kind !== 'specialist' && kind !== 'reviewer') throw new Error('ROUTING_KIND_INVALID');
  return kind;
}
```

Copy `requireText` style for workspace/request IDs and add allowlist parsers for status/date/user filters.

**Admin authorization pattern** (lines 102-111):
```typescript
export async function requireRoutingAdmin(workspaceId: string, actorId: string) {
  const scopedWorkspaceId = requireText(workspaceId, 'WORKSPACE_REQUIRED');
  const scopedActorId = requireText(actorId, 'ACTOR_REQUIRED');
  const authorizedRoles: Role[] = ['coordinator_admin', 'super_admin'];
  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId: scopedWorkspaceId, userId: scopedActorId, role: { in: authorizedRoles }, isActive: true, user: { isActive: true }, workspace: { isActive: true } },
    select: { id: true },
  });
  if (!membership) throw new Error('FORBIDDEN');
}
```

Create `requireOpsAdmin` using this exact role list and active membership constraints.

**Prisma scoped list pattern** (lines 165-177):
```typescript
export async function listRoutingMatterTypes(workspaceId?: string) {
  return prisma.matterType.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: [{ label: 'asc' }, { key: 'asc' }],
  });
}

export async function listRoutingCapabilities(workspaceId: string) {
  return db.routingCapability.findMany({
    where: { workspaceId: requireText(workspaceId, 'WORKSPACE_REQUIRED') },
    include: { user: true, matterType: true },
    orderBy: [{ matterTypeKey: 'asc' }, { kind: 'asc' }, { user: { name: 'asc' } }, { userId: 'asc' }],
  });
}
```

Use same scoped `where` and deterministic `orderBy` style for filters, request list, workload source lists.

**Atomic write pattern to avoid for ops read service** (lines 269-312):
```typescript
return prisma.$transaction(async (tx) => {
  let currentStatus = request.status;
  for (let index = 1; index < path.length; index += 1) {
    const nextStatus = path[index];
    const updated = await tx.legalRequest.updateMany({
      where: { id: requestId, status: currentStatus },
      data: { status: nextStatus },
    });
    if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');

    await tx.workflowTransition.create({
      data: { requestId, actorId, fromStatus: currentStatus, toStatus: nextStatus, reason },
    });
    currentStatus = nextStatus;
  }
```

Phase 7 ops service should not mutate status or assignments; use this only as evidence that workflow changes are backend-owned and already audited.

**Workflow transition source for SLA/current status age** from `src/lib/workflow/request-workflow.ts` (lines 113-121):
```typescript
await tx.workflowTransition.create({
  data: {
    requestId: input.requestId,
    actorId: input.actorId,
    fromStatus: request.status,
    toStatus: input.toStatus,
    reason: input.reason ?? null,
  },
});
```

Use `WorkflowTransition.createdAt` as the source for status-age milestones rather than `LegalRequest.updatedAt`.

**Safe audit DTO constraints** from `src/lib/audit/audit.ts` (lines 58-77):
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

Timeline service should select and return only these safe fields plus workflow transition status/reason identifiers.

**Schema fields to query** from `prisma/schema.prisma`:
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
  workflowTransitions  WorkflowTransition[]
  auditEvents          AuditEvent[]

  @@index([workspaceId])
  @@index([assignedSpecialistId])
  @@index([assignedReviewerId])
  @@index([status])
}
```

```prisma
model WorkflowTransition {
  id          String       @id @default(cuid())
  requestId   String
  fromStatus  RequestStatus
  toStatus    RequestStatus
  actorId     String
  reason      String?
  metadata    Json?
  createdAt   DateTime     @default(now())

  @@index([requestId])
  @@index([actorId])
  @@index([fromStatus, toStatus])
}
```

```prisma
model AuditEvent {
  id              String          @id @default(cuid())
  actorId         String?
  workspaceId     String
  action          String
  targetType      AuditTargetType
  targetId        String
  requestId       String?
  correlationId   String?
  metadataSummary String?
  createdAt       DateTime        @default(now())

  @@index([workspaceId])
  @@index([requestId])
  @@index([targetType, targetId])
  @@index([correlationId])
}
```

---

### `src/lib/ops/ops-service.test.ts` (test, batch/transform)

**Analog:** `src/lib/routing/routing-service.test.ts`

**Imports/source inspection pattern** (lines 0-7):
```typescript
import { readFileSync } from 'node:fs';
import { assignRequest, getRoutingSuggestions, upsertMatterType, upsertRoutingCapability } from './routing-service';

const source = readFileSync(new URL('./routing-service.ts', import.meta.url), 'utf8');

function mustInclude(value: string, message: string) {
  if (!source.includes(value)) throw new Error(message);
}
```

Use this lightweight node test style if service behavior is hard to run without DB. Prefer checking exported functions and security-sensitive strings.

**Security invariant assertions** (lines 15-35):
```typescript
mustInclude('ASSIGNMENT_REASON_REQUIRED', 'missing required assignment reason guard');
mustInclude('coordinator_admin', 'assignment must authorize coordinator admin');
mustInclude('super_admin', 'assignment must authorize super admin');
mustInclude('assignedSpecialistId', 'specialist assignment must update LegalRequest.assignedSpecialistId');
mustInclude('assignedReviewerId', 'reviewer assignment must update LegalRequest.assignedReviewerId');
mustInclude('requestAssignment.create', 'assignment must append RequestAssignment history');
mustInclude('request.assigned', 'assignment must write request.assigned audit event');
mustInclude('targetType: \'ASSIGNMENT\'', 'assignment audit target must be ASSIGNMENT');
mustInclude('reasonProvided=true', 'assignment audit summary must include reason presence');
mustInclude('metadataSummary', 'assignment audit summary required');
mustInclude('slice(0, 160)', 'assignment audit reason must be shortened');
mustInclude('metadata.length > 500', 'assignment audit summary must enforce safe length');
mustInclude("['intake_submitted', 'triage', 'assigned']", 'intake_submitted assignment must progress through triage to assigned');
mustInclude("['triage', 'assigned']", 'triage assignment must progress to assigned');
mustInclude('workflowTransition.create', 'assignment must create WorkflowTransition rows inside transaction');
mustInclude('updateMany', 'assignment status writes must use conflict guard updateMany');
mustInclude('updated.count !== 1', 'assignment status writes must check conflict guard count');
mustInclude('routingCapability.findFirst', 'assignment must validate matching active RoutingCapability');
mustInclude('workspaceMembership.findFirst', 'assignment must validate active assignee membership');
mustInclude('user: { isActive: true }', 'assignment must validate active assignee user');
mustInclude('prisma.$transaction', 'assignment writes must be atomic');
```

For ops tests, assert strings such as `coordinator_admin`, `super_admin`, `workspaceMembership.findFirst`, `legalRequest.groupBy`, `assignedSpecialistId`, `assignedReviewerId`, `workflowTransition.findMany`, `auditEvent.findMany`, `metadataSummary`, and absence of sensitive fields (`generatedContent`, `storageKey`, `generalComment`).

**Fixture-style safety checks** (lines 47-65):
```typescript
const behaviorFixtures = {
  requiredReasonCode: 'ASSIGNMENT_REASON_REQUIRED',
  reassignmentHistoryRows: 2,
  sensitiveAnswerText: 'Mức chiết khấu bí mật 37%',
  safeMetadata: 'kind=specialist; assignee=user_1; request=req_1; matter=agency_contract; reasonProvided=true; reason=Đủ năng lực',
  rollbackOriginalStatus: 'intake_submitted',
  rollbackNoAssigneeField: null as string | null,
  rollbackAssignmentRows: 0,
  rollbackAuditRows: 0,
};

if (behaviorFixtures.requiredReasonCode !== 'ASSIGNMENT_REASON_REQUIRED') throw new Error('reason code fixture mismatch');
if (behaviorFixtures.reassignmentHistoryRows < 2) throw new Error('reassignment must assert at least two RequestAssignment rows');
if (behaviorFixtures.safeMetadata.includes(behaviorFixtures.sensitiveAnswerText)) throw new Error('metadataSummary must not contain sensitive answer fixture text');
if (behaviorFixtures.safeMetadata.length > 500) throw new Error('metadataSummary must be <= 500 chars');
```

Copy this style for timeline safety fixtures: safe metadata must not include raw legal content, review comments, generated document content, or vault storage keys.

---

### `src/app/admin/components/admin-shell.tsx` (component/layout, request-response)

**Analog:** same file, modify existing navigation

**Nav item pattern** (lines 0-8):
```typescript
import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/workspaces', label: 'Workspace' },
  { href: '/admin/requests', label: 'Hồ sơ yêu cầu' },
  { href: '/admin/audit', label: 'Audit' },
];
```

Add one item such as `{ href: '/admin/ops', label: 'Vận hành' }` using the same object shape.

**Permission warning pattern** (lines 38-40):
```typescript
<p className="mt-4 border-t border-[#E2E8F0] pt-3 text-[13px] font-normal leading-[1.5] text-[#64748B]">
  Ẩn mục điều hướng chỉ là UX; server vẫn enforce permissions theo D-07.
</p>
```

Keep this warning; ops authorization must live in service/page, not nav hiding.

## Shared Patterns

### Authentication and admin authorization
**Source:** `src/lib/security/session.ts` lines 10-34 and `src/lib/routing/routing-service.ts` lines 102-111  
**Apply to:** `src/app/admin/ops/page.tsx`, `src/app/admin/ops/[requestId]/page.tsx`, `src/lib/ops/ops-service.ts`

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

  const membership = user?.memberships[0];
  if (!user || !membership) throw new Error('UNAUTHENTICATED');

  return {
    userId: user.id,
    activeWorkspaceId: membership.workspaceId,
    roles: [membership.role],
  };
}
```

```typescript
const authorizedRoles: Role[] = ['coordinator_admin', 'super_admin'];
const membership = await prisma.workspaceMembership.findFirst({
  where: { workspaceId: scopedWorkspaceId, userId: scopedActorId, role: { in: authorizedRoles }, isActive: true, user: { isActive: true }, workspace: { isActive: true } },
  select: { id: true },
});
if (!membership) throw new Error('FORBIDDEN');
```

### RBAC request access boundary
**Source:** `src/lib/security/rbac.ts` lines 38-64  
**Apply to:** request-specific timeline service

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

### Admin UI primitives
**Source:** `src/app/admin/components/ui.tsx` lines 25-78  
**Apply to:** all ops pages

```typescript
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6 ${className}`}>{children}</section>;
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-[#F8FAFC]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap border-b border-[#E2E8F0] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] leading-[1.4] text-[#64748B]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] bg-white">{children}</tbody>
      </table>
    </div>
  );
}
```

### Safe audit metadata only
**Source:** `src/app/admin/audit/page.tsx` lines 27-35 and `src/lib/audit/audit.ts` lines 63-64  
**Apply to:** timeline service and page

```typescript
<PageHeader
  title="Audit"
  description="Dòng thời gian thao tác quan trọng chỉ hiển thị định danh, action, mã tương quan và tóm tắt metadata an toàn."
/>

<Card>
  <p className="text-[14px] font-normal leading-[1.4] text-[#475569]">
    Không hiển thị nội dung pháp lý thô trong audit; dùng metadataSummary, identifier hoặc hash khi cần truy vết.
  </p>
</Card>
```

```typescript
if (input.metadataSummary != null && typeof input.metadataSummary !== 'string') throw new Error('metadataSummary must be a string');
if (input.metadataSummary && input.metadataSummary.length > 500) throw new Error('metadataSummary must be 500 characters or fewer');
```

### Backend-owned workflow transitions
**Source:** `src/lib/workflow/request-workflow.ts` lines 94-107 and 113-134  
**Apply to:** SLA aging derivation and timeline

```typescript
const allowedTransitions = getAllowedTransitions(request.status);

if (!allowedTransitions.includes(input.toStatus)) throw new Error('INVALID_REQUEST_TRANSITION');
if (!(await canAccessRequest(actor, input.requestId))) throw new Error('FORBIDDEN');
if (!canTransitionRequestStatus(actor, request, input.toStatus)) throw new Error('FORBIDDEN');

return prisma.$transaction(async (tx) => {
  const updated = await tx.legalRequest.updateMany({
    where: { id: input.requestId, status: request.status },
    data: { status: input.toStatus },
  });

  if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');
```

```typescript
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
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | Existing admin pages, services, RBAC, audit, workflow, and tests provide sufficient analogs. |

## Metadata

**Analog search scope:** `src/app/admin/**/page.tsx`, `src/app/admin/components/*.tsx`, `src/lib/**/*.ts`, `prisma/schema.prisma`  
**Files scanned:** 15  
**Pattern extraction date:** 2026-06-01
