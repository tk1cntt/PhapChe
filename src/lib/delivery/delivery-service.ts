import type { RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

export type CustomerDeliveryDocument = {
  documentId: string;
  documentTitle: string;
  documentVersionId: string;
  templateVersion: number;
  createdAt: Date;
  vaultFileId: string;
  filename: string | null;
  size: number | null;
  contentType: string | null;
};

export type CustomerDeliveryRequest = {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: Date;
  matterTypeKey: string | null;
  documents: CustomerDeliveryDocument[];
};

export async function getCustomerDeliveryRequest(session: AppSession, requestId: string): Promise<CustomerDeliveryRequest> {
  if (!session.activeWorkspaceId) throw new Error('FORBIDDEN');
  if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findFirst({
    where: {
      id: requestId,
      workspaceId: session.activeWorkspaceId,
      createdById: session.userId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');

  const [intakeSubmission, documents, finalVersions, vaultFiles] = await Promise.all([
    prisma.intakeSubmission.findUnique({
      where: { requestId },
      select: { matterTypeKey: true },
    }),
    prisma.document.findMany({
      where: { requestId, workspaceId: session.activeWorkspaceId },
      select: { id: true, title: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.documentVersion.findMany({
      where: { status: 'final', document: { requestId, workspaceId: session.activeWorkspaceId } },
      select: { id: true, documentId: true, templateVersion: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vaultFile.findMany({
      where: { requestId, workspaceId: session.activeWorkspaceId, documentVersionId: { not: null } },
      select: { id: true, filename: true, documentVersionId: true, size: true, contentType: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const vaultFilesByVersion = new Map(vaultFiles.map((file) => [file.documentVersionId, file]));
  const deliveryDocuments: CustomerDeliveryDocument[] = [];

  for (const version of finalVersions) {
    const document = documentsById.get(version.documentId);
    const vaultFile = vaultFilesByVersion.get(version.id);
    if (!document || !vaultFile) continue;

    deliveryDocuments.push({
      documentId: document.id,
      documentTitle: document.title,
      documentVersionId: version.id,
      templateVersion: version.templateVersion,
      createdAt: version.createdAt,
      vaultFileId: vaultFile.id,
      filename: vaultFile.filename,
      size: vaultFile.size,
      contentType: vaultFile.contentType,
    });
  }

  return {
    id: request.id,
    title: request.title,
    status: request.status,
    createdAt: request.createdAt,
    matterTypeKey: intakeSubmission?.matterTypeKey ?? null,
    documents: deliveryDocuments,
  };
}
