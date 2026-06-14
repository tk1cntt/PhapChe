/**
 * Type Unification Index
 * Central export point for all shared type definitions
 */

export * from './user';
export * from './workspace';
export * from './request';
export * from './audit';
export * from './workflow';
export * from './vault';
export * from './review';

// Re-export constants from existing types.ts
export {
  REQUEST_STATUS,
  ROLE,
  ASSIGNMENT_KIND,
  AUDIT_TARGET_TYPE,
  TEMPLATE_STATUS,
  DOCUMENT_VERSION_STATUS,
  REVIEW_STATUS,
  REVIEW_DECISION,
  VERSION_STATUS,
} from '@/lib/types';

// Re-export types from constants
export type {
  RequestStatus,
  Role,
  AssignmentKind,
  AuditTargetType,
  TemplateStatus,
  DocumentVersionStatus,
  ReviewStatus,
  ReviewDecision,
  VersionStatus,
  AppRole,
} from '@/lib/types';
