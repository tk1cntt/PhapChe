/**
 * Partner Invite Service
 * Handles partner member invitation and onboarding
 */

import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export type PartnerInviteRole = 'admin' | 'specialist' | 'viewer';
export type PartnerInviteStatus = 'pending' | 'accepted' | 'revoked';

export interface PartnerInvite {
  id: string;
  partnerId: string;
  email: string;
  role: PartnerInviteRole;
  token: string;
  status: PartnerInviteStatus;
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateInviteInput {
  partnerId: string;
  email: string;
  role: PartnerInviteRole;
  invitedBy: string;
  expiresInDays?: number;
}

/**
 * Generate a secure invite token
 */
function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

export class PartnerInviteService {
  private prismaClient = prisma;
  private DEFAULT_EXPIRY_DAYS = 7;

  constructor(customPrisma?: typeof prisma) {
    this.prismaClient = customPrisma || prisma;
  }

  /**
   * Create a new invite for a partner organization
   */
  async createInvite(input: CreateInviteInput): Promise<{
    success: boolean;
    invite?: PartnerInvite;
    error?: string;
  }> {
    try {
      const { partnerId, email, role, invitedBy, expiresInDays } = input;

      // Validate role
      const validRoles: PartnerInviteRole[] = ['admin', 'specialist', 'viewer'];
      if (!validRoles.includes(role)) {
        return { success: false, error: 'Invalid role' };
      }

      // Check if partner exists
      const partner = await this.prismaClient.partner.findUnique({
        where: { id: partnerId },
      });

      if (!partner) {
        return { success: false, error: 'Partner not found' };
      }

      // Check if user is already a member
      const existingUser = await this.prismaClient.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        const existingMember = await this.prismaClient.partnerMember.findFirst({
          where: {
            partnerId,
            userId: existingUser.id,
          },
        });

        if (existingMember) {
          return { success: false, error: 'User is already a member' };
        }
      }

      // Check for existing pending invite
      const existingInvite = await this.prismaClient.partnerInvite.findFirst({
        where: {
          partnerId,
          email: email.toLowerCase(),
          status: 'pending',
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvite) {
        return { success: false, error: 'Pending invite already exists for this email' };
      }

      // Generate token and calculate expiry
      const token = generateInviteToken();
      const expiryDays = expiresInDays || this.DEFAULT_EXPIRY_DAYS;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Create invite
      const invite = await this.prismaClient.partnerInvite.create({
        data: {
          partnerId,
          email: email.toLowerCase(),
          role,
          token,
          invitedBy,
          expiresAt,
          status: 'pending',
        },
      });

      return {
        success: true,
        invite: {
          ...invite,
          role: invite.role as PartnerInviteRole,
          status: invite.status as PartnerInviteStatus,
        },
      };
    } catch (error) {
      console.error('Create invite error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invite',
      };
    }
  }

  /**
   * Accept an invite and link user to partner
   */
  async acceptInvite(token: string, userId: string): Promise<{
    success: boolean;
    member?: {
      id: string;
      partnerId: string;
      role: string;
    };
    error?: string;
  }> {
    try {
      // Find invite by token
      const invite = await this.prismaClient.partnerInvite.findFirst({
        where: {
          token,
          status: 'pending',
        },
      });

      if (!invite) {
        return { success: false, error: 'Invalid or expired invite' };
      }

      // Check if expired
      if (invite.expiresAt < new Date()) {
        return { success: false, error: 'Invite has expired' };
      }

      // Check if user exists
      const user = await this.prismaClient.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify email matches (if user email is set)
      if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
        return { success: false, error: 'Invite email does not match user email' };
      }

      // Check if already a member
      const existingMember = await this.prismaClient.partnerMember.findFirst({
        where: {
          partnerId: invite.partnerId,
          userId,
        },
      });

      if (existingMember) {
        return { success: false, error: 'User is already a member' };
      }

      // Create member record
      const member = await this.prismaClient.partnerMember.create({
        data: {
          partnerId: invite.partnerId,
          userId,
          role: invite.role,
          isActive: true,
        },
      });

      // Update invite status
      await this.prismaClient.partnerInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted' },
      });

      return {
        success: true,
        member: {
          id: member.id,
          partnerId: member.partnerId,
          role: member.role,
        },
      };
    } catch (error) {
      console.error('Accept invite error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to accept invite',
      };
    }
  }

  /**
   * Revoke a pending invite
   */
  async revokeInvite(inviteId: string, revokedBy: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const invite = await this.prismaClient.partnerInvite.findUnique({
        where: { id: inviteId },
      });

      if (!invite) {
        return { success: false, error: 'Invite not found' };
      }

      if (invite.status !== 'pending') {
        return { success: false, error: 'Invite is not pending' };
      }

      await this.prismaClient.partnerInvite.update({
        where: { id: inviteId },
        data: { status: 'revoked' },
      });

      return { success: true };
    } catch (error) {
      console.error('Revoke invite error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke invite',
      };
    }
  }

  /**
   * List all pending invites for a partner
   */
  async listPendingInvites(partnerId: string): Promise<PartnerInvite[]> {
    const invites = await this.prismaClient.partnerInvite.findMany({
      where: {
        partnerId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map(invite => ({
      ...invite,
      role: invite.role as PartnerInviteRole,
      status: invite.status as PartnerInviteStatus,
    }));
  }

  /**
   * Get invite by ID
   */
  async getInviteById(inviteId: string): Promise<PartnerInvite | null> {
    const invite = await this.prismaClient.partnerInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) return null;

    return {
      ...invite,
      role: invite.role as PartnerInviteRole,
      status: invite.status as PartnerInviteStatus,
    };
  }

  /**
   * Get invite by token (for public acceptance)
   */
  async getInviteByToken(token: string): Promise<PartnerInvite | null> {
    const invite = await this.prismaClient.partnerInvite.findFirst({
      where: {
        token,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (!invite) return null;

    return {
      ...invite,
      role: invite.role as PartnerInviteRole,
      status: invite.status as PartnerInviteStatus,
    };
  }
}

// Export singleton instance
export const partnerInviteService = new PartnerInviteService();
