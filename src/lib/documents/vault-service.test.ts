import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { listVaultFiles, getVaultFileMetadata, requestVaultFileAccess, storeVaultFile, deleteVaultFile, verifyVaultFileAccessSignature } from './vault-service';
import type { AppSession } from '@/lib/security/session';

const VAULT_E2E_PREFIX = 'vault_service_e2e';

type VaultSeed = {
  suffix: string;
  workspaceId: string;
  otherWorkspaceId: string;
  coordinatorId: string;
  specialistId: string;
  customerId: string;
  otherCustomerId: string;
  requestId: string;
  otherRequestId: string;
  userIds: string[];
  correlationPrefix: string;
};

function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for vault service test');

  const url = new URL(databaseUrl);
  const databaseName = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run vault service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}

async function seedVaultTest(): Promise<VaultSeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const correlationPrefix = `${VAULT_E2E_PREFIX}_${suffix}`;

  const [workspace, otherWorkspace] = await Promise.all([
    prisma.workspace.create({ data: { name: `Vault Service ${suffix}`, slug: `${VAULT_E2E_PREFIX}-${suffix}` } }),
    prisma.workspace.create({ data: { name: `Vault Service Other ${suffix}`, slug: `${VAULT_E2E_PREFIX}-other-${suffix}` } }),
  ]);

  const [coordinator, specialist, customer, otherCustomer] = await Promise.all([
    prisma.user.create({
      data: {
        email: `${VAULT_E2E_PREFIX}_coord_${suffix}@example.test`,
        name: 'Coordinator',
        memberships: { create: { workspaceId: workspace.id, role: 'coordinator_admin' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${VAULT_E2E_PREFIX}_spec_${suffix}@example.test`,
        name: 'Specialist',
        memberships: { create: { workspaceId: workspace.id, role: 'specialist' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${VAULT_E2E_PREFIX}_cust_${suffix}@example.test`,
        name: 'Customer',
        memberships: { create: { workspaceId: workspace.id, role: 'customer' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${VAULT_E2E_PREFIX}_other_${suffix}@example.test`,
        name: 'Other Customer',
        memberships: { create: { workspaceId: otherWorkspace.id, role: 'customer' } },
      },
    }),
  ]);

  const [request, otherRequest] = await Promise.all([
    prisma.legalRequest.create({
      data: { workspaceId: workspace.id, title: `Vault request ${suffix}`, status: 'in_progress', createdById: customer.id },
    }),
    prisma.legalRequest.create({
      data: { workspaceId: otherWorkspace.id, title: `Vault other request ${suffix}`, status: 'in_progress', createdById: customer.id },
    }),
  ]);

  // Create vault files with different fileKinds
  await prisma.vaultFile.createMany({
    data: [
      {
        requestId: request.id,
        workspaceId: workspace.id,
        actorId: customer.id,
        filename: 'hop-dong.pdf',
        storageKey: `private/intake/${workspace.id}/${request.id}/hop-dong.pdf`,
        fileKind: 'intake_upload',
        source: 'customer_upload',
      },
      {
        requestId: request.id,
        workspaceId: workspace.id,
        actorId: specialist.id,
        filename: 'hop-dong-lao-dong-v1-2026.txt',
        storageKey: `private/drafts/${workspace.id}/${request.id}/draft-001.txt`,
        fileKind: 'generated_draft',
        source: 'template_generation',
      },
    ],
  });

  return {
    suffix,
    workspaceId: workspace.id,
    otherWorkspaceId: otherWorkspace.id,
    coordinatorId: coordinator.id,
    specialistId: specialist.id,
    customerId: customer.id,
    otherCustomerId: otherCustomer.id,
    requestId: request.id,
    otherRequestId: otherRequest.id,
    userIds: [coordinator.id, specialist.id, customer.id, otherCustomer.id],
    correlationPrefix,
  };
}

async function cleanupVaultTest(seed: VaultSeed | null) {
  if (!seed) return;

  const { workspaceId, otherWorkspaceId, requestId, otherRequestId, userIds } = seed;

  await prisma.auditEvent.deleteMany({ where: { workspaceId: { in: [workspaceId, otherWorkspaceId] } } });
  await prisma.vaultFile.deleteMany({ where: { requestId: { in: [requestId, otherRequestId] } } });
  await prisma.legalRequest.deleteMany({ where: { id: { in: [requestId, otherRequestId] } } });
  await prisma.workspaceMembership.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds }, email: { startsWith: VAULT_E2E_PREFIX } } });
  await prisma.workspace.deleteMany({ where: { id: { in: [workspaceId, otherWorkspaceId] } } });
}

async function withVaultSeed(run: (seed: VaultSeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: VaultSeed | null = null;

  try {
    seed = await seedVaultTest();
    await run(seed);
  } finally {
    await cleanupVaultTest(seed);
  }
}

function specialistSession(seed: VaultSeed): AppSession {
  return { userId: seed.specialistId, activeWorkspaceId: seed.workspaceId, roles: ['specialist'] };
}

function coordinatorSession(seed: VaultSeed): AppSession {
  return { userId: seed.coordinatorId, activeWorkspaceId: seed.workspaceId, roles: ['coordinator_admin'] };
}

function customerSession(seed: VaultSeed): AppSession {
  return { userId: seed.customerId, activeWorkspaceId: seed.workspaceId, roles: ['customer'] };
}

test('listVaultFiles returns only accessible files', async () => {
  await withVaultSeed(async (seed) => {
    const files = await listVaultFiles(specialistSession(seed), seed.requestId);

    assert.equal(files.length, 2);
    assert.equal(files.some((f) => f.fileKind === 'intake_upload'), true);
    assert.equal(files.some((f) => f.fileKind === 'generated_draft'), true);

    // Verify no storageKey exposed
    for (const file of files) {
      assert.equal(Object.hasOwn(file, 'storageKey'), false);
    }
  });
});

test('listVaultFiles filters by fileKind', async () => {
  await withVaultSeed(async (seed) => {
    const draftFiles = await listVaultFiles(specialistSession(seed), seed.requestId, { fileKind: 'generated_draft' });
    assert.equal(draftFiles.length, 1);
    assert.equal(draftFiles[0].fileKind, 'generated_draft');

    const uploadFiles = await listVaultFiles(specialistSession(seed), seed.requestId, { fileKind: 'intake_upload' });
    assert.equal(uploadFiles.length, 1);
    assert.equal(uploadFiles[0].fileKind, 'intake_upload');
  });
});

test('getVaultFileMetadata records audit event', async () => {
  await withVaultSeed(async (seed) => {
    // Get a vault file ID
    const files = await listVaultFiles(specialistSession(seed), seed.requestId);
    const vaultFileId = files[0].id;

    const metadata = await getVaultFileMetadata(specialistSession(seed), vaultFileId);

    assert.equal(metadata.id, vaultFileId);
    assert.equal(metadata.fileKind, 'intake_upload');

    // Verify audit event created
    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'vault.metadata_accessed', targetId: vaultFileId },
    });
    assert.ok(audit);

    // Verify metadataSummary does not include storageKey
    assert.doesNotMatch(audit?.metadataSummary ?? '', /storageKey/);
  });
});

test('requestVaultFileAccess returns signed access URL without storageKey', async () => {
  await withVaultSeed(async (seed) => {
    const files = await listVaultFiles(specialistSession(seed), seed.requestId);
    const vaultFileId = files[0].id;
    const before = Date.now();

    const result = await requestVaultFileAccess(specialistSession(seed), vaultFileId, `${seed.correlationPrefix}_access`);
    const url = new URL(result.accessUrl, 'http://localhost');
    const expires = url.searchParams.get('expires');
    const userId = url.searchParams.get('userId');
    const signature = url.searchParams.get('signature');
    const expiryDelta = result.expiresAt.getTime() - before;

    assert.equal(url.pathname, `/api/vault/${vaultFileId}/download`);
    assert.ok(expires);
    assert.equal(userId, seed.specialistId);
    assert.ok(signature);
    assert.equal(verifyVaultFileAccessSignature({ vaultFileId, userId, expires, signature }), true);
    assert.equal(verifyVaultFileAccessSignature({ vaultFileId, userId, expires: `${Number(expires) + 1}`, signature }), false);
    assert.equal(verifyVaultFileAccessSignature({ vaultFileId, userId: seed.customerId, expires, signature }), false);
    assert.equal(verifyVaultFileAccessSignature({ vaultFileId: `${vaultFileId}-tampered`, userId, expires, signature }), false);
    assert.equal(verifyVaultFileAccessSignature({ vaultFileId, userId, expires, signature: 'not-hex' }), false);
    assert.ok(expiryDelta <= 16 * 60 * 1000, `expiresAt should be <= 16 minutes, got ${expiryDelta}`);
    assert.ok(expiryDelta >= 14 * 60 * 1000, `expiresAt should be >= 14 minutes, got ${expiryDelta}`);

    // Verify storageKey not in response
    assert.doesNotMatch(JSON.stringify(result), /storageKey/);
  });
});

test('RBAC - user without request access gets FORBIDDEN', async () => {
  await withVaultSeed(async (seed) => {
    // List files from different workspace - should fail
    await assert.rejects(
      listVaultFiles(specialistSession(seed), seed.otherRequestId),
      /FORBIDDEN/,
    );

    // Get metadata from different workspace - should fail
    const otherFiles = await listVaultFiles({ userId: seed.otherCustomerId, activeWorkspaceId: seed.otherWorkspaceId, roles: ['customer'] }, seed.requestId);
    const vaultFileId = otherFiles[0].id;
    await assert.rejects(
      getVaultFileMetadata(specialistSession(seed), vaultFileId),
      /FORBIDDEN/,
    );
  });
});

test('deleteVaultFile requires coordinator_admin role', async () => {
  await withVaultSeed(async (seed) => {
    const files = await listVaultFiles(specialistSession(seed), seed.requestId);
    const vaultFileId = files[0].id;

    // Specialist tries to delete - should fail
    await assert.rejects(
      deleteVaultFile(specialistSession(seed), vaultFileId, `${seed.correlationPrefix}_spec_delete`),
      /FORBIDDEN/,
    );

    // Coordinator deletes successfully
    const result = await deleteVaultFile(coordinatorSession(seed), vaultFileId, `${seed.correlationPrefix}_coord_delete`);
    assert.equal(result.deleted, true);

    // Verify file marked as deleted
    const deletedFile = await prisma.vaultFile.findUniqueOrThrow({ where: { id: vaultFileId } });
    assert.equal(deletedFile.fileKind, '_deleted');
  });
});

test('storeVaultFile creates file with audit event', async () => {
  await withVaultSeed(async (seed) => {
    const result = await storeVaultFile({
      session: specialistSession(seed),
      requestId: seed.requestId,
      storageKey: `private/uploads/${seed.workspaceId}/${seed.requestId}/test-file.pdf`,
      filename: 'test-file.pdf',
      fileKind: 'custom',
      source: 'manual_upload',
      size: 1024,
      contentType: 'application/pdf',
      correlationId: `${seed.correlationPrefix}_store`,
    });

    assert.ok(result.id);
    assert.equal(result.filename, 'test-file.pdf');
    assert.equal(result.fileKind, 'custom');

    // Verify audit event
    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'vault.file_stored', targetId: result.id },
    });
    assert.ok(audit);
    assert.match(audit?.metadataSummary ?? '', /test-file\.pdf/);
  });
});