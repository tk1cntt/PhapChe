import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';

export const FOUNDATION_E2E_PREFIX = 'foundation_e2e';

type FoundationSeed = {
  suffix: string;
  workspaceId: string;
  userIds: string[];
  requestId: string;
  documentId: string;
  reviewId: string;
  vaultFileId: string;
  correlationPrefix: string;
};

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

  const request = await prisma.legalRequest.create({
    data: {
      workspaceId: workspace.id,
      title: `Foundation E2E request ${suffix}`,
      status: 'draft_intake',
      createdById: customer.id,
      assignedSpecialistId: specialist.id,
      assignedReviewerId: reviewer.id,
    },
  });

  await prisma.requestAssignment.createMany({
    data: [
      {
        requestId: request.id,
        userId: specialist.id,
        kind: 'specialist',
        createdById: coordinatorAdmin.id,
        reason: correlationPrefix,
      },
      {
        requestId: request.id,
        userId: reviewer.id,
        kind: 'reviewer',
        createdById: coordinatorAdmin.id,
        reason: correlationPrefix,
      },
    ],
  });

  const document = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      requestId: request.id,
      title: `Foundation E2E document ${suffix}`,
    },
  });

  const review = await prisma.review.create({
    data: {
      workspaceId: workspace.id,
      requestId: request.id,
      documentId: document.id,
      reviewerId: reviewer.id,
    },
  });

  const vaultFile = await prisma.vaultFile.create({
    data: {
      workspaceId: workspace.id,
      requestId: request.id,
      storageKey: `${FOUNDATION_E2E_PREFIX}/${suffix}/contract.pdf`,
      filename: `contract-${suffix}.pdf`,
    },
  });

  return {
    suffix,
    workspaceId: workspace.id,
    userIds: [customer.id, specialist.id, reviewer.id, coordinatorAdmin.id, superAdmin.id],
    requestId: request.id,
    documentId: document.id,
    reviewId: review.id,
    vaultFileId: vaultFile.id,
    correlationPrefix,
  };
}

async function cleanupFoundationE2E(seed: FoundationSeed | null) {
  if (!seed) return;

  // Cleanup stays scoped to seeded ids/prefix. Never use unscoped deleteMany({}).
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { workspaceId: seed.workspaceId },
        { targetId: { in: [seed.workspaceId, seed.requestId, seed.documentId, seed.reviewId, seed.vaultFileId, ...seed.userIds] } },
        { correlationId: { startsWith: seed.correlationPrefix } },
      ],
    },
  });
  await prisma.workflowTransition.deleteMany({ where: { requestId: seed.requestId } });
  await prisma.review.deleteMany({ where: { id: seed.reviewId, requestId: seed.requestId } });
  await prisma.document.deleteMany({ where: { id: seed.documentId, requestId: seed.requestId } });
  await prisma.vaultFile.deleteMany({ where: { id: seed.vaultFileId, requestId: seed.requestId } });
  await prisma.requestAssignment.deleteMany({ where: { requestId: seed.requestId } });
  await prisma.legalRequest.deleteMany({ where: { id: seed.requestId, workspaceId: seed.workspaceId } });
  await prisma.workspaceMembership.deleteMany({ where: { workspaceId: seed.workspaceId, userId: { in: seed.userIds } } });
  await prisma.user.deleteMany({
    where: {
      id: { in: seed.userIds },
      email: { startsWith: FOUNDATION_E2E_PREFIX },
    },
  });
  await prisma.workspace.deleteMany({
    where: {
      id: seed.workspaceId,
      slug: { startsWith: FOUNDATION_E2E_PREFIX },
    },
  });
}

async function assertCleanupRemovedSeed(seed: FoundationSeed) {
  const [workspaces, users, auditEvents] = await Promise.all([
    prisma.workspace.count({ where: { id: seed.workspaceId } }),
    prisma.user.count({ where: { id: { in: seed.userIds } } }),
    prisma.auditEvent.count({
      where: {
        OR: [
          { workspaceId: seed.workspaceId },
          { correlationId: { startsWith: seed.correlationPrefix } },
        ],
      },
    }),
  ]);

  assert.equal(workspaces, 0);
  assert.equal(users, 0);
  assert.equal(auditEvents, 0);
}

test('Phase 1 foundation uses real database safely', async () => {
  assertSafeDatabaseUrl();
  let seed: FoundationSeed | null = null;

  try {
    seed = await seedFoundationE2E();

    const persisted = await prisma.legalRequest.findUnique({
      where: { id: seed.requestId },
      include: {
        workspace: true,
        createdBy: true,
        assignedSpecialist: true,
        assignedReviewer: true,
        documents: true,
        reviews: true,
        vaultFiles: true,
      },
    });

    assert.equal(persisted?.workspaceId, seed.workspaceId);
    assert.equal(persisted?.status, 'draft_intake');
    assert.equal(persisted?.documents[0]?.id, seed.documentId);
    assert.equal(persisted?.reviews[0]?.id, seed.reviewId);
    assert.equal(persisted?.vaultFiles[0]?.id, seed.vaultFileId);
  } finally {
    await cleanupFoundationE2E(seed);
    if (seed) await assertCleanupRemovedSeed(seed);
    await prisma.$disconnect();
  }
});
