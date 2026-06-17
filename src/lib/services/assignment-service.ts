/**
 * Assignment Service
 *
 * Handles business logic for RequestAssignment operations.
 * Supports both old (by createdAt) and new (by isCurrent flag) code paths
 * based on DB_MIGRATION_PHASE4 feature flag.
 *
 * The isCurrent flag ensures only one active assignment per (requestId, kind).
 */

import { prisma } from '@/lib/prisma';
import { isEnabled } from '@/lib/config/feature-flags';

export type AssignmentKind = 'specialist' | 'reviewer';

export interface CreateAssignmentInput {
  requestId: string;
  userId: string;
  kind: AssignmentKind;
  partnerId?: string;
  engagementId?: string;
  reason?: string;
  createdById: string;
}

export interface AssignmentFilters {
  requestId?: string;
  userId?: string;
  kind?: AssignmentKind;
  isCurrent?: boolean;
  partnerId?: string;
  engagementId?: string;
}

/**
 * Get the current (active) assignment for a request and kind
 * Uses isCurrent flag when DB_MIGRATION_PHASE4 is enabled
 */
export async function getCurrentAssignment(requestId: string, kind: AssignmentKind) {
  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Filter by isCurrent flag
    return prisma.requestAssignment.findFirst({
      where: {
        requestId,
        kind,
        isCurrent: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        partner: { select: { id: true, name: true } },
        engagement: { select: { id: true, partnerId: true } },
      },
    });
  }

  // Old: Get most recent by createdAt
  return prisma.requestAssignment.findFirst({
    where: { requestId, kind },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Get all assignments for a request (history)
 */
export async function getAssignmentHistory(requestId: string, kind?: AssignmentKind) {
  const where: Record<string, unknown> = { requestId };
  if (kind) where.kind = kind;

  return prisma.requestAssignment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      partner: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * Create a new assignment
 * When DB_MIGRATION_PHASE4 is enabled, uses transaction to ensure atomicity:
 * 1. End current assignment (set isCurrent=false, endedAt=now)
 * 2. Create new assignment with isCurrent=true
 */
export async function createAssignment(input: CreateAssignmentInput) {
  if (isEnabled('DB_MIGRATION_PHASE4')) {
    // New: Use transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      // 1. End current assignment for this request and kind
      await tx.requestAssignment.updateMany({
        where: {
          requestId: input.requestId,
          kind: input.kind,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
          endedAt: new Date(),
        },
      });

      // 2. Create new assignment with isCurrent=true
      return tx.requestAssignment.create({
        data: {
          requestId: input.requestId,
          userId: input.userId,
          kind: input.kind,
          partnerId: input.partnerId,
          engagementId: input.engagementId,
          reason: input.reason,
          isCurrent: true,
          createdById: input.createdById,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          request: { select: { id: true, title: true } },
        },
      });
    });
  }

  // Old: Simple create (no isCurrent management)
  return prisma.requestAssignment.create({
    data: {
      requestId: input.requestId,
      userId: input.userId,
      kind: input.kind,
      partnerId: input.partnerId,
      engagementId: input.engagementId,
      reason: input.reason,
      createdById: input.createdById,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * End an assignment (set isCurrent=false)
 */
export async function endAssignment(assignmentId: string) {
  if (isEnabled('DB_MIGRATION_PHASE4')) {
    return prisma.requestAssignment.update({
      where: { id: assignmentId },
      data: {
        isCurrent: false,
        endedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  // Old: Just return the assignment (no isCurrent to manage)
  return prisma.requestAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}

/**
 * Reassign a user to a request
 * This creates a new assignment and ends the current one
 */
export async function reassignUser(
  requestId: string,
  userId: string,
  kind: AssignmentKind,
  createdById: string,
  reason?: string
) {
  return createAssignment({
    requestId,
    userId,
    kind,
    reason: reason || `Reassigned by ${createdById}`,
    createdById,
  });
}

/**
 * Get all assignments for a user
 */
export async function getUserAssignments(
  userId: string,
  filters: AssignmentFilters = {},
  page: number = 1,
  pageSize: number = 20
) {
  const where: Record<string, unknown> = { userId };
  if (filters.kind) where.kind = filters.kind;
  if (filters.isCurrent !== undefined && isEnabled('DB_MIGRATION_PHASE4')) {
    where.isCurrent = filters.isCurrent;
  }
  if (filters.partnerId) where.partnerId = filters.partnerId;
  if (filters.engagementId) where.engagementId = filters.engagementId;

  const [assignments, total] = await Promise.all([
    prisma.requestAssignment.findMany({
      where,
      include: {
        request: {
          select: {
            id: true,
            title: true,
            status: true,
            workspace: { select: { id: true, name: true } },
          },
        },
        partner: { select: { id: true, name: true } },
      },
      skip: (Math.max(1, page) - 1) * Math.min(Math.max(1, pageSize), 100),
      take: Math.min(Math.max(1, pageSize), 100),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.requestAssignment.count({ where }),
  ]);

  return {
    data: assignments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / Math.min(Math.max(1, pageSize), 100)),
    },
  };
}

/**
 * Get assignment stats for a user
 */
export async function getAssignmentStats(userId: string) {
  const baseWhere = { userId };

  if (isEnabled('DB_MIGRATION_PHASE4')) {
    const [total, current, completed] = await Promise.all([
      prisma.requestAssignment.count({ where: baseWhere }),
      prisma.requestAssignment.count({ where: { ...baseWhere, isCurrent: true } }),
      prisma.requestAssignment.count({ where: { ...baseWhere, isCurrent: false } }),
    ]);

    const [specialistCurrent, reviewerCurrent] = await Promise.all([
      prisma.requestAssignment.count({
        where: { ...baseWhere, isCurrent: true, kind: 'specialist' },
      }),
      prisma.requestAssignment.count({
        where: { ...baseWhere, isCurrent: true, kind: 'reviewer' },
      }),
    ]);

    return {
      total,
      current,
      completed,
      specialistCurrent,
      reviewerCurrent,
    };
  }

  // Old: Simpler stats
  const total = await prisma.requestAssignment.count({ where: baseWhere });
  return { total };
}

/**
 * Validate that a user can be assigned to a request
 */
export async function validateAssignment(
  requestId: string,
  userId: string,
  kind: AssignmentKind
): Promise<{ valid: boolean; error?: string }> {
  // Check request exists
  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { id: true, workspaceId: true },
  });

  if (!request) {
    return { valid: false, error: 'Request not found' };
  }

  // Check user has appropriate membership in the workspace
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      userId,
      workspaceId: request.workspaceId,
      role: kind,
      isActive: true,
    },
  });

  if (!membership) {
    return { valid: false, error: `User is not a ${kind} in this workspace` };
  }

  // Check user account is active
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });

  if (!user?.isActive) {
    return { valid: false, error: 'User account is deactivated' };
  }

  return { valid: true };
}
