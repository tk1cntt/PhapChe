import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { storeVaultFile } from '@/lib/documents/vault-service';
import { canAccessRequest } from '@/lib/security/rbac';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import { getTemplatesForGeneration } from './template-service';
import type { AppSession } from '@/lib/security/session';
import type { TemplateVariable } from './template-service';

type GenerateDraftInput = {
  session: AppSession;
  requestId: string;
  templateId: string;
  variables: Record<string, unknown>;
  correlationId?: string;
};

type GenerateDraftResult = {
  documentVersionId: string;
  generatedContent: string;
  templateLabel: string;
  templateVersion: number;
};

type ListVersionsInput = {
  session: AppSession;
  requestId: string;
};

type SubmitForReviewInput = {
  session: AppSession;
  documentVersionId: string;
  reason?: string;
  correlationId?: string;
};

function replacePlaceholders(content: string, variables: Record<string, unknown>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

function validateRequiredVariables(schema: TemplateVariable[], variables: Record<string, unknown>): string[] {
  return schema
    .filter((v) => v.required && (variables[v.key] === undefined || variables[v.key] === null || variables[v.key] === ''))
    .map((v) => v.key);
}

// generateDraft: specialist generates document from approved/published template
export async function generateDraft(input: GenerateDraftInput): Promise<GenerateDraftResult> {
  const { session, requestId, templateId, variables, correlationId } = input;

  // Load request and verify specialist assignment
  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      workspaceId: true,
      status: true,
      assignedSpecialistId: true,
    },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');

  const isAssignedSpecialist = request.assignedSpecialistId === session.userId;
  const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');

  if (!isAssignedSpecialist && !isAdmin) throw new Error('FORBIDDEN');

  // Load template - must be approved or published
  const templates = await getTemplatesForGeneration(session, request.workspaceId, '');

  const template = await prisma.documentTemplate.findFirst({
    where: { id: templateId, status: { in: ['approved', 'published'] } },
    select: {
      id: true,
      workspaceId: true,
      matterTypeKey: true,
      version: true,
      status: true,
      label: true,
      variableSchema: true,
      content: true,
    },
  });

  if (!template) throw new Error('TEMPLATE_NOT_FOUND');

  // Validate required variables
  const schema = template.variableSchema as TemplateVariable[];
  const missingVars = validateRequiredVariables(schema, variables);
  if (missingVars.length > 0) {
    throw new Error(`MISSING_REQUIRED_VARIABLES: ${missingVars.join(', ')}`);
  }

  // Load intake submission for snapshot
  const intake = await prisma.intakeSubmission.findUnique({
    where: { requestId },
    select: { answers: true, answerLabels: true },
  });

  // Perform placeholder replacement
  const generatedContent = replacePlaceholders(template.content, variables);

  // Create or get Document record
  let document = await prisma.document.findFirst({
    where: { requestId },
    select: { id: true },
  });

  if (!document) {
    document = await prisma.document.create({
      data: {
        workspaceId: request.workspaceId,
        requestId,
        title: `${template.matterTypeKey} - ${template.label}`,
      },
    });
  }

  // Create DocumentVersion record
  const docVersion = await prisma.$transaction(async (tx) => {
    const created = await tx.documentVersion.create({
      data: {
        documentId: document!.id,
        templateId: template.id,
        templateVersion: template.version,
        status: 'draft',
        inputSnapshot: {
          variables,
          intakeAnswers: intake?.answers ?? {},
          intakeAnswerLabels: intake?.answerLabels ?? {},
        },
        generatedContent,
      },
    });

    // Create VaultFile for the draft via storeVaultFile wrapper (includes audit event)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${template.matterTypeKey}-v${template.version}-${timestamp}.txt`;
    const storageKey = `private/drafts/${request.workspaceId}/${requestId}/${created.id}/${filename}`;

    await storeVaultFile({
      session,
      requestId,
      storageKey,
      filename,
      fileKind: 'generated_draft',
      source: 'template_generation',
      documentVersionId: created.id,
      correlationId: correlationId ?? `draft-store-${created.id}`,
    }, tx);

    // Record audit event
    await recordAuditEvent(
      {
        actorId: session.userId,
        workspaceId: request.workspaceId,
        action: 'document.draft_generated',
        targetType: 'DOCUMENT',
        targetId: created.id,
        requestId,
        correlationId: correlationId ?? `draft-generate-${created.id}`,
        metadataSummary: `docVersionId=${created.id}; templateId=${templateId}; templateVersion=${template.version}; matterTypeKey=${template.matterTypeKey}`,
      },
      tx,
    );

    return created;
  });

  return {
    documentVersionId: docVersion.id,
    generatedContent,
    templateLabel: template.label,
    templateVersion: template.version,
  };
}

// listDocumentVersions: list all versions for a request with template info
export async function listDocumentVersions(input: ListVersionsInput) {
  const { session, requestId } = input;

  if (!(await canAccessRequest(session, requestId))) throw new Error('FORBIDDEN');

  const document = await prisma.document.findFirst({
    where: { requestId },
    select: { id: true, workspaceId: true },
  });

  if (!document) return [];

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: document.id },
    select: {
      id: true,
      templateId: true,
      templateVersion: true,
      status: true,
      inputSnapshot: true,
      generatedContent: true,
      createdAt: true,
      document: {
        include: {
          documentVersions: {
            select: { id: true, templateVersion: true, status: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Enrich with template labels
  const templateIds = [...new Set(versions.map((v) => v.templateId))];
  const templates = await prisma.documentTemplate.findMany({
    where: { id: { in: templateIds } },
    select: { id: true, label: true, matterTypeKey: true },
  });
  const templateMap = new Map(templates.map((t) => [t.id, t]));

  return versions.map((v) => {
    const template = templateMap.get(v.templateId);
    return {
      ...v,
      templateLabel: template?.label ?? 'Unknown',
      matterTypeKey: template?.matterTypeKey ?? 'unknown',
      inputSnapshot: undefined, // Don't expose raw snapshot in list
    };
  });
}

// submitForReview: transition document version to submitted_for_review
export async function submitForReview(input: SubmitForReviewInput): Promise<{ id: string; status: string }> {
  const { session, documentVersionId, reason, correlationId } = input;

  const docVersion = await prisma.documentVersion.findUnique({
    where: { id: documentVersionId },
    include: {
      document: {
        select: {
          id: true,
          requestId: true,
          workspaceId: true,
          request: {
            select: {
              id: true,
              status: true,
              assignedSpecialistId: true,
            },
          },
        },
      },
    },
  });

  if (!docVersion) throw new Error('DOCUMENT_VERSION_NOT_FOUND');

  const isAssignedSpecialist = docVersion.document.request.assignedSpecialistId === session.userId;
  const isAdmin = session.roles.includes('coordinator_admin') || session.roles.includes('super_admin');

  if (!isAssignedSpecialist && !isAdmin) throw new Error('FORBIDDEN');

  if (docVersion.status !== 'draft') throw new Error('INVALID_DOCUMENT_VERSION_STATUS');

  const updated = await prisma.$transaction(async (tx) => {
    const updatedVersion = await tx.documentVersion.update({
      where: { id: documentVersionId },
      data: { status: 'submitted_for_review' },
      select: { id: true, status: true },
    });

    // Transition request status via workflow
    const transitionReason = reason ?? `Gửi phiên bản ${documentVersionId} để kiểm tra`;
    await transitionRequestStatus({
      requestId: docVersion.document.requestId,
      actorId: session.userId,
      toStatus: 'pending_review',
      reason: transitionReason,
      correlationId: correlationId ?? `submit-review-${documentVersionId}`,
    });

    // Record audit event
    await recordAuditEvent({
      actorId: session.userId,
      workspaceId: docVersion.document.workspaceId,
      action: 'document.submitted_for_review',
      targetType: 'DOCUMENT',
      targetId: documentVersionId,
      requestId: docVersion.document.requestId,
      correlationId: correlationId ?? `submit-review-${documentVersionId}`,
      metadataSummary: `docVersionId=${documentVersionId}; requestId=${docVersion.document.requestId}`,
    });

    return updatedVersion;
  });

  return updated;
}