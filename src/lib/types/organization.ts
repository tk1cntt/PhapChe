/**
 * Organization Type Definitions (v2.3)
 * Organization = data owner (SME customer) in the multi-tenant hierarchy.
 *
 * Hierarchy: Tenant → Organization → Workspace → WorkspaceMembership
 *            Tenant → Organization → OrganizationMembership (cross-workspace)
 * See: docs/shared_customer_partner_collaboration.md §2.1, §5.3, §5.5
 *      prisma/schema.prisma line 88-108
 */

export type OrganizationStatus = 'active' | 'inactive' | 'pending';

/**
 * Organization-level role — assigned per organization_members
 * Mirrors design doc §5.5: owner | admin | member | viewer
 */
export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';
export type MembershipStatus = 'active' | 'invited' | 'suspended' | 'removed';

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
  /** At most one organization per tenant may be the default. Enforced at the service layer. */
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating an organization
 */
export interface CreateOrganizationInput {
  name: string;
  /** tenantId is derived server-side from the authenticated session */
  tenantId: string;
  businessType?: string;
  registrationNumber?: string;
  address?: string;
  contactEmail?: string;
  isDefault?: boolean;
}

/**
 * Organization membership — user's cross-workspace role within an organization.
 * One user can be a member of one organization. Used for org-scoped authorization
 * that spans multiple workspaces under the same org.
 *
 * Parallel to WorkspaceMembership (per-workspace), but at the data-owner level.
 * See: docs/shared_customer_partner_collaboration.md §5.5, §13.2 (rule 3)
 */
export interface OrganizationMembership {
  id: string;
  tenantId: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  /** Use a strict permission set. Validate/sanitize on read and write. */
  permissionsJson: Record<string, boolean>;
  invitedByUserId?: string | null;
  joinedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
