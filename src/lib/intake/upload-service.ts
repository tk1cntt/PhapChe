import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { storeVaultFile } from '@/lib/documents/vault-service';
import { canAccessRequest } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

type IntakeUploadFile = {
  name: string;
  size: number;
  type?: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

type AttachIntakeFileInput = {
  session: AppSession | null | undefined;
  requestId: string;
  file: IntakeUploadFile;
  correlationId?: string;
};

export async function attachIntakeFile(input: AttachIntakeFileInput) {
  if (!input.file || input.file.size < 1) throw new Error('FILE_REQUIRED');
  if (!(await canAccessRequest(input.session, input.requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, workspaceId: true },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');

  const filename = input.file.name.trim();
  if (!filename) throw new Error('FILE_NAME_REQUIRED');
  const safeFilename = filename
    .replace(/[\\/\0-\x1f\x7f]+/g, '-')
    .replace(/\.\.+/g, '.')
    .slice(0, 180);

  const vaultFile = await storeVaultFile({
    session: input.session!,
    requestId: request.id,
    storageKey: `private/intake/${request.workspaceId}/${request.id}/${randomUUID()}-${safeFilename}`,
    filename,
    fileKind: 'intake_upload',
    source: 'customer_upload',
    size: input.file.size,
    contentType: input.file.type ?? 'application/octet-stream',
    correlationId: input.correlationId ?? `intake-upload-${randomUUID()}`,
  });

  return {
    vaultFileId: vaultFile.id,
    filename: vaultFile.filename,
    size: input.file.size,
    contentType: input.file.type ?? 'application/octet-stream',
    private: true,
  };
}
