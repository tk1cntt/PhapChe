/**
 * Shared Partner Status Constants
 * Used by both frontend and backend to ensure consistency
 */

import { REQUEST_STATUS } from '@/lib/types';

// Partner allowed status transitions based on request-workflow.ts
// Partners can transition from in_progress to pending_review
export const PARTNER_ALLOWED_STATUSES = [
  REQUEST_STATUS.IN_PROGRESS,      // 'in_progress'
  REQUEST_STATUS.PENDING_REVIEW,    // 'pending_review'
  REQUEST_STATUS.APPROVED,          // 'approved' - partner can mark as approved after review
  REQUEST_STATUS.DELIVERED,        // 'delivered' - partner can mark as delivered
] as const;

export type PartnerAllowedStatus = typeof PARTNER_ALLOWED_STATUSES[number];

// Status display labels for UI
export const PARTNER_STATUS_LABELS: Record<PartnerAllowedStatus, { vi: string; en: string }> = {
  [REQUEST_STATUS.IN_PROGRESS]: { vi: 'Đang xử lý', en: 'In Progress' },
  [REQUEST_STATUS.PENDING_REVIEW]: { vi: 'Chờ duyệt', en: 'Pending Review' },
  [REQUEST_STATUS.APPROVED]: { vi: 'Đã duyệt', en: 'Approved' },
  [REQUEST_STATUS.DELIVERED]: { vi: 'Đã giao', en: 'Delivered' },
};
