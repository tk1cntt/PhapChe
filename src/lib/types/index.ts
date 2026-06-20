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
export * from './tenant';
export * from './organization';
export * from './partner';
export * from './partner-member';
export * from './service-type';
export * from './engagement';
export * from './engagement-service-scope';
export * from './request-context';
export * from './wizard';

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

// Re-export user types
export type { AccountType } from './user';
