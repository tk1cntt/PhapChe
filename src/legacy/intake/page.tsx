import { notFound, redirect } from 'next/navigation';
import { MATTER_CATALOG, getMatterType } from '@/lib/intake/catalog';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';
import { IntakeHeader, IntakeShell, ProgressSteps, QuestionStep, ReviewSummary, ServiceSelection, UploadStep } from './components';

type IntakePageProps = {
  searchParams?: Promise<{ requestId?: string; step?: string }>;
};

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function asAnswerLabels(value: unknown): { key: string; label: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { key: string; label: string } => Boolean(item) && typeof item === 'object' && typeof item.key === 'string' && typeof item.label === 'string');
}

function getStepFromParams(params: { requestId?: string; step?: string }): number {
  if (!params.requestId) return 0;
  const step = parseInt(params.step || '1', 10);
  if (isNaN(step) || step < 1 || step > 3) return 1;
  return step;
}

export default async function IntakePage({ searchParams }: IntakePageProps) {
  const params = await searchParams;
  const requestId = params?.requestId?.trim();
  const activeStep = getStepFromParams(params || {});

  // Step 0: Service Selection (no requestId yet)
  if (!requestId) {
    return (
      <IntakeShell>
        <IntakeHeader />
        <ProgressSteps activeStep={0} />
        <ServiceSelection catalog={MATTER_CATALOG} />
      </IntakeShell>
    );
  }

  // Require session for all subsequent steps
  let session;
  try {
    session = await requireAppSession();
  } catch {
    redirect('/sign-in');
  }

  if (!(await canAccessRequest(session, requestId))) notFound();

  // Fetch request data
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
        select: { filename: true, size: true },
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
  const uploadedFiles: { filename: string; size: number }[] = request.vaultFiles
    .filter((file) => file.filename !== null && file.size !== null)
    .map((file) => ({ filename: file.filename as string, size: typeof file.size === 'bigint' ? Number(file.size) : (file.size as number) }));

  // Step 1: Questions
  if (activeStep === 1) {
    return (
      <IntakeShell>
        <IntakeHeader />
        <ProgressSteps activeStep={1} />
        <QuestionStep
          matterType={selectedMatterType}
          savedAnswers={answers}
          requestId={requestId}
        />
      </IntakeShell>
    );
  }

  // Step 2: Upload Documents
  if (activeStep === 2) {
    return (
      <IntakeShell>
        <IntakeHeader />
        <ProgressSteps activeStep={2} />
        <UploadStep requestId={requestId} files={uploadedFiles} />
      </IntakeShell>
    );
  }

  // Step 3: Review & Submit
  if (activeStep === 3) {
    return (
      <IntakeShell>
        <IntakeHeader />
        <ProgressSteps activeStep={3} />
        <ReviewSummary
          matterType={selectedMatterType}
          answers={reviewAnswers}
          files={uploadedFiles}
          requestId={requestId}
        />
      </IntakeShell>
    );
  }

  notFound();
}
