/**
 * Organization Type Definitions
 * Represents a customer company in the multi-tenant hierarchy
 */

export type OrganizationStatus = 'active' | 'inactive' | 'pending';

/**
 * Organization entity - customer company
 * Lives under a Tenant and contains Workspaces
 */
export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  businessType?: string;
  registrationNumber?: string;
  address?: string;
  contactEmail?: string;
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
