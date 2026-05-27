import { MATTER_CATALOG, getMatterType } from '@/lib/intake/catalog';
import { attachIntakeFileAction, createIntakeDraftAction, saveIntakeAnswersAction, submitIntakeAction } from './actions';
import { IntakeHeader, IntakeShell, ProgressSteps, QuestionStep, ReviewSummary, ServiceSelection, UploadStep } from './components';

const selectedMatterType = getMatterType('agency_contract')!;
const reviewAnswers = selectedMatterType.questions.map((question) => ({
  key: question.key,
  label: question.label,
  value: question.required ? 'Sẽ được lưu từ câu trả lời của khách hàng' : 'Không bắt buộc',
}));
const uploadedFiles = [{ filename: 'ho-so-mau.pdf', size: 24576 }];

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

export default function IntakePage() {
  return (
    <IntakeShell>
      <IntakeHeader />
      <ProgressSteps activeStep={3} />

      <form action={createDraftFormAction} className="space-y-8">
        <ServiceSelection catalog={MATTER_CATALOG} />
      </form>

      <form action={saveAnswersFormAction} className="space-y-8">
        <input type="hidden" name="requestId" value="demo-request" />
        <QuestionStep matterType={selectedMatterType} />
      </form>

      <form action={attachFileFormAction} className="space-y-8">
        <input type="hidden" name="requestId" value="demo-request" />
        <UploadStep files={uploadedFiles} />
      </form>

      <form action={submitIntakeAction} className="space-y-8">
        <input type="hidden" name="requestId" value="demo-request" />
        <ReviewSummary matterType={selectedMatterType} answers={reviewAnswers} files={uploadedFiles} />
      </form>
    </IntakeShell>
  );
}
