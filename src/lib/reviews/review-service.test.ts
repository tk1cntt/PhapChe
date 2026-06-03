import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { approveReview, rejectReview } from './review-service';
import type { AppSession } from '@/lib/security/session';
import { CHECKLIST_ITEMS } from '@/constants/checklist-items';

const REVIEW_E2E_PREFIX = 'review_service_e2e';

const REQUIRED_ITEM_IDS = CHECKLIST_ITEMS.filter((i) => i.required).map((i) => i.id);

type ReviewSeed = {
  suffix: string;
  workspaceId: string;
  coordinatorId: string;
  specialistId: string;
  reviewerId: string;
  customerId: string;
  requestId: string;
  documentId: string;
  documentVersionId: string;
  reviewId: string;
  userIds: string[];
  correlationPrefix: string;
};

function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for review service test');

  const url = new URL(databaseUrl);
  const databaseName = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run review service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}

async function seedReviewTest(): Promise<ReviewSeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const correlationPrefix = `${REVIEW_E2E_PREFIX}_${suffix}`;

  const workspace = await prisma.workspace.create({
    data: { name: `Review Service ${suffix}`, slug: `${REVIEW_E2E_PREFIX}-${suffix}` },
  });

  const [coordinator, specialist, reviewer, customer] = await Promise.all([
    prisma.user.create({
      data: {
        email: `${REVIEW_E2E_PREFIX}_coord_${suffix}@example.test`,
        name: 'Coordinator',
        memberships: { create: { workspaceId: workspace.id, role: 'coordinator_admin' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${REVIEW_E2E_PREFIX}_spec_${suffix}@example.test`,
        name: 'Specialist',
        memberships: { create: { workspaceId: workspace.id, role: 'specialist' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${REVIEW_E2E_PREFIX}_rev_${suffix}@example.test`,
        name: 'Reviewer',
        memberships: { create: { workspaceId: workspace.id, role: 'reviewer' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${REVIEW_E2E_PREFIX}_cust_${suffix}@example.test`,
        name: 'Customer',
        memberships: { create: { workspaceId: workspace.id, role: 'customer' } },
      },
    }),
  ]);

  const request = await prisma.legalRequest.create({
    data: {
      workspaceId: workspace.id,
      title: `Review request ${suffix}`,
      status: 'pending_review',
      createdById: customer.id,
      assignedSpecialistId: specialist.id,
      assignedReviewerId: reviewer.id,
    },
  });

  const document = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      requestId: request.id,
      title: `Document ${suffix}`,
    },
  });

  const documentVersion = await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      templateId: 'tpl-' + suffix,
      templateVersion: 1,
      status: 'submitted_for_review',
      inputSnapshot: { variables: { foo: 'bar' } },
      generatedContent: 'Nội dung tài liệu mẫu cho review.',
    },
  });

  const review = await prisma.review.create({
    data: {
      workspaceId: workspace.id,
      requestId: request.id,
      documentId: document.id,
      reviewerId: reviewer.id,
      documentVersionId: documentVersion.id,
      status: 'in_progress',
    },
  });

  return {
    suffix,
    workspaceId: workspace.id,
    coordinatorId: coordinator.id,
    specialistId: specialist.id,
    reviewerId: reviewer.id,
    customerId: customer.id,
    requestId: request.id,
    documentId: document.id,
    documentVersionId: documentVersion.id,
    reviewId: review.id,
    userIds: [coordinator.id, specialist.id, reviewer.id, customer.id],
    correlationPrefix,
  };
}

async function cleanupReviewTest(seed: ReviewSeed | null) {
  if (!seed) return;

  const { workspaceId, requestId, userIds } = seed;

  await prisma.auditEvent.deleteMany({ where: { workspaceId } });
  await prisma.workflowTransition.deleteMany({ where: { requestId } });
  await prisma.reviewChecklistAnswer.deleteMany({
    where: { review: { requestId } },
  });
  await prisma.review.deleteMany({ where: { requestId } });
  await prisma.documentVersion.deleteMany({ where: { document: { requestId } } });
  await prisma.document.deleteMany({ where: { requestId } });
  await prisma.legalRequest.deleteMany({ where: { id: requestId } });
  await prisma.workspaceMembership.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds }, email: { startsWith: REVIEW_E2E_PREFIX } } });
  await prisma.workspace.deleteMany({ where: { id: workspaceId } });
}

async function withReviewSeed(run: (seed: ReviewSeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: ReviewSeed | null = null;

  try {
    seed = await seedReviewTest();
    await run(seed);
  } finally {
    await cleanupReviewTest(seed);
  }
}

function reviewerSession(seed: ReviewSeed): AppSession {
  return { userId: seed.reviewerId, activeWorkspaceId: seed.workspaceId, roles: ['reviewer'] };
}

function coordinatorSession(seed: ReviewSeed): AppSession {
  return { userId: seed.coordinatorId, activeWorkspaceId: seed.workspaceId, roles: ['coordinator_admin'] };
}

function allPassedAnswers() {
  return CHECKLIST_ITEMS.map((i) => ({
    checklistItemId: i.id,
    passed: true,
    comment: null as string | null,
  }));
}

function answersWithOneFailed(failedId: string) {
  return CHECKLIST_ITEMS.map((i) => ({
    checklistItemId: i.id,
    passed: i.id === failedId ? false : true,
    comment: i.id === failedId ? 'Thiếu căn cứ' : null,
  }));
}

// ---------------------------------------------------------------------------
// Test 1: approve happy-path
// ---------------------------------------------------------------------------

test('approveReview sets DocumentVersion.final + request.approved + audit + workflow', async () => {
  await withReviewSeed(async (seed) => {
    const result = await approveReview({
      session: reviewerSession(seed),
      reviewId: seed.reviewId,
      answers: allPassedAnswers(),
      correlationId: `${seed.correlationPrefix}_approve`,
    });

    assert.equal(result.status, 'approved');
    assert.equal(result.reviewId, seed.reviewId);

    const docVersion = await prisma.documentVersion.findUniqueOrThrow({ where: { id: seed.documentVersionId } });
    assert.equal(docVersion.status, 'final');

    const request = await prisma.legalRequest.findUniqueOrThrow({ where: { id: seed.requestId } });
    assert.equal(request.status, 'approved');

    const review = await prisma.review.findUniqueOrThrow({ where: { id: seed.reviewId } });
    assert.equal(review.status, 'approved');
    assert.equal(review.decision, 'approve');
    assert.ok(review.completedAt);

    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'review.approved', targetId: seed.reviewId },
    });
    assert.ok(audit);
    assert.ok(audit.metadataSummary?.includes('passedCount=9'));
    assert.ok(audit.metadataSummary?.includes('failedCount=0'));
    // D-06: metadata must not contain legal content.
    assert.ok(!audit.metadataSummary?.includes('Nội dung'));
    assert.ok(!audit.metadataSummary?.includes('Biểu mẫu'));

    const transition = await prisma.workflowTransition.findFirst({
      where: { requestId: seed.requestId, toStatus: 'approved' },
    });
    assert.ok(transition);
    assert.equal(transition?.fromStatus, 'pending_review');
  });
});

// ---------------------------------------------------------------------------
// Test 2: reject happy-path
// ---------------------------------------------------------------------------

test('rejectReview sets DocumentVersion.draft + request.revision_required + preserves answers', async () => {
  await withReviewSeed(async (seed) => {
    // Seed one answer so we can prove it is preserved after reject.
    await prisma.reviewChecklistAnswer.create({
      data: { reviewId: seed.reviewId, checklistItemId: 'formal-1', passed: true, comment: 'OK' },
    });

    const result = await rejectReview({
      session: reviewerSession(seed),
      reviewId: seed.reviewId,
      answers: answersWithOneFailed('legal-3'),
      generalComment: 'Điều khoản rủi ro chưa đủ chi tiết',
      correlationId: `${seed.correlationPrefix}_reject`,
    });

    assert.equal(result.status, 'rejected');

    const docVersion = await prisma.documentVersion.findUniqueOrThrow({ where: { id: seed.documentVersionId } });
    assert.equal(docVersion.status, 'draft');

    const request = await prisma.legalRequest.findUniqueOrThrow({ where: { id: seed.requestId } });
    assert.equal(request.status, 'revision_required');

    const review = await prisma.review.findUniqueOrThrow({ where: { id: seed.reviewId } });
    assert.equal(review.status, 'rejected');
    assert.equal(review.decision, 'reject');
    assert.ok(review.completedAt);
    assert.equal(review.generalComment, 'Điều khoản rủi ro chưa đủ chi tiết');

    // REV-08: checklist answers preserved.
    const answers = await prisma.reviewChecklistAnswer.findMany({ where: { reviewId: seed.reviewId } });
    assert.ok(answers.length >= 1);
    assert.ok(answers.some((a) => a.checklistItemId === 'formal-1' && a.passed === true));

    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'review.rejected', targetId: seed.reviewId },
    });
    assert.ok(audit);
    assert.ok(audit.metadataSummary?.includes('failedCount=1'));
    // D-06: reject comment must not leak into metadata.
    assert.ok(!audit.metadataSummary?.includes('rủi ro'));
  });
});

// ---------------------------------------------------------------------------
// Test 3 (negative): approve with one required item not passed
// ---------------------------------------------------------------------------

test('approveReview rejects when any required item is not passed', async () => {
  await withReviewSeed(async (seed) => {
    await assert.rejects(
      approveReview({
        session: reviewerSession(seed),
        reviewId: seed.reviewId,
        answers: answersWithOneFailed('legal-1'),
        correlationId: `${seed.correlationPrefix}_approve_incomplete`,
      }),
      /CHECKLIST_NOT_COMPLETE/,
    );

    // No state changes
    const docVersion = await prisma.documentVersion.findUniqueOrThrow({ where: { id: seed.documentVersionId } });
    assert.equal(docVersion.status, 'submitted_for_review');
    const request = await prisma.legalRequest.findUniqueOrThrow({ where: { id: seed.requestId } });
    assert.equal(request.status, 'pending_review');
    const review = await prisma.review.findUniqueOrThrow({ where: { id: seed.reviewId } });
    assert.equal(review.status, 'in_progress');

    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'review.approved', targetId: seed.reviewId },
    });
    assert.equal(audit, null);
  });
});

// ---------------------------------------------------------------------------
// Test 4 (negative): reject with empty generalComment
// ---------------------------------------------------------------------------

test('rejectReview rejects when generalComment is empty', async () => {
  await withReviewSeed(async (seed) => {
    await assert.rejects(
      rejectReview({
        session: reviewerSession(seed),
        reviewId: seed.reviewId,
        answers: answersWithOneFailed('legal-3'),
        generalComment: '   ',
        correlationId: `${seed.correlationPrefix}_reject_empty`,
      }),
      /REJECT_COMMENT_REQUIRED/,
    );

    const review = await prisma.review.findUniqueOrThrow({ where: { id: seed.reviewId } });
    assert.equal(review.status, 'in_progress');
  });
});

// ---------------------------------------------------------------------------
// Test 5 (negative): approve when session.userId !== assignedReviewerId
// ---------------------------------------------------------------------------

test('approveReview rejects when caller is not the assigned reviewer', async () => {
  await withReviewSeed(async (seed) => {
    // Build a session for the coordinator (admin role), then for a different
    // reviewer-style user (non-assigned). Use a fresh reviewer account.
    const otherReviewer = await prisma.user.create({
      data: {
        email: `${REVIEW_E2E_PREFIX}_other_rev_${seed.suffix}@example.test`,
        name: 'Other Reviewer',
        memberships: { create: { workspaceId: seed.workspaceId, role: 'reviewer' } },
      },
    });

    const otherSession: AppSession = {
      userId: otherReviewer.id,
      activeWorkspaceId: seed.workspaceId,
      roles: ['reviewer'],
    };

    await assert.rejects(
      approveReview({
        session: otherSession,
        reviewId: seed.reviewId,
        answers: allPassedAnswers(),
        correlationId: `${seed.correlationPrefix}_approve_forbidden`,
      }),
      /FORBIDDEN/,
    );

    // Coordinator admin also allowed (positive control on RBAC) — but
    // we already asserted the negative path above; cleanup the extra user.
    await prisma.workspaceMembership.deleteMany({ where: { userId: otherReviewer.id } });
    await prisma.user.delete({ where: { id: otherReviewer.id } });
  });
});

// ---------------------------------------------------------------------------
// Test 6 (negative): reject with non-assigned reviewer returns FORBIDDEN
// ---------------------------------------------------------------------------

test('rejectReview rejects when caller is not the assigned reviewer', async () => {
  await withReviewSeed(async (seed) => {
    const otherReviewer = await prisma.user.create({
      data: {
        email: `${REVIEW_E2E_PREFIX}_other_rev2_${seed.suffix}@example.test`,
        name: 'Other Reviewer 2',
        memberships: { create: { workspaceId: seed.workspaceId, role: 'reviewer' } },
      },
    });

    const otherSession: AppSession = {
      userId: otherReviewer.id,
      activeWorkspaceId: seed.workspaceId,
      roles: ['reviewer'],
    };

    await assert.rejects(
      rejectReview({
        session: otherSession,
        reviewId: seed.reviewId,
        answers: answersWithOneFailed('legal-3'),
        generalComment: 'Không đạt',
        correlationId: `${seed.correlationPrefix}_reject_forbidden`,
      }),
      /FORBIDDEN/,
    );

    await prisma.workspaceMembership.deleteMany({ where: { userId: otherReviewer.id } });
    await prisma.user.delete({ where: { id: otherReviewer.id } });
  });
});
