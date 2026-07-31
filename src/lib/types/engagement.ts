/**
 * Engagement Type Definitions
 * Represents a partnership between a partner and an organization
 */

export type EngagementStatus = 'active' | 'inactive' | 'pending';

export interface Engagement {
  id: string;
  partnerId: string;
  organizationId: string;
  status: EngagementStatus;
  /** Must be on or before `endDate` when both are provided. */
  startDate?: Date;
  /** Must be on or after `startDate` when both are provided. */
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEngagementInput {
  partnerId: string;
  organizationId: string;
  status?: EngagementStatus;
  /** Must be on or before `endDate` when both are provided. */
  startDate?: Date;
  /** Must be on or after `startDate` when both are provided. */
  endDate?: Date;
  notes?: string;
}

export interface UpdateEngagementInput {
  status?: EngagementStatus;
  /** Must be on or before `endDate` when both are provided. */
  startDate?: Date;
  /** Must be on or after `startDate` when both are provided. */
  endDate?: Date;
  notes?: string;
}
