import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest } from '@/lib/security/rbac';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import type { AppSession } from '@/lib/security/session';
import { CHECKLIST_ITEMS } from '@/constants/checklist-items';

type ChecklistAnswer = { checklistItemId: string; passed: boolean; comment?: string | null };

type StartReviewInput = { session: AppSession; documentVersionId: string; correlationId?: string };
type AnswerItemInput = { session: AppSession; reviewId: string; answers: ChecklistAnswer[]; correlationId?: string };
type ApproveReviewInput = { session: AppSession; reviewId: string; answers: ChecklistAnswer[]; correlationId?: string };
type RejectReviewInput = {
  session: AppSession;
  reviewId: string;
  answers: ChecklistAnswer[];
  generalComment: string;
  correlationId?: string;
};

// Hard-coded mirror of QC-LEG-01 required flags. Kept inline so the service
// remains self-contained and explicit about what "all required items passed"
// means; do not replace with a config lookup.
const REQUIRED_ITEM_IDS = CHECKLIST_ITEMS.filter((i) => i.required).map((i) => i.id);

type LoadedReview = {
  id: string;
  workspaceId: string;
  requestId: string;
  documentId: string;
  reviewerId: string;
  documentVersionId: string | null;
  status: string;
  generalComment: string | null;
  request: { assignedReviewerId: string | null; status: string; workspaceId: string };
};

async function loadReviewForActor(reviewId: string, session: AppSession): Promise<LoadedReview> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      workspaceId: true,
      requestId: true,
      documentId: true,
      reviewerId: true,
      documentVersionId: true,
      status: true,
      generalComment: true,
      request: { select: { assignedReviewerId: true, status: true, workspaceId: true } },
    },
  });
  if (!review) throw new Error('REVIEW_NOT_FOUND');
  const isAssignedReviewer =
    review.reviewerId === session.userId && review.request.assignedReviewerId === session.userId;
  const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');
  if (!isAssignedReviewer && !isAdmin) throw new Error('FORBIDDEN');
  return review;
}

function countAnswers(answers: ChecklistAnswer[]) {
  let passed = 0;
  let failed = 0;
  for (const a of answers) {
    if (a.passed) passed += 1;
    else failed += 1;
  }
  return { passed, failed };
}

export async function startReview(input: StartReviewInput): Promise<{ reviewId: string; status: string }> {
  const { session, documentVersionId, correlationId } = input;

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
              assignedReviewerId: true,
            },
          },
        },
      },
    },
  });

  if (!docVersion) throw new Error('DOCUMENT_VERSION_NOT_FOUND');
  if (docVersion.status !== 'submitted_for_review') throw new Error('INVALID_DOCUMENT_VERSION_STATUS');

  const isAssignedReviewer = docVersion.document.request.assignedReviewerId === session.userId;
  const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');
  if (!isAssignedReviewer && !isAdmin) throw new Error('FORBIDDEN');

  const result = await prisma.$transaction(async (tx) => {
    // Schema has no unique on (documentVersionId, reviewerId); guard against
    // double-create by checking existence first.
    const existing = await tx.review.findFirst({
      where: { documentVersionId, reviewerId: session.userId },
      select: { id: true, status: true },
    });
    const review = existing
      ? existing
      : await tx.review.create({
          data: {
            workspaceId: docVersion.document.workspaceId,
            requestId: docVersion.document.requestId,
            documentId: docVersion.document.id,
            reviewerId: session.userId,
            documentVersionId,
            status: 'in_progress',
          },
          select: { id: true, status: true },
        });

    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: docVersion.document.workspaceId,
        action: 'review.started',
        targetType: 'REVIEW',
        targetId: review.id,
        requestId: docVersion.document.requestId,
        correlationId: correlationId ?? `review-start-${review.id}`,
        metadataSummary: `docVersionId=${documentVersionId}; reviewId=${review.id}; reviewerId=${session.userId}`,
      },
      tx,
    );

    return review;
  });

  return { reviewId: result.id, status: result.status };
}

export async function answerChecklistItem(
  input: AnswerItemInput,
): Promise<{ reviewId: string; answerCount: number }> {
  const { session, reviewId, answers, correlationId } = input;

  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');

  // Secondary guard: only the request's reviewer (or admin) can answer.
  if (!(await canAccessRequest(session, review.requestId))) throw new Error('FORBIDDEN');

  await prisma.$transaction(async (tx) => {
    for (const answer of answers) {
      await tx.reviewChecklistAnswer.upsert({
        where: { reviewId_checklistItemId: { reviewId, checklistItemId: answer.checklistItemId } },
        create: {
          reviewId,
          checklistItemId: answer.checklistItemId,
          passed: answer.passed,
          comment: answer.comment ?? null,
        },
        update: {
          passed: answer.passed,
          comment: answer.comment ?? null,
        },
      });
    }

    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: review.workspaceId,
        action: 'review.checklist_answered',
        targetType: 'REVIEW',
        targetId: reviewId,
        requestId: review.requestId,
        correlationId: correlationId ?? `review-answer-${reviewId}`,
        metadataSummary: `reviewId=${reviewId}; answerCount=${answers.length}`,
      },
      tx,
    );
  });

  return { reviewId, answerCount: answers.length };
}

export async function approveReview(
  input: ApproveReviewInput,
): Promise<{ reviewId: string; status: string }> {
  const { session, reviewId, answers, correlationId } = input;

  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');
  if (!review.documentVersionId) throw new Error('REVIEW_NOT_ACTIVE');

  // Validate that every required item is present and passed.
  const byItem = new Map(answers.map((a) => [a.checklistItemId, a]));
  for (const requiredId of REQUIRED_ITEM_IDS) {
    const a = byItem.get(requiredId);
    if (!a || a.passed !== true) {
      throw new Error('CHECKLIST_NOT_COMPLETE');
    }
  }

  const { passed, failed } = countAnswers(answers);
  const corr = correlationId ?? `review-approve-${reviewId}`;

  await prisma.$transaction(async (tx) => {
    // Persist all answers (idempotent upserts).
    for (const answer of answers) {
      await tx.reviewChecklistAnswer.upsert({
        where: { reviewId_checklistItemId: { reviewId, checklistItemId: answer.checklistItemId } },
        create: {
          reviewId,
          checklistItemId: answer.checklistItemId,
          passed: answer.passed,
          comment: answer.comment ?? null,
        },
        update: {
          passed: answer.passed,
          comment: answer.comment ?? null,
        },
      });
    }

    await tx.documentVersion.update({
      where: { id: review.documentVersionId! },
      data: { status: 'final' },
    });

    await tx.review.update({
      where: { id: reviewId },
      data: { status: 'approved', decision: 'approve', completedAt: new Date() },
    });

    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: review.workspaceId,
        action: 'review.approved',
        targetType: 'REVIEW',
        targetId: reviewId,
        requestId: review.requestId,
        correlationId: corr,
        metadataSummary: `reviewId=${reviewId}; docVersionId=${review.documentVersionId}; passedCount=${passed}; failedCount=${failed}`,
      },
      tx,
    );
  });

  // Workflow transition runs outside the $transaction (matches the
  // submitForReview pattern in draft-service.ts). transitionRequestStatus
  // has its own transaction + audit write.
  await transitionRequestStatus({
    requestId: review.requestId,
    actorId: session.userId,
    toStatus: 'approved',
    reason: 'Reviewer duyệt tài liệu',
    correlationId: corr,
  });

  return { reviewId, status: 'approved' };
}

export async function rejectReview(
  input: RejectReviewInput,
): Promise<{ reviewId: string; status: string }> {
  const { session, reviewId, answers, generalComment, correlationId } = input;

  if (generalComment.trim().length === 0) throw new Error('REJECT_COMMENT_REQUIRED');

  const review = await loadReviewForActor(reviewId, session);
  if (review.status !== 'in_progress') throw new Error('REVIEW_NOT_ACTIVE');
  if (!review.documentVersionId) throw new Error('REVIEW_NOT_ACTIVE');

  const { passed, failed } = countAnswers(answers);
  const corr = correlationId ?? `review-reject-${reviewId}`;

  await prisma.$transaction(async (tx) => {
    for (const answer of answers) {
      await tx.reviewChecklistAnswer.upsert({
        where: { reviewId_checklistItemId: { reviewId, checklistItemId: answer.checklistItemId } },
        create: {
          reviewId,
          checklistItemId: answer.checklistItemId,
          passed: answer.passed,
          comment: answer.comment ?? null,
        },
        update: {
          passed: answer.passed,
          comment: answer.comment ?? null,
        },
      });
    }

    await tx.documentVersion.update({
      where: { id: review.documentVersionId! },
      data: { status: 'draft' },
    });

    await tx.review.update({
      where: { id: reviewId },
      data: {
        status: 'rejected',
        decision: 'reject',
        generalComment,
        completedAt: new Date(),
      },
    });

    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: review.workspaceId,
        action: 'review.rejected',
        targetType: 'REVIEW',
        targetId: reviewId,
        requestId: review.requestId,
        correlationId: corr,
        metadataSummary: `reviewId=${reviewId}; docVersionId=${review.documentVersionId}; passedCount=${passed}; failedCount=${failed}`,
      },
      tx,
    );
  });

  await transitionRequestStatus({
    requestId: review.requestId,
    actorId: session.userId,
    toStatus: 'revision_required',
    reason: 'Reviewer yêu cầu chỉnh sửa',
    correlationId: corr,
  });

  return { reviewId, status: 'rejected' };
}
