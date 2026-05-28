import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
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

  const bytes = Buffer.from(await input.file.arrayBuffer());
  const hash = createHash('sha256').update(bytes).digest('hex');
  const filename = input.file.name.trim();
  if (!filename) throw new Error('FILE_NAME_REQUIRED');
  const safeFilename = filename
    .replace(/[\\/\0-\x1f\x7f]+/g, '-')
    .replace(/\.\.+/g, '.')
    .slice(0, 180);

  const vaultFile = await prisma.$transaction(async (tx) => {
    const created = await tx.vaultFile.create({
      data: {
        workspaceId: request.workspaceId,
        requestId: request.id,
        filename,
        storageKey: `private/intake/${request.workspaceId}/${request.id}/${randomUUID()}-${safeFilename}`,
      },
    });

    await recordAuditEvent(
      {
        actorId: input.session?.userId ?? null,
        workspaceId: request.workspaceId,
        action: 'intake.file_uploaded',
        targetType: 'VAULT_FILE',
        targetId: created.id,
        requestId: request.id,
        correlationId: input.correlationId ?? `intake-upload-${created.id}`,
        metadataSummary: `filename=${filename}; size=${input.file.size}; sha256=${hash}`,
      },
      tx,
    );

    return created;
  });

  return {
    vaultFileId: vaultFile.id,
    filename: vaultFile.filename,
    size: input.file.size,
    contentType: input.file.type ?? 'application/octet-stream',
    private: true,
  };
}
