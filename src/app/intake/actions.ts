'use server';

import { redirect } from 'next/navigation';
import { createDraftIntake, saveIntakeAnswers, submitIntake } from '@/lib/intake/intake-service';
import { attachIntakeFile } from '@/lib/intake/upload-service';
import { requireAppSession } from '@/lib/security/session';

function correlationId() {
  return `intake-${Date.now()}`;
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function createIntakeDraftAction(formData: FormData) {
  const session = await requireAppSession();
  const matterTypeKey = stringValue(formData, 'matterTypeKey');

  if (!matterTypeKey) {
    throw new Error('Vui lòng chọn một nhóm dịch vụ để tiếp tục.');
  }

  const draft = await createDraftIntake({
    session,
    matterTypeKey,
    correlationId: correlationId(),
  });

  redirect(`/intake?requestId=${draft.id}`);
}

export async function saveIntakeAnswersAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');
  const answers = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => key.startsWith('answer.') && typeof value === 'string')
      .map(([key, value]) => [key.slice('answer.'.length), String(value)]),
  );

  return saveIntakeAnswers({
    session,
    requestId,
    answers,
    correlationId: correlationId(),
  });
}

export async function attachIntakeFileAction(formData: FormData) {
  const session = await requireAppSession();
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('FILE_REQUIRED');

  const uploaded = await attachIntakeFile({
    session,
    requestId: stringValue(formData, 'requestId'),
    file,
    correlationId: correlationId(),
  });

  return { filename: uploaded.filename, size: uploaded.size };
}

export async function submitIntakeAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');

  if (!requestId) {
    throw new Error('Yêu cầu không hợp lệ. Vui lòng bắt đầu lại.');
  }

  try {
    const submitted = await submitIntake({
      session,
      requestId,
      correlationId: correlationId(),
    });
    redirect(`/requests/${submitted.id}`);
  } catch (error) {
    // Log error with correlationId for debugging
    console.error(`Submit intake failed [${correlationId()}]:`, error);
    throw new Error('Không thể gửi yêu cầu. Vui lòng thử lại sau.');
  }
}
