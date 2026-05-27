'use server';

import { redirect } from 'next/navigation';
import type { AppSession } from '@/lib/security/session';
import { createDraftIntake, saveIntakeAnswers, submitIntake } from '@/lib/intake/intake-service';
import { attachIntakeFile } from '@/lib/intake/upload-service';

const demoSession: AppSession = {
  userId: 'demo-customer',
  activeWorkspaceId: 'demo-workspace',
  roles: ['customer'],
};

function correlationId() {
  return `intake-${Date.now()}`;
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function createIntakeDraftAction(formData: FormData) {
  return createDraftIntake({
    session: demoSession,
    matterTypeKey: stringValue(formData, 'matterTypeKey'),
    correlationId: correlationId(),
  });
}

export async function saveIntakeAnswersAction(formData: FormData) {
  const requestId = stringValue(formData, 'requestId');
  const answers = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => key.startsWith('answer.') && typeof value === 'string')
      .map(([key, value]) => [key.slice('answer.'.length), String(value)]),
  );

  return saveIntakeAnswers({
    session: demoSession,
    requestId,
    answers,
    correlationId: correlationId(),
  });
}

export async function attachIntakeFileAction(formData: FormData) {
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('FILE_REQUIRED');

  const uploaded = await attachIntakeFile({
    session: demoSession,
    requestId: stringValue(formData, 'requestId'),
    file,
    correlationId: correlationId(),
  });

  return { filename: uploaded.filename, size: uploaded.size };
}

export async function submitIntakeAction(formData: FormData) {
  const requestId = stringValue(formData, 'requestId');
  const submitted = await submitIntake({
    session: demoSession,
    requestId,
    correlationId: correlationId(),
  });

  redirect(`/requests/${submitted.id}`);
}
