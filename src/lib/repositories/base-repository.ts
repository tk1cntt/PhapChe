/**
 * Base Repository
 * Common CRUD operations with permission context
 */

import { prisma } from '@/lib/prisma';
import type { RequestContext } from '@/lib/types/request-context';
import { PermissionService } from '@/lib/services/permission-service';

export interface FindManyOptions<T> {
  where?: T;
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, boolean | object>;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  protected db: typeof prisma;
  protected permissionService: PermissionService;

  constructor(customDb?: typeof prisma) {
    this.db = customDb || prisma;
    this.permissionService = new PermissionService(this.db);
  }

  /**
   * Find by ID with permission check
   */
  async findById(ctx: RequestContext, id: string): Promise<T | null> {
    const result = await this.dbFindById(id);
    if (!result) return null;

    if (await this.canAccess(ctx, result)) {
      return result as T;
    }
    return null;
  }

  /**
   * Find many with permission filter
   */
  async findMany(ctx: RequestContext, options: FindManyOptions<WhereInput>): Promise<T[]> {
    const results = await this.dbFindMany(options);
    const accessible: T[] = [];

    for (const result of results) {
      if (await this.canAccess(ctx, result)) {
        accessible.push(result as T);
      }
    }

    return accessible;
  }

  /**
   * Create with permission check
   */
  async create(ctx: RequestContext, data: CreateInput): Promise<T> {
    if (!await this.canCreate(ctx, data)) {
      throw new Error('Permission denied');
    }
    return this.dbCreate(data) as Promise<T>;
  }

  /**
   * Update with permission check
   */
  async update(ctx: RequestContext, id: string, data: UpdateInput): Promise<T> {
    const existing = await this.dbFindById(id);
    if (!existing) throw new Error('Not found');

    if (!await this.canAccess(ctx, existing)) {
      throw new Error('Permission denied');
    }

    if (!await this.canUpdate(ctx, existing, data)) {
      throw new Error('Permission denied');
    }

    return this.dbUpdate(id, data) as Promise<T>;
  }

  /**
   * Delete with permission check
   */
  async delete(ctx: RequestContext, id: string): Promise<void> {
    const existing = await this.dbFindById(id);
    if (!existing) throw new Error('Not found');

    if (!await this.canAccess(ctx, existing)) {
      throw new Error('Permission denied');
    }

    if (!await this.canDelete(ctx, existing)) {
      throw new Error('Permission denied');
    }

    await this.dbDelete(id);
  }

  // Abstract methods for Prisma operations
  protected abstract dbFindById(id: string): Promise<unknown | null>;
  protected abstract dbFindMany(options: FindManyOptions<WhereInput>): Promise<unknown[]>;
  protected abstract dbCreate(data: CreateInput): Promise<unknown>;
  protected abstract dbUpdate(id: string, data: UpdateInput): Promise<unknown>;
  protected abstract dbDelete(id: string): Promise<unknown>;

  // Permission checks (can be overridden)
  protected abstract canAccess(ctx: RequestContext, entity: unknown): Promise<boolean>;
  protected abstract canCreate(ctx: RequestContext, data: CreateInput): Promise<boolean>;
  protected abstract canUpdate(ctx: RequestContext, entity: unknown, data: UpdateInput): Promise<boolean>;
  protected abstract canDelete(ctx: RequestContext, entity: unknown): Promise<boolean>;
}
