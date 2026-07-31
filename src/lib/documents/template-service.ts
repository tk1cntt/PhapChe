import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessWorkspace } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

function isAdmin(session: AppSession | null | undefined) {
  return session?.roles?.includes('coordinator_admin') || session?.roles?.includes('super_admin') || false;
}

export type TemplateVariable = {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'select';
};

type CreateTemplateInput = {
  workspaceId: string;
  matterTypeKey: string;
  label: string;
  description?: string;
  variableSchema: TemplateVariable[];
  content: string;
};

type UpdateTemplateInput = {
  label?: string;
  description?: string;
  variableSchema?: TemplateVariable[];
  content?: string;
};

type CreateVersionInput = {
  label?: string;
  description?: string;
  variableSchema?: TemplateVariable[];
  content?: string;
};

// listTemplates: admin can list all templates in workspace
export async function listTemplates(session: AppSession, workspaceId: string, matterTypeKey?: string) {
  if (!(await canAccessWorkspace(session, workspaceId))) throw new Error('FORBIDDEN');

  return prisma.documentTemplate.findMany({
    where: {
      workspaceId,
      ...(matterTypeKey ? { matterTypeKey } : {}),
    },
    orderBy: [{ matterTypeKey: 'asc' }, { version: 'desc' }],
  });
}

// createTemplate: admin creates new draft template
export async function createTemplate(session: AppSession, input: CreateTemplateInput) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const workspace = await prisma.workspace.findFirst({
    where: { id: input.workspaceId, isActive: true },
    select: { id: true },
  });
  if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');

  const template = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.documentTemplate.count({
      where: { workspaceId: input.workspaceId, matterTypeKey: input.matterTypeKey },
    });

    return tx.documentTemplate.create({
      data: {
        workspaceId: input.workspaceId,
        matterTypeKey: input.matterTypeKey,
        label: input.label,
        description: input.description || null,
        variableSchema: input.variableSchema ?? [],
        content: input.content,
        version: existingCount + 1,
        status: 'draft',
        createdById: session.userId,
      },
    });
  });

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: input.workspaceId,
    action: 'template.created',
    targetType: 'DOCUMENT',
    targetId: template.id,
    correlationId: `template-create-${template.id}`,
    metadataSummary: `matterType=${input.matterTypeKey}; version=${template.version}; status=draft`,
  });

  return template;
}

// updateTemplate: admin updates draft template (immutable if published/deprecated)
export async function updateTemplate(session: AppSession, templateId: string, input: UpdateTemplateInput) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, status: true, workspaceId: true },
  });

  if (!template) throw new Error('TEMPLATE_NOT_FOUND');
  if (template.status === 'published' || template.status === 'deprecated') throw new Error('TEMPLATE_IMMUTABLE');

  return prisma.documentTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.label != null ? { label: input.label } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.variableSchema != null ? { variableSchema: input.variableSchema } : {}),
      ...(input.content != null ? { content: input.content } : {}),
    },
  });
}

// approveTemplate: admin approves draft template
export async function approveTemplate(session: AppSession, templateId: string) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, status: true, workspaceId: true, matterTypeKey: true, version: true },
  });

  if (!template) throw new Error('TEMPLATE_NOT_FOUND');
  if (template.status !== 'draft') throw new Error('INVALID_TEMPLATE_STATUS');

  const updated = await prisma.documentTemplate.update({
    where: { id: templateId },
    data: { status: 'approved' },
  });

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: template.workspaceId,
    action: 'template.approved',
    targetType: 'DOCUMENT',
    targetId: templateId,
    correlationId: `template-approve-${templateId}`,
    metadataSummary: `matterType=${template.matterTypeKey}; version=${template.version}`,
  });

  return updated;
}

// publishTemplate: admin publishes template (immutable after publish)
export async function publishTemplate(session: AppSession, templateId: string) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, status: true, workspaceId: true, matterTypeKey: true, version: true },
  });

  if (!template) throw new Error('TEMPLATE_NOT_FOUND');
  if (template.status !== 'approved') throw new Error('TEMPLATE_MUST_BE_APPROVED');

  const updated = await prisma.documentTemplate.update({
    where: { id: templateId },
    data: { status: 'published' },
  });

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: template.workspaceId,
    action: 'template.published',
    targetType: 'DOCUMENT',
    targetId: templateId,
    correlationId: `template-publish-${templateId}`,
    metadataSummary: `matterType=${template.matterTypeKey}; version=${template.version}`,
  });

  return updated;
}

// deprecateTemplate: admin deprecates template (immutable after deprecate)
export async function deprecateTemplate(session: AppSession, templateId: string) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, status: true, workspaceId: true, matterTypeKey: true, version: true },
  });

  if (!template) throw new Error('TEMPLATE_NOT_FOUND');
  if (template.status !== 'published') throw new Error('ONLY_PUBLISHED_CAN_BE_DEPRECATED');

  const updated = await prisma.documentTemplate.update({
    where: { id: templateId },
    data: { status: 'deprecated' },
  });

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: template.workspaceId,
    action: 'template.deprecated',
    targetType: 'DOCUMENT',
    targetId: templateId,
    correlationId: `template-deprecate-${templateId}`,
    metadataSummary: `matterType=${template.matterTypeKey}; version=${template.version}`,
  });

  return updated;
}

// createNewVersion: create new version from published/approved template
export async function createNewVersion(session: AppSession, templateId: string, input?: CreateVersionInput) {
  if (!isAdmin(session)) throw new Error('FORBIDDEN');

  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, workspaceId: true, matterTypeKey: true, version: true, status: true, label: true, description: true, variableSchema: true, content: true },
  });

  if (!template) throw new Error('TEMPLATE_NOT_FOUND');
  if (template.status === 'draft') throw new Error('CANNOT_CREATE_VERSION_FROM_DRAFT');

  const newTemplate = await prisma.$transaction(async (tx) => {
    const maxVersion = await tx.documentTemplate.aggregate({
      where: { workspaceId: template.workspaceId, matterTypeKey: template.matterTypeKey },
      _max: { version: true },
    });
    const newVersion = (maxVersion._max.version ?? template.version) + 1;

    return tx.documentTemplate.create({
      data: {
        workspaceId: template.workspaceId,
        matterTypeKey: template.matterTypeKey,
        version: newVersion,
        status: 'draft',
        label: input?.label !== undefined ? input.label : template.label,
        description: input?.description !== undefined ? input.description : template.description,
        variableSchema: input?.variableSchema ?? template.variableSchema,
        content: input?.content ?? template.content,
        previousVersionId: templateId,
        createdById: session.userId,
      },
    });
  });

  await recordAuditEvent({
    actorId: session.userId,
    workspaceId: template.workspaceId,
    action: 'template.version_created',
    targetType: 'DOCUMENT',
    targetId: newTemplate.id,
    correlationId: `template-version-${newTemplate.id}`,
    metadataSummary: `newVersionId=${newTemplate.id}; oldVersionId=${templateId}; matterType=${template.matterTypeKey}; newVersion=${newTemplate.version}`,
  });

  return newTemplate;
}

// getTemplatesForGeneration: list approved/published templates for specialist workbench
export async function getTemplatesForGeneration(session: AppSession, workspaceId: string, matterTypeKey: string) {
  if (!(await canAccessWorkspace(session, workspaceId))) throw new Error('FORBIDDEN');

  const templates = await prisma.documentTemplate.findMany({
    where: {
      workspaceId,
      matterTypeKey,
      status: { in: ['approved', 'published'] },
    },
    orderBy: { version: 'desc' },
  });

  // Return only the latest version per matterTypeKey
  if (templates.length === 0) return [];
  const latest = templates[0];
  return [latest];
}