import { notFound } from 'next/navigation';
import { MATTER_CATALOG, getMatterType } from '@/lib/intake/catalog';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';
import { attachIntakeFileAction, createIntakeDraftAction, saveIntakeAnswersAction, submitIntakeAction } from './actions';
import { IntakeHeader, IntakeShell, ProgressSteps, QuestionStep, ReviewSummary, ServiceSelection, UploadStep } from './components';

async function createDraftFormAction(formData: FormData) {
  'use server';
  await createIntakeDraftAction(formData);
}

async function saveAnswersFormAction(formData: FormData) {
  'use server';
  await saveIntakeAnswersAction(formData);
}

async function attachFileFormAction(formData: FormData) {
  'use server';
  await attachIntakeFileAction(formData);
}

type IntakePageProps = {
  searchParams?: Promise<{ requestId?: string }>;
};

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function asAnswerLabels(value: unknown): { key: string; label: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { key: string; label: string } => Boolean(item) && typeof item === 'object' && typeof item.key === 'string' && typeof item.label === 'string');
}

export default async function IntakePage({ searchParams }: IntakePageProps) {
  const params = await searchParams;
  const requestId = params?.requestId?.trim();

  if (!requestId) {
    return (
      <IntakeShell>
        <IntakeHeader />
        <ProgressSteps activeStep={0} />
        <form action={createDraftFormAction} className="space-y-8">
          <ServiceSelection catalog={MATTER_CATALOG} />
        </form>
      </IntakeShell>
    );
  }

  const session = await requireAppSession();
  if (!(await canAccessRequest(session, requestId))) notFound();

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      intakeSubmission: {
        select: {
          matterTypeKey: true,
          answers: true,
          answerLabels: true,
        },
      },
      vaultFiles: {
        select: { filename: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!request?.intakeSubmission) notFound();

  const selectedMatterType = getMatterType(request.intakeSubmission.matterTypeKey);
  if (!selectedMatterType) notFound();

  const answers = asRecord(request.intakeSubmission.answers);
  const answerLabels = asAnswerLabels(request.intakeSubmission.answerLabels);
  const reviewAnswers = answerLabels
    .map((answerLabel) => ({
      key: answerLabel.key,
      label: answerLabel.label,
      value: answers[answerLabel.key] ?? '',
    }))
    .filter((answer) => answer.value !== '');
  const uploadedFiles = request.vaultFiles
    .filter((file): file is { filename: string } => file.filename !== null)
    .map((file) => ({ filename: file.filename, size: 0 }));

  return (
    <IntakeShell>
      <IntakeHeader />
      <ProgressSteps activeStep={3} />

      <form action={createDraftFormAction} className="space-y-8">
        <ServiceSelection catalog={MATTER_CATALOG} />
      </form>

      <form action={saveAnswersFormAction} className="space-y-8">
        <input type="hidden" name="requestId" value={request.id} />
        <QuestionStep matterType={selectedMatterType} />
      </form>

      <form action={attachFileFormAction} className="space-y-8">
        <input type="hidden" name="requestId" value={request.id} />
        <UploadStep files={uploadedFiles} />
      </form>

      <form action={submitIntakeAction} className="space-y-8">
        <input type="hidden" name="requestId" value={request.id} />
        <ReviewSummary matterType={selectedMatterType} answers={reviewAnswers} files={uploadedFiles} />
      </form>
    </IntakeShell>
  );
}
