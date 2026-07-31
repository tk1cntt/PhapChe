/**
 * PartnerMember Type Definitions
 * Represents a user belonging to a partner organization
 */

export type PartnerMemberRole = 'admin' | 'member';

/**
 * PartnerMember entity - user belonging to a partner.
 * Contains PII (userId link to user identity) — treat as confidential.
 */
export interface PartnerMember {
  id: string;
  partnerId: string;
  userId: string;
  role: PartnerMemberRole;
  /** Membership-level active status — distinct from user-level isActive. Member is active in this partner organization. */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PartnerMember with user details for listing
 */
export interface PartnerMemberWithUser extends PartnerMember {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isActive: boolean;
  };
}

/**
 * Input for adding a member to partner
 */
export interface AddPartnerMemberInput {
  userId: string;
  /** @default 'member' */
  role?: PartnerMemberRole;
}
