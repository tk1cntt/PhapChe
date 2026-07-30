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

      // Verify email matches (if both user and invite emails are set)
      if (user.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
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

      // ── Create member + update invite atomically ──
      // Wrapped in transaction to prevent concurrent accepts and to use
      // conditional updateMany to avoid overwriting an already-accepted invite.
      const [member] = await this.prismaClient.$transaction([
        this.prismaClient.partnerMember.create({
          data: {
            partnerId: invite.partnerId,
            userId,
            role: invite.role,
            isActive: true,
          },
        }),
        // Only update if still pending — prevents race with concurrent accept
        this.prismaClient.partnerInvite.updateMany({
          where: { id: invite.id, status: 'pending' },
          data: { status: 'accepted' },
        }),
      ]);

      // ── B3: Auto-create WorkspaceMembership cho các workspace trong tổ chức có engagement ──
      // Khi partner member join, họ cần workspace membership để truy cập workspace của org.
      // See: docs/shared_customer_partner_collaboration.md §3.1, §13.3
      await this.syncPartnerWorkspaceMemberships(userId, invite.partnerId);

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

      const result = await this.prismaClient.partnerInvite.updateMany({
        where: { id: inviteId, status: 'pending' },
        data: { status: 'revoked' },
      });

      if (result.count === 0) {
        return { success: false, error: 'Invite is not pending or already processed' };
      }

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
   * ── B3: Partner Workspace Bridge ──
   * Sync WorkspaceMembership cho tất cả workspace của các organization có engagement với partner.
   * Đảm bảo partner member có quyền truy cập workspace của khách hàng đã ký engagement.
   * See: docs/shared_customer_partner_collaboration.md §3.1, §13.3
   */
  private async syncPartnerWorkspaceMemberships(userId: string, partnerId: string): Promise<void> {
    try {
      // Lấy tất cả engagement active của partner
      const engagements = await this.prismaClient.engagement.findMany({
        where: { partnerId, status: 'active' },
        select: { organizationId: true },
      });

      if (engagements.length === 0) return;

      // Lấy tất cả workspace thuộc các organization có engagement
      const orgIds = engagements.map(e => e.organizationId);
      const workspaces = await this.prismaClient.workspace.findMany({
        where: { organizationId: { in: orgIds }, isActive: true },
        select: { id: true },
      });

      // Tạo WorkspaceMembership cho các workspace chưa có
      for (const ws of workspaces) {
        const existing = await this.prismaClient.workspaceMembership.findFirst({
          where: { userId, workspaceId: ws.id },
          select: { id: true },
        });
        if (existing) continue;

        await this.prismaClient.workspaceMembership.create({
          data: {
            userId,
            workspaceId: ws.id,
            role: 'specialist', // Partner mặc định là specialist trong workspace
            isActive: true,
          },
        });
      }
    } catch (error) {
      // Non-fatal: partner có thể join nhưng chưa có workspace access
      // Sẽ được sync lại khi engagement được active
      console.error('syncPartnerWorkspaceMemberships error:', error);
    }
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
