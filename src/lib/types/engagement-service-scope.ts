/**
 * EngagementServiceScope Type Definitions
 * Represents a service type scope within an engagement
 */

export type PermissionLevel = 'case_assigned' | 'service_wide' | 'full_access';

export interface EngagementServiceScope {
  id: string;
  engagementId: string;
  serviceTypeId: string;
  permissionLevel: PermissionLevel;
  createdAt: Date;
}

export interface CreateEngagementServiceScopeInput {
  engagementId: string;
  serviceTypeId: string;
  permissionLevel?: PermissionLevel;
}
