/**
 * Workspace Repository
 * Tenant-aware data access for workspaces
 */

import { PrismaClient } from '@prisma/client';
import { BaseRepository, FindManyOptions } from './base-repository';
import type { RequestContext } from '@/lib/types/request-context';
import type { Workspace } from '@/lib/types/workspace';

export class WorkspaceRepository extends BaseRepository<
  Workspace,
  { name: string; slug: string; organizationId?: string },
  { name?: string; isActive?: boolean },
  { id?: string; organizationId?: string; isActive?: boolean }
> {
  constructor(prisma?: PrismaClient) {
    super(prisma);
  }

  protected async prismaFindById(id: string) {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  protected async prismaFindMany(options: FindManyOptions<{ id?: string; organizationId?: string; isActive?: boolean }>) {
    return this.prisma.workspace.findMany(options as Parameters<typeof this.prisma.workspace.findMany>[0]);
  }

  protected async prismaCreate(data: { name: string; slug: string; organizationId?: string }) {
    return this.prisma.workspace.create({ data });
  }

  protected async prismaUpdate(id: string, data: { name?: string; isActive?: boolean }) {
    return this.prisma.workspace.update({ where: { id }, data });
  }

  protected async prismaDelete(id: string) {
    return this.prisma.workspace.delete({ where: { id } });
  }

  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const workspace = entity as { slug: string };
    return this.permissionService.canAccessWorkspace(ctx, workspace.slug);
  }

  protected async canCreate(ctx: RequestContext): Promise<boolean> {
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.organization) {
      return this.permissionService.canManageOrganization(ctx, ctx.organization.id);
    }
    return false;
  }

  protected async canUpdate(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const workspace = entity as { slug: string };
    return this.permissionService.canManageWorkspace(ctx, workspace.slug);
  }

  protected async canDelete(ctx: RequestContext): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }

  /**
   * List workspaces for current user
   */
  async listForUser(ctx: RequestContext, options?: { skip?: number; take?: number }) {
    return this.prisma.workspace.findMany({
      where: {
        memberships: {
          some: { userId: ctx.user.id, isActive: true },
        },
      },
      include: {
        _count: { select: { memberships: true, requests: true } },
      },
      ...options,
    });
  }
}
