/**
 * Audit Type Definitions
 */

import type { AuditTargetType } from '@/lib/types';

/**
 * Audit log entry for tracking system changes
 */
export interface AuditLog {
  id: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
  targetType: AuditTargetType;
  targetId: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Audit log filters
 */
export interface AuditFilters {
  actorId?: string;
  targetType?: AuditTargetType;
  targetId?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Audit log summary for admin dashboard
 */
export interface AuditSummary {
  totalLogs: number;
  recentActions: {
    action: string;
    count: number;
  }[];
  activeUsers: {
    actorId: string;
    actorEmail: string;
    count: number;
  }[];
}

/**
 * Common audit actions
 */
export const AUDIT_ACTIONS = {
  // User actions
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',

  // Workspace actions
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
  MEMBER_INVITED: 'workspace.member_invited',
  MEMBER_REMOVED: 'workspace.member_removed',

  // Request actions
  REQUEST_CREATED: 'request.created',
  REQUEST_UPDATED: 'request.updated',
  REQUEST_DELETED: 'request.deleted',
  REQUEST_ASSIGNED: 'request.assigned',
  REQUEST_TRANSITIONED: 'request.transitioned',

  // Document actions
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_DOWNLOADED: 'document.downloaded',
  DOCUMENT_DELETED: 'document.deleted',
  DOCUMENT_VIEWED: 'document.viewed',

  // Review actions
  REVIEW_STARTED: 'review.started',
  REVIEW_APPROVED: 'review.approved',
  REVIEW_REJECTED: 'review.rejected',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
