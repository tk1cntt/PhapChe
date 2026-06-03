import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import type { AppSession } from '@/lib/security/session';
import {
  createFolder,
  listFolders,
  moveFileToFolder,
  createTag,
  listTags,
  tagFile,
  untagFile,
  listFileClassifications,
} from './classification-service';

const E2E_PREFIX = 'classification_service_e2e';

type ClassifySeed = {
  workspaceId: string;
  adminId: string;
  specialistId: string;
  vaultFileId: string;
  adminSession: AppSession;
  specialistSession: AppSession;
};

function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for classification service test');
  const url = new URL(databaseUrl);
  const hostname = url.hostname.toLowerCase();
  const databaseName = url.pathname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');
  assert.ok(safe, `Refusing to run classification service test against unsafe DATABASE_URL: ${url.hostname}${url.pathname}`);
}

async function seedClassifyTest(): Promise<ClassifySeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const workspace = await prisma.workspace.create({
    data: { name: `Classify Test ${suffix}`, slug: `${E2E_PREFIX}-${suffix}` },
  });

  const [admin, specialist, actorUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: `${E2E_PREFIX}_admin_${suffix}@example.test`,
        name: 'Classify Admin',
        memberships: { create: { workspaceId: workspace.id, role: 'coordinator_admin' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${E2E_PREFIX}_spec_${suffix}@example.test`,
        name: 'Classify Specialist',
        memberships: { create: { workspaceId: workspace.id, role: 'specialist' } },
      },
    }),
    prisma.user.create({
      data: {
        email: `${E2E_PREFIX}_actor_${suffix}@example.test`,
        name: 'Classify Actor',
      },
    }),
  ]);

  const request = await prisma.legalRequest.create({
    data: {
      workspaceId: workspace.id,
      createdById: admin.id,
      title: `Test Request ${suffix}`,
      status: 'in_progress',
    },
  });

  const vaultFile = await prisma.vaultFile.create({
    data: {
      workspaceId: workspace.id,
      requestId: request.id,
      actorId: actorUser.id,
      filename: `${E2E_PREFIX}_${suffix}.pdf`,
      fileKind: 'document',
    },
  });

  return {
    workspaceId: workspace.id,
    adminId: admin.id,
    specialistId: specialist.id,
    vaultFileId: vaultFile.id,
    adminSession: { userId: admin.id, activeWorkspaceId: workspace.id, roles: ['coordinator_admin'] },
    specialistSession: { userId: specialist.id, activeWorkspaceId: workspace.id, roles: ['specialist'] },
  };
}

async function cleanup(workspaceId: string) {
  await prisma.vaultFileTag.deleteMany({ where: { vaultFile: { workspaceId } } });
  await prisma.vaultFileFolder.deleteMany({ where: { vaultFile: { workspaceId } } });
  await prisma.tag.deleteMany({ where: { workspaceId } });
  await prisma.folder.deleteMany({ where: { workspaceId } });
  await prisma.auditEvent.deleteMany({ where: { workspaceId } });
  await prisma.vaultFile.deleteMany({ where: { workspaceId } });
  await prisma.legalRequest.deleteMany({ where: { workspaceId } });
  await prisma.workspaceMembership.deleteMany({ where: { workspaceId } });
  await prisma.workspace.delete({ where: { id: workspaceId } });
}

// --- Tests ---

test('createFolder: admin creates folder and audit event recorded', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedClassifyTest();
  try {
    const folder = await createFolder(seed.adminSession, { workspaceId: seed.workspaceId, name: 'Hợp đồng' });
    assert.equal(folder.workspaceId, seed.workspaceId);
    assert.equal(folder.name, 'Hợp đồng');
    assert.equal(folder.parentId, null);

    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'folder.created', targetId: folder.id },
    });
    assert.ok(audit, 'audit event should exist');
    assert.equal(audit?.actorId, seed.adminId);
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('createFolder: non-admin (specialist) gets FORBIDDEN', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedClassifyTest();
  try {
    await assert.rejects(
      createFolder(seed.specialistSession, { workspaceId: seed.workspaceId, name: 'Should fail' }),
      /FORBIDDEN/,
    );
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('moveFileToFolder: transactional, join row + audit created', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedClassifyTest();
  try {
    const folder = await createFolder(seed.adminSession, { workspaceId: seed.workspaceId, name: 'Báo cáo' });
    await moveFileToFolder(seed.adminSession, { vaultFileId: seed.vaultFileId, folderId: folder.id });

    const link = await prisma.vaultFileFolder.findUnique({
      where: { vaultFileId_folderId: { vaultFileId: seed.vaultFileId, folderId: folder.id } },
    });
    assert.ok(link, 'join row should exist');

    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'vault_file.moved_to_folder', targetId: seed.vaultFileId },
    });
    assert.ok(audit, 'audit event should exist');
    assert.ok(audit?.metadataSummary?.includes(`folderId=${folder.id}`));
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('tagFile: idempotent (second call no duplicate), audit emitted', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedClassifyTest();
  try {
    const tag = await createTag(seed.adminSession, { workspaceId: seed.workspaceId, key: 'urgent', label: 'Khẩn cấp' });

    await tagFile(seed.adminSession, { vaultFileId: seed.vaultFileId, tagId: tag.id });
    await tagFile(seed.adminSession, { vaultFileId: seed.vaultFileId, tagId: tag.id });

    const count = await prisma.vaultFileTag.count({
      where: { vaultFileId: seed.vaultFileId, tagId: tag.id },
    });
    assert.equal(count, 1, 'should be idempotent (no duplicate join row)');

    const audit = await prisma.auditEvent.findFirst({
      where: { action: 'vault_file.tagged', targetId: seed.vaultFileId },
    });
    assert.ok(audit, 'audit event should exist');
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('untagFile: rejects with VAULT_FILE_TAG_NOT_FOUND when no prior tag', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedClassifyTest();
  try {
    const tag = await createTag(seed.adminSession, { workspaceId: seed.workspaceId, key: 'archived', label: 'Lưu trữ' });
    await assert.rejects(
      untagFile(seed.adminSession, { vaultFileId: seed.vaultFileId, tagId: tag.id }),
      /VAULT_FILE_TAG_NOT_FOUND/,
    );
  } finally {
    await cleanup(seed.workspaceId);
  }
});

test('listFileClassifications: returns folders + tags per vault file', async () => {
  assertSafeDatabaseUrl();
  const seed = await seedClassifyTest();
  try {
    const folder = await createFolder(seed.adminSession, { workspaceId: seed.workspaceId, name: 'Tài liệu' });
    const tag = await createTag(seed.adminSession, { workspaceId: seed.workspaceId, key: 'reviewed', label: 'Đã duyệt' });
    await moveFileToFolder(seed.adminSession, { vaultFileId: seed.vaultFileId, folderId: folder.id });
    await tagFile(seed.adminSession, { vaultFileId: seed.vaultFileId, tagId: tag.id });

    const classifications = await listFileClassifications(seed.adminSession, seed.workspaceId);
    const entry = classifications.find((c) => c.vaultFile.id === seed.vaultFileId);
    assert.ok(entry, 'classification entry should exist');
    assert.equal(entry?.folders.length, 1);
    assert.equal(entry?.folders[0].name, 'Tài liệu');
    assert.equal(entry?.tags.length, 1);
    assert.equal(entry?.tags[0].key, 'reviewed');
  } finally {
    await cleanup(seed.workspaceId);
  }
});
