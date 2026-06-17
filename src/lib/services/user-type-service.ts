/**
 * User Type Utilities
 *
 * Helper functions to determine user types based on:
 * - accountType: 'staff' | 'customer'
 * - workspace memberships and roles
 */

import type { AccountType } from '@/lib/types';
import type { WorkspaceMembership, Workspace } from '@prisma/client';

export interface UserTypeInfo {
  accountType: AccountType;
  isStaff: boolean;
  isCustomer: boolean;
  organizationId: string | null;
  primaryRole: string;
  allRoles: string[];
}

/**
 * Staff roles in workspace
 */
export const STAFF_ROLES = ['super_admin', 'coordinator', 'specialist', 'reviewer'] as const;

/**
 * Check if a role is a staff role
 */
export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role as typeof STAFF_ROLES[number]);
}

/**
 * Get user type info from memberships
 */
export function getUserTypeInfo(
  accountType: AccountType,
  memberships: WorkspaceMembership[]
): UserTypeInfo {
  const activeMemberships = memberships.filter(m => m.isActive);
  const allRoles = activeMemberships.map(m => m.role);
  const hasStaffRole = allRoles.some(role => isStaffRole(role));

  // If accountType is 'staff', user is staff regardless of membership
  // If accountType is 'customer', check membership roles
  const isStaff = accountType === 'staff' || hasStaffRole;
  const isCustomer = !isStaff;

  // Get organization ID from first workspace that has one
  let organizationId: string | null = null;
  for (const membership of activeMemberships) {
    // This would need workspace data - see getOrganizationIdFromMemberships
    // For now, return null and use the extended version
    break;
  }

  return {
    accountType,
    isStaff,
    isCustomer,
    organizationId,
    primaryRole: allRoles[0] || 'none',
    allRoles: [...new Set(allRoles)],
  };
}

/**
 * Get user type with organization info
 * Requires workspace data to be joined
 */
export function getUserTypeInfoWithOrg(
  accountType: AccountType,
  memberships: (WorkspaceMembership & { workspace?: { organizationId: string | null } })[]
): UserTypeInfo {
  const activeMemberships = memberships.filter(m => m.isActive);
  const allRoles = activeMemberships.map(m => m.role);
  const hasStaffRole = allRoles.some(role => isStaffRole(role));

  const isStaff = accountType === 'staff' || hasStaffRole;
  const isCustomer = !isStaff;

  // Get first non-null organizationId
  const organizationId = activeMemberships
    .find(m => m.workspace?.organizationId)?
    .workspace?.organizationId || null;

  return {
    accountType,
    isStaff,
    isCustomer,
    organizationId,
    primaryRole: allRoles[0] || 'none',
    allRoles: [...new Set(allRoles)],
  };
}

/**
 * Check if user is a corporate customer (customer with organization)
 */
export function isCorporateCustomer(info: UserTypeInfo): boolean {
  return info.isCustomer && info.organizationId !== null;
}

/**
 * Check if user is an individual customer (customer without organization)
 */
export function isIndividualCustomer(info: UserTypeInfo): boolean {
  return info.isCustomer && info.organizationId === null;
}

/**
 * Get activity type based on user type
 */
export function getActivityType(
  info: UserTypeInfo
): 'staff_activity' | 'corporate_activity' | 'individual_activity' {
  if (info.isStaff) return 'staff_activity';
  if (info.organizationId) return 'corporate_activity';
  return 'individual_activity';
}
