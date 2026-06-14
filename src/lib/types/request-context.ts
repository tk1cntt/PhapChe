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
 */
export interface WorkspaceContext {
  id: string;
  slug: string;
  organizationId?: string;
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
 * Tenant context (platform level)
 */
export interface TenantContext {
  id: string;
  type: string;
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
