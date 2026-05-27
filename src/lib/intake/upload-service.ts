import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

type AttachIntakeFileInput = {
  session: AppSession;
  requestId: string;
  file: File;
  correlationId: string;
};

export async function attachIntakeFile(input: AttachIntakeFileInput) {
  if (!input.file || input.file.size < 1) throw new Error('FILE_REQUIRED');
  if (!(await canAccessRequest(input.session, input.requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findUnique({
    where: { id: input.requestId },
    select: { workspaceId: true },
  });
  if (!request) throw new Error('REQUEST_NOT_FOUND');

  const filename = input.file.name.trim() || 'upload.bin';
  const size = input.file.size;
  const storageKey = `private/${request.workspaceId}/${input.requestId}/${randomUUID()}-${filename}`;

  return prisma.$transaction(async (tx) => {
    const vaultFile = await tx.vaultFile.create({
      data: {
        workspaceId: request.workspaceId,
        requestId: input.requestId,
        storageKey,
        filename,
      },
      select: { id: true, filename: true },
    });

    await recordAuditEvent(
      {
        actorId: input.session.userId,
        workspaceId: request.workspaceId,
        action: 'file.uploaded',
        targetType: 'VAULT_FILE',
        targetId: vaultFile.id,
        requestId: input.requestId,
        correlationId: input.correlationId,
        metadataSummary: `filename=${filename}; size=${size}`,
      },
      tx,
    );

    return { id: vaultFile.id, filename: vaultFile.filename, size };
  });
}
