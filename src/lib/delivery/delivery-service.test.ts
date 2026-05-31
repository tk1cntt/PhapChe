import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import type { AppSession } from '@/lib/security/session';
import { getCustomerDeliveryRequest } from './delivery-service';
import { requestVaultFileAccess } from '@/lib/documents/vault-service';

const DELIVERY_E2E_PREFIX = 'delivery_service_e2e';

type DeliverySeed = {
  suffix: string;
  workspaceId: string;
  otherWorkspaceId: string;
  customerId: string;
  otherCustomerId: string;
  requestId: string;
  documentId: string;
  finalVersionId: string;
  draftVersionId: string;
  finalVaultFileId: string;
  draftVaultFileId: string;
  userIds: string[];
};

function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for delivery service test');

  const url = new URL(databaseUrl);
  const databaseName = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run delivery service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}

async function seedDeliveryTest(): Promise<DeliverySeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const [workspace, otherWorkspace] = await Promise.all([
    prisma.workspace.create({ data: { name: `Delivery Service ${suffix}`, slug: `${DELIVERY_E2E_PREFIX}-${suffix}` } }),
    prisma.workspace.create({ data: { name: `Delivery Service Other ${suffix}`, slug: `${DELIVERY_E2E_PREFIX}-other-${suffix}` } }),
  ]);

  const [customer, otherCustomer] = await Promise.all([
    prisma.user.create({
      data: {
        email: `${DELIVERY_E2E_PREFIX}_cust_${suffix}@example.test`,
        name: 'Customer',
        memberships: { create: { workspaceId: workspace.id, role: 'customer' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${DELIVERY_E2E_PREFIX}_other_${suffix}@example.test`,
        name: 'Other Customer',
        memberships: { create: { workspaceId: otherWorkspace.id, role: 'customer' } },
      },
    }),
  ]);

  const request = await prisma.legalRequest.create({
    data: { workspaceId: workspace.id, title: `Delivery request ${suffix}`, status: 'delivered', createdById: customer.id },
  });

  const document = await prisma.document.create({
    data: { workspaceId: workspace.id, requestId: request.id, title: 'Hợp đồng đại lý' },
  });

  const [finalVersion, draftVersion] = await Promise.all([
    prisma.documentVersion.create({
      data: {
        documentId: document.id,
        templateId: `template-final-${suffix}`,
        templateVersion: 2,
        status: 'final',
        inputSnapshot: { hidden: 'inputSnapshot final secret' },
        generatedContent: 'generatedContent final secret',
      },
    }),
    prisma.documentVersion.create({
      data: {
        documentId: document.id,
        templateId: `template-draft-${suffix}`,
        templateVersion: 1,
        status: 'draft',
        inputSnapshot: { hidden: 'inputSnapshot draft secret' },
        generatedContent: 'generatedContent draft secret',
      },
    }),
  ]);

  const [finalVaultFile, draftVaultFile] = await Promise.all([
    prisma.vaultFile.create({
      data: {
        requestId: request.id,
        workspaceId: workspace.id,
        actorId: customer.id,
        filename: 'hop-dong-final.pdf',
        storageKey: `private/final/${workspace.id}/${request.id}/storageKey-final.pdf`,
        fileKind: 'final_document',
        source: 'review_approval',
        documentVersionId: finalVersion.id,
        size: 2048,
        contentType: 'application/pdf',
      },
    }),
    prisma.vaultFile.create({
      data: {
        requestId: request.id,
        workspaceId: workspace.id,
        actorId: customer.id,
        filename: 'hop-dong-draft.pdf',
        storageKey: `private/draft/${workspace.id}/${request.id}/storageKey-draft.pdf`,
        fileKind: 'generated_draft',
        source: 'template_generation',
        documentVersionId: draftVersion.id,
        size: 1024,
        contentType: 'application/pdf',
      },
    }),
  ]);

  await prisma.review.create({
    data: {
      workspaceId: workspace.id,
      requestId: request.id,
      documentId: document.id,
      reviewerId: customer.id,
      documentVersionId: finalVersion.id,
      status: 'approved',
      decision: 'approve',
      generalComment: 'review comment secret',
      checklistAnswers: { create: { checklistItemId: `checklist-${suffix}`, passed: true, comment: 'checklist comment secret' } },
    },
  });

  return {
    suffix,
    workspaceId: workspace.id,
    otherWorkspaceId: otherWorkspace.id,
    customerId: customer.id,
    otherCustomerId: otherCustomer.id,
    requestId: request.id,
    documentId: document.id,
    finalVersionId: finalVersion.id,
    draftVersionId: draftVersion.id,
    finalVaultFileId: finalVaultFile.id,
    draftVaultFileId: draftVaultFile.id,
    userIds: [customer.id, otherCustomer.id],
  };
}

async function cleanupDeliveryTest(seed: DeliverySeed | null) {
  if (!seed) return;

  await prisma.reviewChecklistAnswer.deleteMany({ where: { review: { requestId: seed.requestId } } });
  await prisma.review.deleteMany({ where: { requestId: seed.requestId } });
  await prisma.vaultFile.deleteMany({ where: { requestId: seed.requestId } });
  await prisma.documentVersion.deleteMany({ where: { documentId: seed.documentId } });
  await prisma.document.deleteMany({ where: { id: seed.documentId } });
  await prisma.legalRequest.deleteMany({ where: { id: seed.requestId } });
  await prisma.workspaceMembership.deleteMany({ where: { userId: { in: seed.userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: seed.userIds }, email: { startsWith: DELIVERY_E2E_PREFIX } } });
  await prisma.workspace.deleteMany({ where: { id: { in: [seed.workspaceId, seed.otherWorkspaceId] } } });
}

async function withDeliverySeed(run: (seed: DeliverySeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: DeliverySeed | null = null;

  try {
    seed = await seedDeliveryTest();
    await run(seed);
  } finally {
    await cleanupDeliveryTest(seed);
  }
}

function customerSession(seed: DeliverySeed): AppSession {
  return { userId: seed.customerId, activeWorkspaceId: seed.workspaceId, roles: ['customer'] };
}

function otherCustomerSession(seed: DeliverySeed): AppSession {
  return { userId: seed.otherCustomerId, activeWorkspaceId: seed.otherWorkspaceId, roles: ['customer'] };
}

test('getCustomerDeliveryRequest returns only final document data for own customer request', async () => {
  await withDeliverySeed(async (seed) => {
    const result = await getCustomerDeliveryRequest(customerSession(seed), seed.requestId);

    assert.equal(result.id, seed.requestId);
    assert.equal(result.title, `Delivery request ${seed.suffix}`);
    assert.equal(result.documents.length, 1);
    assert.equal(result.documents[0].documentId, seed.documentId);
    assert.equal(result.documents[0].documentTitle, 'Hợp đồng đại lý');
    assert.equal(result.documents[0].documentVersionId, seed.finalVersionId);
    assert.equal(result.documents[0].templateVersion, 2);
    assert.equal(result.documents[0].vaultFileId, seed.finalVaultFileId);
    assert.equal(result.documents[0].filename, 'hop-dong-final.pdf');
    assert.equal(result.documents.some((doc) => doc.documentVersionId === seed.draftVersionId), false);
    assert.equal(result.documents.some((doc) => doc.vaultFileId === seed.draftVaultFileId), false);
  });
});

test('getCustomerDeliveryRequest rejects other customers without returning data', async () => {
  await withDeliverySeed(async (seed) => {
    await assert.rejects(
      getCustomerDeliveryRequest(otherCustomerSession(seed), seed.requestId),
      /FORBIDDEN|REQUEST_NOT_FOUND/,
    );
  });
});

test('getCustomerDeliveryRequest response excludes sensitive fields', async () => {
  await withDeliverySeed(async (seed) => {
    const result = await getCustomerDeliveryRequest(customerSession(seed), seed.requestId);
    const json = JSON.stringify(result);

    assert.doesNotMatch(json, /storageKey/);
    assert.doesNotMatch(json, /generatedContent/);
    assert.doesNotMatch(json, /inputSnapshot/);
    assert.doesNotMatch(json, /review/i);
    assert.doesNotMatch(json, /checklist/i);
    assert.doesNotMatch(json, /comment/i);
  });
});

test('requestVaultFileAccess returns 15 minute final-document access without raw storageKey', async () => {
  await withDeliverySeed(async (seed) => {
    const before = Date.now();
    const result = await requestVaultFileAccess(customerSession(seed), seed.finalVaultFileId, `vault-access-test-${seed.suffix}`);
    const after = Date.now();
    const json = JSON.stringify(result);
    const expiryDelta = result.expiresAt.getTime() - before;
    const afterExpiryDelta = result.expiresAt.getTime() - after;

    assert.match(result.accessUrl, new RegExp(`/api/vault/${seed.finalVaultFileId}/download\\?expires=\\d+`));
    assert.equal(result.filename, 'hop-dong-final.pdf');
    assert.equal(result.contentType, 'application/pdf');
    assert.ok(expiryDelta <= 16 * 60 * 1000, `expiresAt should be <= 16 minutes, got ${expiryDelta}`);
    assert.ok(afterExpiryDelta >= 14 * 60 * 1000, `expiresAt should be >= 14 minutes, got ${afterExpiryDelta}`);
    assert.doesNotMatch(json, /storageKey-final/);

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { correlationId: `vault-access-test-${seed.suffix}`, action: 'vault.access_requested' },
      select: { metadataSummary: true },
    });

    assert.match(audit.metadataSummary ?? '', /vaultFileId=/);
    assert.match(audit.metadataSummary ?? '', /requestId=/);
    assert.match(audit.metadataSummary ?? '', /expiresAt=/);
    assert.doesNotMatch(audit.metadataSummary ?? '', /storageKey/);
    assert.doesNotMatch(audit.metadataSummary ?? '', /generatedContent final secret/);
  });
});

test('requestVaultFileAccess rejects customer access to draftVaultFileId', async () => {
  await withDeliverySeed(async (seed) => {
    await assert.rejects(
      requestVaultFileAccess(customerSession(seed), seed.draftVaultFileId, `vault-draft-test-${seed.suffix}`),
      /FORBIDDEN/,
    );
  });
});
