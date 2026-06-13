import type { Prisma } from '@prisma/client';
import type { RequestStatus, Role } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import type { AppSession } from '@/lib/security/session';

// --- OpsSlaDto: 4-level SLA model ---
export type OpsSlaDto = {
  level: 'ok' | 'warn' | 'danger' | 'info';
  label: string;
  percent: number;
  source: 'deadline' | 'status_age' | 'request_age' | 'none';
};

export type OpsAggregateDto = {
  stats: {
    openRequests: number;
    nearSla: number;
    completedToday: number;
    auditWarnings: number;
  };
  workload: OpsWorkloadRowDto[];
  timeline: OpsTimelineItemDto[];
  requests: OpsRequestRowDto[];
  filters: {
    workspaces: Array<{ id: string; name: string }>;
    matterTypes: Array<{ key: string; label: string }>;
    specialists: Array<{ id: string; name: string }>;
    reviewers: Array<{ id: string; name: string }>;
    statuses: string[];
  };
  pagination?: { page: number; pageSize: number; total: number };
};

export type OpsFilters = {
  workspaceId?: string;
  matterTypeKey?: string;
  status?: RequestStatus;
  assignedSpecialistId?: string;
  assignedReviewerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type OpsDashboardDto = {
  total: number;
  byStatus: Array<{ status: RequestStatus; count: number }>;
  bySpecialist: Array<{ userId: string; name: string; email: string; count: number }>;
  byReviewer: Array<{ userId: string; name: string; email: string; count: number }>;
  aging: {
    pendingReview: number;
    revisionRequired: number;
    olderThanSevenDays: number;
  };
  requests: OpsRequestRowDto[];
  workload: OpsWorkloadRowDto[];
};

export type OpsRequestRowDto = {
  id: string;
  title: string;
  status: RequestStatus;
  workspaceId: string;
  code?: string | null;
  priority?: string | null;
  matterTypeKey: string | null;
  matterTypeLabel: string | null;
  customerName: string;
  customerEmail: string;
  workspaceName?: string;
  assignedSpecialistId?: string | null;
  assignedSpecialistName: string | null;
  assignedReviewerId?: string | null;
  assignedReviewerName: string | null;
  slaDeadline?: Date | null;
  sla?: OpsSlaDto;
  createdAt: Date;
  updatedAt: Date;
  currentStatusSince: Date;
  currentStatusAgeDays: number;
  pendingReviewSince: Date | null;
  deliveredAt: Date | null;
  closedAt: Date | null;
};

export type OpsWorkloadRowDto = {
  kind: 'specialist' | 'reviewer';
  userId: string;
  name: string;
  email: string;
  activeCount: number;
  byStatus: Array<{ status: RequestStatus; count: number }>;
  oldestActiveAgeDays: number;
};

export type OpsTimelineDto = {
  requestId: string;
  workspaceId: string;
  title: string;
  sla: {
    currentStatusSince: Date;
    currentStatusAgeDays: number;
    pendingReviewSince: Date | null;
    deliveredAt: Date | null;
    closedAt: Date | null;
  };
  items: OpsTimelineItemDto[];
};

export type OpsTimelineItemDto = {
  id: string;
  kind: 'audit' | 'workflow';
  at: Date;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus | null;
  correlationId: string | null;
  reason: string | null;
  metadataSummary: string | null;
};

const requestStatuses: RequestStatus[] = [
  'draft_intake',
  'intake_submitted',
  'triage',
  'assigned',
  'in_progress',
  'pending_review',
  'revision_required',
  'approved',
  'delivered',
  'closed',
  'cancelled',
];

const activeStatuses: RequestStatus[] = ['intake_submitted', 'triage', 'assigned', 'in_progress', 'pending_review', 'revision_required', 'approved'];

function requireText(value: string, errorCode: string) {
  if (!value.trim()) throw new Error(errorCode);
  return value.trim();
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanParam(value: string | string[] | undefined) {
  const text = firstParam(value)?.trim();
  return text || undefined;
}

function parseDateParam(value: string | string[] | undefined) {
  const text = cleanParam(value);
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseStatusParam(value: string | string[] | undefined): RequestStatus | undefined {
  const text = cleanParam(value);
  if (!text) return undefined;
  return requestStatuses.includes(text as RequestStatus) ? (text as RequestStatus) : undefined;
}

export async function requireOpsAdmin(workspaceId: string, actorId: string): Promise<void> {
  const scopedWorkspaceId = requireText(workspaceId, 'WORKSPACE_REQUIRED');
  const scopedActorId = requireText(actorId, 'ACTOR_REQUIRED');
  const authorizedRoles: Role[] = ['coordinator_admin', 'super_admin'];
  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId: scopedWorkspaceId, userId: scopedActorId, role: { in: authorizedRoles }, isActive: true, user: { isActive: true }, workspace: { isActive: true } },
    select: { id: true },
  });
  if (!membership) throw new Error('FORBIDDEN');
}

export function parseOpsFilters(searchParamsLike: Record<string, string | string[] | undefined>): OpsFilters {
  return {
    workspaceId: cleanParam(searchParamsLike.workspaceId ?? searchParamsLike.workspace ?? searchParamsLike.customerWorkspaceId),
    matterTypeKey: cleanParam(searchParamsLike.matterTypeKey ?? searchParamsLike.matterType),
    status: parseStatusParam(searchParamsLike.status),
    assignedSpecialistId: cleanParam(searchParamsLike.assignedSpecialistId ?? searchParamsLike.specialistId),
    assignedReviewerId: cleanParam(searchParamsLike.assignedReviewerId ?? searchParamsLike.reviewerId),
    dateFrom: parseDateParam(searchParamsLike.dateFrom ?? searchParamsLike.from),
    dateTo: parseDateParam(searchParamsLike.dateTo ?? searchParamsLike.to),
  };
}

function buildOpsRequestWhere(filters: OpsFilters): Prisma.LegalRequestWhereInput {
  const and: Prisma.LegalRequestWhereInput[] = [];
  if (filters.workspaceId) and.push({ workspaceId: filters.workspaceId });
  // Note: intakeSubmission has @unique requestId, so { is: } is correct for one-to-one filtering
  if (filters.matterTypeKey) and.push({ intakeSubmission: { is: { matterTypeKey: filters.matterTypeKey } } });
  if (filters.status) and.push({ status: filters.status });
  if (filters.assignedSpecialistId) and.push({ assignedSpecialistId: filters.assignedSpecialistId });
  if (filters.assignedReviewerId) and.push({ assignedReviewerId: filters.assignedReviewerId });
  if (filters.dateFrom || filters.dateTo) {
    and.push({ createdAt: { ...(filters.dateFrom ? { gte: filters.dateFrom } : {}), ...(filters.dateTo ? { lte: filters.dateTo } : {}) } });
  }
  return and.length ? { AND: and } : {};
}

function daysBetween(from: Date, to = new Date()) {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

function countByStatus(rows: Array<{ status: RequestStatus; count: number }>, status: RequestStatus) {
  return rows.find((row) => row.status === status)?.count ?? 0;
}

async function requireSessionWorkspace(session: AppSession, filters: OpsFilters): Promise<string> {
  const workspaceId = requireText(filters.workspaceId || session.activeWorkspaceId || '', 'WORKSPACE_REQUIRED');
  await requireOpsAdmin(workspaceId, session.userId);
  return workspaceId;
}

export async function getOpsDashboard(session: AppSession, filters: OpsFilters): Promise<OpsDashboardDto> {
  const workspaceId = await requireSessionWorkspace(session, filters);
  const scopedFilters = { ...filters, workspaceId };
  const where = buildOpsRequestWhere(scopedFilters);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const [total, statusGroups, specialistGroups, reviewerGroups, requests] = await Promise.all([
    prisma.legalRequest.count({ where }),
    prisma.legalRequest.groupBy({ by: ['status'], _count: { _all: true }, where, orderBy: { status: 'asc' } }),
    prisma.legalRequest.groupBy({ by: ['assignedSpecialistId'], _count: { _all: true }, where: { AND: [where, { assignedSpecialistId: { not: null } }] } }),
    prisma.legalRequest.groupBy({ by: ['assignedReviewerId'], _count: { _all: true }, where: { AND: [where, { assignedReviewerId: { not: null } }] } }),
    prisma.legalRequest.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { name: true, email: true } },
        assignedSpecialistId: true,
        assignedSpecialist: { select: { name: true, email: true } },
        assignedReviewerId: true,
        assignedReviewer: { select: { name: true, email: true } },
        intakeSubmission: { select: { matterTypeKey: true, matterType: { select: { label_vi: true } } } },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 100,
    }),
  ]);

  const requestIds = requests.map((request) => request.id);
  const transitions = requestIds.length
    ? await prisma.workflowTransition.findMany({
        where: { requestId: { in: requestIds } },
        select: { requestId: true, toStatus: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }],
      })
    : [];

  const latestByRequest = new Map<string, Date>();
  const pendingByRequest = new Map<string, Date>();
  const deliveredByRequest = new Map<string, Date>();
  const closedByRequest = new Map<string, Date>();
  for (const transition of transitions) {
    if (!latestByRequest.has(transition.requestId)) latestByRequest.set(transition.requestId, transition.createdAt);
    if (transition.toStatus === 'pending_review' && !pendingByRequest.has(transition.requestId)) pendingByRequest.set(transition.requestId, transition.createdAt);
    if (transition.toStatus === 'delivered' && !deliveredByRequest.has(transition.requestId)) deliveredByRequest.set(transition.requestId, transition.createdAt);
    if (transition.toStatus === 'closed' && !closedByRequest.has(transition.requestId)) closedByRequest.set(transition.requestId, transition.createdAt);
  }

  const byStatus: Array<{ status: RequestStatus; count: number }> = statusGroups.map((row) => ({
    status: row.status as RequestStatus,
    count: row._count._all,
  }));
  const userIds = [...new Set([...specialistGroups.map((row) => row.assignedSpecialistId), ...reviewerGroups.map((row) => row.assignedReviewerId)].filter(Boolean))] as string[];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds }, isActive: true }, select: { id: true, name: true, email: true } })
    : [];
  const userById = new Map(users.map((user) => [user.id, user]));

  const bySpecialist = specialistGroups.map((row) => {
    const user = userById.get(row.assignedSpecialistId || '');
    return { userId: row.assignedSpecialistId || '', name: user?.name || 'Unknown', email: user?.email || '', count: row._count._all };
  });
  const byReviewer = reviewerGroups.map((row) => {
    const user = userById.get(row.assignedReviewerId || '');
    return { userId: row.assignedReviewerId || '', name: user?.name || 'Unknown', email: user?.email || '', count: row._count._all };
  });

  const requestRows: OpsRequestRowDto[] = requests.map((request) => {
    const currentStatusSince = latestByRequest.get(request.id) || request.createdAt;
    return {
      id: request.id,
      title: request.title,
      status: request.status as RequestStatus,
      workspaceId: request.workspaceId,
      matterTypeKey: request.intakeSubmission?.matterTypeKey ?? null,
      matterTypeLabel: request.intakeSubmission?.matterType?.label_vi ?? request.intakeSubmission?.matterTypeKey ?? null,
      customerName: request.createdBy.name,
      customerEmail: request.createdBy.email,
      assignedSpecialistName: request.assignedSpecialist?.name ?? null,
      assignedReviewerName: request.assignedReviewer?.name ?? null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      currentStatusSince,
      currentStatusAgeDays: daysBetween(currentStatusSince),
      pendingReviewSince: pendingByRequest.get(request.id) ?? null,
      deliveredAt: deliveredByRequest.get(request.id) ?? null,
      closedAt: closedByRequest.get(request.id) ?? null,
    };
  });

  const workloadBySpecialist = new Map<string, OpsRequestRowDto[]>();
  const workloadByReviewer = new Map<string, OpsRequestRowDto[]>();
  for (const request of requestRows) {
    if (!activeStatuses.includes(request.status)) continue;
    const source = requests.find((item) => item.id === request.id);
    if (source?.assignedSpecialistId) workloadBySpecialist.set(source.assignedSpecialistId, [...(workloadBySpecialist.get(source.assignedSpecialistId) ?? []), request]);
    if (source?.assignedReviewerId) workloadByReviewer.set(source.assignedReviewerId, [...(workloadByReviewer.get(source.assignedReviewerId) ?? []), request]);
  }

  const workload: OpsWorkloadRowDto[] = [
    ...bySpecialist.map((row) => {
      const assignedRequests = workloadBySpecialist.get(row.userId) ?? [];
      return {
        kind: 'specialist' as const,
        userId: row.userId,
        name: row.name,
        email: row.email,
        activeCount: assignedRequests.length,
        byStatus: activeStatuses.map((status) => ({ status, count: assignedRequests.filter((request) => request.status === status).length })),
        oldestActiveAgeDays: assignedRequests.reduce((max, request) => Math.max(max, request.currentStatusAgeDays), 0),
      };
    }),
    ...byReviewer.map((row) => {
      const assignedRequests = workloadByReviewer.get(row.userId) ?? [];
      return {
        kind: 'reviewer' as const,
        userId: row.userId,
        name: row.name,
        email: row.email,
        activeCount: assignedRequests.length,
        byStatus: activeStatuses.map((status) => ({ status, count: assignedRequests.filter((request) => request.status === status).length })),
        oldestActiveAgeDays: assignedRequests.reduce((max, request) => Math.max(max, request.currentStatusAgeDays), 0),
      };
    }),
  ];

  return {
    total,
    byStatus,
    bySpecialist,
    byReviewer,
    aging: {
      pendingReview: countByStatus(byStatus, 'pending_review'),
      revisionRequired: countByStatus(byStatus, 'revision_required'),
      olderThanSevenDays: requests.filter((request) => request.createdAt <= sevenDaysAgo && !['closed', 'cancelled'].includes(request.status)).length,
    },
    requests: requestRows,
    workload,
  };
}

// --- SLA calculation: deadline-first, then status-age fallback, then info ---
export function calcOpsSla(
  slaDeadline: Date | null,
  latestTransitionCreatedAt: Date | null,
  requestCreatedAt: Date,
): OpsSlaDto {
  const now = new Date();

  // Path 1: real deadline
  if (slaDeadline) {
    const msLeft = slaDeadline.getTime() - now.getTime();
    const totalMs = slaDeadline.getTime() - requestCreatedAt.getTime();
    if (totalMs <= 0) {
      return { level: 'ok', label: 'Đúng hạn', percent: 100, source: 'deadline' };
    }
    const percent = Math.min(100, Math.max(0, Math.round((1 - msLeft / totalMs) * 100)));
    if (msLeft < 0) {
      return { level: 'danger', label: `Trễ ${formatHours(Math.abs(msLeft))}`, percent: 100, source: 'deadline' };
    }
    const hoursLeft = msLeft / 3_600_000;
    if (hoursLeft < 24) {
      return { level: 'danger', label: `Còn ${formatHours(msLeft)}`, percent, source: 'deadline' };
    }
    if (hoursLeft < 72) {
      return { level: 'warn', label: `Còn ${formatHours(msLeft)}`, percent, source: 'deadline' };
    }
    return { level: 'ok', label: 'Đúng hạn', percent, source: 'deadline' };
  }

  // Path 2: status age from latest transition
  if (latestTransitionCreatedAt) {
    const daysElapsed = daysBetween(latestTransitionCreatedAt);
    const maxDays = 7;
    const percent = Math.min(100, Math.round((daysElapsed / maxDays) * 100));
    if (daysElapsed >= maxDays) {
      return { level: 'danger', label: `Trễ ${daysElapsed} ngày`, percent: 100, source: 'status_age' };
    }
    if (daysElapsed >= 3) {
      return { level: 'warn', label: `${daysElapsed} ngày`, percent, source: 'status_age' };
    }
    return { level: 'ok', label: `${daysElapsed} ngày`, percent, source: 'status_age' };
  }

  // Path 3: request age fallback
  const daysElapsed = daysBetween(requestCreatedAt);
  const maxDays = 7;
  const percent = Math.min(100, Math.round((daysElapsed / maxDays) * 100));
  return { level: 'info', label: 'Chưa có SLA', percent, source: 'none' };
}

function formatHours(ms: number): string {
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.round(ms / 60_000)} phút`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)} ngày`;
}

// --- Global recent timeline: AuditEvent + WorkflowTransition merged, ordered by createdAt desc ---
async function getGlobalTimeline(workspaceId: string): Promise<OpsTimelineItemDto[]> {
  const [auditEvents, workflowTransitions] = await Promise.all([
    prisma.auditEvent.findMany({
      where: { workspaceId },
      select: {
        id: true,
        actorId: true,
        action: true,
        targetType: true,
        targetId: true,
        correlationId: true,
        metadataSummary: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 20,
    }),
    prisma.workflowTransition.findMany({
      where: { request: { workspaceId } },
      select: {
        id: true,
        actorId: true,
        fromStatus: true,
        toStatus: true,
        reason: true,
        createdAt: true,
        request: { select: { id: true, title: true, workspaceId: true } },
        actor: { select: { name: true, email: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 20,
    }),
  ]);

  const items: OpsTimelineItemDto[] = [
    ...auditEvents.map((e) => ({
      id: e.id,
      kind: 'audit' as const,
      at: e.createdAt,
      actorId: e.actorId,
      actorName: e.actor?.name ?? null,
      actorEmail: e.actor?.email ?? null,
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId,
      fromStatus: null,
      toStatus: null,
      correlationId: e.correlationId,
      reason: null,
      metadataSummary: e.metadataSummary,
    })),
    ...workflowTransitions.map((t) => ({
      id: t.id,
      kind: 'workflow' as const,
      at: t.createdAt,
      actorId: t.actorId,
      actorName: t.actor?.name ?? null,
      actorEmail: t.actor?.email ?? null,
      action: 'request.status_changed',
      targetType: 'workflow_transition',
      targetId: t.id,
      fromStatus: t.fromStatus as RequestStatus | null,
      toStatus: t.toStatus as RequestStatus,
      correlationId: null,
      reason: t.reason,
      metadataSummary: `${t.fromStatus} → ${t.toStatus}`,
    })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 20);
}

// --- Aggregate endpoint ---
export async function getOpsAggregate(
  session: AppSession,
  filters: OpsFilters & { search?: string; page?: number; pageSize?: number },
): Promise<OpsAggregateDto> {
  const workspaceId = await requireSessionWorkspace(session, filters);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  console.log('[getOpsAggregate] page:', page, 'pageSize:', pageSize, 'skip:', skip);

  // Build where clause
  const and: Prisma.LegalRequestWhereInput[] = [];
  if (filters.workspaceId) and.push({ workspaceId: filters.workspaceId });
  // Note: intakeSubmission has @unique requestId, so { is: } is correct for one-to-one filtering
  if (filters.matterTypeKey) and.push({ intakeSubmission: { is: { matterTypeKey: filters.matterTypeKey } } });
  if (filters.status) and.push({ status: filters.status });
  if (filters.assignedSpecialistId) and.push({ assignedSpecialistId: filters.assignedSpecialistId });
  if (filters.assignedReviewerId) and.push({ assignedReviewerId: filters.assignedReviewerId });
  if (filters.dateFrom || filters.dateTo) {
    and.push({ createdAt: { ...(filters.dateFrom ? { gte: filters.dateFrom } : {}), ...(filters.dateTo ? { lte: filters.dateTo } : {}) } });
  }
  if (filters.search && filters.search.length <= 200) {
    and.push({
      OR: [
        { title: { contains: filters.search } },
        { code: { contains: filters.search } },
      ],
    });
  }
  const where: Prisma.LegalRequestWhereInput = and.length ? { AND: and } : {};

  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 3_600_000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Stats counts
  const closedStatuses = ['closed', 'cancelled'];

  const [totalCount, nearSlaCount, completedTodayCount, allActive] = await Promise.all([
    prisma.legalRequest.count({ where: { AND: [where, { status: { in: activeStatuses } }] } }),
    prisma.legalRequest.count({ where: { AND: [where, { slaDeadline: { lte: twentyFourHoursFromNow, gte: now }, status: { in: activeStatuses } }] } }),
    prisma.legalRequest.count({ where: { AND: [where, { status: { in: closedStatuses }, updatedAt: { gte: todayStart } }] } }),
    prisma.legalRequest.count({ where: { AND: [where, { status: { in: activeStatuses } }] } }),
  ]);

  // Audit warnings: count of active requests with no assignee
  const auditWarningsCount = await prisma.legalRequest.count({
    where: { AND: [where, { status: { in: activeStatuses }, assignedSpecialistId: null, assignedReviewerId: null }] },
  });

  // Workload: reuse existing pattern
  const dashboard = await getOpsDashboard(session, filters);

  // Global timeline
  const timeline = await getGlobalTimeline(workspaceId);

  // Paginated requests
  const [requests, total] = await Promise.all([
    prisma.legalRequest.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        priority: true,
        workspaceId: true,
        slaDeadline: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { name: true, email: true } },
        assignedSpecialistId: true,
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewerId: true,
        assignedReviewer: { select: { id: true, name: true } },
        workspace: { select: { name: true } },
        intakeSubmission: { select: { matterTypeKey: true, matterType: { select: { label_vi: true } } } },
        workflowTransitions: {
          select: { toStatus: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.legalRequest.count({ where }),
  ]);

  // Map transitions for latest timestamps
  const transitionMap = new Map<string, Date | null>();
  for (const req of requests) {
    const latest = req.workflowTransitions[0];
    transitionMap.set(req.id, latest?.createdAt ?? null);
  }

  const requestRows: OpsRequestRowDto[] = requests.map((r) => {
    const latestTransitionAt = transitionMap.get(r.id) ?? null;
    const currentStatusSince = latestTransitionAt ?? r.createdAt;
    const sla = calcOpsSla(r.slaDeadline, latestTransitionAt, r.createdAt);
    return {
      id: r.id,
      title: r.title,
      status: r.status as RequestStatus,
      workspaceId: r.workspaceId,
      code: r.code ?? null,
      priority: r.priority ?? null,
      matterTypeKey: r.intakeSubmission?.matterTypeKey ?? null,
      matterTypeLabel: r.intakeSubmission?.matterType?.label_vi ?? r.intakeSubmission?.matterTypeKey ?? null,
      customerName: r.createdBy.name,
      customerEmail: r.createdBy.email,
      workspaceName: r.workspace.name,
      assignedSpecialistId: r.assignedSpecialistId,
      assignedSpecialistName: r.assignedSpecialist?.name ?? null,
      assignedReviewerId: r.assignedReviewerId,
      assignedReviewerName: r.assignedReviewer?.name ?? null,
      slaDeadline: r.slaDeadline,
      sla,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      currentStatusSince,
      currentStatusAgeDays: daysBetween(currentStatusSince),
      pendingReviewSince: null,
      deliveredAt: null,
      closedAt: null,
    };
  });

  // Filter options
  const [workspaces, matterTypes, specialists, reviewers, statuses] = await Promise.all([
    prisma.workspace.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.matterType.findMany({ where: { isActive: true }, select: { key: true, label_vi: true }, orderBy: { label_vi: 'asc' } }),
    prisma.user.findMany({
      where: { isActive: true, memberships: { some: { role: 'specialist', isActive: true } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { isActive: true, memberships: { some: { role: 'reviewer', isActive: true } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    Promise.resolve(requestStatuses),
  ]);

  return {
    stats: {
      openRequests: totalCount,
      nearSla: nearSlaCount,
      completedToday: completedTodayCount,
      auditWarnings: auditWarningsCount,
    },
    workload: dashboard.workload,
    timeline,
    requests: requestRows,
    filters: {
      workspaces: workspaces.map((w) => ({ id: w.id, name: w.name })),
      matterTypes: matterTypes.map((m) => ({ key: m.key, label: m.label_vi ?? m.key })),
      specialists: specialists.map((s) => ({ id: s.id, name: s.name })),
      reviewers: reviewers.map((r) => ({ id: r.id, name: r.name })),
      statuses,
    },
    pagination: { page, pageSize, total },
  };
}

export async function getOpsRequestTimeline(session: AppSession, requestId: string): Promise<OpsTimelineDto> {
  const scopedRequestId = requireText(requestId, 'REQUEST_REQUIRED');
  const request = await prisma.legalRequest.findFirst({
    where: { id: scopedRequestId },
    select: { id: true, workspaceId: true, title: true },
  });
  if (!request) throw new Error('REQUEST_NOT_FOUND');
  await requireOpsAdmin(request.workspaceId, session.userId);

  const [auditEvents, workflowTransitions] = await Promise.all([
    prisma.auditEvent.findMany({
      where: { requestId: scopedRequestId, workspaceId: request.workspaceId },
      select: {
        id: true,
        actorId: true,
        action: true,
        targetType: true,
        targetId: true,
        correlationId: true,
        metadataSummary: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.workflowTransition.findMany({
      where: { requestId: scopedRequestId },
      select: {
        id: true,
        actorId: true,
        fromStatus: true,
        toStatus: true,
        reason: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    }),
  ]);

  const currentStatusSince = workflowTransitions[0]?.createdAt ?? new Date(0);
  const pendingReviewSince = workflowTransitions.find((transition) => transition.toStatus === 'pending_review')?.createdAt ?? null;
  const deliveredAt = workflowTransitions.find((transition) => transition.toStatus === 'delivered')?.createdAt ?? null;
  const closedAt = workflowTransitions.find((transition) => transition.toStatus === 'closed')?.createdAt ?? null;

  const items: OpsTimelineItemDto[] = [
    ...auditEvents.map((event) => ({
      id: event.id,
      kind: 'audit' as const,
      at: event.createdAt,
      actorId: event.actorId,
      actorName: event.actor?.name ?? null,
      actorEmail: event.actor?.email ?? null,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      fromStatus: null,
      toStatus: null,
      correlationId: event.correlationId,
      reason: null,
      metadataSummary: event.metadataSummary,
    })),
    ...workflowTransitions.map((transition) => ({
      id: transition.id,
      kind: 'workflow' as const,
      at: transition.createdAt,
      actorId: transition.actorId,
      actorName: transition.actor?.name ?? null,
      actorEmail: transition.actor?.email ?? null,
      action: 'request.status_changed',
      targetType: 'workflow_transition',
      targetId: transition.id,
      fromStatus: transition.fromStatus as RequestStatus | null,
      toStatus: transition.toStatus as RequestStatus,
      correlationId: null,
      reason: transition.reason,
      metadataSummary: `${transition.fromStatus} -> ${transition.toStatus}`,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    requestId: request.id,
    workspaceId: request.workspaceId,
    title: request.title,
    sla: {
      currentStatusSince,
      currentStatusAgeDays: daysBetween(currentStatusSince),
      pendingReviewSince,
      deliveredAt,
      closedAt,
    },
    items,
  };
}
