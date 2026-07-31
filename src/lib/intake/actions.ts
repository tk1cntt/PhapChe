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

  if (!(await canAccessRequest(session, requestId))) {
    throw new Error('FORBIDDEN');
  }

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
  const requestId = stringValue(formData, 'requestId');
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('FILE_REQUIRED');

  if (!(await canAccessRequest(session, requestId))) {
    throw new Error('FORBIDDEN');
  }

  const cid = correlationId();
  try {
    const uploaded = await attachIntakeFile({
      session,
      requestId,
      file,
      correlationId: cid,
    });
    return { filename: uploaded.filename, size: uploaded.size };
  } catch (error) {
    if (error instanceof Error && error.message === 'UPLOAD_STORAGE_NOT_CONFIGURED') {
      throw error;
    }
    console.error(`Attach file failed [${cid}]:`, error);
    throw new Error('Không thể tải tệp lên. Vui lòng thử lại sau.');
  }
}

export async function submitIntakeAction(formData: FormData) {
  const session = await requireAppSession();
  const requestId = stringValue(formData, 'requestId');

  if (!requestId) {
    throw new Error('Yêu cầu không hợp lệ. Vui lòng bắt đầu lại.');
  }

  if (!(await canAccessRequest(session, requestId))) {
    throw new Error('FORBIDDEN');
  }

  const cid = correlationId();
  try {
    const submitted = await submitIntake({
      session,
      requestId,
      correlationId: cid,
    });
    redirect(`/requests/${submitted.id}`);
  } catch (error) {
    console.error(`Submit intake failed [${cid}]:`, error);
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

  // Fetch file keys before deletion so they can be cleaned up from storage
  const vaultFiles = await prisma.vaultFile.findMany({
    where: { requestId },
    select: { storageKey: true },
  });

  await prisma.$transaction(async (tx) => {
    const request = await tx.legalRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, createdById: true },
    });

    if (!request) throw new Error('REQUEST_NOT_FOUND');
    if (request.status !== 'draft_intake') throw new Error('NOT_DRAFT');
    if (request.createdById !== session.userId) throw new Error('FORBIDDEN');

    await tx.intakeSubmission.deleteMany({ where: { requestId } });
    await tx.vaultFile.deleteMany({ where: { requestId } });
    await tx.legalRequest.delete({ where: { id: requestId } });
  });

  // Note: vaultFile records are deleted above; storage cleanup of actual files
  // (identified by storageKey) should be handled by a scheduled job or the storage
  // provider's lifecycle policy to avoid blocking the user-facing delete flow.
  // The vaultFiles array containing storageKeys is available for async cleanup.

  redirect('/customer/requests');
}
