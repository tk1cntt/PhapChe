/**
 * Organization Type Definitions (v2.3)
 * Organization = data owner (SME customer) in the multi-tenant hierarchy.
 *
 * Hierarchy: Tenant → Organization → Workspace → WorkspaceMembership
 * See: docs/shared_customer_partner_collaboration.md §2.1, §5.3
 *      prisma/schema.prisma line 88-108
 */

export type OrganizationStatus = 'active' | 'inactive' | 'pending';

/**
 * Organization entity — customer company, the data owner.
 * One organization can have multiple workspaces (departments/projects).
 */
export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  businessType?: string | null;
  registrationNumber?: string | null;
  address?: string | null;
  contactEmail?: string | null;
  status: OrganizationStatus;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating an organization
 */
export interface CreateOrganizationInput {
  name: string;
  tenantId: string;
  businessType?: string;
  registrationNumber?: string;
  address?: string;
  contactEmail?: string;
  isDefault?: boolean;
}

/**
 * Input for updating an organization
 */
export interface UpdateOrganizationInput {
  name?: string;
  businessType?: string;
  registrationNumber?: string;
  address?: string;
  contactEmail?: string;
  status?: OrganizationStatus;
}
