import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import type { AppSession } from '@/lib/security/session';
import {
  createTemplate,
  updateTemplate,
  approveTemplate,
  publishTemplate,
  deprecateTemplate,
  createNewVersion,
  listTemplates,
  getTemplatesForGeneration,
} from './template-service';

const E2E_PREFIX = 'template_service_e2e';

type TemplateSeed = {
  suffix: string;
  workspaceId: string;
  adminId: string;
  coordinatorId: string;
  adminSession: AppSession;
  coordinatorSession: AppSession;
};

function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for template service test');
  const url = new URL(databaseUrl);
  const hostname = url.hostname.toLowerCase();
  const databaseName = url.pathname.toLowerCase();
  const safe = hostname === 'localhost' || hostname === '127.0.0.1' || databaseName.includes('dev') || databaseName.includes('test') || databaseName.includes('local');
  assert.ok(safe, `Refusing to run template service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}

async function seedTemplateTest(): Promise<TemplateSeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const workspace = await prisma.workspace.create({
    data: { name: `Template Test ${suffix}`, slug: `${E2E_PREFIX}-${suffix}` },
  });

  const [admin, coordinator] = await Promise.all([
    prisma.user.create({
      data: {
        email: `${E2E_PREFIX}_admin_${suffix}@example.test`,
        name: 'Template Admin',
        memberships: { create: { workspaceId: workspace.id, role: 'super_admin' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${E2E_PREFIX}_coord_${suffix}@example.test`,
        name: 'Template Coordinator',
        memberships: { create: { workspaceId: workspace.id, role: 'coordinator_admin' } },
      },
    }),
  ]);

  return {
    suffix,
    workspaceId: workspace.id,
    adminId: admin.id,
    coordinatorId: coordinator.id,
    adminSession: { userId: admin.id, activeWorkspaceId: workspace.id, roles: ['super_admin'] },
    coordinatorSession: { userId: coordinator.id, activeWorkspaceId: workspace.id, roles: ['coordinator_admin'] },
  };
}

async function cleanup(workspaceId: string) {
  await prisma.documentTemplate.deleteMany({ where: { workspaceId } });
  await prisma.workspace.delete({ where: { id: workspaceId } });
}

// --- Tests ---

test('createTemplate: admin can create draft template', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Mẫu Hợp đồng lao động',
      description: 'Mẫu chuẩn',
      variableSchema: [{ key: 'employee_name', label: 'Tên người lao động', required: true, type: 'text' }],
      content: 'Hợp đồng lao động giữa {{employer_name}} và {{employee_name}}',
    });
    assert.equal(template.workspaceId, seed.workspaceId);
    assert.equal(template.matterTypeKey, 'labor_contract');
    assert.equal(template.status, 'draft');
    assert.equal(template.version, 1);
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('createTemplate: non-admin cannot create template', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const customer = await prisma.user.create({
      data: {
        email: `${E2E_PREFIX}_cust_${seed.suffix}@example.test`,
        name: 'Customer',
        memberships: { create: { workspaceId: seed.workspaceId, role: 'customer' } },
      },
    });
    const session: AppSession = { userId: customer.id, activeWorkspaceId: seed.workspaceId, roles: ['customer'] };
    await assert.rejects(() =>
      createTemplate(session, {
        workspaceId: seed.workspaceId,
        matterTypeKey: 'labor_contract',
        label: 'Test',
        variableSchema: [],
        content: 'Test content',
      }),
      /FORBIDDEN/,
    );
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('updateTemplate: admin can update draft template', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Original Label',
      variableSchema: [],
      content: 'Original content',
    });
    const updated = await updateTemplate(seed.adminSession, template.id, { label: 'Updated Label', content: 'Updated content' });
    assert.equal(updated.label, 'Updated Label');
    assert.equal(updated.content, 'Updated content');
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('updateTemplate: published template is immutable', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Immutable',
      variableSchema: [],
      content: 'Content',
    });
    await publishTemplate(seed.adminSession, template.id);
    await assert.rejects(() => updateTemplate(seed.adminSession, template.id, { label: 'New Label' }), /TEMPLATE_IMMUTABLE/);
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('approveTemplate: transitions draft to approved', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'To Approve',
      variableSchema: [],
      content: 'Content',
    });
    const approved = await approveTemplate(seed.adminSession, template.id);
    assert.equal(approved.status, 'approved');
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('publishTemplate: transitions approved to published', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'To Publish',
      variableSchema: [],
      content: 'Content',
    });
    const published = await publishTemplate(seed.adminSession, template.id);
    assert.equal(published.status, 'published');
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('publishTemplate: published template cannot be published again', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Already Published',
      variableSchema: [],
      content: 'Content',
    });
    await publishTemplate(seed.adminSession, template.id);
    await assert.rejects(() => publishTemplate(seed.adminSession, template.id), /TEMPLATE_ALREADY_PUBLISHED/);
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('deprecateTemplate: admin can deprecate template', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'To Deprecate',
      variableSchema: [],
      content: 'Content',
    });
    const deprecated = await deprecateTemplate(seed.adminSession, template.id);
    assert.equal(deprecated.status, 'deprecated');
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('createNewVersion: creates new version linked via previousVersionId', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Original Version',
      description: 'Original desc',
      variableSchema: [{ key: 'name', label: 'Name', required: true, type: 'text' }],
      content: 'Original content',
    });
    await publishTemplate(seed.adminSession, template.id);

    const newVersion = await createNewVersion(seed.adminSession, template.id, { label: 'Version 2' });
    assert.equal(newVersion.version, 2);
    assert.equal(newVersion.status, 'draft');
    assert.equal(newVersion.previousVersionId, template.id);
    assert.equal(newVersion.matterTypeKey, 'labor_contract');
    assert.equal(newVersion.workspaceId, seed.workspaceId);
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('createNewVersion: cannot create version from draft', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Draft',
      variableSchema: [],
      content: 'Content',
    });
    await assert.rejects(() => createNewVersion(seed.adminSession, template.id), /CREATE_VERSION_FROM_PUBLISHED_ONLY/);
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('listTemplates: returns templates for workspace', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const t1 = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Labor Template',
      variableSchema: [],
      content: 'Content',
    });
    await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'trademark_registration',
      label: 'Trademark Template',
      variableSchema: [],
      content: 'Content',
    });
    const templates = await listTemplates(seed.adminSession, seed.workspaceId);
    assert.ok(templates.length >= 2);
    assert.ok(templates.some((t) => t.id === t1.id));
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('getTemplatesForGeneration: returns only approved/published latest version', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedTemplateTest();
  try {
    const published = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Published',
      variableSchema: [],
      content: 'Content',
    });
    await publishTemplate(seed.adminSession, published.id);

    // Draft template should not appear
    const draft = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Draft',
      variableSchema: [],
      content: 'Content',
    });

    const results = await getTemplatesForGeneration(seed.adminSession, seed.workspaceId, 'labor_contract');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, published.id);
    assert.equal(results[0].status, 'published');
  } finally {
    await cleanup(seed.workspaceId);
  }
});