/**
 * Partner Auth Service
 * Handles partner-specific authentication and session management
 */

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import type { Partner, PartnerMember, User } from '@prisma/client';

export interface PartnerAuthResult {
  success: boolean;
  user?: User;
  partner?: Partner;
  partnerMember?: PartnerMember;
  permissions?: string[];
  error?: string;
}

export interface PartnerPermissions {
  role: string;
  permissions: string[];
}

/**
 * Role-based permissions for partner members
 */
export const PARTNER_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'manage_members',
    'manage_engagements',
    'view_requests',
    'manage_requests',
    'view_documents',
    'manage_documents',
  ],
  specialist: [
    'view_requests',
    'manage_requests',
    'view_documents',
    'manage_documents',
  ],
  viewer: ['view_requests', 'view_documents'],
};

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: string): string[] {
  const normalizedRole = role.toLowerCase();
  return PARTNER_PERMISSIONS[normalizedRole] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: string): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

export class PartnerAuthService {
  private prismaClient = prisma;

  constructor(customPrisma?: typeof prisma) {
    this.prismaClient = customPrisma || prisma;
  }

  /**
   * Partner login - verify credentials and return session with partner context
   */
  async partnerLogin(email: string, password: string): Promise<PartnerAuthResult> {
    try {
      // Get user by email
      const user = await this.prismaClient.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is inactive' };
      }

      // Verify password using better-auth
      const signInResult = await auth.api.signInEmail({
        body: {
          email: email.toLowerCase(),
          password,
        },
      });

      if (!signInResult?.user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if user is an active partner member
      const partnerMember = await this.prismaClient.partnerMember.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          partner: {
            status: 'active',
          },
        },
        include: {
          partner: true,
        },
      });

      if (!partnerMember) {
        return { success: false, error: 'User is not a partner member' };
      }

      // Get permissions for the role
      const permissions = getPermissionsForRole(partnerMember.role);

      return {
        success: true,
        user,
        partner: partnerMember.partner,
        partnerMember,
        permissions,
      };
    } catch (error) {
      console.error('Partner login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Validate partner session - check if user is an active partner member
   */
  async validatePartnerSession(userId: string): Promise<{
    valid: boolean;
    partnerContext?: {
      partner: Partner;
      member: PartnerMember;
      permissions: string[];
    };
    error?: string;
  }> {
    try {
      const member = await this.prismaClient.partnerMember.findFirst({
        where: {
          userId,
          isActive: true,
          partner: {
            status: 'active',
          },
        },
        include: {
          partner: true,
        },
      });

      if (!member) {
        return { valid: false, error: 'Not a partner member or partner is inactive' };
      }

      const permissions = getPermissionsForRole(member.role);

      return {
        valid: true,
        partnerContext: {
          partner: member.partner,
          member,
          permissions,
        },
      };
    } catch (error) {
      console.error('Validate partner session error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Get partner permissions for a specific user in a partner organization
   */
  async getPartnerPermissions(
    partnerId: string,
    userId: string
  ): Promise<PartnerPermissions | null> {
    try {
      const member = await this.prismaClient.partnerMember.findFirst({
        where: {
          partnerId,
          userId,
          isActive: true,
        },
      });

      if (!member) {
        return null;
      }

      return {
        role: member.role,
        permissions: getPermissionsForRole(member.role),
      };
    } catch (error) {
      console.error('Get partner permissions error:', error);
      return null;
    }
  }

  /**
   * Check if user has a specific permission in a partner organization
   */
  async hasPartnerPermission(
    partnerId: string,
    userId: string,
    permission: string
  ): Promise<boolean> {
    const permissions = await this.getPartnerPermissions(partnerId, userId);
    if (!permissions) return false;
    return permissions.permissions.includes(permission);
  }

  /**
   * Get all partner members with their user info
   */
  async getPartnerMembers(partnerId: string, options?: {
    role?: string;
    isActive?: boolean;
  }): Promise<(PartnerMember & { user: User })[]> {
    const where: Record<string, unknown> = { partnerId };
    if (options?.role) {
      where.role = options.role;
    }
    if (typeof options?.isActive === 'boolean') {
      where.isActive = options.isActive;
    }

    return this.prismaClient.partnerMember.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    }) as Promise<(PartnerMember & { user: User })[]>;
  }
}

// Export singleton instance
export const partnerAuthService = new PartnerAuthService();
