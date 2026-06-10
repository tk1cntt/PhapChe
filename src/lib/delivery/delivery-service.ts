import type { RequestStatus } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import { sendDeliveryReadyEmail } from './notification-service';

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

type DeliveryActionInput = {
  session: AppSession;
  requestId: string;
  correlationId?: string;
};

type CloseDeliveryInput = DeliveryActionInput & {
  reason: string;
};

async function getFinalVaultFiles(requestId: string, workspaceId: string) {
  return prisma.vaultFile.findMany({
    where: {
      requestId,
      workspaceId,
      documentVersionId: { not: null },
      documentVersion: { status: 'final' },
    },
    select: { id: true, filename: true },
    orderBy: { createdAt: 'asc' },
  });
}

async function getDeliveryActionRequest(session: AppSession, requestId: string, expectedStatus: RequestStatus) {
  if (!session.activeWorkspaceId) throw new Error('FORBIDDEN');
  if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');

  const request = await prisma.legalRequest.findFirst({
    where: { id: requestId, workspaceId: session.activeWorkspaceId },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      status: true,
      assignedSpecialistId: true,
      createdBy: { select: { email: true } },
    },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');
  if (request.status !== expectedStatus) throw new Error('INVALID_REQUEST_STATUS');

  const isCoordinator = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');
  const isAssignedSpecialist = session.roles.includes('specialist') && request.assignedSpecialistId === session.userId;
  if (!isCoordinator && !isAssignedSpecialist) throw new Error('FORBIDDEN');

  const finalVaultFiles = await getFinalVaultFiles(request.id, request.workspaceId);
  if (finalVaultFiles.length === 0) throw new Error('FINAL_DOCUMENT_REQUIRED');

  return { request, finalVaultFiles };
}

export async function markRequestDelivered(input: DeliveryActionInput): Promise<{ id: string; status: RequestStatus }> {
  const { request, finalVaultFiles } = await getDeliveryActionRequest(input.session, input.requestId, 'approved');
  const correlationId = input.correlationId ?? `delivery-${input.requestId}-${Date.now()}`;
  const filenames = finalVaultFiles.map((file) => file.filename ?? file.id);
  const portalUrl = `/customer/requests/${request.id}`;

  const updated = await transitionRequestStatus({
    requestId: request.id,
    actorId: input.session.userId,
    toStatus: 'delivered',
    correlationId,
  });

  await sendDeliveryReadyEmail({
    to: request.createdBy.email,
    requestTitle: request.title,
    portalUrl,
    filenames,
  });

  await recordAuditEvent({
    actorId: input.session.userId,
    workspaceId: request.workspaceId,
    action: 'delivery.ready_notified',
    targetType: 'REQUEST',
    targetId: request.id,
    requestId: request.id,
    correlationId,
    metadataSummary: `requestId=${request.id}; documentCount=${finalVaultFiles.length}`,
  });

  return updated;
}

export async function closeDeliveredRequest(input: CloseDeliveryInput): Promise<{ id: string; status: RequestStatus }> {
  const reason = input.reason.trim();
  if (!reason) throw new Error('CLOSE_REASON_REQUIRED');

  await getDeliveryActionRequest(input.session, input.requestId, 'delivered');

  return transitionRequestStatus({
    requestId: input.requestId,
    actorId: input.session.userId,
    toStatus: 'closed',
    reason,
    correlationId: input.correlationId ?? `close-${input.requestId}-${Date.now()}`,
  });
}

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

  const intakeSubmission = await prisma.intakeSubmission.findUnique({
    where: { requestId },
    select: { matterTypeKey: true },
  });

  const deliveryDocuments: CustomerDeliveryDocument[] = [];

  if (request.status === 'delivered' || request.status === 'closed') {
    const [documents, finalVersions, vaultFiles] = await Promise.all([
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
  }

  return {
    id: request.id,
    title: request.title,
    status: request.status as RequestStatus,
    createdAt: request.createdAt,
    matterTypeKey: intakeSubmission?.matterTypeKey ?? null,
    documents: deliveryDocuments,
  };
}
