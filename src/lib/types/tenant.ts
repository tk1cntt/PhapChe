/**
 * Tenant Type Definitions (v2.3)
 * Top-level container in the multi-tenant hierarchy.
 *
 * Hierarchy: Tenant → Organization → Workspace → WorkspaceMembership
 * See: docs/shared_customer_partner_collaboration.md §1, §5.1
 *      prisma/schema.prisma line 76-86
 */

/**
 * Tenant deployment mode (replaces old 'type')
 * - shared_platform: single tenant shared by all customers (MVP default)
 * - dedicated_partner: dedicated tenant for a large partner
 * - dedicated_customer: dedicated tenant for a large customer
 */
export type TenantMode = 'shared_platform' | 'dedicated_partner' | 'dedicated_customer';

/**
 * Tenant entity — top-level multi-tenant container.
 * In MVP, there is exactly ONE tenant: 'platform-tenant' with mode 'shared_platform'.
 * Tenant isolation is reserved for future dedicated-tenant deployments.
 */
export interface Tenant {
  id: string;
  name: string;
  code?: string | null;
  mode: TenantMode;
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
  code?: string | null;
  mode?: TenantMode;
  settings?: TenantSettings;
}

/**
 * Input for updating a tenant
 */
export interface UpdateTenantInput {
  name?: string;
  mode?: TenantMode;
  settings?: Partial<TenantSettings>;
}

/** Platform tenant constant — the single tenant in MVP */
export const PLATFORM_TENANT_ID = 'platform-tenant';
/** Shared platform mode — the single tenant mode in MVP */
export const PLATFORM_TENANT_MODE: TenantMode = 'shared_platform';
