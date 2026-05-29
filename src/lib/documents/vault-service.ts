import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest, canAccessVaultFile } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

type VaultFileMetadata = {
  id: string;
  filename: string | null;
  fileKind: string | null;
  source: string | null;
  documentVersionId: string | null;
  createdAt: Date;
  size?: number | null;
  contentType?: string | null;
};

type ListVaultFilesOptions = {
  fileKind?: string;
  includeMetadata?: boolean;
};

type StoreVaultFileInput = {
  session: AppSession;
  requestId: string;
  storageKey: string;
  filename: string;
  fileKind?: string;
  source?: string;
  documentVersionId?: string;
  size?: number;
  contentType?: string;
  correlationId?: string;
};

type RequestVaultFileAccessResult = {
  accessUrl: string;
  expiresAt: Date;
};

// listVaultFiles: list vault files for a request without exposing storageKey
export async function listVaultFiles(
  session: AppSession,
  requestId: string,
  options?: ListVaultFilesOptions,
): Promise<VaultFileMetadata[]> {
  if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');

  const vaultFiles = await prisma.vaultFile.findMany({
    where: {
      requestId,
      ...(options?.fileKind ? { fileKind: options.fileKind } : {}),
    },
    select: {
      id: true,
      filename: true,
      fileKind: true,
      source: true,
      documentVersionId: true,
      createdAt: true,
      size: true,
      contentType: true,
      // Explicitly exclude storageKey - never return it
    },
    orderBy: { createdAt: 'desc' },
  });

  return vaultFiles.map((f) => ({
    id: f.id,
    filename: f.filename,
    fileKind: f.fileKind,
    source: f.source,
    documentVersionId: f.documentVersionId,
    createdAt: f.createdAt,
    size: f.size ?? undefined,
    contentType: f.contentType ?? undefined,
  }));
}

// getVaultFileMetadata: return metadata only, never storageKey
export async function getVaultFileMetadata(session: AppSession, vaultFileId: string): Promise<VaultFileMetadata> {
  if (!(await canAccessVaultFile(session, vaultFileId))) throw new Error('FORBIDDEN');

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: {
      id: true,
      filename: true,
      fileKind: true,
      source: true,
      documentVersionId: true,
      createdAt: true,
      size: true,
      contentType: true,
    },
  });

  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  // Record audit event for metadata access
  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: vaultFile.fileKind ?? '', // Will be set from request
    action: 'vault.metadata_accessed',
    targetType: 'VAULT_FILE',
    targetId: vaultFileId,
    correlationId: `vault-metadata-${vaultFileId}`,
    metadataSummary: `vaultFileId=${vaultFileId}; action=metadata`,
  });

  return {
    id: vaultFile.id,
    filename: vaultFile.filename,
    fileKind: vaultFile.fileKind,
    source: vaultFile.source,
    documentVersionId: vaultFile.documentVersionId,
    createdAt: vaultFile.createdAt,
    size: vaultFile.size ?? undefined,
    contentType: vaultFile.contentType ?? undefined,
  };
}

// requestVaultFileAccess: stub for signed URL abstraction (D-17)
export async function requestVaultFileAccess(
  session: AppSession,
  vaultFileId: string,
  correlationId?: string,
): Promise<RequestVaultFileAccessResult> {
  if (!(await canAccessVaultFile(session, vaultFileId))) throw new Error('FORBIDDEN');

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: {
      id: true,
      requestId: true,
      workspaceId: true,
      filename: true,
    },
  });

  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  // Generate short-lived signed URL stub (MVP implementation)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const accessUrl = `/api/vault/${vaultFileId}/download?token=stub&expires=${expiresAt.getTime()}`;

  // Record audit event
  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: vaultFile.workspaceId,
    action: 'vault.access_requested',
    targetType: 'VAULT_FILE',
    targetId: vaultFileId,
    requestId: vaultFile.requestId,
    correlationId: correlationId ?? `vault-access-${vaultFileId}`,
    metadataSummary: `vaultFileId=${vaultFileId}; action=access_request`,
  });

  return { accessUrl, expiresAt };
}

// storeVaultFile: create vault file with RBAC check
export async function storeVaultFile(input: StoreVaultFileInput) {
  const { session, requestId, storageKey, filename, fileKind, source, documentVersionId, size, contentType, correlationId } = input;

  if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { id: true, workspaceId: true },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');

  const vaultFile = await prisma.$transaction(async (tx) => {
    const created = await tx.vaultFile.create({
      data: {
        requestId,
        workspaceId: request.workspaceId,
        actorId: session.userId,
        filename,
        storageKey,
        fileKind: fileKind ?? null,
        source: source ?? null,
        documentVersionId: documentVersionId ?? null,
        size: size ?? null,
        contentType: contentType ?? null,
      },
    });

    // Record audit event
    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: request.workspaceId,
        action: 'vault.file_stored',
        targetType: 'VAULT_FILE',
        targetId: created.id,
        requestId,
        correlationId: correlationId ?? `vault-store-${created.id}`,
        metadataSummary: `vaultFileId=${created.id}; fileKind=${fileKind ?? 'unknown'}; filename=${filename}`,
      },
      tx,
    );

    return created;
  });

  return {
    id: vaultFile.id,
    filename: vaultFile.filename,
    fileKind: vaultFile.fileKind,
    source: vaultFile.source,
    documentVersionId: vaultFile.documentVersionId,
    createdAt: vaultFile.createdAt,
  };
}

// deleteVaultFile: coordinator_admin or super_admin only
export async function deleteVaultFile(session: AppSession, vaultFileId: string, correlationId?: string) {
  if (!(await canAccessVaultFile(session, vaultFileId))) throw new Error('FORBIDDEN');

  const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');
  if (!isAdmin) throw new Error('FORBIDDEN');

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: { id: true, requestId: true, workspaceId: true },
  });

  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    // Soft-delete: set fileKind to deprecated marker
    await tx.vaultFile.update({
      where: { id: vaultFileId },
      data: { fileKind: '_deleted' },
    });

    // Record audit event
    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: vaultFile.workspaceId,
        action: 'vault.file_deleted',
        targetType: 'VAULT_FILE',
        targetId: vaultFileId,
        requestId: vaultFile.requestId,
        correlationId: correlationId ?? `vault-delete-${vaultFileId}`,
        metadataSummary: `vaultFileId=${vaultFileId}`,
      },
      tx,
    );
  });

  return { deleted: true, vaultFileId };
}