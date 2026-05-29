'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button } from '@/app/admin/components/ui';
import { submitForReviewAction } from '../actions';

type VersionStatus = 'draft' | 'submitted_for_review' | 'final';

type DocumentVersion = {
  id: string;
  templateId: string;
  templateVersion: number;
  status: VersionStatus;
  generatedContent: string;
  createdAt: Date;
  template: { label: string; version: number };
};

type Props = {
  documentVersions: DocumentVersion[];
  requestId: string;
  requestStatus: string;
};

const statusConfig: Record<VersionStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'accent' }> = {
  draft: { label: 'Nháp', tone: 'neutral' },
  submitted_for_review: { label: 'Đang chờ kiểm tra', tone: 'warning' },
  final: { label: 'Hoàn thành', tone: 'accent' },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

export default function DocumentVersionsList({ documentVersions, requestId, requestStatus }: Props) {
  const router = useRouter();
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmingVersionId, setConfirmingVersionId] = useState<string | null>(null);

  async function handleSubmitForReview(documentVersionId: string) {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await submitForReviewAction({ documentVersionId });
      setSuccess('Đã gửi phiên bản để kiểm tra');
      setConfirmingVersionId(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi kiểm tra';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {documentVersions.length === 0 ? (
        <p className="text-[14px] leading-[1.4] text-[#475569]">Chưa có phiên bản tài liệu nào.</p>
      ) : (
        <ul className="space-y-3">
          {documentVersions.map((version) => {
            const statusInfo = statusConfig[version.status];
            const isExpanded = expandedVersionId === version.id;
            const isConfirming = confirmingVersionId === version.id;
            const canSubmitForReview = version.status === 'draft' && requestStatus === 'in_progress';

            return (
              <li key={version.id} className="rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[16px] font-semibold leading-[1.5] text-[#0F172A]">
                      {version.template.label} (v{version.templateVersion})
                    </p>
                    <p className="mt-1 text-[14px] leading-[1.4] text-[#475569]">
                      Ngày tạo: {formatDate(version.createdAt)}
                    </p>
                  </div>
                  <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setExpandedVersionId(isExpanded ? null : version.id)}
                  >
                    {isExpanded ? 'Ẩn nội dung' : 'Xem nội dung'}
                  </Button>

                  {canSubmitForReview && (
                    <>
                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] text-[#475569]">Gửi phiên bản để kiểm tra?</span>
                          <Button
                            variant="primary"
                            disabled={isSubmitting}
                            onClick={() => handleSubmitForReview(version.id)}
                          >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi kiểm tra'}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setConfirmingVersionId(null)}
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmingVersionId(version.id)}
                        >
                          Gửi kiểm tra
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <pre className="whitespace-pre-wrap text-[14px] leading-[1.5] text-[#0F172A]">
                      {version.generatedContent}
                    </pre>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-[14px] text-red-600">{error}</p>}
      {success && <p className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-[14px] text-[#0F766E]">{success}</p>}
    </div>
  );
}
