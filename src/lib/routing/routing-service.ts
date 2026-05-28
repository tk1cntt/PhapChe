import type { AssignmentKind, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type RoutingPrisma = typeof prisma & {
  routingCapability: {
    upsert(input: unknown): Promise<{ kind: AssignmentKind }>;
    findMany(input: unknown): Promise<Array<{ userId: string; user: { id: string; name: string; email: string } }>>;
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

export async function upsertMatterType(input: UpsertMatterTypeInput) {
  const key = requireText(input.key, 'MATTER_TYPE_KEY_REQUIRED');
  const label = requireText(input.label, 'MATTER_TYPE_LABEL_REQUIRED');
  const schemaVersion = requireText(input.schemaVersion, 'MATTER_TYPE_SCHEMA_VERSION_REQUIRED');
  const workspaceId = input.workspaceId?.trim() || null;

  return prisma.matterType.upsert({
    where: { key },
    update: {
      workspaceId,
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
    where: { key: matterTypeKey, isActive: true },
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
    where: workspaceId ? { OR: [{ workspaceId }, { workspaceId: null }] } : undefined,
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
