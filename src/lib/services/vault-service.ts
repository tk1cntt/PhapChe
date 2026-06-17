/**
 * Vault Service
 *
 * Handles business logic for VaultFile operations.
 * Supports both old (duplicate storage fields) and new (fileId FK) code paths
 * based on DB_MIGRATION_PHASE4 feature flag.
 *
 * Architecture: VaultFile is the business layer, File is the storage layer.
 * When DB_MIGRATION_PHASE4 is enabled, VaultFile stores fileId FK to File.
 */

import { prisma } from '@/lib/prisma';
import { isEnabled } from '@/lib/config/feature-flags';
import crypto from 'crypto';

export interface UploadVaultFileInput {
  requestId: string;
  workspaceId: string;
  actorId: string;
  file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  };
  fileKind?: string;
  source?: string;
  documentVersionId?: string;
  fromStatus?: string;
  toStatus?: string;
  reason?: string;
}

export interface VaultFileFilters {
  requestId?: string;
  workspaceId?: string;
  fileKind?: string;
  source?: string;
  documentVersionId?: string;
}

/**
 * Generate a unique object key for file storage
 */
function generateObjectKey(originalName: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `vault/${timestamp}-${random}-${sanitized}`;
}

/**
 * Calculate checksum for a file buffer
 */
async function calculateChecksum(buffer: Buffer): Promise<string> {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Upload a file to the vault
 *
 * Creates a File record (storage layer) first, then a VaultFile record (business layer).
 * When DB_MIGRATION_PHASE4 is enabled, VaultFile.fileId references the File record.
 * Old duplicate fields are set to null when the flag is enabled.
 */
export async function uploadVaultFile(input: UploadVaultFileInput) {
  const { file, ...metadata } = input;

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Create File and VaultFile in transaction to prevent orphaned records
    return prisma.$transaction(async (tx) => {
      // Get organizationId from the request's engagement
      const request = await tx.legalRequest.findUnique({
        where: { id: metadata.requestId },
        select: { engagement: { select: { organizationId: true } } },
      });

      const fileRecord = await tx.file.create({
        data: {
          workspaceId: metadata.workspaceId,
          requestId: metadata.requestId,
          storageDriver: 'local',
          objectKey: generateObjectKey(file.originalname),
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          checksum: await calculateChecksum(file.buffer),
          category: 'vault_file',
          visibility: 'private',
          status: 'uploaded',
          createdById: metadata.actorId,
        },
      });

      return tx.vaultFile.create({
        data: {
          requestId: metadata.requestId,
          workspaceId: metadata.workspaceId,
          actorId: metadata.actorId,
          fileId: fileRecord.id, // NEW: FK to File
          organizationId: request?.engagement?.organizationId || null,
          // Old fields: set to null when flag enabled
          filename: null,
          storageKey: null,
          size: null,
          contentType: null,
          fileKind: metadata.fileKind,
          source: metadata.source,
          documentVersionId: metadata.documentVersionId,
          fromStatus: metadata.fromStatus,
          toStatus: metadata.toStatus,
          reason: metadata.reason,
        },
        include: {
          file: true, // Include File for storage info
          request: { select: { id: true, title: true } },
          workspace: { select: { id: true, name: true } },
          actor: { select: { id: true, name: true } },
        },
      });
    });
  }

  // Old: Use duplicate fields directly on VaultFile
  const storageKey = generateObjectKey(file.originalname);

  return prisma.vaultFile.create({
    data: {
      requestId: metadata.requestId,
      workspaceId: metadata.workspaceId,
      actorId: metadata.actorId,
      // Old: Store duplicate fields
      filename: file.originalname,
      storageKey: storageKey,
      size: file.size,
      contentType: file.mimetype,
      fileKind: metadata.fileKind,
      source: metadata.source,
      documentVersionId: metadata.documentVersionId,
      fromStatus: metadata.fromStatus,
      toStatus: metadata.toStatus,
      reason: metadata.reason,
    },
    include: {
      request: { select: { id: true, title: true } },
      workspace: { select: { id: true, name: true } },
      actor: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get vault items for a request
 *
 * Includes File relation when DB_MIGRATION_PHASE4 is enabled.
 */
export async function getVaultItems(requestId: string, filters: VaultFileFilters = {}) {
  const where: Record<string, unknown> = {
    deletedAt: null, // Exclude soft-deleted
    requestId,
  };

  if (filters.fileKind) where.fileKind = filters.fileKind;
  if (filters.source) where.source = filters.source;
  if (filters.documentVersionId) where.documentVersionId = filters.documentVersionId;

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Include File relation
    return prisma.vaultFile.findMany({
      where,
      include: {
        file: true, // Include File for storage info
        workspace: { select: { id: true, name: true } },
        actor: { select: { id: true, name: true } },
        vaultFileFolders: {
          include: {
            folder: { select: { id: true, name_vi: true } },
          },
        },
        vaultFileTags: {
          include: {
            tag: { select: { id: true, key: true, label_vi: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Old: Use VaultFile fields directly
  return prisma.vaultFile.findMany({
    where,
    include: {
      workspace: { select: { id: true, name: true } },
      actor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single vault file
 */
export async function getVaultFileById(id: string) {
  if (isEnabled('DB_MIGRATION_PHASE4')) {
    return prisma.vaultFile.findUnique({
      where: { id },
      include: {
        file: true,
        request: { select: { id: true, title: true } },
        workspace: { select: { id: true, name: true } },
        actor: { select: { id: true, name: true } },
        vaultFileFolders: {
          include: { folder: true },
        },
        vaultFileTags: {
          include: { tag: true },
        },
      },
    });
  }

  return prisma.vaultFile.findUnique({
    where: { id },
    include: {
      request: { select: { id: true, title: true } },
      workspace: { select: { id: true, name: true } },
      actor: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get download URL for a vault file
 *
 * Uses file.objectKey when DB_MIGRATION_PHASE4 is enabled.
 */
export async function getVaultFileDownloadUrl(vaultFileId: string): Promise<string | null> {
  const vaultFile = await getVaultFileById(vaultFileId);

  if (!vaultFile) return null;

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Use File.objectKey
    // Cast to include file relation
    const vf = vaultFile as Awaited<ReturnType<typeof getVaultFileById>> & { file?: { id: string; objectKey: string } | null };
    if (vf.file?.objectKey) {
      return `/api/files/${vf.file.id}/download`;
    }
    return null;
  }

  // Old: Use VaultFile.storageKey directly
  const vf = vaultFile as { storageKey?: string | null };
  if (vf.storageKey) {
    return `/api/files/download?key=${vf.storageKey}`;
  }

  return null;
}

/**
 * Get file metadata
 *
 * Returns unified metadata regardless of feature flag.
 */
export async function getVaultFileMetadata(vaultFileId: string) {
  const vaultFile = await getVaultFileById(vaultFileId);

  if (!vaultFile) return null;

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Prefer File record
    // Cast to include file relation
    const vf = vaultFile as Awaited<ReturnType<typeof getVaultFileById>> & {
      file?: { originalName: string; size: number; mimeType: string; objectKey: string; storageDriver: string } | null;
      filename?: string | null;
      size?: number | null;
      contentType?: string | null;
      storageKey?: string | null;
    };
    return {
      id: vaultFile.id,
      filename: vf.file?.originalName || vf.filename,
      size: vf.file?.size || vf.size,
      contentType: vf.file?.mimeType || vf.contentType,
      objectKey: vf.file?.objectKey || vf.storageKey,
      storageDriver: vf.file?.storageDriver || 'local',
      createdAt: vaultFile.createdAt,
    };
  }

  // Old: Use VaultFile fields
  return {
    id: vaultFile.id,
    filename: vaultFile.filename,
    size: vaultFile.size,
    contentType: vaultFile.contentType,
    objectKey: vaultFile.storageKey,
    storageDriver: 'local',
    createdAt: vaultFile.createdAt,
  };
}

/**
 * Delete a vault file (soft delete)
 */
export async function deleteVaultFile(id: string) {
  return prisma.vaultFile.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Add tags to a vault file
 * Note: SQLite doesn't support skipDuplicates, so we handle duplicates in application code
 */
export async function addVaultFileTags(vaultFileId: string, tagIds: string[]) {
  // Filter out existing tags first
  const existingTags = await prisma.vaultFileTag.findMany({
    where: { vaultFileId },
    select: { tagId: true },
  });
  const existingTagIds = new Set(existingTags.map((t) => t.tagId));
  const newTagIds = tagIds.filter((id) => !existingTagIds.has(id));

  if (newTagIds.length === 0) return { count: 0 };

  const tagConnections = newTagIds.map((tagId) => ({
    vaultFileId,
    tagId,
  }));

  return prisma.vaultFileTag.createMany({
    data: tagConnections,
  });
}

/**
 * Remove a tag from a vault file
 */
export async function removeVaultFileTag(vaultFileId: string, tagId: string) {
  return prisma.vaultFileTag.delete({
    where: {
      vaultFileId_tagId: {
        vaultFileId,
        tagId,
      },
    },
  });
}

/**
 * Add a vault file to a folder
 */
export async function addVaultFileToFolder(vaultFileId: string, folderId: string) {
  return prisma.vaultFileFolder.create({
    data: {
      vaultFileId,
      folderId,
    },
  });
}

/**
 * Remove a vault file from a folder
 */
export async function removeVaultFileFromFolder(vaultFileId: string, folderId: string) {
  return prisma.vaultFileFolder.delete({
    where: {
      vaultFileId_folderId: {
        vaultFileId,
        folderId,
      },
    },
  });
}

/**
 * Get vault file counts by type
 */
export async function getVaultFileStats(requestId?: string) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (requestId) where.requestId = requestId;

  const [total, withDocument, fromIntake, fromReview] = await Promise.all([
    prisma.vaultFile.count({ where }),
    prisma.vaultFile.count({ where: { ...where, documentVersionId: { not: null } } }),
    prisma.vaultFile.count({ where: { ...where, source: 'intake' } }),
    prisma.vaultFile.count({ where: { ...where, source: 'review' } }),
  ]);

  return {
    total,
    withDocument,
    fromIntake,
    fromReview,
  };
}
