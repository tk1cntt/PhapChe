/**
 * Workflow Type Definitions
 */

import type { Role } from '@/lib/types';

/**
 * Workflow definition entity
 */
export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  nameKey?: string;
  description?: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  initialState: string;
  /** Semver version string (e.g. "1.0.0") */
  version: string;
  status: 'draft' | 'published' | 'deprecated';
  /** ISO 8601 date string */
  createdAt: string;
  /** ISO 8601 date string */
  updatedAt: string;
}

/**
 * Workflow state definition
 */
export interface WorkflowState {
  code: string;
  name: string;
  nameKey?: string;
  description?: string;
  order: number;
  color: string;
  icon?: string;
  requiresAssignment: boolean;
  canEdit: boolean;
  isTerminal: boolean;
}

/**
 * Workflow transition definition
 */
export interface WorkflowTransition {
  id: string;
  from: string;
  to: string;
  allowedRoles: Role[];
  actionLabel?: string;
  actionLabelKey?: string;
  confirmRequired: boolean;
  confirmMessage?: string;
  confirmMessageKey?: string;
  requiresNote: boolean;
  notificationTemplate?: string;
}

/**
 * Workflow transition log entry
 */
export interface WorkflowTransitionLog {
  id: string;
  requestId: string;
  fromState: string;
  fromStateName?: string;
  toState: string;
  toStateName?: string;
  triggeredBy: string;
  triggeredByName?: string;
  note?: string;
  metadata?: Record<string, unknown>;
  triggeredAt: string;
}

/**
 * Available transition for current user
 */
export interface AvailableTransition {
  transition: WorkflowTransition;
  from: WorkflowState;
  to: WorkflowState;
}

/**
 * Input for executing a transition
 */
export interface ExecuteTransitionInput {
  requestId: string;
  transitionId: string;
  note?: string;
}

/**
 * Workflow status for a request
 */
export interface WorkflowStatus {
  definition: WorkflowDefinition;
  currentState: WorkflowState;
  availableTransitions: AvailableTransition[];
  recentTransitions: WorkflowTransitionLog[];
}
