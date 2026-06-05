# Phase 3: routing - Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 7 new/modified files
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` existing `RequestAssignment`, `MatterType`, `WorkspaceMembership` | exact |
| `src/lib/routing/routing-service.ts` | service | CRUD/request-response | `src/lib/intake/intake-service.ts` | role-match |
| `src/lib/routing/routing-service.test.ts` | test | CRUD/request-response | `src/lib/intake/intake.test.ts`, `src/lib/workflow/request-workflow.test.ts` | role-match |
| `src/app/admin/routing/page.tsx` | component/page | request-response | `src/app/admin/requests/page.tsx` | exact |
| `src/app/admin/routing/actions.ts` | server action | request-response | `src/app/intake/actions.ts` | exact |
| `src/app/specialist/requests/page.tsx` | component/page | request-response | `src/app/admin/requests/page.tsx` | role-match |
| `src/app/specialist/requests/[requestId]/page.tsx` | component/page | request-response/file-I/O metadata | `src/app/requests/[requestId]/page.tsx` | exact |

## Pattern Assignments

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `prisma/schema.prisma`

**Enum/import pattern** (lines 9-34):
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

enum AssignmentKind {
  specialist
  reviewer
}
```

**Relation/timestamp/index pattern** (lines 84-98):
```prisma
model WorkspaceMembership {
  id          String    @id @default(cuid())
  userId      String
  workspaceId String
  role        Role
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User      @relation(fields: [userId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])

  @@unique([userId, workspaceId, role])
  @@index([workspaceId])
  @@index([role])
}
```

**Assignment history pattern** (lines 164-179):
```prisma
model RequestAssignment {
  id          String         @id @default(cuid())
  requestId   String
  userId      String
  kind        AssignmentKind
  reason      String?
  createdAt   DateTime       @default(now())
  createdById String
  request     LegalRequest   @relation(fields: [requestId], references: [id])
  user        User           @relation("AssignmentUser", fields: [userId], references: [id])
  createdBy   User           @relation("AssignmentCreator", fields: [createdById], references: [id])

  @@index([requestId])
  @@index([userId])
  @@index([kind])
}
```

**Apply:** add `RoutingCapability`/`UserCapability` with `workspaceId`, `userId`, `matterTypeKey`, `kind`, `isActive`, timestamps, relations, `@@unique([workspaceId, userId, matterTypeKey, kind])`, indexes matching existing style.

---

### `src/lib/routing/routing-service.ts` (service, CRUD/request-response)

**Analog:** `src/lib/intake/intake-service.ts`

**Imports pattern** (lines 0-6):
```typescript
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest, canAccessWorkspace } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import { getMatterType } from './catalog';
```

**Validation pattern** (lines 51-65):
```typescript
function validateAnswers(matterTypeKey: string, answers: IntakeAnswers): ValidationResult {
  const matterType = getMatterType(matterTypeKey);
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');

  const allowedKeys = new Set(matterType.questions.map((question) => question.key));
  for (const key of Object.keys(answers)) {
    if (!allowedKeys.has(key)) throw new Error('UNKNOWN_INTAKE_ANSWER_KEY');
  }

  const missingRequired = matterType.questions
    .filter((question) => question.required && !answers[question.key]?.trim())
    .map((question) => question.key);

  return { ok: missingRequired.length === 0, missingRequired };
}
```

**Workspace authorization + transaction + audit pattern** (lines 67-125):
```typescript
export async function createDraftIntake(input: CreateDraftInput) {
  const matterType = getMatterType(input.matterTypeKey);
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');
  if (!input.session.activeWorkspaceId) throw new Error('WORKSPACE_REQUIRED');
  if (!(await canAccessWorkspace(input.session, input.session.activeWorkspaceId))) throw new Error('FORBIDDEN');

  return prisma.$transaction(async (tx) => {
    await tx.matterType.upsert({
      where: { key: matterType.key },
      update: {
        label: matterType.label,
        description: matterType.description,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
      create: {
        key: matterType.key,
        label: matterType.label,
        description: matterType.description,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });
```

**Audit metadata summary pattern** (lines 110-122):
```typescript
await recordAuditEvent(
  {
    actorId: input.session.userId,
    workspaceId: input.session.activeWorkspaceId!,
    action: 'intake.draft_created',
    targetType: 'REQUEST',
    targetId: request.id,
    requestId: request.id,
    correlationId: input.correlationId,
    metadataSummary: `matterType=${matterType.key}; questions=${matterType.questions.length}`,
  },
  tx,
);
```

**Workflow handoff pattern** (lines 197-204):
```typescript
await transitionRequestStatus({
  requestId: input.requestId,
  actorId: input.session.userId,
  toStatus: 'intake_submitted',
  reason: 'intake submitted',
  correlationId: input.correlationId,
});
```

**Apply:** routing service must own suggestions, assignment transaction, reason validation, active user/membership filtering, append-only `RequestAssignment`, audit, and status transition through workflow only.

---

### `src/lib/routing/routing-service.test.ts` (test, CRUD/request-response)

**Analog:** `src/lib/intake/intake.test.ts`

**Executable tsx test style** (lines 0-10):
```typescript
import { getMatterQuestions, getMatterType, MATTER_CATALOG } from './catalog';

const requiredMatterKeys = ['agency_contract', 'labor_contract', 'trademark_registration', 'unsupported'];

for (const key of requiredMatterKeys) {
  const matterType = getMatterType(key);
  if (!matterType) throw new Error(`${key} matter type missing`);
  if (!matterType.label.trim()) throw new Error(`${key} Vietnamese label missing`);
  if (!matterType.schemaVersion.trim()) throw new Error(`${key} schema version missing`);
  if (matterType.questions.length === 0) throw new Error(`${key} questions missing`);
}
```

**Assertion style** (lines 17-29):
```typescript
const unsupported = getMatterType('unsupported');
if (!unsupported?.description.includes('chuyên viên phân loại')) {
  throw new Error('unsupported guidance must route to human triage');
}

const duplicateKeys = MATTER_CATALOG.map((item) => item.key).filter((key, index, keys) => keys.indexOf(key) !== index);
if (duplicateKeys.length > 0) throw new Error(`duplicate matter keys: ${duplicateKeys.join(',')}`);
```

**Apply:** use direct TypeScript script tests with `throw new Error(...)`. Cover eligibility filtering, required reason, append-only assignment history, audit summary, workflow transition behavior, specialist-only queue filtering.

---

### `src/app/admin/routing/page.tsx` (component/page, request-response)

**Analog:** `src/app/admin/requests/page.tsx`

**Imports pattern** (lines 0-3):
```typescript
import type { RequestStatus } from '@prisma/client';
import { getAllowedTransitions } from '@/lib/workflow/request-workflow';
import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';
```

**Vietnamese status copy pattern** (lines 5-17):
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

**Admin shell/page header/card/table pattern** (lines 25-66):
```typescript
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

**Required reason input pattern** (lines 48-51):
```typescript
<label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
  <span>Lý do chuyển trạng thái</span>
  <textarea className="min-h-24 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
</label>
```

**Table row + badge pattern** (lines 54-64):
```typescript
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

**Apply:** coordinator routing page should use `AdminShell`, `PageHeader`, `Card`, `Table`, `Badge`, `Button`; Vietnamese labels; server-side data loading; form posts to server actions; display suggestions only, no auto-assign.

---

### `src/app/admin/routing/actions.ts` (server action, request-response)

**Analog:** `src/app/intake/actions.ts`

**Server action imports pattern** (lines 0-5):
```typescript
'use server';

import { redirect } from 'next/navigation';
import { createDraftIntake, saveIntakeAnswers, submitIntake } from '@/lib/intake/intake-service';
import { attachIntakeFile } from '@/lib/intake/upload-service';
import { requireAppSession } from '@/lib/security/session';
```

**Correlation and FormData helper pattern** (lines 7-14):
```typescript
function correlationId() {
  return `intake-${Date.now()}`;
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}
```

**Action calls service with session pattern** (lines 60-70):
```typescript
export async function submitIntakeAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');
  const submitted = await submitIntake({
    session,
    requestId,
    correlationId: correlationId(),
  });

  redirect(`/requests/${submitted.id}`);
}
```

**Apply:** routing actions should be thin: parse `requestId`, `kind`, `assigneeId`, `reason`; get `requireAppSession`; call routing service; redirect or return small result. Do not put authorization or workflow mutation in action file.

---

### `src/app/specialist/requests/page.tsx` (component/page, request-response)

**Analog:** `src/app/admin/requests/page.tsx`

**UI import pattern** (lines 1-3):
```typescript
import { getAllowedTransitions } from '@/lib/workflow/request-workflow';
import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';
```

**Backend workflow label pattern** (lines 5-17):
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

**Table pattern** (lines 54-64):
```typescript
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

**Apply:** specialist queue query must be server-side with `assignedSpecialistId=session.userId` and active workspace membership. UI may reuse admin visual language, but access control must be query/service-owned.

---

### `src/app/specialist/requests/[requestId]/page.tsx` (component/page, request-response/file-I/O metadata)

**Analog:** `src/app/requests/[requestId]/page.tsx`

**Imports/auth pattern** (lines 0-5):
```typescript
import { notFound } from 'next/navigation';
import type { RequestStatus } from '@prisma/client';
import { Badge, Card, PageHeader } from '@/app/admin/components/ui';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';
```

**Param/session/RBAC/read pattern** (lines 21-36):
```typescript
export default async function RequestStatusPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const session = await requireAppSession();
  if (!(await canAccessRequest(session, requestId))) notFound();

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      title: true,
      status: true,
      vaultFiles: { select: { id: true, filename: true } },
      intakeSubmission: { select: { matterTypeKey: true } },
    },
  });
  if (!request) notFound();
```

**File metadata display pattern** (lines 56-74):
```typescript
<Card className="space-y-4">
  <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Thông tin hồ sơ</h2>
  <div className="rounded-xl border border-[#E2E8F0] p-4">
    <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Loại việc</p>
    <p className="text-[16px] leading-[1.5] text-[#0F172A]">{request.title}</p>
  </div>
  <div className="rounded-xl border border-[#E2E8F0] p-4">
    <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Tệp đính kèm</p>
    {request.vaultFiles.length > 0 ? (
      <ul className="mt-2 space-y-2">
        {request.vaultFiles.map((file) => (
          <li key={file.id} className="text-[16px] leading-[1.5] text-[#0F172A]">{file.filename}</li>
        ))}
      </ul>
    ) : (
      <p className="mt-2 text-[16px] leading-[1.5] text-[#475569]">Chưa có tệp đính kèm.</p>
    )}
  </div>
</Card>
```

**Apply:** specialist detail must call `requireAppSession` + `canAccessRequest`, use `notFound()` for denied/missing, show intake summary and vault file metadata only. No document drafting features.

## Shared Patterns

### Authentication and RBAC
**Source:** `src/lib/security/rbac.ts`
**Apply to:** routing service, specialist queue, specialist detail, coordinator actions
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

### Workflow transition source of truth
**Source:** `src/lib/workflow/request-workflow.ts`
**Apply to:** assignment service and UI allowed-status display
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

### Status mutation with conflict guard
**Source:** `src/lib/workflow/request-workflow.ts`
**Apply to:** any routing-owned status transition; prefer calling `transitionRequestStatus`
```typescript
const updated = await tx.legalRequest.updateMany({
  where: { id: input.requestId, status: request.status },
  data: { status: input.toStatus },
});

if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');
```

### Audit recording
**Source:** `src/lib/audit/audit.ts`
**Apply to:** matter type changes, capability changes, assignment/reassignment
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

### Admin UI visual language
**Source:** `src/app/admin/components/ui.tsx`
**Apply to:** coordinator routing page, specialist queue/detail where reused
```typescript
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

### Server action shape
**Source:** `src/app/intake/actions.ts`
**Apply to:** `src/app/admin/routing/actions.ts`
```typescript
function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function saveIntakeAnswersAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');
  const answers = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => key.startsWith('answer.') && typeof value === 'string')
      .map(([key, value]) => [key.slice('answer.'.length), String(value)]),
  );

  return saveIntakeAnswers({
    session,
    requestId,
    answers,
    correlationId: correlationId(),
  });
}
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | — | — | Existing schema/service/action/page/test patterns cover all planned files. |

## Metadata

**Analog search scope:** `prisma/schema.prisma`, `src/lib/**/*.ts`, `src/app/**/*.tsx`, `src/app/**/*.ts`
**Files scanned:** 28 TypeScript/TSX files plus Prisma schema
**Pattern extraction date:** 2026-05-28
