/**
 * Shared type constants for enum-like types
 * SQLite schema uses String fields, Prisma generates no type constants
 */

// Request status values
// Note: 'intake_submitted' removed in v2.3 — customer submit goes straight to 'triage'
export const REQUEST_STATUS = {
  DRAFT_INTAKE: 'draft_intake',
  TRIAGE: 'triage',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  PENDING_REVIEW: 'pending_review',
  REVISION_REQUIRED: 'revision_required',
  APPROVED: 'approved',
  DELIVERED: 'delivered',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

/** @deprecated Replaced by 'triage'. Customer submit goes directly to triage. */
export const INTAKE_SUBMITTED_LEGACY = 'intake_submitted' as const;

/** Legacy status including deprecated intake_submitted for DB compatibility */
export type RequestStatusLegacy = RequestStatus | typeof INTAKE_SUBMITTED_LEGACY;

// Role values (v2.3)
// ── Platform-level role (global, stored conceptually, not per workspace) ──
// super_admin: full system access, bypass all workspace checks
//
// ── Workspace-level roles (per WorkspaceMembership) ──
// customer: external SME user, can only access own requests
// specialist: legal specialist, handles assigned requests
// reviewer: quality reviewer, approves/rejects assigned requests
// coordinator_admin: workspace manager, assigns work, delivers, closes
//
// See: docs/shared_customer_partner_collaboration.md §13
export const ROLE = {
  CUSTOMER: 'customer',
  SPECIALIST: 'specialist',
  REVIEWER: 'reviewer',
  COORDINATOR_ADMIN: 'coordinator_admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type Role = typeof ROLE[keyof typeof ROLE];

/** Platform-level role — global, bypasses workspace checks */
export type PlatformRole = 'super_admin';

/** Workspace-level role — assigned per WorkspaceMembership */
export type WorkspaceRole = 'customer' | 'specialist' | 'reviewer' | 'coordinator_admin';

/** All possible roles (platform + workspace) — kept for backward compat */
export type AppRole = Role;

// Assignment kind
export const ASSIGNMENT_KIND = {
  SPECIALIST: 'specialist',
  REVIEWER: 'reviewer',
} as const;

export type AssignmentKind = typeof ASSIGNMENT_KIND[keyof typeof ASSIGNMENT_KIND];

// Audit target type
export const AUDIT_TARGET_TYPE = {
  USER: 'user',
  WORKSPACE: 'workspace',
  MEMBERSHIP: 'membership',
  REQUEST: 'request',
  MATTER_TYPE: 'matter_type',
  INTAKE_SUBMISSION: 'intake_submission',
  ASSIGNMENT: 'assignment',
  DOCUMENT: 'document',
  REVIEW: 'review',
  VAULT_FILE: 'vault_file',
  WORKFLOW_TRANSITION: 'workflow_transition',
} as const;

export type AuditTargetType = typeof AUDIT_TARGET_TYPE[keyof typeof AUDIT_TARGET_TYPE];

// Template status
export const TEMPLATE_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  DEPRECATED: 'deprecated',
} as const;

export type TemplateStatus = typeof TEMPLATE_STATUS[keyof typeof TEMPLATE_STATUS];

// Document version status
export const DOCUMENT_VERSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED_FOR_REVIEW: 'submitted_for_review',
  FINAL: 'final',
} as const;

export type DocumentVersionStatus = typeof DOCUMENT_VERSION_STATUS[keyof typeof DOCUMENT_VERSION_STATUS];

// Review status
export const REVIEW_STATUS = {
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS];

// Review decision
export const REVIEW_DECISION = {
  APPROVE: 'approve',
  REJECT: 'reject',
} as const;

export type ReviewDecision = typeof REVIEW_DECISION[keyof typeof REVIEW_DECISION];

// Version status alias for compatibility
export type VersionStatus = DocumentVersionStatus;
export const VERSION_STATUS = DOCUMENT_VERSION_STATUS;

// Re-export activity types (barrel from types/ directory not reachable via @/lib/types)
export type { ActivityItem, ActivityType, ActivityFilters, ActivityStats } from '@/lib/types/activity';
export { ACTIVITY_COLORS, ACTIVITY_ICON_NAMES } from '@/lib/types/activity';
