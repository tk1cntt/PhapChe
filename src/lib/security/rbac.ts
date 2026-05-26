import { prisma } from '@/lib/prisma';
import type { AppSession } from './session';

function hasRole(session: AppSession | null | undefined, role: string) {
  return session?.roles.includes(role as never) ?? false;
}

async function hasActiveUser(session: AppSession | null | undefined) {
  if (!session?.userId) {
    return false;
  }

  const user = await prisma.user.findFirst({
    where: { id: session.userId, isActive: true },
    select: { id: true },
  });

  return Boolean(user);
}

async function hasActiveMembership(session: AppSession, workspaceId: string) {
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: session.userId,
      workspaceId,
      isActive: true,
      workspace: { isActive: true },
    },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function canAccessWorkspace(session: AppSession | null | undefined, workspaceId: string) {
  if (!workspaceId || !(await hasActiveUser(session))) {
    return false;
  }

  if (hasRole(session, 'super_admin')) {
    return true;
  }

  return hasActiveMembership(session as AppSession, workspaceId);
}

export async function canAccessRequest(session: AppSession | null | undefined, requestId: string) {
  if (!requestId || !(await hasActiveUser(session))) {
    return false;
  }

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      workspaceId: true,
      assignedSpecialistId: true,
      assignedReviewerId: true,
    },
  });

  if (!request) {
    return false;
  }

  if (hasRole(session, 'super_admin')) {
    return true;
  }

  const typedSession = session as AppSession;
  const hasMembership = await hasActiveMembership(typedSession, request.workspaceId);

  if (!hasMembership) {
    return false;
  }

  if (hasRole(typedSession, 'coordinator_admin') || hasRole(typedSession, 'customer')) {
    return true;
  }

  if (hasRole(typedSession, 'specialist') && request.assignedSpecialistId === typedSession.userId) {
    return true;
  }

  if (hasRole(typedSession, 'reviewer') && request.assignedReviewerId === typedSession.userId) {
    return true;
  }

  return false;
}

export async function canAccessDocument(session: AppSession | null | undefined, documentId: string) {
  if (!documentId || !(await hasActiveUser(session))) {
    return false;
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { requestId: true },
  });

  if (!document) {
    return false;
  }

  return canAccessRequest(session, document.requestId);
}

export async function canAccessReview(session: AppSession | null | undefined, reviewId: string) {
  if (!reviewId || !(await hasActiveUser(session))) {
    return false;
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      requestId: true,
      reviewerId: true,
    },
  });

  if (!review) {
    return false;
  }

  if (hasRole(session, 'super_admin')) {
    return true;
  }

  if (hasRole(session, 'reviewer') && review.reviewerId === session?.userId) {
    return true;
  }

  return canAccessRequest(session, review.requestId);
}

export async function canAccessVaultFile(session: AppSession | null | undefined, vaultFileId: string) {
  if (!vaultFileId || !(await hasActiveUser(session))) {
    return false;
  }

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: { requestId: true },
  });

  if (!vaultFile) {
    return false;
  }

  return canAccessRequest(session, vaultFile.requestId);
}
