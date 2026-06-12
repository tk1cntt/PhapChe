'use server';

import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import { generateDraft as generateDraftService } from '@/lib/documents/draft-service';
import { submitForReview as submitForReviewService } from '@/lib/documents/draft-service';
import { closeDeliveredRequest, markRequestDelivered } from '@/lib/delivery/delivery-service';

export type SpecialistRequestActionResult = {
  ok: boolean;
  message: string;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function generateDraftAction(input: {
  requestId: string;
  templateId: string;
  variables: Record<string, unknown>;
}) {
  const session = await requireAppSession();
  return generateDraftService({
    session,
    requestId: input.requestId,
    templateId: input.templateId,
    variables: input.variables,
  });
}

export async function submitForReviewAction(input: {
  documentVersionId: string;
  reason?: string;
}) {
  const session = await requireAppSession();
  return submitForReviewService({
    session,
    documentVersionId: input.documentVersionId,
    reason: input.reason,
  });
}

const deliverySuccessMessage = 'Đã đánh dấu hồ sơ là đã giao.';
const deliveryErrorMessage = 'Không thể giao hồ sơ. Vui lòng kiểm tra tài liệu cuối cùng và quyền xử lý.';
const closeReasonMessage = 'Nhập lý do đóng hồ sơ trước khi lưu.';
const closeSuccessMessage = 'Đã đóng hồ sơ.';
const closeErrorMessage = 'Không thể đóng hồ sơ. Vui lòng kiểm tra trạng thái và quyền xử lý.';

export async function markDeliveredAction(formData: FormData): Promise<SpecialistRequestActionResult> {
  const requestId = stringValue(formData, 'requestId');

  try {
    const session = await requireAppSession();
    await markRequestDelivered({ session, requestId });
    revalidatePath(`/specialist/requests/${requestId}`);
    return { ok: true, message: deliverySuccessMessage };
  } catch {
    return { ok: false, message: deliveryErrorMessage };
  }
}

export async function closeDeliveredAction(formData: FormData): Promise<SpecialistRequestActionResult> {
  const requestId = stringValue(formData, 'requestId');
  const reason = stringValue(formData, 'reason');
  if (!reason) {
    return { ok: false, message: closeReasonMessage };
  }

  try {
    const session = await requireAppSession();
    await closeDeliveredRequest({ session, requestId, reason });
    revalidatePath(`/specialist/requests/${requestId}`);
    return { ok: true, message: closeSuccessMessage };
  } catch {
    return { ok: false, message: closeErrorMessage };
  }
}
