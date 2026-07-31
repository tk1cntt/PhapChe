/**
 * Organization Repository
 * Tenant-aware data access for organizations
 */

import { prisma } from '@/lib/prisma';
import { BaseRepository, FindManyOptions } from './base-repository';
import type { RequestContext } from '@/lib/types/request-context';
import type { Organization } from '@/lib/types/organization';

export class OrganizationRepository extends BaseRepository<
  Organization,
  { name: string; tenantId: string; businessType?: string },
  { name?: string; businessType?: string; status?: string },
  { id?: string; tenantId?: string; status?: string }
> {
  constructor(customDb?: typeof prisma) {
    super(customDb);
  }

  protected async dbFindById(id: string) {
    return this.db.organization.findUnique({ where: { id } });
  }

  protected async dbFindMany(options: FindManyOptions<{ id?: string; tenantId?: string; status?: string }>) {
    return this.db.organization.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: options.include,
    });
  }

  protected async dbCreate(data: { name: string; tenantId: string; businessType?: string }) {
    return this.db.organization.create({ data });
  }

  protected async dbUpdate(id: string, data: { name?: string; businessType?: string; status?: string }) {
    return this.db.organization.update({ where: { id }, data });
  }

  protected async dbDelete(id: string) {
    return this.db.organization.delete({ where: { id } });
  }

  private isSameTenantOrAdmin(ctx: RequestContext, org: { tenantId?: string } | null | undefined): boolean {
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && org && ctx.tenant.id === org.tenantId) return true;
    return false;
  }

  protected async canAccess(ctx: RequestContext, entity: unknown): Promise<boolean> {
    const org = entity as { tenantId?: string } | null | undefined;
    if (this.permissionService.isPlatformAdmin(ctx)) return true;
    if (ctx.tenant && org && ctx.tenant.id === org.tenantId) return true;
    return false;
  }

  protected async canCreate(ctx: RequestContext, _data?: { name: string; tenantId: string; businessType?: string }): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }

  protected async canUpdate(ctx: RequestContext, entity: unknown, _data?: { name?: string; businessType?: string; status?: string }): Promise<boolean> {
    return this.isSameTenantOrAdmin(ctx, entity as { tenantId?: string } | null | undefined);
  }

  protected async canDelete(ctx: RequestContext, _entity?: unknown): Promise<boolean> {
    return this.permissionService.isPlatformAdmin(ctx);
  }

  /**
   * List organizations for current tenant
   */
  async listForTenant(ctx: RequestContext, options?: { skip?: number; take?: number }) {
    if (!ctx.tenant) throw new Error('Tenant context required');
    return this.findMany(ctx, {
      where: { tenantId: ctx.tenant.id },
      ...options,
    });
  }
}
