/**
 * Review Type Definitions
 */

import type { ReviewStatus, ReviewDecision, DocumentVersionStatus } from '@/lib/types';

/**
 * Review entity for document approval workflow
 */
export interface Review {
  id: string;
  documentVersionId: string;
  reviewerId: string;
  reviewerName?: string;
  status: ReviewStatus;
  decision?: ReviewDecision;
  comments?: ReviewComment[];
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review comment for feedback
 */
export interface ReviewComment {
  id: string;
  reviewId: string;
  reviewerId: string;
  reviewerName?: string;
  content: string;
  lineStart?: number;
  lineEnd?: number;
  pageNumber?: number;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

/**
 * Document entity
 */
export interface Document {
  id: string;
  requestId: string;
  name: string;
  description?: string;
  currentVersionId: string;
  currentVersion?: DocumentVersion;
  versions?: DocumentVersion[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document version entity
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  status: DocumentVersionStatus;
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdBy: string;
  createdByName?: string;
  reviewId?: string;
  review?: Review;
  createdAt: Date;
}

/**
 * Input for creating a review
 */
export interface CreateReviewInput {
  documentVersionId: string;
}

/**
 * Input for adding a review comment
 */
export interface AddCommentInput {
  reviewId: string;
  content: string;
  lineStart?: number;
  lineEnd?: number;
  pageNumber?: number;
}

/**
 * Input for making a review decision
 */
export interface ReviewDecisionInput {
  reviewId: string;
  decision: ReviewDecision;
  comments?: string;
}

/**
 * Review statistics
 */
export interface ReviewStats {
  pendingReviews: number;
  approvedThisWeek: number;
  rejectedThisWeek: number;
  avgReviewTimeHours: number;
}

/**
 * Review timeline for document history
 */
export interface DocumentReviewHistory {
  version: number;
  status: DocumentVersionStatus;
  reviewDecision?: ReviewDecision;
  reviewerName?: string;
  decidedAt?: Date;
  comments: number;
}
