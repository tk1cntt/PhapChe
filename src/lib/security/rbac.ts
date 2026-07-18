import { prisma } from '@/lib/prisma';
import type { AppSession } from './session';

function hasRole(session: AppSession | null | undefined, role: string) {
  return session?.roles.includes(role as never) ?? false;
}

async function hasActiveUser(session: AppSession | null | undefined) {
  if (!session?.userId) return false;

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

/**
 * ── B4: Organization-scope access check ──
 * Kiểm tra user có quyền truy cập workspace thông qua Organization membership.
 * Dùng khi user là organization member nhưng chưa có WorkspaceMembership trực tiếp.
 * See: docs/shared_customer_partner_collaboration.md §5.5, §13.2 (rule 3)
 */
async function hasOrganizationAccess(session: AppSession, workspaceId: string): Promise<boolean> {
  // Lấy organizationId của workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId, isActive: true },
    select: { organizationId: true },
  });
  if (!workspace) return false;

  // Kiểm tra OrganizationMembership — user có role trong organization đó không?
  // Hiện tại Prisma chưa có model OrganizationMembership → fallback: nếu user có
  // WorkspaceMembership trong BẤT KỲ workspace nào của organization, coi như có org access.
  // Note: khi OrganizationMembership model được thêm vào Prisma, thay fallback này bằng query trực tiếp.
  const orgWorkspaceMembership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: session.userId,
      isActive: true,
      workspace: {
        organizationId: workspace.organizationId,
        isActive: true,
      },
    },
    select: { id: true },
  });

  return Boolean(orgWorkspaceMembership);
}

export async function canAccessWorkspace(session: AppSession | null | undefined, workspaceId: string) {
  if (!workspaceId || !(await hasActiveUser(session))) return false;
  if (hasRole(session, 'super_admin')) return true;
  const typedSession = session as AppSession;
  if (await hasActiveMembership(typedSession, workspaceId)) return true;
  // B4: Fallback to Organization scope
  return hasOrganizationAccess(typedSession, workspaceId);
}

export async function canAccessRequest(session: AppSession | null | undefined, requestId: string): Promise<boolean> {
  if (!requestId || !(await hasActiveUser(session))) return false;

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      workspaceId: true,
      createdById: true,
      assignedSpecialistId: true,
      assignedReviewerId: true,
    },
  });

  if (!request) return false;

  const typedSession = session as AppSession;

  // Super admin can access all requests
  if (hasRole(typedSession, 'super_admin')) return true;

  // Check if user has active membership in the request's workspace
  const hasMembership = await hasActiveMembership(typedSession, request.workspaceId);

  // Coordinator admin can access requests in their workspace (if they have membership)
  if (hasMembership && hasRole(typedSession, 'coordinator_admin')) return true;

  // Customer can access their own requests (if they have membership)
  if (hasMembership && hasRole(typedSession, 'customer') && request.createdById === typedSession.userId) return true;

  // Specialist can access requests assigned to them (if they have membership)
  if (hasMembership && hasRole(typedSession, 'specialist') && request.assignedSpecialistId === typedSession.userId) return true;

  // Reviewer can access requests assigned to them (if they have membership)
  if (hasMembership && hasRole(typedSession, 'reviewer') && request.assignedReviewerId === typedSession.userId) return true;

  // B4: Organization-scope access — user có org membership có thể xem request
  // trong workspace thuộc organization của họ (cross-workspace visibility)
  const hasOrgAccess = await hasOrganizationAccess(typedSession, request.workspaceId);
  if (hasOrgAccess) return true;

  return false;
}

export async function canAccessDocument(session: AppSession | null | undefined, documentId: string) {
  if (!documentId || !(await hasActiveUser(session))) return false;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { requestId: true },
  });

  if (!document) return false;
  return canAccessRequest(session, document.requestId);
}

export async function canAccessReview(session: AppSession | null | undefined, reviewId: string) {
  if (!reviewId || !(await hasActiveUser(session))) return false;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      requestId: true,
      reviewerId: true,
    },
  });

  if (!review) return false;
  if (hasRole(session, 'super_admin')) return true;
  if (hasRole(session, 'reviewer') && review.reviewerId === session?.userId) return true;

  return canAccessRequest(session, review.requestId);
}

export async function canAccessVaultFile(session: AppSession | null | undefined, vaultFileId: string) {
  if (!vaultFileId || !(await hasActiveUser(session))) return false;

  const vaultFile = await prisma.vaultFile.findUnique({
    where: { id: vaultFileId },
    select: { requestId: true },
  });

  if (!vaultFile) return false;
  return canAccessRequest(session, vaultFile.requestId);
}
