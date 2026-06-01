import { createHmac, timingSafeEqual } from 'node:crypto';
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
  filename: string | null;
  contentType: string | null;
};

const VAULT_ACCESS_TTL_MS = 15 * 60 * 1000;

function vaultDownloadSecret() {
  const secret = process.env.VAULT_DOWNLOAD_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') return 'dev-vault-download-secret';
  throw new Error('VAULT_DOWNLOAD_SECRET_REQUIRED');
}

function signVaultFileAccess(vaultFileId: string, userId: string, expires: string) {
  return createHmac('sha256', vaultDownloadSecret()).update(`${vaultFileId}.${userId}.${expires}`).digest('hex');
}

export function verifyVaultFileAccessSignature(input: { vaultFileId: string; userId: string; expires: string; signature: string }) {
  try {
    if (!/^[0-9a-f]+$/i.test(input.signature)) return false;
    const expected = Buffer.from(signVaultFileAccess(input.vaultFileId, input.userId, input.expires), 'hex');
    const actual = Buffer.from(input.signature, 'hex');
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function isCustomerSession(session: AppSession) {
  return session.roles.includes('customer');
}

export async function getVaultFileDownloadPayload(session: AppSession, vaultFileId: string) {
  if (!(await canAccessVaultFile(session, vaultFileId))) throw new Error('FORBIDDEN');

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: {
      id: true,
      requestId: true,
      workspaceId: true,
      filename: true,
      storageKey: true,
      contentType: true,
      documentVersionId: true,
      request: { select: { createdById: true, status: true } },
    },
  });

  if (!vaultFile) throw new Error('VAULT_FILE_NOT_FOUND');

  if (isCustomerSession(session)) {
    if (!session.activeWorkspaceId || vaultFile.workspaceId !== session.activeWorkspaceId) throw new Error('FORBIDDEN');
    if (vaultFile.request.createdById !== session.userId) throw new Error('FORBIDDEN');
    if (!['delivered', 'closed'].includes(vaultFile.request.status)) throw new Error('FORBIDDEN');
    if (!vaultFile.documentVersionId) throw new Error('FORBIDDEN');

    const finalVersion = await prisma.documentVersion.findFirst({
      where: { id: vaultFile.documentVersionId, status: 'final', document: { requestId: vaultFile.requestId } },
      select: { id: true },
    });

    if (!finalVersion) throw new Error('FORBIDDEN');
  }

  return vaultFile;
}

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
      workspaceId: true,
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
    workspaceId: vaultFile.workspaceId,
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

export async function requestVaultFileAccess(
  session: AppSession,
  vaultFileId: string,
  correlationId?: string,
): Promise<RequestVaultFileAccessResult> {
  const vaultFile = await getVaultFileDownloadPayload(session, vaultFileId);
  const expiresAt = new Date(Date.now() + VAULT_ACCESS_TTL_MS);
  const expires = String(expiresAt.getTime());
  const signature = signVaultFileAccess(vaultFileId, session.userId, expires);
  const accessUrl = `/api/vault/${vaultFileId}/download?expires=${expires}&userId=${encodeURIComponent(session.userId)}&signature=${signature}`;

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: vaultFile.workspaceId,
    action: 'vault.access_requested',
    targetType: 'VAULT_FILE',
    targetId: vaultFileId,
    requestId: vaultFile.requestId,
    correlationId: correlationId ?? `vault-access-${vaultFileId}`,
    metadataSummary: `vaultFileId=${vaultFileId}; requestId=${vaultFile.requestId}; expiresAt=${expiresAt.toISOString()}`,
  });

  return { accessUrl, expiresAt, filename: vaultFile.filename, contentType: vaultFile.contentType };
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