import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessWorkspace } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

function isAdmin(session: AppSession | null | undefined) {
  return session?.roles.includes('coordinator_admin') || session?.roles.includes('super_admin') || false;
}

type CreateFolderInput = { workspaceId: string; name: string; parentId?: string | null };
type MoveFileToFolderInput = { vaultFileId: string; folderId: string };
type CreateTagInput = { workspaceId: string; key: string; label: string };
type TagFileInput = { vaultFileId: string; tagId: string };
type UntagFileInput = { vaultFileId: string; tagId: string };

// listFolders: workspace access; returns folders with child + file counts
export async function listFolders(session: AppSession, workspaceId: string, parentId?: string | null) {
  if (!(await canAccessWorkspace(session, workspaceId))) throw new Error('FORBIDDEN');

  return prisma.folder.findMany({
    where: { workspaceId, ...(parentId !== undefined ? { parentId } : {}) },
    include: {
      _count: { select: { children: true, vaultFileFolders: true } },
    },
    orderBy: [{ name_vi: 'asc' }],
  });
}

// createFolder: admin creates folder, optionally nested under parentId
export async function createFolder(session: AppSession, input: CreateFolderInput) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');
  if (!input.name || input.name.length === 0) throw new Error('FOLDER_NAME_REQUIRED');
  if (input.name.length > 80) throw new Error('FOLDER_NAME_TOO_LONG');

  const existing = await prisma.folder.findFirst({
    where: { workspaceId: input.workspaceId, parentId: input.parentId ?? null, name: input.name },
    select: { id: true },
  });
  if (existing) throw new Error('FOLDER_DUPLICATE');

  if (input.parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: input.parentId, workspaceId: input.workspaceId },
      select: { id: true },
    });
    if (!parent) throw new Error('FOLDER_PARENT_NOT_FOUND');
  }

  const folder = await prisma.folder.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      parentId: input.parentId ?? null,
    },
  });

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: input.workspaceId,
    action: 'folder.created',
    targetType: 'VAULT_FILE',
    targetId: folder.id,
    correlationId: `folder-create-${folder.id}`,
    metadataSummary: `name=${input.name}; parentId=${input.parentId ?? 'root'}`,
  });

  return folder;
}

// moveFileToFolder: admin moves a vault file into a folder (idempotent)
export async function moveFileToFolder(session: AppSession, input: MoveFileToFolderInput) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const [vaultFile, folder] = await Promise.all([
    prisma.vaultFile.findUnique({ where: { id: input.vaultFileId }, select: { id: true, workspaceId: true } }),
    prisma.folder.findUnique({ where: { id: input.folderId }, select: { id: true, workspaceId: true, name: true } }),
  ]);
  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');
  if (!folder) throw new Error('FOLDER_NOT_FOUND');
  if (vaultFile.workspaceId !== folder.workspaceId) throw new Error('WORKSPACE_MISMATCH');

  await prisma.$transaction(async (tx) => {
    await tx.vaultFileFolder.upsert({
      where: { vaultFileId_folderId: { vaultFileId: input.vaultFileId, folderId: input.folderId } },
      create: { vaultFileId: input.vaultFileId, folderId: input.folderId },
      update: {},
    });

    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: vaultFile.workspaceId,
        action: 'vault_file.moved_to_folder',
        targetType: 'VAULT_FILE',
        targetId: input.vaultFileId,
        correlationId: `vault-file-move-${input.vaultFileId}-${input.folderId}`,
        metadataSummary: `folderId=${input.folderId}; folderName=${folder.name}`,
      },
      tx,
    );
  });
}

// listTags: workspace access; returns tags with usage counts
export async function listTags(session: AppSession, workspaceId: string) {
  if (!(await canAccessWorkspace(session, workspaceId))) throw new Error('FORBIDDEN');

  return prisma.tag.findMany({
    where: { workspaceId },
    include: { _count: { select: { vaultFileTags: true } } },
    orderBy: { key: 'asc' },
  });
}

// createTag: admin creates tag with unique (workspaceId, key)
export async function createTag(session: AppSession, input: CreateTagInput) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');
  if (!input.key || !/^[a-z0-9_-]{1,32}$/.test(input.key)) throw new Error('TAG_KEY_INVALID');
  if (!input.label || input.label.length === 0) throw new Error('TAG_LABEL_REQUIRED');
  if (input.label.length > 80) throw new Error('TAG_LABEL_TOO_LONG');

  const existing = await prisma.tag.findFirst({
    where: { workspaceId: input.workspaceId, key: input.key },
    select: { id: true },
  });
  if (existing) throw new Error('TAG_DUPLICATE');

  const tag = await prisma.tag.create({
    data: { workspaceId: input.workspaceId, key: input.key, label: input.label },
  });

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: input.workspaceId,
    action: 'tag.created',
    targetType: 'VAULT_FILE',
    targetId: tag.id,
    correlationId: `tag-create-${tag.id}`,
    metadataSummary: `key=${input.key}; label=${input.label}`,
  });

  return tag;
}

// tagFile: admin applies tag to a vault file (idempotent)
export async function tagFile(session: AppSession, input: TagFileInput) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const [vaultFile, tag] = await Promise.all([
    prisma.vaultFile.findUnique({ where: { id: input.vaultFileId }, select: { id: true, workspaceId: true } }),
    prisma.tag.findUnique({ where: { id: input.tagId }, select: { id: true, workspaceId: true, key: true } }),
  ]);
  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');
  if (!tag) throw new Error('TAG_NOT_FOUND');
  if (vaultFile.workspaceId !== tag.workspaceId) throw new Error('WORKSPACE_MISMATCH');

  await prisma.$transaction(async (tx) => {
    await tx.vaultFileTag.upsert({
      where: { vaultFileId_tagId: { vaultFileId: input.vaultFileId, tagId: input.tagId } },
      create: { vaultFileId: input.vaultFileId, tagId: input.tagId },
      update: {},
    });

    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: vaultFile.workspaceId,
        action: 'vault_file.tagged',
        targetType: 'VAULT_FILE',
        targetId: input.vaultFileId,
        correlationId: `vault-file-tag-${input.vaultFileId}-${input.tagId}`,
        metadataSummary: `tagId=${input.tagId}; tagKey=${tag.key}`,
      },
      tx,
    );
  });
}

// untagFile: admin removes tag from vault file
export async function untagFile(session: AppSession, input: UntagFileInput) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: input.vaultFileId },
    select: { id: true, workspaceId: true },
  });
  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  const existing = await prisma.vaultFileTag.findUnique({
    where: { vaultFileId_tagId: { vaultFileId: input.vaultFileId, tagId: input.tagId } },
  });
  if (!existing) throw new Error('VAULT_FILE_TAG_NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    await tx.vaultFileTag.delete({
      where: { vaultFileId_tagId: { vaultFileId: input.vaultFileId, tagId: input.tagId } },
    });

    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: vaultFile.workspaceId,
        action: 'vault_file.untagged',
        targetType: 'VAULT_FILE',
        targetId: input.vaultFileId,
        correlationId: `vault-file-untag-${input.vaultFileId}-${input.tagId}`,
        metadataSummary: `tagId=${input.tagId}`,
      },
      tx,
    );
  });
}

// listFileClassifications: returns folders + tags for each vault file in a workspace
export async function listFileClassifications(session: AppSession, workspaceId: string) {
  if (!(await canAccessWorkspace(session, workspaceId))) throw new Error('FORBIDDEN');

  const vaultFiles = await prisma.vaultFile.findMany({
    where: { workspaceId },
    include: {
      vaultFileFolders: { include: { folder: { select: { id: true, name: true } } } },
      vaultFileTags: { include: { tag: { select: { id: true, key: true, label: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return vaultFiles.map((vf) => ({
    vaultFile: { id: vf.id, filename: vf.filename, createdAt: vf.createdAt },
    folders: vf.vaultFileFolders.map((vff) => vff.folder),
    tags: vf.vaultFileTags.map((vft) => vft.tag),
  }));
}
