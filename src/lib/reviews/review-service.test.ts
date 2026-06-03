import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
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
// Task 1 placeholder tests — these will be replaced/extended in Task 2
// ---------------------------------------------------------------------------

test('scaffold — review service test environment is wired', async () => {
  assertSafeDatabaseUrl();
  // The actual service functions will be imported and exercised in Task 2.
  // For now we only assert that the seed/cleanup helpers round-trip the DB.
  const seed = await seedReviewTest();
  try {
    const review = await prisma.review.findUniqueOrThrow({ where: { id: seed.reviewId } });
    assert.equal(review.status, 'in_progress');
    assert.equal(review.reviewerId, seed.reviewerId);
  } finally {
    await cleanupReviewTest(seed);
  }
});

test('REQUIRED_ITEM_IDS mirror of QC-LEG-01 is non-empty', () => {
  assert.ok(REQUIRED_ITEM_IDS.length > 0);
  assert.ok(REQUIRED_ITEM_IDS.includes('formal-1'));
  assert.ok(REQUIRED_ITEM_IDS.includes('legal-1'));
});
