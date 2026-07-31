/**
 * Shared Partner Status Constants
 * Used by both frontend and backend to ensure consistency
 */

import { REQUEST_STATUS } from '@/lib/types';
import type { RequestStatus } from '@/lib/types';

// Partner-allowed statuses (aggregated across specialist, reviewer, coordinator roles)
// See request-workflow.ts canTransitionRequestStatus() for per-role enforcement
// - specialist: in_progress, pending_review
// - reviewer: approved (also revision_required, not listed here)
// - coordinator_admin: delivered
export const PARTNER_ALLOWED_STATUSES = [
  REQUEST_STATUS.IN_PROGRESS,
  REQUEST_STATUS.PENDING_REVIEW,
  REQUEST_STATUS.APPROVED,
  REQUEST_STATUS.DELIVERED,
] as const;

export type PartnerAllowedStatus = typeof PARTNER_ALLOWED_STATUSES[number];

// Status display labels for UI
export const PARTNER_STATUS_LABELS: Record<PartnerAllowedStatus, { vi: string; en: string }> = {
  [REQUEST_STATUS.IN_PROGRESS]: { vi: 'Đang xử lý', en: 'In Progress' },
  [REQUEST_STATUS.PENDING_REVIEW]: { vi: 'Chờ phê duyệt', en: 'Pending Review' },
  [REQUEST_STATUS.APPROVED]: { vi: 'Đã phê duyệt', en: 'Approved' },
  [REQUEST_STATUS.DELIVERED]: { vi: 'Đã giao', en: 'Delivered' },
};

// All request status labels for admin (all statuses, not just partner-allowed)
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  [REQUEST_STATUS.DRAFT_INTAKE]: 'Bản nháp',
  [REQUEST_STATUS.TRIAGE]: 'Phân loại',
  [REQUEST_STATUS.ASSIGNED]: 'Đã phân công',
  [REQUEST_STATUS.IN_PROGRESS]: 'Đang xử lý',
  [REQUEST_STATUS.PENDING_REVIEW]: 'Chờ phê duyệt',
  [REQUEST_STATUS.REVISION_REQUIRED]: 'Cần sửa',
  [REQUEST_STATUS.APPROVED]: 'Đã phê duyệt',
  [REQUEST_STATUS.DELIVERED]: 'Đã giao',
  [REQUEST_STATUS.CLOSED]: 'Đã đóng',
  [REQUEST_STATUS.CANCELLED]: 'Đã hủy',
};
