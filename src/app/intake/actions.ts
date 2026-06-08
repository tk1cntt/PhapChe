'use server';

import { redirect } from 'next/navigation';
import { createDraftIntake, saveIntakeAnswers, submitIntake } from '@/lib/intake/intake-service';
import { attachIntakeFile } from '@/lib/intake/upload-service';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';

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

  try {
    const uploaded = await attachIntakeFile({
      session,
      requestId: stringValue(formData, 'requestId'),
      file,
      correlationId: correlationId(),
    });
    return { filename: uploaded.filename, size: uploaded.size };
  } catch (error) {
    if (error instanceof Error && error.message === 'UPLOAD_STORAGE_NOT_CONFIGURED') {
      throw error;
    }
    console.error(`Attach file failed [${correlationId()}]:`, error);
    throw new Error('Không thể tải tệp lên. Vui lòng thử lại sau.');
  }
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
    console.error(`Submit intake failed [${correlationId()}]:`, error);
    throw new Error('Không thể gửi yêu cầu. Vui lòng thử lại sau.');
  }
}

export async function deleteDraftIntakeAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');

  if (!requestId) {
    throw new Error('Yêu cầu không hợp lệ.');
  }

  if (!(await canAccessRequest(session, requestId))) {
    throw new Error('FORBIDDEN');
  }

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, createdById: true },
  });

  if (!request) throw new Error('REQUEST_NOT_FOUND');
  if (request.status !== 'draft_intake') throw new Error('NOT_DRAFT');
  if (request.createdById !== session.userId) throw new Error('FORBIDDEN');

  await prisma.$transaction([
    prisma.intakeSubmission.deleteMany({ where: { requestId } }),
    prisma.vaultFile.deleteMany({ where: { requestId } }),
    prisma.legalRequest.delete({ where: { id: requestId } }),
  ]);

  redirect('/intake');
}
