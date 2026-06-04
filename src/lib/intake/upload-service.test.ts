import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import type { AppSession } from '@/lib/security/session';
import { attachIntakeFile } from './upload-service';

const UPLOAD_E2E_PREFIX = 'intake_upload_e2e';

type UploadSeed = {
  suffix: string;
  workspaceId: string;
  otherWorkspaceId: string;
  customerId: string;
  otherCustomerId: string;
  requestId: string;
  otherRequestId: string;
  userIds: string[];
  correlationPrefix: string;
};

function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for upload service test');

  const url = new URL(databaseUrl);
  const databaseName = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run upload service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}

async function seedUploadTest(): Promise<UploadSeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const correlationPrefix = `${UPLOAD_E2E_PREFIX}_${suffix}`;
  const [workspace, otherWorkspace] = await Promise.all([
    prisma.workspace.create({ data: { name: `Intake Upload ${suffix}`, slug: `${UPLOAD_E2E_PREFIX}-${suffix}` } }),
    prisma.workspace.create({ data: { name: `Intake Upload Other ${suffix}`, slug: `${UPLOAD_E2E_PREFIX}-other-${suffix}` } }),
  ]);

  const [customer, otherCustomer] = await Promise.all([
    prisma.user.create({
      data: {
        email: `${UPLOAD_E2E_PREFIX}_customer_${suffix}@example.test`,
        name: 'Intake Upload customer',
        memberships: { create: { workspaceId: workspace.id, role: 'customer' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${UPLOAD_E2E_PREFIX}_other_${suffix}@example.test`,
        name: 'Intake Upload other customer',
        memberships: { create: { workspaceId: otherWorkspace.id, role: 'customer' } },
      },
    }),
  ]);

  const [request, otherRequest] = await Promise.all([
    prisma.legalRequest.create({
      data: { workspaceId: workspace.id, title: `Upload request ${suffix}`, status: 'draft_intake', createdById: customer.id },
    }),
    prisma.legalRequest.create({
      data: { workspaceId: otherWorkspace.id, title: `Upload other request ${suffix}`, status: 'draft_intake', createdById: otherCustomer.id },
    }),
  ]);

  return {
    suffix,
    workspaceId: workspace.id,
    otherWorkspaceId: otherWorkspace.id,
    customerId: customer.id,
    otherCustomerId: otherCustomer.id,
    requestId: request.id,
    otherRequestId: otherRequest.id,
    userIds: [customer.id, otherCustomer.id],
    correlationPrefix,
  };
}

async function cleanupUploadTest(seed: UploadSeed | null) {
  if (!seed) return;

  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { workspaceId: { in: [seed.workspaceId, seed.otherWorkspaceId] } },
        { correlationId: { startsWith: seed.correlationPrefix } },
      ],
    },
  });
  await prisma.vaultFile.deleteMany({ where: { requestId: { in: [seed.requestId, seed.otherRequestId] } } });
  await prisma.legalRequest.deleteMany({ where: { id: { in: [seed.requestId, seed.otherRequestId] } } });
  await prisma.workspaceMembership.deleteMany({ where: { userId: { in: seed.userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: seed.userIds }, email: { startsWith: UPLOAD_E2E_PREFIX } } });
  await prisma.workspace.deleteMany({ where: { id: { in: [seed.workspaceId, seed.otherWorkspaceId] } } });
}

async function withUploadSeed(run: (seed: UploadSeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: UploadSeed | null = null;

  try {
    seed = await seedUploadTest();
    await run(seed);
  } finally {
    await cleanupUploadTest(seed);
  }
}

function customerSession(seed: UploadSeed): AppSession {
  return { userId: seed.customerId, activeWorkspaceId: seed.workspaceId, roles: ['customer'] };
}

function sampleFile() {
  return {
    name: 'hop-dong-dai-ly.pdf',
    size: 128,
    type: 'application/pdf',
    arrayBuffer: async () => Buffer.from('fake pdf bytes').buffer,
  };
}

test('authorized customer can attach private file metadata to own request', async () => {
  await withUploadSeed(async (seed) => {
    const result = await attachIntakeFile({
      session: customerSession(seed),
      requestId: seed.requestId,
      file: sampleFile(),
      correlationId: `${seed.correlationPrefix}_authorized`,
    });

    assert.equal(result.filename, 'hop-dong-dai-ly.pdf');
    assert.equal(result.size, 128);
    assert.equal(result.contentType, 'application/pdf');
    assert.equal(result.private, true);
    assert.equal('storageKey' in result, false);
    assert.equal('publicUrl' in result, false);
    assert.ok(result.vaultFileId);
  });
});

test('service rejects attaching file outside accessible workspace', async () => {
  await withUploadSeed(async (seed) => {
    await assert.rejects(
      attachIntakeFile({
        session: customerSession(seed),
        requestId: seed.otherRequestId,
        file: sampleFile(),
        correlationId: `${seed.correlationPrefix}_forbidden`,
      }),
      /FORBIDDEN/,
    );
  });
});

test('service creates VaultFile with private storageKey and no public URL field', async () => {
  await withUploadSeed(async (seed) => {
    const result = await attachIntakeFile({
      session: customerSession(seed),
      requestId: seed.requestId,
      file: sampleFile(),
      correlationId: `${seed.correlationPrefix}_private`,
    });

    const vaultFile = await prisma.vaultFile.findUniqueOrThrow({ where: { id: result.vaultFileId } });
    assert.equal(vaultFile.workspaceId, seed.workspaceId);
    assert.equal(vaultFile.requestId, seed.requestId);
    assert.equal(vaultFile.filename, 'hop-dong-dai-ly.pdf');
    assert.match(vaultFile.storageKey, /^private\/intake\//);
    assert.equal(Object.hasOwn(vaultFile, 'publicUrl'), false);
  });
});

test('storeVaultFile records vault.file_stored audit event', async () => {
  await withUploadSeed(async (seed) => {
    const correlationId = `${seed.correlationPrefix}_audit`;
    await attachIntakeFile({
      session: customerSession(seed),
      requestId: seed.requestId,
      file: sampleFile(),
      correlationId,
    });

    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { correlationId } });
    assert.equal(audit.action, 'vault.file_stored');
    assert.equal(audit.targetType, 'vault_file');
    assert.equal(audit.requestId, seed.requestId);
    assert.match(audit.metadataSummary ?? '', /filename=hop-dong-dai-ly\.pdf/);
    assert.doesNotMatch(audit.metadataSummary ?? '', /storageKey/);
  });
});
