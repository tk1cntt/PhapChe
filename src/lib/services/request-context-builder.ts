/**
 * Request Context Builder Service
 * Builds permission context from request for multi-tenant access control
 */

import { PrismaClient } from '@prisma/client';
import type {
  RequestContext,
  RequestContextOptions,
  UserContext,
  WorkspaceContext,
  OrganizationContext,
  TenantContext,
  PartnerContext,
} from '@/lib/types/request-context';

export class RequestContextBuilder {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Build complete request context from options
   */
  async build(options: RequestContextOptions): Promise<RequestContext> {
    const context: RequestContext = {
      user: await this.buildUserContext(options.userId),
    };

    if (options.workspaceSlug) {
      context.workspace = await this.buildWorkspaceContext(options.workspaceSlug);

      if (options.includeOrganization !== false && context.workspace?.organizationId) {
        context.organization = await this.buildOrganizationContext(context.workspace.organizationId);

        if (context.organization) {
          context.tenant = await this.buildTenantContext(context.organization.tenantId);
        }
      }
    } else if (options.workspaceId) {
      context.workspace = await this.buildWorkspaceContextById(options.workspaceId);

      if (options.includeOrganization !== false && context.workspace?.organizationId) {
        context.organization = await this.buildOrganizationContext(context.workspace.organizationId);

        if (context.organization) {
          context.tenant = await this.buildTenantContext(context.organization.tenantId);
        }
      }
    }

    if (options.includePartner) {
      context.partner = await this.buildPartnerContext(options.userId);
    }

    return context;
  }

  private async buildUserContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        memberships: {
          select: { role: true },
        },
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.memberships.map((m) => m.role),
      isActive: user.isActive,
    };
  }

  private async buildWorkspaceContext(slug: string): Promise<WorkspaceContext | undefined> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!workspace) return undefined;

    return {
      id: workspace.id,
      slug: workspace.slug,
      organizationId: workspace.organizationId || undefined,
      isActive: workspace.isActive,
    };
  }

  private async buildWorkspaceContextById(id: string): Promise<WorkspaceContext | undefined> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!workspace) return undefined;

    return {
      id: workspace.id,
      slug: workspace.slug,
      organizationId: workspace.organizationId || undefined,
      isActive: workspace.isActive,
    };
  }

  private async buildOrganizationContext(id: string): Promise<OrganizationContext | undefined> {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        name: true,
        status: true,
        isDefault: true,
      },
    });

    if (!org) return undefined;

    return {
      id: org.id,
      tenantId: org.tenantId,
      name: org.name,
      status: org.status,
      isDefault: org.isDefault,
    };
  }

  private async buildTenantContext(id: string): Promise<TenantContext | undefined> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        name: true,
      },
    });

    if (!tenant) return undefined;

    return {
      id: tenant.id,
      type: tenant.type,
      name: tenant.name,
    };
  }

  private async buildPartnerContext(userId: string): Promise<PartnerContext | undefined> {
    const member = await this.prisma.partnerMember.findFirst({
      where: { userId, isActive: true },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!member) return undefined;

    // Get active engagements for this partner
    const engagements = await this.prisma.engagement.findMany({
      where: {
        partnerId: member.partnerId,
        status: 'active',
      },
      select: { id: true },
    });

    return {
      id: member.partner.id,
      name: member.partner.name,
      role: member.role,
      isActive: member.isActive,
      engagementIds: engagements.map((e) => e.id),
    };
  }

  /**
   * Build minimal context for platform admin
   */
  async buildPlatformContext(userId: string): Promise<RequestContext> {
    const user = await this.buildUserContext(userId);

    return {
      user,
      tenant: {
        id: 'platform-tenant',
        type: 'platform',
        name: 'GitNexus Platform',
      },
    };
  }
}
