import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { generateDraft, listDocumentVersions, submitForReview } from './draft-service';
import type { AppSession } from '@/lib/security/session';

const DRAFT_E2E_PREFIX = 'draft_service_e2e';

type DraftSeed = {
  suffix: string;
  workspaceId: string;
  coordinatorId: string;
  specialistId: string;
  customerId: string;
  requestId: string;
  templateId: string;
  matterTypeId: string;
  userIds: string[];
  correlationPrefix: string;
};

function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for draft service test');

  const url = new URL(databaseUrl);
  const databaseName = url.pathname.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run draft service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}

async function seedDraftTest(): Promise<DraftSeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const correlationPrefix = `${DRAFT_E2E_PREFIX}_${suffix}`;

  const [workspace, matterType] = await Promise.all([
    prisma.workspace.create({ data: { name: `Draft Service ${suffix}`, slug: `${DRAFT_E2E_PREFIX}-${suffix}` } }),
    prisma.matterType.create({
      data: {
        workspaceId: null,
        key: 'labor_contract',
        label: 'Hợp đồng lao động',
        schemaVersion: '1.0',
        questionSchema: [],
      },
    }),
  ]);

  const [coordinator, specialist, customer] = await Promise.all([
    prisma.user.create({
      data: {
        email: `${DRAFT_E2E_PREFIX}_coord_${suffix}@example.test`,
        name: 'Coordinator',
        memberships: { create: { workspaceId: workspace.id, role: 'coordinator_admin' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${DRAFT_E2E_PREFIX}_spec_${suffix}@example.test`,
        name: 'Specialist',
        memberships: { create: { workspaceId: workspace.id, role: 'specialist' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${DRAFT_E2E_PREFIX}_cust_${suffix}@example.test`,
        name: 'Customer',
        memberships: { create: { workspaceId: workspace.id, role: 'customer' } },
      },
    }),
  ]);

  const template = await prisma.documentTemplate.create({
    data: {
      workspaceId: workspace.id,
      matterTypeKey: 'labor_contract',
      version: 1,
      status: 'published',
      label: 'Hợp đồng lao động v2.0',
      description: 'Template for labor contract',
      variableSchema: [
        { key: 'company_name', label: 'Tên công ty', required: true, type: 'text' },
        { key: 'tax_id', label: 'Mã số thuế', required: true, type: 'text' },
        { key: 'employee_name', label: 'Tên nhân viên', required: true, type: 'text' },
        { key: 'position', label: 'Vị trí', required: false, type: 'text' },
        { key: 'salary', label: 'Lương', required: true, type: 'number' },
        { key: 'start_date', label: 'Ngày bắt đầu', required: true, type: 'date' },
      ],
      content: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Công ty: {{company_name}}
Mã số thuế: {{tax_id}}

HỢP ĐỒNG LAO ĐỘNG

Công ty {{company_name}} (sau đây gọi là "Công ty") và ông/bà {{employee_name}} (sau đây gọi là "Người lao động") thỏa thuận ký hợp đồng lao động với các điều khoản sau:

1. Vị trí: {{position}}
2. Lương: {{salary}} VND/tháng
3. Ngày bắt đầu: {{start_date}}
4. Các điều khoản khác theo quy định pháp luật hiện hành.
`,
    },
  });

  const request = await prisma.legalRequest.create({
    data: {
      workspaceId: workspace.id,
      title: `Draft request ${suffix}`,
      status: 'in_progress',
      createdById: customer.id,
      assignedSpecialistId: specialist.id,
    },
  });

  // Create intake submission
  await prisma.intakeSubmission.create({
    data: {
      requestId: request.id,
      matterTypeKey: 'labor_contract',
      schemaVersion: '1.0',
      answers: { company_name: 'ABC Corp', tax_id: '0123456789', employee_name: 'Nguyen Van A' },
      answerLabels: { company_name: 'Tên công ty', tax_id: 'Mã số thuế', employee_name: 'Tên nhân viên' },
    },
  });

  return {
    suffix,
    workspaceId: workspace.id,
    coordinatorId: coordinator.id,
    specialistId: specialist.id,
    customerId: customer.id,
    requestId: request.id,
    templateId: template.id,
    matterTypeId: matterType.id,
    userIds: [coordinator.id, specialist.id, customer.id],
    correlationPrefix,
  };
}

async function cleanupDraftTest(seed: DraftSeed | null) {
  if (!seed) return;

  const { workspaceId, requestId, userIds } = seed;

  await prisma.auditEvent.deleteMany({ where: { workspaceId } });
  await prisma.documentVersion.deleteMany({ where: { document: { requestId } } });
  await prisma.document.deleteMany({ where: { requestId } });
  await prisma.intakeSubmission.deleteMany({ where: { requestId } });
  await prisma.vaultFile.deleteMany({ where: { requestId } });
  await prisma.legalRequest.deleteMany({ where: { id: requestId } });
  await prisma.documentTemplate.deleteMany({ where: { workspaceId } });
  await prisma.workspaceMembership.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds }, email: { startsWith: DRAFT_E2E_PREFIX } } });
  await prisma.workspace.deleteMany({ where: { id: workspaceId } });
  await prisma.matterType.deleteMany({ where: { id: seed.matterTypeId } });
}

async function withDraftSeed(run: (seed: DraftSeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: DraftSeed | null = null;

  try {
    seed = await seedDraftTest();
    await run(seed);
  } finally {
    await cleanupDraftTest(seed);
  }
}

function specialistSession(seed: DraftSeed): AppSession {
  return { userId: seed.specialistId, activeWorkspaceId: seed.workspaceId, roles: ['specialist'] };
}

function coordinatorSession(seed: DraftSeed): AppSession {
  return { userId: seed.coordinatorId, activeWorkspaceId: seed.workspaceId, roles: ['coordinator_admin'] };
}

function customerSession(seed: DraftSeed): AppSession {
  return { userId: seed.customerId, activeWorkspaceId: seed.workspaceId, roles: ['customer'] };
}

test('generateDraft creates document version with template snapshot', async () => {
  await withDraftSeed(async (seed) => {
    const result = await generateDraft({
      session: specialistSession(seed),
      requestId: seed.requestId,
      templateId: seed.templateId,
      variables: {
        company_name: 'Test Company',
        tax_id: '9876543210',
        employee_name: 'Test Employee',
        salary: '15000000',
        start_date: '2026-06-01',
      },
      correlationId: `${seed.correlationPrefix}_generate`,
    });

    assert.ok(result.documentVersionId);
    assert.ok(result.generatedContent.includes('Test Company'));
    assert.ok(result.generatedContent.includes('Test Employee'));
    assert.equal(result.templateVersion, 1);

    // Verify DocumentVersion in DB
    const docVersion = await prisma.documentVersion.findUniqueOrThrow({
      where: { id: result.documentVersionId },
    });
    assert.equal(docVersion.templateId, seed.templateId);
    assert.equal(docVersion.templateVersion, 1);
    assert.equal(docVersion.status, 'draft');

    // Verify inputSnapshot contains variables and intake answers
    const snapshot = docVersion.inputSnapshot as Record<string, unknown>;
    assert.equal(snapshot.variables?.company_name, 'Test Company');
    assert.ok(snapshot.intakeAnswers);

    // Verify VaultFile created
    const vaultFile = await prisma.vaultFile.findFirst({
      where: { documentVersionId: result.documentVersionId, fileKind: 'generated_draft' },
    });
    assert.ok(vaultFile);
    assert.ok(vaultFile.filename?.includes('labor_contract'));
  });
});

test('generateDraft blocks on missing required variables', async () => {
  await withDraftSeed(async (seed) => {
    await assert.rejects(
      generateDraft({
        session: specialistSession(seed),
        requestId: seed.requestId,
        templateId: seed.templateId,
        variables: {
          company_name: 'Test Company',
          // Missing required: tax_id, employee_name, salary, start_date
        },
        correlationId: `${seed.correlationPrefix}_missing`,
      }),
      /MISSING_REQUIRED_VARIABLES/,
    );

    // Verify no DocumentVersion created
    const docVersions = await prisma.documentVersion.findMany({
      where: { document: { requestId: seed.requestId } },
    });
    assert.equal(docVersions.length, 0);
  });
});

test('generateDraft allows missing optional variables', async () => {
  await withDraftSeed(async (seed) => {
    const result = await generateDraft({
      session: specialistSession(seed),
      requestId: seed.requestId,
      templateId: seed.templateId,
      variables: {
        company_name: 'Test Company',
        tax_id: '9876543210',
        employee_name: 'Test Employee',
        salary: '15000000',
        start_date: '2026-06-01',
        // Missing optional: position
      },
      correlationId: `${seed.correlationPrefix}_optional`,
    });

    assert.ok(result.documentVersionId);
    // Optional variable replaced with empty string
    assert.ok(result.generatedContent.includes('Vị trí:'));
    assert.ok(result.generatedContent.includes('{{position}}') === false);
  });
});

test('generateDraft replaces placeholders correctly', async () => {
  await withDraftSeed(async (seed) => {
    const result = await generateDraft({
      session: specialistSession(seed),
      requestId: seed.requestId,
      templateId: seed.templateId,
      variables: {
        company_name: 'ABC Corp',
        tax_id: '0123456789',
        employee_name: 'Nguyen Van A',
        salary: '20000000',
        start_date: '2026-07-01',
      },
      correlationId: `${seed.correlationPrefix}_replace`,
    });

    // Verify placeholders replaced
    assert.ok(result.generatedContent.includes('Công ty: ABC Corp'));
    assert.ok(result.generatedContent.includes('Mã số thuế: 0123456789'));
    assert.ok(result.generatedContent.includes('ông/bà Nguyen Van A'));
    assert.ok(result.generatedContent.includes('Lương: 20000000'));
    assert.ok(result.generatedContent.includes('Ngày bắt đầu: 2026-07-01'));

    // Verify no placeholders left
    assert.ok(result.generatedContent.includes('{{company_name}}') === false);
    assert.ok(result.generatedContent.includes('{{tax_id}}') === false);
  });
});

test('submitForReview transitions request to pending_review', async () => {
  await withDraftSeed(async (seed) => {
    // First generate a draft
    const draftResult = await generateDraft({
      session: specialistSession(seed),
      requestId: seed.requestId,
      templateId: seed.templateId,
      variables: {
        company_name: 'Test Company',
        tax_id: '9876543210',
        employee_name: 'Test Employee',
        salary: '15000000',
        start_date: '2026-06-01',
      },
      correlationId: `${seed.correlationPrefix}_submit_gen`,
    });

    // Submit for review
    const submitResult = await submitForReview({
      session: specialistSession(seed),
      documentVersionId: draftResult.documentVersionId,
      reason: 'Sẵn sàng để kiểm tra',
      correlationId: `${seed.correlationPrefix}_submit`,
    });

    assert.equal(submitResult.status, 'submitted_for_review');

    // Verify request status changed
    const request = await prisma.legalRequest.findUniqueOrThrow({ where: { id: seed.requestId } });
    assert.equal(request.status, 'pending_review');

    // Verify audit event created
    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'document.submitted_for_review', targetId: draftResult.documentVersionId },
    });
    assert.ok(audit);
  });
});

test('submitForReview rejects non-draft version', async () => {
  await withDraftSeed(async (seed) => {
    // Generate and submit first draft
    const draftResult = await generateDraft({
      session: specialistSession(seed),
      requestId: seed.requestId,
      templateId: seed.templateId,
      variables: {
        company_name: 'Test Company',
        tax_id: '9876543210',
        employee_name: 'Test Employee',
        salary: '15000000',
        start_date: '2026-06-01',
      },
      correlationId: `${seed.correlationPrefix}_reject_gen`,
    });

    await submitForReview({
      session: specialistSession(seed),
      documentVersionId: draftResult.documentVersionId,
      correlationId: `${seed.correlationPrefix}_reject_first`,
    });

    // Try to submit again - should fail
    await assert.rejects(
      submitForReview({
        session: specialistSession(seed),
        documentVersionId: draftResult.documentVersionId,
        correlationId: `${seed.correlationPrefix}_reject_second`,
      }),
      /INVALID_DOCUMENT_VERSION_STATUS/,
    );
  });
});

test('RBAC - only assigned specialist can generate draft', async () => {
  await withDraftSeed(async (seed) => {
    // Create another specialist not assigned to the request
    const otherSpecialist = await prisma.user.create({
      data: {
        email: `${DRAFT_E2E_PREFIX}_other_spec_${seed.suffix}@example.test`,
        name: 'Other Specialist',
        memberships: { create: { workspaceId: seed.workspaceId, role: 'specialist' } },
      },
    });

    const otherSession: AppSession = { userId: otherSpecialist.id, activeWorkspaceId: seed.workspaceId, roles: ['specialist'] };

    await assert.rejects(
      generateDraft({
        session: otherSession,
        requestId: seed.requestId,
        templateId: seed.templateId,
        variables: {
          company_name: 'Test Company',
          tax_id: '9876543210',
          employee_name: 'Test Employee',
          salary: '15000000',
          start_date: '2026-06-01',
        },
        correlationId: `${seed.correlationPrefix}_rbac`,
      }),
      /FORBIDDEN/,
    );

    // Cleanup
    await prisma.workspaceMembership.deleteMany({ where: { userId: otherSpecialist.id } });
    await prisma.user.delete({ where: { id: otherSpecialist.id } });
  });
});

test('RBAC - non-specialist cannot submit for review', async () => {
  await withDraftSeed(async (seed) => {
    const draftResult = await generateDraft({
      session: specialistSession(seed),
      requestId: seed.requestId,
      templateId: seed.templateId,
      variables: {
        company_name: 'Test Company',
        tax_id: '9876543210',
        employee_name: 'Test Employee',
        salary: '15000000',
        start_date: '2026-06-01',
      },
      correlationId: `${seed.correlationPrefix}_customer_gen`,
    });

    // Customer tries to submit - should fail
    await assert.rejects(
      submitForReview({
        session: customerSession(seed),
        documentVersionId: draftResult.documentVersionId,
        correlationId: `${seed.correlationPrefix}_customer_submit`,
      }),
      /FORBIDDEN/,
    );
  });
});