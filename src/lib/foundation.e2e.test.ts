import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { createAdminUser, updateAdminUserRole, deactivateAdminUser, assignUserToWorkspace } from '@/lib/admin/users';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessDocument, canAccessRequest, canAccessReview, canAccessVaultFile, canAccessWorkspace } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';
import { getAllowedTransitions, transitionRequestStatus } from '@/lib/workflow/request-workflow';

export const FOUNDATION_E2E_PREFIX = 'foundation_e2e';

type FoundationSeed = {
  suffix: string;
  workspaceId: string;
  customerId: string;
  specialistId: string;
  reviewerId: string;
  coordinatorAdminId: string;
  superAdminId: string;
  unrelatedUserId: string;
  adminManagedUserId?: string;
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

  const unrelatedUser = await prisma.user.create({
    data: {
      email: `${FOUNDATION_E2E_PREFIX}_unrelated_${suffix}@example.test`,
      name: 'Foundation E2E unrelated',
    },
  });

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
    customerId: customer.id,
    specialistId: specialist.id,
    reviewerId: reviewer.id,
    coordinatorAdminId: coordinatorAdmin.id,
    superAdminId: superAdmin.id,
    unrelatedUserId: unrelatedUser.id,
    userIds: [customer.id, specialist.id, reviewer.id, coordinatorAdmin.id, superAdmin.id, unrelatedUser.id],
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

    const customerSession: AppSession = { userId: seed.customerId, activeWorkspaceId: seed.workspaceId, roles: ['customer'] };
    const specialistSession: AppSession = { userId: seed.specialistId, activeWorkspaceId: seed.workspaceId, roles: ['specialist'] };
    const reviewerSession: AppSession = { userId: seed.reviewerId, activeWorkspaceId: seed.workspaceId, roles: ['reviewer'] };
    const coordinatorSession: AppSession = { userId: seed.coordinatorAdminId, activeWorkspaceId: seed.workspaceId, roles: ['coordinator_admin'] };
    const superAdminSession: AppSession = { userId: seed.superAdminId, activeWorkspaceId: seed.workspaceId, roles: ['super_admin'] };
    const unrelatedSession: AppSession = { userId: seed.unrelatedUserId, activeWorkspaceId: null, roles: ['customer'] };

    assert.equal(await canAccessWorkspace(coordinatorSession, seed.workspaceId), true);
    assert.equal(await canAccessWorkspace(superAdminSession, seed.workspaceId), true);
    assert.equal(await canAccessRequest(customerSession, seed.requestId), true);
    assert.equal(await canAccessRequest(specialistSession, seed.requestId), true);
    assert.equal(await canAccessReview(reviewerSession, seed.reviewId), true);
    assert.equal(await canAccessDocument(customerSession, seed.documentId), true);
    assert.equal(await canAccessVaultFile(customerSession, seed.vaultFileId), true);
    assert.equal(await canAccessRequest(unrelatedSession, seed.requestId), false);

    await prisma.user.update({ where: { id: seed.unrelatedUserId }, data: { isActive: false } });
    assert.equal(await canAccessWorkspace(unrelatedSession, seed.workspaceId), false);

    await recordAuditEvent({
      actorId: seed.coordinatorAdminId,
      workspaceId: seed.workspaceId,
      action: 'foundation.e2e_checked',
      targetType: 'REQUEST',
      targetId: seed.requestId,
      requestId: seed.requestId,
      correlationId: `${seed.correlationPrefix}_audit`,
      metadataSummary: 'phase1 foundation audit check',
    });
    assert.equal(await prisma.auditEvent.count({ where: { correlationId: `${seed.correlationPrefix}_audit` } }), 1);
    await assert.rejects(
      recordAuditEvent({
        actorId: seed.coordinatorAdminId,
        workspaceId: seed.workspaceId,
        action: 'foundation.e2e_bad_metadata',
        targetType: 'REQUEST',
        targetId: seed.requestId,
        correlationId: `${seed.correlationPrefix}_bad_metadata`,
        metadataSummary: { unsafe: true } as never,
      }),
      /metadataSummary must be a string/,
    );
    await assert.rejects(
      recordAuditEvent({
        actorId: seed.coordinatorAdminId,
        workspaceId: seed.workspaceId,
        action: 'foundation.e2e_long_metadata',
        targetType: 'REQUEST',
        targetId: seed.requestId,
        correlationId: `${seed.correlationPrefix}_long_metadata`,
        metadataSummary: 'x'.repeat(501),
      }),
      /metadataSummary must be 500 characters or fewer/,
    );

    assert.deepEqual(getAllowedTransitions('draft_intake'), ['intake_submitted', 'cancelled']);
    const transitioned = await transitionRequestStatus({
      requestId: seed.requestId,
      actorId: seed.customerId,
      toStatus: 'intake_submitted',
      reason: 'foundation e2e transition',
      correlationId: `${seed.correlationPrefix}_workflow`,
    });
    assert.equal(transitioned.status, 'intake_submitted');
    assert.equal((await prisma.legalRequest.findUnique({ where: { id: seed.requestId } }))?.status, 'intake_submitted');
    assert.equal(await prisma.workflowTransition.count({ where: { requestId: seed.requestId, fromStatus: 'draft_intake', toStatus: 'intake_submitted' } }), 1);
    assert.equal(await prisma.auditEvent.count({ where: { requestId: seed.requestId, action: 'request.status_changed', correlationId: `${seed.correlationPrefix}_workflow` } }), 1);

    const managedUser = await createAdminUser({
      actor: coordinatorSession,
      input: {
        email: `${FOUNDATION_E2E_PREFIX}_managed_${seed.suffix}@example.test`,
        name: 'Foundation E2E managed',
        role: 'customer',
        workspaceId: seed.workspaceId,
        correlationId: `${seed.correlationPrefix}_admin_create`,
      },
    });
    seed.adminManagedUserId = managedUser.id;
    seed.userIds.push(managedUser.id);
    assert.equal(await prisma.auditEvent.count({ where: { action: 'user.created', targetId: managedUser.id } }), 1);

    const updatedMembership = await updateAdminUserRole({
      actor: coordinatorSession,
      input: {
        userId: managedUser.id,
        role: 'specialist',
        workspaceId: seed.workspaceId,
        correlationId: `${seed.correlationPrefix}_admin_role`,
      },
    });
    assert.equal(updatedMembership.role, 'specialist');
    assert.equal(await prisma.auditEvent.count({ where: { action: 'user.role_updated', targetId: managedUser.id } }), 1);

    await assignUserToWorkspace({
      actor: coordinatorSession,
      input: {
        userId: managedUser.id,
        role: 'reviewer',
        workspaceId: seed.workspaceId,
        correlationId: `${seed.correlationPrefix}_admin_assign`,
      },
    });
    assert.equal(await prisma.workspaceMembership.count({ where: { userId: managedUser.id, workspaceId: seed.workspaceId, role: 'reviewer', isActive: true } }), 1);
    assert.equal(await prisma.auditEvent.count({ where: { action: 'workspace.membership_assigned' } }), 1);

    const deactivatedUser = await deactivateAdminUser({
      actor: coordinatorSession,
      input: {
        userId: managedUser.id,
        workspaceId: seed.workspaceId,
        correlationId: `${seed.correlationPrefix}_admin_deactivate`,
      },
    });
    assert.equal(deactivatedUser.isActive, false);
    assert.equal((await prisma.user.findUnique({ where: { id: managedUser.id } }))?.isActive, false);
    assert.equal(await prisma.auditEvent.count({ where: { action: 'user.deactivated', targetId: managedUser.id } }), 1);
  } finally {
    await cleanupFoundationE2E(seed);
    if (seed) await assertCleanupRemovedSeed(seed);
    await prisma.$disconnect();
  }
});
