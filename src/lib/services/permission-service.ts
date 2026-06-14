/**
 * Permission Service
 * Permission checking functions for multi-tenant access control
 */

import { prisma } from '@/lib/prisma';
import type { RequestContext } from '@/lib/types/request-context';
import type { PermissionLevel } from '@/lib/types/engagement-service-scope';

export class PermissionService {
  private prismaClient = prisma;

  constructor(customPrisma?: typeof prisma) {
    // Allow custom prisma instance for testing
    this.prismaClient = customPrisma || prisma;
  }

  /**
   * Check if user is platform admin
   */
  isPlatformAdmin(ctx: RequestContext): boolean {
    return ctx.user.roles.includes('super_admin');
  }

  /**
   * Check if user can read a request
   */
  async canReadRequest(ctx: RequestContext, requestId: string): Promise<boolean> {
    // Platform admins can read all
    if (this.isPlatformAdmin(ctx)) return true;

    // Get request details
    const request = await this.prismaClient.legalRequest.findUnique({
      where: { id: requestId },
      include: {
        workspace: {
          include: {
            memberships: {
              where: { userId: ctx.user.id, isActive: true },
            },
          },
        },
      },
    });

    if (!request) return false;

    // Check workspace membership
    const isMember = request.workspace.memberships.length > 0;
    if (isMember) return true;

    // Check partner access
    if (ctx.partner) {
      return this.checkPartnerAccessToRequest(ctx.partner, request);
    }

    return false;
  }

  /**
   * Check if user can write (update) a request
   */
  async canWriteRequest(ctx: RequestContext, requestId: string): Promise<boolean> {
    // Platform admins can write all
    if (this.isPlatformAdmin(ctx)) return true;

    // Get request details
    const request = await this.prismaClient.legalRequest.findUnique({
      where: { id: requestId },
      include: {
        workspace: {
          include: {
            memberships: {
              where: { userId: ctx.user.id, isActive: true, role: { in: ['specialist', 'coordinator_admin'] } },
            },
          },
        },
      },
    });

    if (!request) return false;

    // Check workspace membership with write role
    const isWriter = request.workspace.memberships.length > 0;
    if (isWriter) return true;

    // Partners cannot write unless they have full_access
    if (ctx.partner) {
      const hasFullAccess = await this.checkPartnerFullAccess(ctx.partner.id, request);
      return hasFullAccess;
    }

    return false;
  }

  /**
   * Check if user can access workspace
   */
  async canAccessWorkspace(ctx: RequestContext, workspaceSlug: string): Promise<boolean> {
    // Platform admins can access all workspaces
    if (this.isPlatformAdmin(ctx)) return true;

    // Check workspace membership
    const workspace = await this.prismaClient.workspace.findUnique({
      where: { slug: workspaceSlug },
      include: {
        memberships: {
          where: { userId: ctx.user.id, isActive: true },
        },
      },
    });

    if (!workspace) return false;
    return workspace.memberships.length > 0;
  }

  /**
   * Check if user can manage organization
   */
  async canManageOrganization(ctx: RequestContext, organizationId: string): Promise<boolean> {
    // Platform admins can manage all organizations
    if (this.isPlatformAdmin(ctx)) return true;

    // Get organization and check if user has admin role in any workspace
    const workspaces = await this.prismaClient.workspace.findMany({
      where: { organizationId },
      include: {
        memberships: {
          where: { userId: ctx.user.id, isActive: true, role: 'coordinator_admin' },
        },
      },
    });

    return workspaces.some(w => w.memberships.length > 0);
  }

  /**
   * Check if user can manage workspace
   */
  async canManageWorkspace(ctx: RequestContext, workspaceSlug: string): Promise<boolean> {
    // Platform admins can manage all workspaces
    if (this.isPlatformAdmin(ctx)) return true;

    const workspace = await this.prismaClient.workspace.findUnique({
      where: { slug: workspaceSlug },
      include: {
        memberships: {
          where: { userId: ctx.user.id, isActive: true, role: 'coordinator_admin' },
        },
      },
    });

    if (!workspace) return false;
    return workspace.memberships.length > 0;
  }

  /**
   * Check partner access to a specific request
   */
  private async checkPartnerAccessToRequest(
    partner: { id: string; engagementIds: string[] },
    request: { engagementId?: string | null; assignedPartnerId?: string | null }
  ): Promise<boolean> {
    // Direct assignment to partner
    if (request.assignedPartnerId === partner.id) return true;

    // Check engagement access
    if (request.engagementId && partner.engagementIds.includes(request.engagementId)) {
      return true;
    }

    return false;
  }

  /**
   * Check if partner has full_access to a request
   */
  private async checkPartnerFullAccess(partnerId: string, request: { engagementId?: string | null }): Promise<boolean> {
    if (!request.engagementId) return false;

    const scope = await this.prismaClient.engagementServiceScope.findFirst({
      where: {
        engagementId: request.engagementId,
        permissionLevel: 'full_access',
      },
    });

    return scope !== null;
  }

  /**
   * Get permission level for partner on engagement
   */
  async getPartnerPermissionLevel(engagementId: string): Promise<PermissionLevel[]> {
    const scopes = await this.prismaClient.engagementServiceScope.findMany({
      where: { engagementId },
      select: { permissionLevel: true },
    });

    return scopes.map(s => s.permissionLevel as PermissionLevel);
  }
}
