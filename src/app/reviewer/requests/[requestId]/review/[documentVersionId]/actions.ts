'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAppSession } from '@/lib/security/session';
import { approveReview, rejectReview } from '@/lib/reviews/review-service';

export type ReviewerActionResult = { ok: boolean; message: string };

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function parseAnswers(
  formData: FormData,
): Array<{ checklistItemId: string; passed: boolean; comment: string | null }> {
  const answers: Array<{ checklistItemId: string; passed: boolean; comment: string | null }> = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('answer_')) continue;
    if (typeof value !== 'string') continue;
    const checklistItemId = key.slice('answer_'.length);
    const passed = value === '1';
    const commentRaw = formData.get(`comment_${checklistItemId}`);
    const comment =
      typeof commentRaw === 'string' && commentRaw.trim().length > 0 ? commentRaw.trim() : null;
    answers.push({ checklistItemId, passed, comment });
  }
  return answers;
}

function mapReviewError(err: unknown): ReviewerActionResult {
  const code = err instanceof Error ? err.message : 'UNKNOWN';
  switch (code) {
    case 'FORBIDDEN':
      return { ok: false, message: 'Bạn không có quyền thực hiện thao tác này.' };
    case 'DOCUMENT_VERSION_NOT_FOUND':
      return { ok: false, message: 'Không tìm thấy phiên bản tài liệu.' };
    case 'REVIEW_NOT_FOUND':
      return { ok: false, message: 'Phiên duyệt chưa được khởi tạo.' };
    case 'REVIEW_NOT_ACTIVE':
      return { ok: false, message: 'Phiên duyệt đã đóng, không thể cập nhật.' };
    case 'CHECKLIST_NOT_COMPLETE':
      return {
        ok: false,
        message: 'Vui lòng hoàn thành tất cả mục bắt buộc trong checklist trước khi duyệt.',
      };
    case 'REJECT_COMMENT_REQUIRED':
      return { ok: false, message: 'Vui lòng nhập nhận xét cho các mục chưa đạt.' };
    default:
      return { ok: false, message: 'Không thể lưu đánh giá. Vui lòng thử lại hoặc liên hệ quản trị viên.' };
  }
}

export async function approveReviewAction(formData: FormData): Promise<ReviewerActionResult> {
  const reviewId = stringValue(formData, 'reviewId');
  if (!reviewId) return { ok: false, message: 'Thiếu mã phiên duyệt.' };
  const answers = parseAnswers(formData);
  const session = await requireAppSession();
  try {
    await approveReview({ session, reviewId, answers });
    revalidatePath('/reviewer/requests');
    revalidatePath(
      `/reviewer/requests/${stringValue(formData, 'requestId')}/review/${stringValue(formData, 'documentVersionId')}`,
    );
  } catch (err) {
    return mapReviewError(err);
  }
  redirect('/reviewer/requests?notice=approved');
}

export async function rejectReviewAction(formData: FormData): Promise<ReviewerActionResult> {
  const reviewId = stringValue(formData, 'reviewId');
  if (!reviewId) return { ok: false, message: 'Thiếu mã phiên duyệt.' };
  const generalComment = stringValue(formData, 'generalComment');
  if (generalComment.length === 0) {
    return { ok: false, message: 'Vui lòng nhập nhận xét chung trước khi yêu cầu chỉnh sửa.' };
  }
  const answers = parseAnswers(formData);
  const session = await requireAppSession();
  try {
    await rejectReview({ session, reviewId, answers, generalComment });
    revalidatePath('/reviewer/requests');
    revalidatePath(
      `/reviewer/requests/${stringValue(formData, 'requestId')}/review/${stringValue(formData, 'documentVersionId')}`,
    );
  } catch (err) {
    return mapReviewError(err);
  }
  redirect('/reviewer/requests?notice=revision');
}
