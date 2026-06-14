/**
 * Tenant Type Definitions
 * Represents the top-level tenant in the multi-tenant hierarchy
 */

export type TenantType = 'platform' | 'customer';

/**
 * Tenant entity - top-level multi-tenant container
 */
export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant-specific settings stored as JSON
 */
export interface TenantSettings {
  requireMfa?: boolean;
  allowedDomains?: string[];
  defaultLanguage?: string;
  timezone?: string;
}

/**
 * Input for creating a tenant
 */
export interface CreateTenantInput {
  name: string;
  type?: TenantType;
  settings?: TenantSettings;
}

/**
 * Input for updating a tenant
 */
export interface UpdateTenantInput {
  name?: string;
  settings?: Partial<TenantSettings>;
}
