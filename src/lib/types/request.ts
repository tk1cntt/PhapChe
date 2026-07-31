/**
 * Request Type Definitions
 */

import type { RequestStatus } from '@/lib/types'; // Note: circular via barrel; prefer '@/lib/types.ts' if issues arise

/**
 * Priority type for requests
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Reference to an uploaded file (safe for server-side and JSON serialization)
 */
export interface FileReference {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

/**
 * Legal request entity
 */
export interface LegalRequest {
  id: string;
  code: string;
  workspaceId: string;
  matterTypeId: string;
  matterType?: MatterType;
  priority: Priority;
  status: RequestStatus;
  customerId: string;
  customer?: RequestCustomer;
  assignedTo?: string;
  assignee?: RequestAssignee;
  title: string;
  description?: string;
  /** ISO 8601 date string */
  deadline?: string;
  /** ISO 8601 date string */
  slaDueAt?: string;
  /** ISO 8601 date string */
  currentStateEnteredAt?: string;
  engagementId?: string;
  assignedPartnerId?: string;
  /** ISO 8601 date string */
  createdAt: string;
  /** ISO 8601 date string */
  updatedAt: string;
}

/**
 * Simplified customer info for request
 */
export interface RequestCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

/**
 * Simplified assignee info for request
 */
export interface RequestAssignee {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Matter type category
 */
export interface MatterType {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Intake submission for draft request
 */
export interface IntakeSubmission {
  id: string;
  requestId: string;
  answers: IntakeAnswer[];
  submittedAt?: Date;
  createdAt: Date;
}

/**
 * Individual intake answer
 */
export interface IntakeAnswer {
  questionKey: string;
  /** FileReference[] for file uploads (safe for server-side and JSON serialization) */
  value: string | string[] | FileReference[];
}

/**
 * Request filters for listing
 */
export interface RequestFilters {
  status?: RequestStatus[];
  priority?: Priority[];
  matterTypeId?: string;
  assignedTo?: string;
  customerId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Input for creating a request
 */
export interface CreateRequestInput {
  matterTypeId: string;
  priority: Priority;
  title: string;
  description?: string;
  deadline?: Date;
}

/**
 * Input for updating a request
 */
export interface UpdateRequestInput {
  priority?: Priority;
  title?: string;
  description?: string;
  deadline?: Date;
}

/**
 * Assignment input
 */
export interface AssignRequestInput {
  assignedTo: string;
  note?: string;
}

/**
 * Request statistics for dashboard
 */
export interface RequestStats {
  total: number;
  /** Backend guarantees all keys are present (zero-count statuses included) */
  byStatus: Record<RequestStatus, number>;
  /** Backend guarantees all keys are present (zero-count priorities included) */
  byPriority: Record<Priority, number>;
  overdue: number;
  slaAtRisk: number;
}
