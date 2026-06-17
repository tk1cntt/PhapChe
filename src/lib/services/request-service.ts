/**
 * Request Service
 *
 * Handles business logic for LegalRequest operations.
 * Supports both old (matterType text) and new (matterTypeId FK) code paths
 * based on DB_MIGRATION_PHASE4 feature flag.
 */

import { prisma } from '@/lib/prisma';
import { isEnabled } from '@/lib/config/feature-flags';

export interface CreateRequestInput {
  workspaceId: string;
  title: string;
  description?: string;
  priority?: string;
  matterType?: string; // Old: text key
  matterTypeId?: string; // New: FK to MatterType
  createdById: string;
}

export interface UpdateRequestInput {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  matterType?: string;
  matterTypeId?: string;
  assignedSpecialistId?: string | null;
  assignedReviewerId?: string | null;
  slaDeadline?: Date | null;
}

export interface RequestFilters {
  workspaceId?: string;
  status?: string;
  priority?: string;
  search?: string;
  assignedTo?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Get matterType display value
 * Handles both old (text) and new (FK relation) formats
 */
function getMatterTypeDisplay(request: {
  matterType?: string | null;
  matterTypeId?: string | null;
  matterTypeRef?: { key: string; label_vi?: string | null; label_en?: string | null } | null;
}): string {
  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Use relation
    const mt = request.matterTypeRef;
    if (mt) {
      return mt.label_vi || mt.label_en || mt.key || 'Unknown';
    }
    return 'Unknown';
  }
  // Old: Use text field
  return request.matterType || 'Unknown';
}

/**
 * Build matterType filter for queries
 */
function buildMatterTypeFilter(matterType: string): Record<string, unknown> {
  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Filter by FK relation
    return { matterTypeRef: { key: matterType } };
  }
  // Old: Filter by text field
  return { matterType };
}

/**
 * Build data for request creation/update
 * Handles both old and new column formats
 */
function buildMatterTypeData(input: CreateRequestInput | UpdateRequestInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Use matterTypeId FK
    if ('matterTypeId' in input && input.matterTypeId) {
      data.matterTypeId = input.matterTypeId;
    }
    // Explicitly set matterType to null to avoid confusion
    data.matterType = null;
  } else {
    // Old: Use matterType text
    if ('matterType' in input && input.matterType) {
      data.matterType = input.matterType;
    }
    // Explicitly set matterTypeId to null
    data.matterTypeId = null;
  }

  return data;
}

/**
 * Create a new legal request
 */
export async function createRequest(input: CreateRequestInput) {
  const data: Record<string, unknown> = {
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description,
    priority: input.priority || 'MEDIUM',
    status: 'draft_intake',
    createdById: input.createdById,
    ...buildMatterTypeData(input),
  };

  return prisma.legalRequest.create({
    data: data as Parameters<typeof prisma.legalRequest.create>[0]['data'],
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      matterTypeRef: isEnabled('DB_MIGRATION_PHASE4'),
    },
  });
}

/**
 * Get a single request by ID
 */
export async function getRequestById(id: string) {
  const request = await prisma.legalRequest.findUnique({
    where: { id },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedSpecialist: { select: { id: true, name: true } },
      assignedReviewer: { select: { id: true, name: true } },
      matterTypeRef: isEnabled('DB_MIGRATION_PHASE4'),
      assignments: {
        where: isEnabled('DB_MIGRATION_PHASE4') ? { isCurrent: true } : undefined,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!request) return null;

  return {
    ...request,
    matterTypeDisplay: getMatterTypeDisplay(request),
  };
}

/**
 * List requests with filters and pagination
 */
export async function listRequests(
  filters: RequestFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  // Enforce pagination limits
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  // Build where clause
  const where: Record<string, unknown> = {
    deletedAt: null, // Exclude soft-deleted
  };

  if (filters.workspaceId) {
    where.workspaceId = filters.workspaceId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.assignedTo) {
    where.OR = [
      { assignedSpecialistId: filters.assignedTo },
      { assignedReviewerId: filters.assignedTo },
    ];
  }

  if (filters.search) {
    where.AND = where.AND || [];
    (where.AND as unknown[]).push({
      OR: [
        { code: { contains: filters.search } },
        { title: { contains: filters.search } },
      ],
    });
  }

  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      (where.createdAt as Record<string, unknown>).gte = filters.createdAfter;
    }
    if (filters.createdBefore) {
      (where.createdAt as Record<string, unknown>).lte = filters.createdBefore;
    }
  }

  // Execute count and data queries in parallel
  const [requests, total] = await Promise.all([
    prisma.legalRequest.findMany({
      where,
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
        matterTypeRef: isEnabled('DB_MIGRATION_PHASE4'),
      },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.legalRequest.count({ where }),
  ]);

  // Transform to include matterType display
  const transformedRequests = requests.map((req) => ({
    ...req,
    matterTypeDisplay: getMatterTypeDisplay(req),
  }));

  return {
    data: transformedRequests,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.ceil(total / safePageSize),
    },
  };
}

/**
 * Update a request
 */
export async function updateRequest(id: string, input: UpdateRequestInput) {
  const data: Record<string, unknown> = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.status !== undefined) data.status = input.status;
  if (input.assignedSpecialistId !== undefined) data.assignedSpecialistId = input.assignedSpecialistId;
  if (input.assignedReviewerId !== undefined) data.assignedReviewerId = input.assignedReviewerId;
  if (input.slaDeadline !== undefined) data.slaDeadline = input.slaDeadline;

  // Handle matterType/matterTypeId
  const matterTypeData = buildMatterTypeData(input);
  Object.assign(data, matterTypeData);

  return prisma.legalRequest.update({
    where: { id },
    data: data as Parameters<typeof prisma.legalRequest.update>[0]['data'],
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      matterTypeRef: isEnabled('DB_MIGRATION_PHASE4'),
    },
  });
}

/**
 * Delete a request (soft delete)
 */
export async function deleteRequest(id: string) {
  return prisma.legalRequest.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Get requests by matterType
 */
export async function getRequestsByMatterType(
  matterType: string,
  filters: RequestFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const matterTypeFilter = buildMatterTypeFilter(matterType);
  return listRequests({ ...filters, ...matterTypeFilter }, page, pageSize);
}

/**
 * Count requests by status
 */
export async function countRequestsByStatus(workspaceId?: string) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (workspaceId) where.workspaceId = workspaceId;

  const [total, draft, pending, inProgress, approved, delivered, closed] = await Promise.all([
    prisma.legalRequest.count({ where }),
    prisma.legalRequest.count({ where: { ...where, status: 'draft_intake' } }),
    prisma.legalRequest.count({ where: { ...where, status: 'pending_review' } }),
    prisma.legalRequest.count({ where: { ...where, status: 'in_progress' } }),
    prisma.legalRequest.count({ where: { ...where, status: 'approved' } }),
    prisma.legalRequest.count({ where: { ...where, status: 'delivered' } }),
    prisma.legalRequest.count({ where: { ...where, status: 'closed' } }),
  ]);

  return {
    total,
    draft,
    pending,
    inProgress,
    approved,
    delivered,
    closed,
  };
}
