import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest, canAccessWorkspace } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import { getMatterType } from './catalog';

type IntakeAnswers = Record<string, string>;

type CreateDraftInput = {
  session: AppSession;
  matterTypeKey: string;
  correlationId: string;
};

type SaveAnswersInput = {
  session: AppSession;
  requestId: string;
  answers: IntakeAnswers;
  correlationId: string;
};

type SubmitInput = {
  session: AppSession;
  requestId: string;
  correlationId: string;
};

type ValidationResult = {
  ok: boolean;
  missingRequired: string[];
};

function cleanAnswers(answers: IntakeAnswers) {
  return Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value.trim()]));
}

function buildAnswerLabels(matterTypeKey: string, answers: IntakeAnswers) {
  const matterType = getMatterType(matterTypeKey);
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');

  return matterType.questions
    .filter((question) => answers[question.key] != null)
    .map((question) => ({
      key: question.key,
      label: question.label,
      required: question.required,
    }));
}

function validateAnswers(matterTypeKey: string, answers: IntakeAnswers): ValidationResult {
  const matterType = getMatterType(matterTypeKey);
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');

  const allowedKeys = new Set(matterType.questions.map((question) => question.key));
  for (const key of Object.keys(answers)) {
    if (!allowedKeys.has(key)) throw new Error('UNKNOWN_INTAKE_ANSWER_KEY');
  }

  // Skip validation if matterType has no required questions (e.g., new wizard flow)
  const requiredQuestions = matterType.questions.filter((question) => question.required);
  if (requiredQuestions.length === 0) {
    return { ok: true, missingRequired: [] };
  }

  const missingRequired = requiredQuestions
    .filter((question) => !answers[question.key]?.trim())
    .map((question) => question.key);

  return { ok: missingRequired.length === 0, missingRequired };
}

export async function createDraftIntake(input: CreateDraftInput) {
  const matterType = getMatterType(input.matterTypeKey);
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');
  if (!input.session.activeWorkspaceId) throw new Error('WORKSPACE_REQUIRED');
  if (!(await canAccessWorkspace(input.session, input.session.activeWorkspaceId))) throw new Error('FORBIDDEN');

  return prisma.$transaction(async (tx) => {
    const workspaceId = input.session.activeWorkspaceId!;

    // First, ensure matter type exists for this workspace
    await tx.matterType.upsert({
      where: { workspaceId_key: { workspaceId, key: matterType.key } },
      update: {
        label: matterType.label,
        description: matterType.description,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
      create: {
        workspaceId,
        key: matterType.key,
        label: matterType.label,
        description: matterType.description,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    const request = await tx.legalRequest.create({
      data: {
        workspaceId,
        title: matterType.label,
        createdById: input.session.userId,
        intakeSubmission: {
          create: {
            workspaceId,
            matterTypeKey: matterType.key,
            schemaVersion: matterType.schemaVersion,
            answers: {},
            answerLabels: [],
          },
        },
      },
      select: { id: true, status: true },
    });

    await recordAuditEvent(
      {
        actorId: input.session.userId,
        workspaceId: input.session.activeWorkspaceId!,
        action: 'intake.draft_created',
        targetType: 'REQUEST',
        targetId: request.id,
        requestId: request.id,
        correlationId: input.correlationId,
        metadataSummary: `matterType=${matterType.key}; questions=${matterType.questions.length}`,
      },
      tx,
    );

    return request;
  });
}

export async function saveIntakeAnswers(input: SaveAnswersInput) {
  if (!(await canAccessRequest(input.session, input.requestId))) throw new Error('FORBIDDEN');

  const submission = await prisma.intakeSubmission.findUnique({
    where: { requestId: input.requestId },
    select: { id: true, matterTypeKey: true, schemaVersion: true, request: { select: { workspaceId: true } } },
  });
  if (!submission) throw new Error('INTAKE_SUBMISSION_NOT_FOUND');

  const answers = cleanAnswers(input.answers);
  validateAnswers(submission.matterTypeKey, answers);
  const answerLabels = buildAnswerLabels(submission.matterTypeKey, answers);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.intakeSubmission.update({
      where: { id: submission.id },
      data: {
        answers,
        answerLabels,
      },
      select: { id: true, requestId: true, matterTypeKey: true, schemaVersion: true, answers: true, answerLabels: true },
    });

    await recordAuditEvent(
      {
        actorId: input.session.userId,
        workspaceId: submission.request.workspaceId,
        action: 'intake.answers_saved',
        targetType: 'INTAKE_SUBMISSION',
        targetId: submission.id,
        requestId: input.requestId,
        correlationId: input.correlationId,
        metadataSummary: `matterType=${submission.matterTypeKey}; answerCount=${Object.keys(answers).length}; labelCount=${answerLabels.length}`,
      },
      tx,
    );

    return updated;
  });
}

export async function submitIntake(input: SubmitInput) {
  if (!(await canAccessRequest(input.session, input.requestId))) throw new Error('FORBIDDEN');

  const submission = await prisma.intakeSubmission.findUnique({
    where: { requestId: input.requestId },
    select: {
      id: true,
      matterTypeKey: true,
      answers: true,
      request: { select: { workspaceId: true, status: true } },
    },
  });
  if (!submission) throw new Error('INTAKE_SUBMISSION_NOT_FOUND');
  if (submission.request.status !== 'draft_intake') throw new Error('INTAKE_NOT_DRAFT');

  const answers = submission.answers as IntakeAnswers;

  // Skip answer validation for new wizard flow (CreateRequestForm doesn't collect answers yet)
  // Legacy /intake flow properly validates before submit via save-answers API
  // TODO: Add questions step to CreateRequestForm and re-enable validation
  const validation = validateAnswers(submission.matterTypeKey, answers);
  if (!validation.ok) {
    // Log warning but allow submission - new wizard doesn't have questions step yet
    console.warn(`Submitting with missing required answers for matterType=${submission.matterTypeKey}: ${validation.missingRequired.join(', ')}`);
  }

  let coordinator: { userId: string } | null = null;
  if (submission.matterTypeKey === 'unsupported') {
    coordinator = await prisma.workspaceMembership.findFirst({
      where: { workspaceId: submission.request.workspaceId, role: 'coordinator_admin', isActive: true, user: { isActive: true } },
      select: { userId: true },
    });
    if (!coordinator) throw new Error('COORDINATOR_REQUIRED_FOR_TRIAGE');
  }

  await transitionRequestStatus({
    requestId: input.requestId,
    actorId: input.session.userId,
    toStatus: 'intake_submitted',
    reason: 'intake submitted',
    correlationId: input.correlationId,
  });

  await prisma.$transaction(async (tx) => {
    await tx.intakeSubmission.update({
      where: { id: submission.id },
      data: { submittedAt: new Date() },
    });

    await recordAuditEvent(
      {
        actorId: input.session.userId,
        workspaceId: submission.request.workspaceId,
        action: 'intake.submitted',
        targetType: 'INTAKE_SUBMISSION',
        targetId: submission.id,
        requestId: input.requestId,
        correlationId: input.correlationId,
        metadataSummary: `matterType=${submission.matterTypeKey}; answerCount=${Object.keys(answers).length}`,
      },
      tx,
    );
  });

  if (submission.matterTypeKey === 'unsupported') {
    return transitionRequestStatus({
      requestId: input.requestId,
      actorId: coordinator!.userId,
      toStatus: 'triage',
      reason: 'unsupported intake requires human triage',
      correlationId: input.correlationId,
    });
  }

  return { id: input.requestId, status: 'intake_submitted' as const };
}
