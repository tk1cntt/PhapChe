# Phase 08: reviewer-service - Pattern Map

**Mapped:** 2026-06-03
**Files analyzed:** 4 new + 2 modified
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/reviews/review-service.ts` (NEW) | service | transaction + state machine | `src/lib/documents/draft-service.ts` (submitForReview) + `src/lib/workflow/request-workflow.ts` | exact |
| `src/lib/reviews/checklist.ts` (NEW) | utility/constant | transform | `src/constants/checklist-items.ts` | exact |
| `src/app/reviewer/requests/page.tsx` (MODIFY) | component (server page) | request-response (read) | `src/app/reviewer/requests/page.tsx` (current broken) | rewrite-from-existing |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` (MODIFY) | component (server page) | request-response (read + form post) | `src/app/specialist/requests/[requestId]/page.tsx` + `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx` | exact |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts` (NEW) | action handler | request-response (form post → server action) | `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx` (calls `markDeliveredAction` / `closeDeliveredAction`) | exact |
| `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx` (NEW) | component (client form) | event-driven (form submit) | `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx` | exact |

## Pattern Assignments

### `src/lib/reviews/review-service.ts` (service, transaction + state machine)

**Primary analog:** `src/lib/documents/draft-service.ts` (`submitForReview` function, lines 244-308) — the only existing service that:
- Runs `prisma.$transaction` with multiple writes
- Calls `transitionRequestStatus`
- Calls `recordAuditEvent` inside the transaction
- Throws plain `Error` strings for failure modes

**Secondary analog:** `src/lib/workflow/request-workflow.ts` (`transitionRequestStatus` lines 66-138) — pattern for the audit + workflow + DB update atomic unit.

**Imports pattern** (from `src/lib/documents/draft-service.ts` lines 1-8):
```typescript
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest } from '@/lib/security/rbac';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import type { AppSession } from '@/lib/security/session';
```

**RBAC + load request pattern** (from `src/lib/documents/draft-service.ts` lines 247-272 — `submitForReview`):
```typescript
const docVersion = await prisma.documentVersion.findUnique({
  where: { id: documentVersionId },
  include: {
    document: {
      select: {
        id: true,
        requestId: true,
        workspaceId: true,
        request: {
          select: {
            id: true,
            status: true,
            assignedSpecialistId: true,
            assignedReviewerId: true,   // <-- reviewer-specific
          },
        },
      },
    },
  },
});

if (!docVersion) throw new Error('DOCUMENT_VERSION_NOT_FOUND');

const isAssignedReviewer = docVersion.document.request.assignedReviewerId === session.userId;
const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');
if (!isAssignedReviewer && !isAdmin) throw new Error('FORBIDDEN');
```

**Transaction + state-machine + audit pattern** (from `src/lib/documents/draft-service.ts` lines 276-306):
```typescript
const updated = await prisma.$transaction(async (tx) => {
  const updatedVersion = await tx.documentVersion.update({
    where: { id: documentVersionId },
    data: { status: 'final' },    // or 'draft' for reject
    select: { id: true, status: true },
  });

  await transitionRequestStatus({
    requestId: docVersion.document.requestId,
    actorId: session.userId,
    toStatus: 'approved',           // or 'revision_required' for reject
    reason: transitionReason,
    correlationId: correlationId ?? `review-approve-${documentVersionId}`,
  });

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: docVersion.document.workspaceId,
    action: 'review.approved',      // or 'review.rejected'
    targetType: 'REVIEW',
    targetId: reviewId,
    requestId: docVersion.document.requestId,
    correlationId: correlationId ?? `review-approve-${documentVersionId}`,
    metadataSummary: `docVersionId=${documentVersionId}; requestId=${docVersion.document.requestId}; passedCount=${passedCount}; failedCount=${failedCount}`,
  });

  return updatedVersion;
});
```

**Status check pattern** (from `src/lib/documents/draft-service.ts` line 274):
```typescript
if (docVersion.status !== 'submitted_for_review') throw new Error('INVALID_DOCUMENT_VERSION_STATUS');
```

**Input type pattern** (from `src/lib/documents/draft-service.ts` lines 30-35):
```typescript
type SubmitForReviewInput = {
  session: AppSession;
  documentVersionId: string;
  reason?: string;
  correlationId?: string;
};
```
Reuse the same shape — `{ session, documentVersionId, correlationId? }` — and add `passedItemIds` / `comments` / `generalComment` fields for the review-specific actions.

**Error handling pattern** (consistent across all services in this codebase):
- Throw `new Error('STABLE_CODE')` with a SCREAMING_SNAKE_CASE token
- Caller (server action) maps tokens to Vietnamese user-facing messages
- Examples: `FORBIDDEN`, `REQUEST_NOT_FOUND`, `DOCUMENT_VERSION_NOT_FOUND`, `INVALID_DOCUMENT_VERSION_STATUS`, `REVIEW_NOT_ACTIVE`, `CHECKLIST_NOT_COMPLETE`

**Required-passed validation** (new for `approveReview`, no analog — derive from D-04):
```typescript
const requiredItems = CHECKLIST_ITEMS.filter((i) => i.required);
const passedRequired = answers.filter((a) => a.passed && requiredItems.some((r) => r.id === a.checklistItemId));
if (passedRequired.length !== requiredItems.length) throw new Error('CHECKLIST_NOT_COMPLETE');
```

---

### `src/lib/reviews/checklist.ts` (utility/constant, transform)

**Exact analog:** `src/constants/checklist-items.ts` — already exists with the full QC-LEG-01 list, 3 groups, 9 items, Vietnamese labels.

**Pattern** (current `src/constants/checklist-items.ts` lines 1-26):
```typescript
export const CHECKLIST_ITEMS = [
  { id: "formal-1", group: "formal", label: "Biểu mẫu phù hợp", required: true },
  // ... 8 more items
] as const;

export const GROUP_LABELS: Record<string, string> = {
  formal: "Yêu cầu hình thức",
  legal: "Nội dung pháp lý",
  operational: "Thủ tục và ký nháy",
};

export const CHECKLIST_GROUPS = ["formal", "legal", "operational"] as const;
```

**Decision:** Per CONTEXT D-07 the planner can either keep this constant in `src/constants/checklist-items.ts` and re-export from the new `src/lib/reviews/checklist.ts`, or move/duplicate. Either way, the new file should **re-export** so service-layer code imports from one place:

```typescript
// src/lib/reviews/checklist.ts
export { CHECKLIST_ITEMS, GROUP_LABELS, CHECKLIST_GROUPS } from '@/constants/checklist-items';
export type ChecklistItemId = typeof CHECKLIST_ITEMS[number]['id'];
```

---

### `src/app/reviewer/requests/page.tsx` (MODIFY) — server page, request-response (read)

**Closest analog:** current `src/app/reviewer/requests/page.tsx` (the file being modified) — keep the layout / `PageHeader` / `Table` structure; **only fix the Prisma query** per CONTEXT D-09, D-10, D-11.

**Server-page pattern** (from `src/app/specialist/requests/[requestId]/page.tsx` lines 45-48, 128-129):
```typescript
export default async function SpecialistRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const session = await requireAppSession();
  if (!(await canAccessRequest(session, requestId))) notFound();
  // ... queries
  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader title="..." description="..." />
      <Card>...</Card>
      <Table>...</Table>
    </main>
  );
}
```

**Queue query — broken vs correct** (current lines 14-35 vs CONTEXT D-09 fix):
- BROKEN: `legalRequest: { assignedReviewerId: session.userId }` (relation path `DocumentVersion.legalRequest` doesn't exist on the Prisma schema; the field is `DocumentVersion.document.request`).
- CORRECT traversal: `document: { request: { assignedReviewerId: session.userId } }`
- Also drop `versionNumber` (does not exist on `DocumentVersion`) and use `templateVersion`.

**Corrected query shape:**
```typescript
const pendingReviews = await prisma.documentVersion.findMany({
  where: {
    status: 'submitted_for_review',
    document: {
      request: {
        assignedReviewerId: session.userId,
      },
    },
  },
  select: {
    id: true,
    templateVersion: true,
    createdAt: true,
    document: {
      select: {
        id: true,
        request: {
          select: {
            id: true,
            title: true,
            intakeSubmission: { select: { matterTypeKey: true } },
            assignedSpecialist: { select: { name: true, email: true } },
          },
        },
      },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

**Empty-state pattern** (from `src/app/specialist/requests/[requestId]/page.tsx` lines 71-78 — empty row inside `Table`):
```tsx
<Table headers={['Yêu cầu', 'Loại vụ việc', 'Chuyên viên', 'Phiên bản', 'Gửi lúc']}>
  {pendingReviews.map((review) => (
    <tr key={review.id} className="hover:bg-[#F1F5F9]">
      {/* cells */}
    </tr>
  ))}
  {pendingReviews.length === 0 ? (
    <tr>
      <td colSpan={5} className="px-4 py-8 text-center text-[16px] font-normal leading-[1.5] text-[#475569]">
        Chưa có tài liệu chờ duyệt
      </td>
    </tr>
  ) : null}
</Table>
```

**Notice banner for `?notice=approved` / `?notice=revision`** (new in this phase, no analog — derive from `Badge` tones in `src/app/admin/components/ui.tsx`):
```tsx
// At top of <main>, before PageHeader
const searchParams = await props.searchParams; // Next 15 page receives searchParams
const notice = searchParams.notice;
{notice === 'approved' ? (
  <Badge tone="accent">Đã duyệt tài liệu. Tài liệu đã được chuyển sang trạng thái cuối.</Badge>
) : notice === 'revision' ? (
  <Badge tone="destructive">Đã gửi yêu cầu chỉnh sửa cho chuyên viên.</Badge>
) : null}
```

---

### `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` (MODIFY) — server page, request-response (read + form post)

**Primary analog:** `src/app/specialist/requests/[requestId]/page.tsx` (lines 1-13, 45-78) — the page pattern of: `requireAppSession` → `canAccessRequest` guard → server-side Prisma query → JSX with `PageHeader` + `Card`.

**Server-component shell:**
```typescript
import { notFound } from 'next/navigation';
import { Badge, Card, PageHeader } from '@/app/admin/components/ui';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';
import ReviewForm from './components/review-form';
import { CHECKLIST_ITEMS, CHECKLIST_GROUPS, GROUP_LABELS } from '@/constants/checklist-items';

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ requestId: string; documentVersionId: string }>;
}) {
  const { requestId, documentVersionId } = await params;
  const session = await requireAppSession();
  if (!(await canAccessRequest(session, requestId))) notFound();

  const docVersion = await prisma.documentVersion.findUnique({
    where: { id: documentVersionId },
    select: {
      id: true,
      documentId: true,
      templateId: true,
      templateVersion: true,
      status: true,
      generatedContent: true,
      createdAt: true,
      document: {
        select: {
          id: true,
          requestId: true,
          request: {
            select: {
              id: true,
              title: true,
              status: true,
              assignedReviewerId: true,
              assignedSpecialist: { select: { name: true, email: true } },
              intakeSubmission: { select: { matterTypeKey: true } },
            },
          },
        },
      },
    },
  });
  if (!docVersion || docVersion.document.requestId !== requestId) notFound();

  // RBAC: must be the assigned reviewer or admin
  const isAssigned = docVersion.document.request.assignedReviewerId === session.userId;
  const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');
  if (!isAssigned && !isAdmin) notFound();

  // Load existing review + answers (if any) for this document version
  const existingReview = await prisma.review.findFirst({
    where: { documentVersionId, reviewerId: session.userId },
    select: {
      id: true,
      status: true,
      generalComment: true,
      checklistAnswers: { select: { checklistItemId: true, passed: true, comment: true } },
    },
  });

  // ...
}
```

**Split-view layout** (CONTEXT UI-SPEC §Layout Primitives, grid `1fr / 420px`):
```tsx
return (
  <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
    <PageHeader
      title="Duyệt tài liệu"
      description="Đọc tài liệu bên trái và hoàn thành checklist bên phải trước khi duyệt."
      action={<Link href="/reviewer/requests"><Button variant="secondary">Quay lại hàng chờ</Button></Link>}
    />

    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A]">Nội dung tài liệu</h2>
        <pre className="whitespace-pre-wrap text-[14px] leading-[1.6] text-[#0F172A]">
          {docVersion.generatedContent}
        </pre>
      </Card>

      <ReviewForm
        requestId={requestId}
        documentVersionId={documentVersionId}
        existingAnswers={existingReview?.checklistAnswers ?? []}
        generalComment={existingReview?.generalComment ?? ''}
        isReadOnly={existingReview?.status === 'approved' || existingReview?.status === 'rejected'}
      />
    </div>
  </main>
);
```

---

### `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/actions.ts` (NEW) — server-action handler

**Exact analog:** `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx` lines 1-7 (the import / state contract) and the server actions it consumes — but the actual `actions.ts` file in the specialist tree is implicit. Use the same shape:

**Type contract** (from `delivery-actions.tsx` lines 1-7):
```typescript
'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import { startReview, answerChecklistItem, approveReview, rejectReview } from '@/lib/reviews/review-service';

export type ReviewerActionResult = { ok: boolean; message: string };

export async function startReviewAction(formData: FormData): Promise<ReviewerActionResult> {
  const session = await requireAppSession();
  const documentVersionId = String(formData.get('documentVersionId') ?? '');
  if (!documentVersionId) return { ok: false, message: 'Thiếu mã phiên bản tài liệu.' };

  try {
    await startReview({ session, documentVersionId });
    revalidatePath('/reviewer/requests');
    return { ok: true, message: 'Đã bắt đầu duyệt.' };
  } catch (err) {
    return mapReviewError(err);
  }
}

export async function approveReviewAction(formData: FormData): Promise<ReviewerActionResult> {
  // ... build answers array from formData, call approveReview
  redirect('/reviewer/requests?notice=approved');
}

export async function rejectReviewAction(formData: FormData): Promise<ReviewerActionResult> {
  // ... build answers + generalComment, call rejectReview
  redirect('/reviewer/requests?notice=revision');
}

function mapReviewError(err: unknown): ReviewerActionResult {
  const code = err instanceof Error ? err.message : 'UNKNOWN';
  switch (code) {
    case 'FORBIDDEN': return { ok: false, message: 'Bạn không có quyền thực hiện thao tác này.' };
    case 'DOCUMENT_VERSION_NOT_FOUND': return { ok: false, message: 'Không tìm thấy phiên bản tài liệu.' };
    case 'REVIEW_NOT_ACTIVE': return { ok: false, message: 'Phiên duyệt đã đóng, không thể cập nhật.' };
    case 'CHECKLIST_NOT_COMPLETE': return { ok: false, message: 'Vui lòng hoàn thành tất cả mục bắt buộc trong checklist trước khi duyệt.' };
    case 'REJECT_COMMENT_REQUIRED': return { ok: false, message: 'Vui lòng nhập nhận xét cho các mục chưa đạt.' };
    default: return { ok: false, message: 'Không thể lưu đánh giá. Vui lòng thử lại hoặc liên hệ quản trị viên.' };
  }
}
```

**Server-action invocation pattern** (from `delivery-actions.tsx` lines 19-28):
```typescript
'use client';
import { useActionState } from 'react';
const initialState: SpecialistRequestActionResult = { ok: false, message: '' };
export function DeliverForm({ requestId }: { requestId: string }) {
  const [result, formAction] = useActionState(async (_state, formData) => markDeliveredAction(formData), initialState);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit">Giao cho khách hàng</Button>
      <FeedbackMessage result={result} />
    </form>
  );
}
```

---

### `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx` (NEW) — client form

**Exact analog:** `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx` (entire file, lines 1-51) — same `useActionState` + hidden inputs + `<Button>` + feedback message pattern.

**Skeleton mirroring the specialist forms:**
```typescript
'use client';

import { useActionState, useState } from 'react';
import { Badge, Button, Card } from '@/app/admin/components/ui';
import { CHECKLIST_ITEMS, CHECKLIST_GROUPS, GROUP_LABELS } from '@/constants/checklist-items';
import { approveReviewAction, rejectReviewAction, type ReviewerActionResult } from '../actions';

const initialState: ReviewerActionResult = { ok: false, message: '' };

type Answer = { itemId: string; passed: boolean; comment: string };

export default function ReviewForm({
  requestId,
  documentVersionId,
  existingAnswers,
  generalComment: initialComment,
  isReadOnly,
}: {
  requestId: string;
  documentVersionId: string;
  existingAnswers: { checklistItemId: string; passed: boolean; comment: string | null }[];
  generalComment: string;
  isReadOnly: boolean;
}) {
  // local state for checklist toggle + per-item comment
  const [answers, setAnswers] = useState<Map<string, Answer>>(
    () => new Map(existingAnswers.map((a) => [a.checklistItemId, {
      itemId: a.checklistItemId,
      passed: a.passed,
      comment: a.comment ?? '',
    }])),
  );
  const [generalComment, setGeneralComment] = useState(initialComment);

  // derive required-passed state for approve enable
  const requiredItems = CHECKLIST_ITEMS.filter((i) => i.required);
  const allRequiredPassed = requiredItems.every((i) => answers.get(i.id)?.passed === true);

  const [approveState, approveFormAction] = useActionState(
    async (_state: ReviewerActionResult, formData: FormData) => approveReviewAction(formData),
    initialState,
  );
  const [rejectState, rejectFormAction] = useActionState(
    async (_state: ReviewerActionResult, formData: FormData) => rejectReviewAction(formData),
    initialState,
  );

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold text-[#0F172A]">Checklist QC-LEG-01</h2>

      <div className="space-y-4">
        {CHECKLIST_GROUPS.map((group) => (
          <div key={group} className="rounded-xl border border-[#E2E8F0]">
            <div className="bg-[#F1F5F9] px-4 py-2 text-[14px] font-semibold text-[#0F172A]">
              {GROUP_LABELS[group]}
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {CHECKLIST_ITEMS.filter((i) => i.group === group).map((item) => {
                const a = answers.get(item.id);
                return (
                  <div key={item.id} className="space-y-2 p-4">
                    <div className="flex items-start gap-3">
                      {/* pass/fail toggle */}
                      <input
                        type="checkbox"
                        checked={a?.passed === true}
                        disabled={isReadOnly}
                        onChange={(e) => setAnswers((prev) => new Map(prev).set(item.id, { itemId: item.id, passed: e.target.checked, comment: prev.get(item.id)?.comment ?? '' }))}
                        className="mt-1 h-5 w-5"
                      />
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-[#0F172A]">
                          {item.label}
                          {item.required ? <Badge tone="destructive">Bắt buộc</Badge> : null}
                        </p>
                        {a && !a.passed ? (
                          <textarea
                            name={`comment-${item.id}`}
                            value={a.comment}
                            disabled={isReadOnly}
                            onChange={(e) => setAnswers((prev) => new Map(prev).set(item.id, { ...a, comment: e.target.value }))}
                            placeholder="Nhận xét cho mục chưa đạt"
                            className="mt-2 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <form action={approveFormAction} className="space-y-2">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="documentVersionId" value={documentVersionId} />
        {Array.from(answers.values()).map((a) => (
          <input key={a.itemId} type="hidden" name={`answer_${a.itemId}`} value={a.passed ? '1' : '0'} />
        ))}
        <Button type="submit" disabled={!allRequiredPassed || isReadOnly}>Duyệt</Button>
        {approveState.message ? (
          <Badge tone={approveState.ok ? 'accent' : 'destructive'}>{approveState.message}</Badge>
        ) : null}
      </form>

      <form action={rejectFormAction} className="space-y-2">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="documentVersionId" value={documentVersionId} />
        {Array.from(answers.values()).map((a) => (
          <input key={a.itemId} type="hidden" name={`answer_${a.itemId}`} value={a.passed ? '1' : '0'} />
        ))}
        <label className="block space-y-2">
          <span className="text-[14px] font-semibold text-[#475569]">Nhận xét chung</span>
          <textarea
            name="generalComment"
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            disabled={isReadOnly}
            className="min-h-24 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-[14px] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
          />
        </label>
        <Button type="submit" variant="destructive" disabled={isReadOnly}>Yêu cầu chỉnh sửa</Button>
        {rejectState.message ? (
          <Badge tone={rejectState.ok ? 'accent' : 'destructive'}>{rejectState.message}</Badge>
        ) : null}
      </form>
    </Card>
  );
}
```

---

## Shared Patterns

### Authentication / Session
**Source:** `src/lib/security/session.ts` (lines 11-35)
**Apply to:** all server actions, all server pages
```typescript
import { requireAppSession } from '@/lib/security/session';
const session = await requireAppSession();   // throws 'UNAUTHENTICATED' if no session
```

### RBAC — request access
**Source:** `src/lib/security/rbac.ts` (lines 39-65)
**Apply to:** every server page that loads a request, every service that touches a request
```typescript
import { canAccessRequest } from '@/lib/security/rbac';
if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');
// In server pages, prefer notFound() over throw
```

### RBAC — review access (reviewer-specific)
**Source:** `src/lib/security/rbac.ts` (lines 79-95)
**Apply to:** review-service.ts — secondary check beyond `canAccessRequest`
```typescript
import { canAccessReview } from '@/lib/security/rbac';
// Confirms reviewerId === session.userId OR super_admin, else falls through to canAccessRequest
```
**Note:** `canAccessReview` queries by `reviewId`. For `startReview` (no reviewId yet), the planner must compose `canAccessRequest` + an additional `assignedReviewerId === session.userId` check (D-16).

### Audit event recording
**Source:** `src/lib/audit/audit.ts` (lines 59-79) and usage in `src/lib/documents/draft-service.ts` lines 161-173, 294-303
**Apply to:** every state-changing service function in review-service
```typescript
import { recordAuditEvent } from '@/lib/audit/audit';
await recordAuditEvent({
  actorId: session.userId,
  workspaceId: workspaceId,
  action: 'review.approved',              // or 'review.rejected', 'review.started', 'review.checklist_answered'
  targetType: 'REVIEW',                    // from targetTypeMap in audit.ts
  targetId: reviewId,
  requestId: docVersion.document.requestId,
  correlationId: `review-approve-${reviewId}`,
  metadataSummary: `reviewId=${reviewId}; docVersionId=${docVersionId}; passedCount=${n}; failedCount=${m}`,
}, tx);  // pass tx when inside a $transaction
```
**Safe-metadata constraint (D-06):** never put legal content in `metadataSummary`. Only IDs, counts, decision tokens, status transitions.

### Workflow state machine
**Source:** `src/lib/workflow/request-workflow.ts` (lines 7-19, 66-138)
**Apply to:** `approveReview` (→ `'approved'`), `rejectReview` (→ `'revision_required'`)
```typescript
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
await transitionRequestStatus({
  requestId: requestId,
  actorId: session.userId,
  toStatus: 'approved',                    // or 'revision_required'
  reason: 'Tài liệu đạt yêu cầu kiểm tra',
  correlationId: `review-approve-${reviewId}`,
});
```
`transitionRequestStatus` itself performs the RBAC check, writes the `WorkflowTransition` row, and records an audit event — all inside one `$transaction`. Calling it inside the review-service's own `$transaction` is **not possible** because `transitionRequestStatus` uses `prisma` (not `tx`). The review-service should call it **after** updating the local tables in its `$transaction`, accepting the small race window (matches existing pattern in `submitForReview`).

### Error handling convention
**Source:** all `src/lib/*/*.ts` services (e.g. `src/lib/documents/draft-service.ts` lines 67, 72, 91, 97, 188, 267, 272, 274)
**Pattern:** throw `new Error('SCREAMING_SNAKE_CODE')`; the server action layer maps the code to a Vietnamese user message.
```typescript
throw new Error('FORBIDDEN');
throw new Error('DOCUMENT_VERSION_NOT_FOUND');
throw new Error('REVIEW_NOT_ACTIVE');           // new — no existing in_progress check
throw new Error('CHECKLIST_NOT_COMPLETE');      // new — required items not all passed
throw new Error('REJECT_COMMENT_REQUIRED');     // new — general comment required on reject
```

### Prisma `$transaction` shape
**Source:** `src/lib/documents/draft-service.ts` lines 126-176, 276-306; `src/lib/workflow/request-workflow.ts` lines 101-138
**Apply to:** `startReview` (create Review + VaultFile-style insert), `approveReview` and `rejectReview` (update Review + update DocumentVersion + record audit)
```typescript
await prisma.$transaction(async (tx) => {
  // ... multiple tx.X.create / tx.X.update calls
  await recordAuditEvent({ ... }, tx);
  return result;
});
```

### UI primitives
**Source:** `src/app/admin/components/ui.tsx` (entire file)
**Apply to:** all reviewer pages and the review-form
- `PageHeader` (lines 69-79) — title + description + optional `action` slot
- `Card` (lines 46-48) — surface container
- `Table` (lines 50-67) — queue listing
- `Badge` (lines 38-44) — tones: `neutral | info | warning | accent | destructive | outline`
- `Button` (lines 26-36) — variants: `primary | secondary | destructive | ghost`

### Vietnamese date formatting
**Source:** `src/app/reviewer/requests/page.tsx` lines 6-8; `src/app/specialist/requests/[requestId]/page.tsx` lines 41-43
```typescript
new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
```

### Server-action form pattern
**Source:** `src/app/specialist/requests/[requestId]/components/delivery-actions.tsx` lines 1-29
**Apply to:** `review-form.tsx` and `actions.ts`
```typescript
// actions.ts — 'use server', takes FormData, returns { ok, message }, calls service, redirects on success
// client component — useActionState, hidden inputs for IDs, <Button type="submit">, FeedbackMessage or Badge
```

### Empty-state pattern
**Source:** `src/app/specialist/requests/[requestId]/page.tsx` lines 71-78, 164, 180, 187-190
```tsx
<p className="rounded-xl border border-[#E2E8F0] p-4 text-[16px] leading-[1.5] text-[#475569]">
  Chưa có tài liệu chờ duyệt
</p>
// or in a table:
<tr><td colSpan={N} className="px-4 py-8 text-center ...">Không có dữ liệu</td></tr>
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All 4 new + 2 modified files have direct analogs in the existing codebase. |

## Metadata

**Analog search scope:** `src/lib/**`, `src/app/**`, `src/constants/**`, `prisma/schema.prisma`
**Files scanned:** 28 lib files + 6 app components + 1 constants file + 1 schema
**Pattern extraction date:** 2026-06-03
**Phase:** 08-reviewer-service
