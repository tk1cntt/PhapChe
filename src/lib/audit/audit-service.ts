import { prisma } from '@/lib/prisma';

export interface FileAccessLogInput {
  fileId: string;
  action: 'upload' | 'download' | 'view' | 'delete' | 'share';
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record file access log
 *
 * Fire-and-forget function that logs file access for audit purposes.
 * Errors are logged but do not throw to prevent blocking the main operation.
 */
const VALID_ACTIONS = ['upload', 'download', 'view', 'delete', 'share'] as const;
const CRITICAL_ACTIONS = ['access_denied', 'unauthorized_access_attempt'] as const;

export async function recordFileAccessLog(input: FileAccessLogInput): Promise<void> {
  if (!input.fileId || typeof input.fileId !== 'string' || input.fileId.trim().length === 0) {
    console.error('Invalid fileId for audit log:', input);
    return;
  }
  if (!VALID_ACTIONS.includes(input.action as typeof VALID_ACTIONS[number])) {
    console.error('Invalid action for audit log:', input);
    return;
  }
  try {
    await prisma.fileAccessLog.create({
      data: {
        fileId: input.fileId,
        action: input.action,
        userId: input.actorId || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not block operations
    console.error('Failed to record file access log:', error);
  }
}

export interface AuditEventFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditEventResult {
  id: string;
  actorId: string | null;
  workspaceId: string;
  action: string;
  targetType: string;
  targetId: string;
  requestId: string | null;
  correlationId: string | null;
  metadataSummary: string | null;
  createdAt: Date;
  actor: { email: string | null; name: string | null } | null;
  workspace: { name: string };
}

export interface GetAuditEventsResult {
  data: AuditEventResult[];
  total: number;
}

export interface AuditStats {
  totalEvents: number;
  criticalCount: number;
  completeAuditPercent: number;
  workspaceCount: number;
}

/**
 * Get paginated audit events with filters
 */
export async function getAuditEvents(filters: AuditEventFilters): Promise<GetAuditEventsResult> {
  try {
    const page = Math.max(1, parseInt(String(filters.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(filters.pageSize ?? '10'), 10) || 10));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    // Filter by action
    if (filters.action) {
      where.action = filters.action;
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(filters.dateTo);
      }
    }

    // Search across actor email, workspace name, correlationId, metadataSummary
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      where.OR = [
        { actor: { email: { contains: searchLower, mode: 'insensitive' } } },
        { workspace: { name: { contains: searchLower, mode: 'insensitive' } } },
        { correlationId: { contains: searchLower, mode: 'insensitive' } },
        { metadataSummary: { contains: searchLower, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        include: {
          actor: {
            select: { email: true, name: true },
          },
          workspace: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return {
      data: data.map((event) => ({
        id: event.id,
        actorId: event.actorId,
        workspaceId: event.workspaceId,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId,
        requestId: event.requestId,
        correlationId: event.correlationId,
        metadataSummary: event.metadataSummary,
        createdAt: event.createdAt,
        actor: event.actor,
        workspace: event.workspace,
      })),
      total,
    };
  } catch (error) {
    console.error('Failed to fetch audit events:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Get aggregate stats for audit dashboard
 */
export async function getAuditStats(): Promise<AuditStats> {
  try {
    // Get events from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalEvents,
      criticalEvents,
      completeEvents,
      workspaceCount,
    ] = await Promise.all([
      // Total events in last 30 days
      prisma.auditEvent.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // Critical events: access_denied or unauthorized_access_attempt
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          action: { in: CRITICAL_ACTIONS as readonly string[] },
        },
      }),

      // Complete audit events: has actor + correlationId + metadataSummary
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          actorId: { not: null },
          correlationId: { not: null },
          metadataSummary: { not: null },
        },
      }),

      // Unique workspaces
      prisma.auditEvent.groupBy({
        by: ['workspaceId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Calculate complete audit percentage
    const completeAuditPercent = totalEvents > 0
      ? Math.round((completeEvents / totalEvents) * 100)
      : 0;

    return {
      totalEvents,
      criticalCount: criticalEvents,
      completeAuditPercent,
      workspaceCount: workspaceCount.length,
    };
  } catch (error) {
    console.error('Failed to fetch audit stats:', error);
    return { totalEvents: 0, criticalCount: 0, completeAuditPercent: 0, workspaceCount: 0 };
  }
}
