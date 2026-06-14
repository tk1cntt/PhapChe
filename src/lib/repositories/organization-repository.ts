/**
 * Organization Repository
 * Tenant-aware data access for organizations
 */

import { PrismaClient } from '@prisma/client';
import { BaseRepository, FindManyOptions } from './base-repository';
import type { RequestContext } from '@/lib/types/request-context';
import type { Organization } from '@/lib/types/organization';

export class OrganizationRepository extends BaseRepository<
  Organization,
  { name: string; tenantId: string; businessType?: string },
  { name?: string; businessType?: string; status?: string },
  { id?: string; tenantId?: string; status?: string }
> {
  constructor(prisma?: PrismaClient) {
    super(prisma);
  }

  protected async prismaFindById(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  protected async prismaFindMany(options: FindManyOptions<{ id?: string; tenantId?: string; status?: string }>) {
    return this.prisma.organization.findMany(options as Parameters<typeof this.prisma.organization.findMany>[0]);
  }

  protected async prismaCreate(data: { name: string; tenantId: string; businessType?: string }) {
    return this.prisma.organization.create({ data });
  }

  protected async prismaUpdate(id: string, data: { name?: string; businessType?: string; status?: string }) {
    return this.prisma.organization.update({ where: { id }, data });
  }

  protected async prismaDelete(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }

  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const org = entity as { tenantId: string };
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && ctx.tenant.id === org.tenantId) return true;
    return false;
  }

  protected async canCreate(ctx: RequestContext): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }

  protected async canUpdate(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const org = entity as { tenantId: string };
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && ctx.tenant.id === org.tenantId) return true;
    return false;
  }

  protected async canDelete(ctx: RequestContext): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }

  /**
   * List organizations for current tenant
   */
  async listForTenant(ctx: RequestContext, options?: { skip?: number; take?: number }) {
    if (!ctx.tenant) throw new Error('Tenant context required');
    return this.prisma.organization.findMany({
      where: { tenantId: ctx.tenant.id },
      ...options,
    });
  }
}
