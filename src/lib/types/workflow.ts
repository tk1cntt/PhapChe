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
  version: number;
  status: 'draft' | 'published' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
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
  triggeredAt: Date;
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
