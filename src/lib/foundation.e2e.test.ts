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

async function withFoundationSeed(run: (seed: FoundationSeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: FoundationSeed | null = null;

  try {
    seed = await seedFoundationE2E();
    await run(seed);
  } finally {
    await cleanupFoundationE2E(seed);
    if (seed) await assertCleanupRemovedSeed(seed);
  }
}

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

test('foundation e2e: database schema and relations persist', async () => {
  await withFoundationSeed(async (seed) => {
    const persisted = await prisma.legalRequest.findUnique({
      where: { id: seed.requestId },
      include: {
        workspace: true,
        createdBy: true,
        assignedSpecialist: true,
        assignedReviewer: true,
        assignments: true,
        documents: true,
        reviews: true,
        vaultFiles: true,
      },
    });

    assert.equal(persisted?.workspaceId, seed.workspaceId);
    assert.equal(persisted?.workspace.slug.startsWith(FOUNDATION_E2E_PREFIX), true);
    assert.equal(persisted?.createdById, seed.customerId);
    assert.equal(persisted?.assignedSpecialistId, seed.specialistId);
    assert.equal(persisted?.assignedReviewerId, seed.reviewerId);
    assert.equal(persisted?.status, 'draft_intake');
    assert.equal(persisted?.assignments.length, 2);
    assert.equal(persisted?.documents[0]?.id, seed.documentId);
    assert.equal(persisted?.reviews[0]?.id, seed.reviewId);
    assert.equal(persisted?.vaultFiles[0]?.id, seed.vaultFileId);
  });
});

test('foundation e2e: RBAC allows assigned resources and denies unrelated or inactive access', async () => {
  await withFoundationSeed(async (seed) => {
    const actor = sessions(seed);

    assert.equal(await canAccessWorkspace(actor.coordinator, seed.workspaceId), true);
    assert.equal(await canAccessWorkspace(actor.superAdmin, seed.workspaceId), true);
    assert.equal(await canAccessRequest(actor.customer, seed.requestId), true);
    assert.equal(await canAccessRequest(actor.specialist, seed.requestId), true);
    assert.equal(await canAccessReview(actor.reviewer, seed.reviewId), true);
    assert.equal(await canAccessDocument(actor.customer, seed.documentId), true);
    assert.equal(await canAccessVaultFile(actor.customer, seed.vaultFileId), true);
    assert.equal(await canAccessRequest(actor.unrelated, seed.requestId), false);
    assert.equal(await canAccessWorkspace(actor.unrelated, seed.workspaceId), false);

    await prisma.user.update({ where: { id: seed.customerId }, data: { isActive: false } });
    assert.equal(await canAccessRequest(actor.customer, seed.requestId), false);
  });
});

test('foundation e2e: audit writer persists safe summaries and rejects unsafe metadata', async () => {
  await withFoundationSeed(async (seed) => {
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

    const audit = await prisma.auditEvent.findFirst({ where: { correlationId: `${seed.correlationPrefix}_audit` } });
    assert.equal(audit?.metadataSummary, 'phase1 foundation audit check');
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
  });
});

test('foundation e2e: workflow transitions enforce allowed paths and persist audit trail', async () => {
  await withFoundationSeed(async (seed) => {
    assert.deepEqual(getAllowedTransitions('draft_intake'), ['intake_submitted', 'cancelled']);
    await assert.rejects(
      transitionRequestStatus({
        requestId: seed.requestId,
        actorId: seed.customerId,
        toStatus: 'approved',
        reason: 'invalid jump',
        correlationId: `${seed.correlationPrefix}_invalid_workflow`,
      }),
      /INVALID_REQUEST_TRANSITION/,
    );
    assert.equal((await prisma.legalRequest.findUnique({ where: { id: seed.requestId } }))?.status, 'draft_intake');

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
  });
});

test('foundation e2e: admin user service mutates users, memberships, and audit rows', async () => {
  await withFoundationSeed(async (seed) => {
    const actor = sessions(seed);
    const managedUser = await createAdminUser({
      actor: actor.coordinator,
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
      actor: actor.coordinator,
      input: {
        userId: managedUser.id,
        role: 'specialist',
        workspaceId: seed.workspaceId,
        correlationId: `${seed.correlationPrefix}_admin_role`,
      },
    });
    assert.equal(updatedMembership.role, 'specialist');
    assert.equal(await prisma.auditEvent.count({ where: { action: 'user.role_updated', targetId: managedUser.id } }), 1);

    const assignedMembership = await assignUserToWorkspace({
      actor: actor.coordinator,
      input: {
        userId: managedUser.id,
        role: 'reviewer',
        workspaceId: seed.workspaceId,
        correlationId: `${seed.correlationPrefix}_admin_assign`,
      },
    });
    assert.equal(await prisma.workspaceMembership.count({ where: { userId: managedUser.id, workspaceId: seed.workspaceId, role: 'reviewer', isActive: true } }), 1);
    assert.equal(await prisma.auditEvent.count({ where: { action: 'workspace.membership_assigned', targetId: assignedMembership.id } }), 1);

    const deactivatedUser = await deactivateAdminUser({
      actor: actor.coordinator,
      input: {
        userId: managedUser.id,
        workspaceId: seed.workspaceId,
        correlationId: `${seed.correlationPrefix}_admin_deactivate`,
      },
    });
    assert.equal(deactivatedUser.isActive, false);
    assert.equal((await prisma.user.findUnique({ where: { id: managedUser.id } }))?.isActive, false);
    assert.equal(await prisma.auditEvent.count({ where: { action: 'user.deactivated', targetId: managedUser.id } }), 1);
  });
});

test('foundation e2e: User can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    const user = await prisma.user.create({ data: { email: `${FOUNDATION_E2E_PREFIX}_user_insert_${seed.suffix}@example.test`, name: 'Inserted user' } });
    seed.userIds.push(user.id);
    assert.equal(user.isActive, true);
    assert.equal((await prisma.user.findUnique({ where: { id: user.id } }))?.email, user.email);
  });
});

test('foundation e2e: User can be updated', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.user.update({ where: { id: seed.customerId }, data: { name: 'Updated customer' } });
    assert.equal(updated.name, 'Updated customer');
  });
});

test('foundation e2e: User can be deactivated', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.user.update({ where: { id: seed.customerId }, data: { isActive: false } });
    assert.equal(updated.isActive, false);
  });
});

test('foundation e2e: User cleanup deletes seeded users', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.user.count({ where: { id: { in: seed.userIds } } }), 0);
});

test('foundation e2e: Workspace can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    assert.equal((await prisma.workspace.findUnique({ where: { id: seed.workspaceId } }))?.slug.startsWith(FOUNDATION_E2E_PREFIX), true);
  });
});

test('foundation e2e: Workspace can be updated', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.workspace.update({ where: { id: seed.workspaceId }, data: { name: 'Updated workspace' } });
    assert.equal(updated.name, 'Updated workspace');
  });
});

test('foundation e2e: Workspace can be deactivated', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.workspace.update({ where: { id: seed.workspaceId }, data: { isActive: false } });
    assert.equal(updated.isActive, false);
  });
});

test('foundation e2e: Workspace cleanup deletes seeded workspace', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.workspace.count({ where: { id: seed.workspaceId } }), 0);
});

test('foundation e2e: Membership can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    const membership = await prisma.workspaceMembership.create({ data: { userId: seed.unrelatedUserId, workspaceId: seed.workspaceId, role: 'customer' } });
    assert.equal(membership.isActive, true);
  });
});

test('foundation e2e: Membership can be updated', async () => {
  await withFoundationSeed(async (seed) => {
    const membership = await prisma.workspaceMembership.findFirstOrThrow({ where: { userId: seed.customerId, workspaceId: seed.workspaceId, role: 'customer' } });
    const updated = await prisma.workspaceMembership.update({ where: { id: membership.id }, data: { isActive: false } });
    assert.equal(updated.isActive, false);
  });
});

test('foundation e2e: Membership cleanup deletes seeded memberships', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.workspaceMembership.count({ where: { workspaceId: seed.workspaceId } }), 0);
});

test('foundation e2e: LegalRequest can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    const request = await prisma.legalRequest.findUnique({ where: { id: seed.requestId } });
    assert.equal(request?.title, `Foundation E2E request ${seed.suffix}`);
  });
});

test('foundation e2e: LegalRequest title can be updated', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.legalRequest.update({ where: { id: seed.requestId }, data: { title: 'Updated request title' } });
    assert.equal(updated.title, 'Updated request title');
  });
});

test('foundation e2e: LegalRequest status can be updated through lifecycle', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.legalRequest.update({ where: { id: seed.requestId }, data: { status: 'triage' } });
    assert.equal(updated.status, 'triage');
  });
});

test('foundation e2e: LegalRequest cleanup deletes seeded request', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.legalRequest.count({ where: { id: seed.requestId } }), 0);
});

test('foundation e2e: Assignment can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    const assignment = await prisma.requestAssignment.create({ data: { requestId: seed.requestId, userId: seed.specialistId, kind: 'specialist', createdById: seed.coordinatorAdminId, reason: `${seed.correlationPrefix}_extra_assignment` } });
    assert.equal(assignment.kind, 'specialist');
  });
});

test('foundation e2e: Assignment reason persists as lifecycle metadata', async () => {
  await withFoundationSeed(async (seed) => {
    const assignment = await prisma.requestAssignment.findFirstOrThrow({ where: { requestId: seed.requestId, kind: 'specialist' } });
    assert.equal(assignment.reason, seed.correlationPrefix);
  });
});

test('foundation e2e: Assignment cleanup deletes seeded assignments', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.requestAssignment.count({ where: { requestId: seed.requestId } }), 0);
});

test('foundation e2e: Document can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    assert.equal((await prisma.document.findUnique({ where: { id: seed.documentId } }))?.title, `Foundation E2E document ${seed.suffix}`);
  });
});

test('foundation e2e: Document can be updated', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.document.update({ where: { id: seed.documentId }, data: { title: 'Updated document title' } });
    assert.equal(updated.title, 'Updated document title');
  });
});

test('foundation e2e: Document cleanup deletes seeded document', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.document.count({ where: { id: seed.documentId } }), 0);
});

test('foundation e2e: Review can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    const review = await prisma.review.findUnique({ where: { id: seed.reviewId } });
    assert.equal(review?.reviewerId, seed.reviewerId);
  });
});

test('foundation e2e: Review relation can be updated to another reviewer', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.review.update({ where: { id: seed.reviewId }, data: { reviewerId: seed.superAdminId } });
    assert.equal(updated.reviewerId, seed.superAdminId);
  });
});

test('foundation e2e: Review cleanup deletes seeded review', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.review.count({ where: { id: seed.reviewId } }), 0);
});

test('foundation e2e: VaultFile can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    assert.equal((await prisma.vaultFile.findUnique({ where: { id: seed.vaultFileId } }))?.filename, `contract-${seed.suffix}.pdf`);
  });
});

test('foundation e2e: VaultFile can be updated', async () => {
  await withFoundationSeed(async (seed) => {
    const updated = await prisma.vaultFile.update({ where: { id: seed.vaultFileId }, data: { filename: 'updated-contract.pdf', storageKey: `${FOUNDATION_E2E_PREFIX}/${seed.suffix}/updated.pdf` } });
    assert.equal(updated.filename, 'updated-contract.pdf');
  });
});

test('foundation e2e: VaultFile cleanup deletes seeded file', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.vaultFile.count({ where: { id: seed.vaultFileId } }), 0);
});

test('foundation e2e: WorkflowTransition can be inserted by workflow service', async () => {
  await withFoundationSeed(async (seed) => {
    await transitionRequestStatus({ requestId: seed.requestId, actorId: seed.customerId, toStatus: 'intake_submitted', reason: 'workflow insert', correlationId: `${seed.correlationPrefix}_workflow_insert` });
    assert.equal(await prisma.workflowTransition.count({ where: { requestId: seed.requestId } }), 1);
  });
});

test('foundation e2e: WorkflowTransition relation points to actor and request', async () => {
  await withFoundationSeed(async (seed) => {
    await transitionRequestStatus({ requestId: seed.requestId, actorId: seed.customerId, toStatus: 'intake_submitted', reason: 'workflow relation', correlationId: `${seed.correlationPrefix}_workflow_relation` });
    const transition = await prisma.workflowTransition.findFirstOrThrow({ where: { requestId: seed.requestId }, include: { actor: true, request: true } });
    assert.equal(transition.actor.id, seed.customerId);
    assert.equal(transition.request.id, seed.requestId);
  });
});

test('foundation e2e: WorkflowTransition cleanup deletes seeded transitions', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await transitionRequestStatus({ requestId: seed.requestId, actorId: seed.customerId, toStatus: 'intake_submitted', reason: 'workflow cleanup', correlationId: `${seed.correlationPrefix}_workflow_cleanup` });
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.workflowTransition.count({ where: { requestId: seed.requestId } }), 0);
});

test('foundation e2e: AuditEvent can be inserted', async () => {
  await withFoundationSeed(async (seed) => {
    await recordAuditEvent({ actorId: seed.coordinatorAdminId, workspaceId: seed.workspaceId, action: 'foundation.audit_inserted', targetType: 'REQUEST', targetId: seed.requestId, requestId: seed.requestId, correlationId: `${seed.correlationPrefix}_audit_insert`, metadataSummary: 'audit insert' });
    assert.equal(await prisma.auditEvent.count({ where: { correlationId: `${seed.correlationPrefix}_audit_insert` } }), 1);
  });
});

test('foundation e2e: AuditEvent stores nullable actor and request safely', async () => {
  await withFoundationSeed(async (seed) => {
    await recordAuditEvent({ actorId: null, workspaceId: seed.workspaceId, action: 'foundation.audit_system', targetType: 'WORKSPACE', targetId: seed.workspaceId, correlationId: `${seed.correlationPrefix}_audit_system`, metadataSummary: 'system audit' });
    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { correlationId: `${seed.correlationPrefix}_audit_system` } });
    assert.equal(audit.actorId, null);
    assert.equal(audit.requestId, null);
  });
});

test('foundation e2e: AuditEvent cleanup deletes seeded audit rows', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();
  await recordAuditEvent({ actorId: seed.coordinatorAdminId, workspaceId: seed.workspaceId, action: 'foundation.audit_cleanup', targetType: 'WORKSPACE', targetId: seed.workspaceId, correlationId: `${seed.correlationPrefix}_audit_cleanup`, metadataSummary: 'audit cleanup' });
  await cleanupFoundationE2E(seed);
  assert.equal(await prisma.auditEvent.count({ where: { correlationId: { startsWith: seed.correlationPrefix } } }), 0);
});

test('foundation e2e: cleanup is scoped and repeatable', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedFoundationE2E();

  await recordAuditEvent({
    actorId: seed.coordinatorAdminId,
    workspaceId: seed.workspaceId,
    action: 'foundation.e2e_cleanup_marker',
    targetType: 'WORKSPACE',
    targetId: seed.workspaceId,
    correlationId: `${seed.correlationPrefix}_cleanup`,
    metadataSummary: 'cleanup marker',
  });

  await cleanupFoundationE2E(seed);
  await cleanupFoundationE2E(seed);
  await assertCleanupRemovedSeed(seed);
});
