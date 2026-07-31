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
  /** ISO 8601 date string (e.g. "2024-01-01T00:00:00.000Z") */
  createdAt: string;
}

export interface CreateEngagementServiceScopeInput {
  engagementId: string;
  serviceTypeId: string;
  /** @default 'case_assigned' */
  permissionLevel?: PermissionLevel;
}
