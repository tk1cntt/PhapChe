/**
 * Request Type Definitions
 */

import type { RequestStatus, Priority } from '@/lib/types';

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
  deadline?: Date;
  slaDueAt?: Date;
  currentStateEnteredAt?: Date;
  engagementId?: string;
  assignedPartnerId?: string;
  createdAt: Date;
  updatedAt: Date;
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
  value: string | string[] | File[];
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
  byStatus: Record<RequestStatus, number>;
  byPriority: Record<Priority, number>;
  overdue: number;
  slaAtRisk: number;
}
