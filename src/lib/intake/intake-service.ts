import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditEvent } from '@/lib/audit/audit';
import { canAccessRequest, canAccessWorkspace } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';
import { transitionRequestStatus } from '@/lib/workflow/request-workflow';
import { SEED_MATTER_TYPES } from '../i18n/seed-multilingual';

type SeedMatter = typeof SEED_MATTER_TYPES[keyof typeof SEED_MATTER_TYPES];

function getSeedMatter(key: string): (SeedMatter & { key: string }) | null {
  const entry = SEED_MATTER_TYPES[key as keyof typeof SEED_MATTER_TYPES];
  if (!entry) return null;
  return { ...entry, key };
}

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
  return Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value?.trim() ?? '']));
}

function buildAnswerLabels(matterTypeKey: string, answers: IntakeAnswers) {
  const matterType = getSeedMatter(matterTypeKey);
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');

  return matterType.questions
    .filter((question) => answers[question.key] !== null && answers[question.key] !== undefined)
    .map((question) => ({
      key: question.key,
      label: question.label,
      required: question.required,
    }));
}

function validateAnswers(matterTypeKey: string, answers: IntakeAnswers): ValidationResult {
  const matterType = getSeedMatter(matterTypeKey);
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');

  const allowedKeys = new Set<string>(matterType.questions.map((question) => question.key));
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
  const matterType = getSeedMatter(input.matterTypeKey);
  if (!matterType) throw new Error('MATTER_TYPE_NOT_FOUND');
  if (!input.session.activeWorkspaceId) throw new Error('WORKSPACE_REQUIRED');
  if (!(await canAccessWorkspace(input.session, input.session.activeWorkspaceId))) throw new Error('FORBIDDEN');

  return prisma.$transaction(async (tx) => {
    const workspaceId = input.session.activeWorkspaceId!;

    // First, ensure matter type exists for this workspace
    await tx.matterType.upsert({
      where: { workspaceId_key: { workspaceId, key: matterType.key } },
      update: {
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
      create: {
        workspaceId,
        key: matterType.key,
        schemaVersion: matterType.schemaVersion,
        questionSchema: matterType.questions as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });

    const request = await tx.legalRequest.create({
      data: {
        workspaceId,
        title: matterType.label?.vi ?? input.matterTypeKey,
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
  // Only validate known keys during save; required-field enforcement happens at submit.
  void validateAnswers(submission.matterTypeKey, answers);
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

  // Validate required answers before submit
  const validation = validateAnswers(submission.matterTypeKey, answers);
  if (!validation.ok) throw new Error(`INTAKE_REQUIRED_ANSWERS_MISSING:${validation.missingRequired.join(',')}`);

  let coordinator: { userId: string } | null = null;
  if (submission.matterTypeKey === 'unsupported') {
    coordinator = await prisma.workspaceMembership.findFirst({
      where: { workspaceId: submission.request.workspaceId, role: 'coordinator_admin', isActive: true, user: { isActive: true } },
      select: { userId: true },
    });
    if (!coordinator) throw new Error('COORDINATOR_REQUIRED_FOR_TRIAGE');
  }

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

  // For unsupported matter type, assign to coordinator instead of auto-triaging
  if (submission.matterTypeKey === 'unsupported') {
    await transitionRequestStatus({
      requestId: input.requestId,
      actorId: coordinator!.userId,
      toStatus: 'triage',
      reason: 'unsupported intake requires human triage',
      correlationId: input.correlationId,
    });
    return { id: input.requestId, status: 'triage' as const };
  }

  await transitionRequestStatus({
    requestId: input.requestId,
    actorId: input.session.userId,
    toStatus: 'triage',
    reason: 'intake submitted via wizard',
    correlationId: input.correlationId,
  });

  return { id: input.requestId, status: 'triage' as const };
}
