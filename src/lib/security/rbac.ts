import { prisma } from '@/lib/prisma';
import type { AppSession } from './session';

function hasRole(session: AppSession | null | undefined, role: string) {
  return session?.roles.includes(role) ?? false;
}

async function hasActiveUser(session: AppSession | null | undefined) {
  if (!session?.userId) return false;

  try {
    const user = await prisma.user.findFirst({
      where: { id: session.userId, isActive: true },
      select: { id: true },
    });

    return Boolean(user);
  } catch (error) {
    console.error('hasActiveUser failed:', error);
    return false;
  }
}

async function hasActiveMembership(session: AppSession, workspaceId: string) {
  try {
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
  } catch (error) {
    console.error('hasActiveMembership failed:', error);
    return false;
  }
}

/**
 * ── B4: Organization-scope access check ──
 * Kiểm tra user có quyền truy cập workspace thông qua Organization membership.
 * Dùng khi user là organization member nhưng chưa có WorkspaceMembership trực tiếp.
 * See: docs/shared_customer_partner_collaboration.md §5.5, §13.2 (rule 3)
 */
async function hasOrganizationAccess(session: AppSession, workspaceId: string): Promise<boolean> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId, isActive: true },
      select: { organizationId: true },
    });
    if (!workspace) return false;

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
  } catch (error) {
    console.error('hasOrganizationAccess failed:', error);
    return false;
  }
}

/**
 * ── C1: Engagement-scope access check ──
 * Partner member chỉ có quyền xem request nếu:
 * 1. Partner được assign trực tiếp vào request (assignedPartnerId)
 * 2. Hoặc có active engagement với organization của request
 * 3. Và engagement có service_type phù hợp + permission_level cho phép
 * See: docs/shared_customer_partner_collaboration.md §13.3
 */
async function hasEngagementAccess(session: AppSession, request: {
  workspaceId: string;
  assignedPartnerId: string | null;
  engagementId: string | null;
}): Promise<boolean> {
  try {
    // Nếu request không có assignedPartnerId và không có engagementId, không phải partner access
    if (!request.assignedPartnerId && !request.engagementId) return false;

    // Kiểm tra user có phải partner member không
    const partnerMember = await prisma.partnerMember.findFirst({
      where: { userId: session.userId, isActive: true },
      select: { partnerId: true, role: true },
    });
    if (!partnerMember) return false;

    // Case 1: Partner được assign trực tiếp vào request
    if (request.assignedPartnerId === partnerMember.partnerId) return true;

    // Case 2: Request có engagement → kiểm tra partner có active engagement với organization không
    if (request.engagementId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: request.workspaceId },
        select: { organizationId: true },
      });
      if (!workspace) return false;

      const engagement = await prisma.engagement.findFirst({
        where: {
          id: request.engagementId,
          partnerId: partnerMember.partnerId,
          organizationId: workspace.organizationId,
          status: 'active',
        },
        select: { id: true },
      });

      return Boolean(engagement);
    }

    return false;
  } catch (error) {
    console.error('hasEngagementAccess failed:', error);
    return false;
  }
}

export async function canAccessWorkspace(session: AppSession | null | undefined, workspaceId: string) {
  try {
    if (!workspaceId || !(await hasActiveUser(session))) return false;
    if (hasRole(session, 'super_admin')) return true;
    const typedSession = session as AppSession;
    if (await hasActiveMembership(typedSession, workspaceId)) return true;
    // B4: Fallback to Organization scope
    return hasOrganizationAccess(typedSession, workspaceId);
  } catch (error) {
    console.error('canAccessWorkspace failed:', error);
    return false;
  }
}

export async function canAccessRequest(session: AppSession | null | undefined, requestId: string): Promise<boolean> {
  try {
    if (!requestId || !(await hasActiveUser(session))) return false;

    const request = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: {
        workspaceId: true,
        createdById: true,
        assignedSpecialistId: true,
        assignedReviewerId: true,
        engagementId: true,       // C1: engagement-scope check
        assignedPartnerId: true,  // C1: partner direct assignment check
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

    // B4: Organization-scope access
    const hasOrgAccess = await hasOrganizationAccess(typedSession, request.workspaceId);
    if (hasOrgAccess) return true;

    // C1: Engagement-scope access — partner member qua engagement hoặc direct assignment
    if (await hasEngagementAccess(typedSession, request)) return true;

    return false;
  } catch (error) {
    console.error('canAccessRequest failed:', error);
    return false;
  }
}

export async function canAccessDocument(session: AppSession | null | undefined, documentId: string) {
  try {
    if (!documentId || !(await hasActiveUser(session))) return false;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { requestId: true },
    });

    if (!document) return false;
    return canAccessRequest(session, document.requestId);
  } catch (error) {
    console.error('canAccessDocument failed:', error);
    return false;
  }
}

export async function canAccessReview(session: AppSession | null | undefined, reviewId: string) {
  try {
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
  } catch (error) {
    console.error('canAccessReview failed:', error);
    return false;
  }
}

export async function canAccessVaultFile(session: AppSession | null | undefined, vaultFileId: string) {
  try {
    if (!vaultFileId || !(await hasActiveUser(session))) return false;

    const vaultFile = await prisma.vaultFile.findUnique({
      where: { id: vaultFileId },
      select: { requestId: true },
    });

    if (!vaultFile) return false;
    return canAccessRequest(session, vaultFile.requestId);
  } catch (error) {
    console.error('canAccessVaultFile failed:', error);
    return false;
  }
}
