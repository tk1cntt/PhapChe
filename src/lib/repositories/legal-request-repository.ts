/**
 * Legal Request Repository
 * Tenant-aware data access for legal requests
 */

import { prisma } from '@/lib/prisma';
import { BaseRepository, FindManyOptions } from './base-repository';
import type { RequestContext } from '@/lib/types/request-context';
import type { LegalRequest } from '@/lib/types/request';

export class LegalRequestRepository extends BaseRepository<
  LegalRequest,
  { workspaceId: string; title: string },
  { title?: string; status?: string; priority?: string },
  { id?: string; workspaceId?: string; status?: string }
> {
  constructor(customDb?: typeof prisma) {
    super(customDb);
  }

  protected async prismaFindById(id: string) {
    return this.db.legalRequest.findUnique({
      where: { id },
      include: {
        workspace: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedSpecialist: { select: { id: true, name: true, email: true } },
      },
    });
  }

  protected async prismaFindMany(options: FindManyOptions<{ id?: string; workspaceId?: string; status?: string }>) {
    return this.db.legalRequest.findMany(options as Parameters<typeof this.db.legalRequest.findMany>[0]);
  }

  protected async prismaCreate(data: { workspaceId: string; title: string }) {
    return this.db.legalRequest.create({ data });
  }

  protected async prismaUpdate(id: string, data: { title?: string; status?: string; priority?: string }) {
    return this.db.legalRequest.update({ where: { id }, data });
  }

  protected async prismaDelete(id: string) {
    return this.db.legalRequest.delete({ where: { id } });
  }

  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const request = entity as { id: string };
    return this.permissionService.canReadRequest(ctx, request.id);
  }

  protected async canCreate(ctx: RequestContext): Promise<boolean> {
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.workspace) {
      return this.permissionService.canAccessWorkspace(ctx, ctx.workspace.slug);
    }
    return false;
  }

  protected async canUpdate(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const request = entity as { id: string };
    return this.permissionService.canWriteRequest(ctx, request.id);
  }

  protected async canDelete(ctx: RequestContext): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }

  /**
   * List requests for current workspace
   */
  async listForWorkspace(ctx: RequestContext, workspaceSlug: string, options?: { skip?: number; take?: number; status?: string }) {
    if (!await this.permissionService.canAccessWorkspace(ctx, workspaceSlug)) {
      throw new Error('Permission denied');
    }

    return this.db.legalRequest.findMany({
      where: {
        workspace: { slug: workspaceSlug },
        ...(options?.status ? { status: options.status } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedSpecialist: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...options,
    });
  }
}
