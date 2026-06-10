import type { Prisma } from '@prisma/client';
import type { AssignmentKind, RequestStatus, Role } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { getAllowedTransitions } from '@/lib/workflow/request-workflow';

type RoutingPrisma = typeof prisma & {
  routingCapability: {
    upsert(input: unknown): Promise<{ kind: AssignmentKind }>;
    findMany(input: unknown): Promise<Array<{ userId: string; user: { id: string; name: string; email: string } }>>;
    findFirst(input: unknown): Promise<{ id: string } | null>;
  };
  matterType: {
    upsert(input: unknown): Promise<{ key: string }>;
  };
};

const db = prisma as RoutingPrisma;

const suggestionReason = 'Phù hợp vai trò và năng lực với loại vụ việc này.';

type UpsertMatterTypeInput = {
  key: string;
  label: string;
  description?: string | null;
  schemaVersion: string;
  questionSchema: Prisma.InputJsonValue;
  isActive?: boolean;
  workspaceId?: string | null;
};

type UpsertRoutingCapabilityInput = {
  workspaceId: string;
  userId: string;
  matterTypeKey: string;
  kind: AssignmentKind;
  isActive?: boolean;
};

type GetRoutingSuggestionsInput = {
  requestId: string;
  workspaceId: string;
};

type AssignRequestInput = {
  requestId: string;
  workspaceId: string;
  actorId: string;
  kind: AssignmentKind;
  assigneeId: string;
  reason: string;
  correlationId: string;
};

type AssignmentRequest = {
  id: string;
  workspaceId: string;
  status: RequestStatus;
  createdById: string;
  assignedSpecialistId: string | null;
  assignedReviewerId: string | null;
  intakeSubmission: { matterTypeKey: string } | null;
};

type RoutingSuggestion = {
  userId: string;
  name: string;
  email: string;
  reason: string;
};

function requireText(value: string, errorCode: string) {
  if (!value.trim()) throw new Error(errorCode);
  return value.trim();
}

function requireRoutingKind(kind: AssignmentKind) {
  if (kind !== 'specialist' && kind !== 'reviewer') throw new Error('ROUTING_KIND_INVALID');
  return kind;
}

function assignmentPath(status: RequestStatus): RequestStatus[] {
  if (status === 'intake_submitted') return ['intake_submitted', 'triage', 'assigned'];
  if (status === 'triage') return ['triage', 'assigned'];
  if (status === 'assigned') return ['assigned'];
  throw new Error('INVALID_REQUEST_TRANSITION');
}

function assertAssignmentPath(status: RequestStatus) {
  const path = assignmentPath(status);
  for (let index = 0; index < path.length - 1; index += 1) {
    if (!getAllowedTransitions(path[index]).includes(path[index + 1])) throw new Error('INVALID_REQUEST_TRANSITION');
  }
  return path;
}

function metadataSummary(input: { kind: AssignmentKind; assigneeId: string; requestId: string; matterTypeKey: string; reason: string }) {
  const shortReason = input.reason.replace(/\s+/g, ' ').trim().slice(0, 160);
  const metadata = `kind=${input.kind}; assignee=${input.assigneeId}; request=${input.requestId}; matter=${input.matterTypeKey}; reasonProvided=true; reason=${shortReason}`;
  if (metadata.length > 500) return metadata.slice(0, 500);
  return metadata;
}

export async function requireRoutingAdmin(workspaceId: string, actorId: string) {
  const scopedWorkspaceId = requireText(workspaceId, 'WORKSPACE_REQUIRED');
  const scopedActorId = requireText(actorId, 'ACTOR_REQUIRED');
  const authorizedRoles: Role[] = ['coordinator_admin', 'super_admin'];
  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId: scopedWorkspaceId, userId: scopedActorId, role: { in: authorizedRoles }, isActive: true, user: { isActive: true }, workspace: { isActive: true } },
    select: { id: true },
  });
  if (!membership) throw new Error('FORBIDDEN');
}

export async function upsertMatterType(input: UpsertMatterTypeInput) {
  const workspaceId = requireText(input.workspaceId || '', 'WORKSPACE_REQUIRED');
  const key = requireText(input.key, 'MATTER_TYPE_KEY_REQUIRED');
  const label = requireText(input.label, 'MATTER_TYPE_LABEL_REQUIRED');
  const schemaVersion = requireText(input.schemaVersion, 'MATTER_TYPE_SCHEMA_VERSION_REQUIRED');

  return db.matterType.upsert({
    where: { workspaceId_key: { workspaceId, key } },
    update: {
      label,
      description: input.description?.trim() || null,
      schemaVersion,
      questionSchema: input.questionSchema,
      isActive: input.isActive ?? true,
    },
    create: {
      workspaceId,
      key,
      label,
      description: input.description?.trim() || null,
      schemaVersion,
      questionSchema: input.questionSchema,
      isActive: input.isActive ?? true,
    },
  });
}

export async function upsertRoutingCapability(input: UpsertRoutingCapabilityInput) {
  const workspaceId = requireText(input.workspaceId, 'WORKSPACE_REQUIRED');
  const userId = requireText(input.userId, 'USER_REQUIRED');
  const matterTypeKey = requireText(input.matterTypeKey, 'MATTER_TYPE_KEY_REQUIRED');
  const kind = requireRoutingKind(input.kind);

  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId, userId, role: kind, isActive: true, user: { isActive: true }, workspace: { isActive: true } },
    select: { id: true },
  });
  if (!membership) throw new Error('ROUTING_MEMBERSHIP_REQUIRED');

  const matterType = await prisma.matterType.findFirst({
    where: { workspaceId, key: matterTypeKey, isActive: true },
    select: { key: true },
  });
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');

  return db.routingCapability.upsert({
    where: { workspaceId_userId_matterTypeKey_kind: { workspaceId, userId, matterTypeKey, kind } },
    update: { isActive: input.isActive ?? true },
    create: { workspaceId, userId, matterTypeKey, kind, isActive: input.isActive ?? true },
  });
}

export async function listRoutingMatterTypes(workspaceId?: string) {
  return prisma.matterType.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: [{ label: 'asc' }, { key: 'asc' }],
  });
}

export async function listRoutingCapabilities(workspaceId: string) {
  return db.routingCapability.findMany({
    where: { workspaceId: requireText(workspaceId, 'WORKSPACE_REQUIRED') },
    include: { user: true, matterType: true },
    orderBy: [{ matterTypeKey: 'asc' }, { kind: 'asc' }, { user: { name: 'asc' } }, { userId: 'asc' }],
  });
}

async function suggestionsFor(input: GetRoutingSuggestionsInput, matterTypeKey: string, kind: AssignmentKind): Promise<RoutingSuggestion[]> {
  const capabilities = await db.routingCapability.findMany({
    where: {
      workspaceId: input.workspaceId,
      matterTypeKey,
      kind,
      isActive: true,
      user: { isActive: true, memberships: { some: { workspaceId: input.workspaceId, role: kind, isActive: true, workspace: { isActive: true } } } },
      matterType: { isActive: true },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ user: { name: 'asc' } }, { userId: 'asc' }],
  });

  return capabilities.map((capability) => ({
    userId: capability.user.id,
    name: capability.user.name,
    email: capability.user.email,
    reason: suggestionReason,
  }));
}

export async function getRoutingSuggestions(input: GetRoutingSuggestionsInput) {
  const requestId = requireText(input.requestId, 'REQUEST_REQUIRED');
  const workspaceId = requireText(input.workspaceId, 'WORKSPACE_REQUIRED');

  const submission = await prisma.intakeSubmission.findFirst({
    where: { requestId, request: { workspaceId } },
    select: { matterTypeKey: true },
  });
  if (!submission) throw new Error('INTAKE_SUBMISSION_NOT_FOUND');

  const scopedInput = { requestId, workspaceId };
  const [specialists, reviewers] = await Promise.all([
    suggestionsFor(scopedInput, submission.matterTypeKey, 'specialist'),
    suggestionsFor(scopedInput, submission.matterTypeKey, 'reviewer'),
  ]);

  return { specialists, reviewers };
}

export async function assignRequest(input: AssignRequestInput) {
  const requestId = requireText(input.requestId, 'REQUEST_REQUIRED');
  const workspaceId = requireText(input.workspaceId, 'WORKSPACE_REQUIRED');
  const actorId = requireText(input.actorId, 'ACTOR_REQUIRED');
  const assigneeId = requireText(input.assigneeId, 'ASSIGNEE_REQUIRED');
  const correlationId = requireText(input.correlationId, 'CORRELATION_REQUIRED');
  const reason = requireText(input.reason, 'ASSIGNMENT_REASON_REQUIRED');
  const kind = requireRoutingKind(input.kind);

  await requireRoutingAdmin(workspaceId, actorId);

  const request = await prisma.legalRequest.findFirst({
    where: { id: requestId, workspaceId },
    select: {
      id: true,
      workspaceId: true,
      status: true,
      createdById: true,
      assignedSpecialistId: true,
      assignedReviewerId: true,
      intakeSubmission: { select: { matterTypeKey: true } },
    },
  });
  if (!request) throw new Error('REQUEST_NOT_FOUND');
  if (!request.intakeSubmission) throw new Error('INTAKE_SUBMISSION_NOT_FOUND');
  const matterTypeKey = request.intakeSubmission.matterTypeKey;

  const path = assertAssignmentPath(request.status as RequestStatus);
  const capability = await db.routingCapability.findFirst({
    where: {
      workspaceId,
      userId: assigneeId,
      kind,
      matterTypeKey,
      isActive: true,
      user: { isActive: true },
      matterType: { isActive: true },
    },
    select: { id: true },
  });
  if (!capability) throw new Error('ROUTING_CAPABILITY_REQUIRED');

  const membership = await prisma.workspaceMembership.findFirst({
    where: { workspaceId, userId: assigneeId, role: kind, isActive: true, user: { isActive: true }, workspace: { isActive: true } },
    select: { id: true },
  });
  if (!membership) throw new Error('ROUTING_MEMBERSHIP_REQUIRED');

  return prisma.$transaction(async (tx) => {
    let currentStatus = request.status;
    for (let index = 1; index < path.length; index += 1) {
      const nextStatus = path[index];
      const updated = await tx.legalRequest.updateMany({
        where: { id: requestId, status: currentStatus },
        data: { status: nextStatus },
      });
      if (updated.count !== 1) throw new Error('REQUEST_STATUS_CONFLICT');

      await tx.workflowTransition.create({
        data: { requestId, actorId, fromStatus: currentStatus, toStatus: nextStatus, reason },
      });
      currentStatus = nextStatus;
    }

    const assignmentField = kind === 'specialist' ? { assignedSpecialistId: assigneeId } : { assignedReviewerId: assigneeId };
    const updatedRequest = await tx.legalRequest.update({
      where: { id: requestId },
      data: assignmentField,
      select: { id: true, status: true, assignedSpecialistId: true, assignedReviewerId: true },
    });

    const assignment = await tx.requestAssignment.create({
      data: { requestId, userId: assigneeId, kind, createdById: actorId, reason },
      select: { id: true },
    });

    await recordAuditEvent(
      {
        actorId,
        workspaceId,
        action: 'request.assigned',
        targetType: 'ASSIGNMENT',
        targetId: assignment.id,
        requestId,
        correlationId,
        metadataSummary: metadataSummary({ kind, assigneeId, requestId, matterTypeKey, reason }),
      },
      tx,
    );

    return updatedRequest;
  });
}
