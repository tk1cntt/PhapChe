/**
 * Workspace Type Definitions
 */

import type { Role } from '@/lib/types';

/**
 * Workspace entity representing a tenant organization
 */
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  organizationId?: string;  // FK to Organization
  settings?: WorkspaceSettings;
  memberCount: number;
  requestCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workspace-specific settings
 */
export interface WorkspaceSettings {
  requireMfa?: boolean;
  allowedDomains?: string[];
  defaultLanguage?: string;
  timezone?: string;
  logo?: string;
}

/**
 * Workspace membership linking users to workspaces
 */
export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  invitedBy?: string;
  joinedAt: Date;
  isActive: boolean;
}

/**
 * Membership with user details for listing
 */
export interface MembershipWithUser extends Membership {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isActive: boolean;
  };
}

/**
 * Input for creating a workspace
 */
export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
  settings?: WorkspaceSettings;
}

/**
 * Input for updating a workspace
 */
export interface UpdateWorkspaceInput {
  name?: string;
  settings?: Partial<WorkspaceSettings>;
}

/**
 * Input for inviting a user to workspace
 */
export interface InviteToWorkspaceInput {
  email: string;
  role: Role;
}

/**
 * Workspace statistics
 */
export interface WorkspaceStats {
  totalMembers: number;
  activeMembers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
}
