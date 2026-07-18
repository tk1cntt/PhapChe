/**
 * Request Context Type Definitions
 * Multi-tenant permission context for API requests
 */

/**
 * User context extracted from session
 */
export interface UserContext {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
}

/**
 * Workspace context extracted from request
 * Workspace.organizationId is NOT NULL since v2.3
 */
export interface WorkspaceContext {
  id: string;
  slug: string;
  organizationId: string; // NOT NULL — every workspace belongs to an organization
  isActive: boolean;
}

/**
 * Organization context (company level)
 */
export interface OrganizationContext {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  isDefault: boolean;
}

/**
 * Tenant context (platform level) — v2.3
 * Single tenant 'platform-tenant' with mode='shared_platform' for MVP
 * See docs/shared_customer_partner_collaboration.md §5.1
 */
export interface TenantContext {
  id: string;
  mode: string; // 'shared_platform' | 'dedicated_partner' | 'dedicated_customer'
  code?: string | null;
  name: string;
}

/**
 * Partner context (if user is a partner member)
 */
export interface PartnerContext {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  engagementIds: string[];
}

/**
 * Complete request context for permission checking
 */
export interface RequestContext {
  user: UserContext;
  workspace?: WorkspaceContext;
  organization?: OrganizationContext;
  tenant?: TenantContext;
  partner?: PartnerContext;
  requestId?: string; // For audit logging
}

/**
 * Request context options for building
 */
export interface RequestContextOptions {
  userId: string;
  workspaceSlug?: string;
  workspaceId?: string;
  includeOrganization?: boolean;
  includePartner?: boolean;
}
