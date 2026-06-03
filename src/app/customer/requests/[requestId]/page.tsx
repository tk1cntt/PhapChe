import { notFound } from 'next/navigation';
import type { RequestStatus } from '@prisma/client';
import { Badge, Button, Card, PageHeader } from '@/app/admin/components/ui';
import { getCustomerDeliveryRequest } from '@/lib/delivery/delivery-service';
import { requestVaultFileAccess } from '@/lib/documents/vault-service';
import { requireAppSession } from '@/lib/security/session';

const statusLabels: Record<RequestStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Nháp tiếp nhận', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi tiếp nhận', tone: 'info' },
  triage: { label: 'Đang phân loại', tone: 'warning' },
  assigned: { label: 'Đã phân công', tone: 'info' },
  in_progress: { label: 'Đang xử lý', tone: 'info' },
  pending_review: { label: 'Chờ kiểm tra chất lượng', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa nội bộ', tone: 'warning' },
  approved: { label: 'Đã được duyệt', tone: 'accent' },
  delivered: { label: 'Đã giao tài liệu', tone: 'outline' },
  closed: { label: 'Đã đóng hồ sơ', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'destructive' },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default async function CustomerRequestDeliveryPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const session = await requireAppSession();
  let request;

  try {
    request = await getCustomerDeliveryRequest(session, requestId);
  } catch (error) {
    if (error instanceof Error && (error.message === 'FORBIDDEN' || error.message === 'REQUEST_NOT_FOUND')) notFound();
    throw error;
  }

  const status = statusLabels[request.status];

  const downloadLinks = await Promise.all(
    request.documents.map(async (document) => {
      try {
        if (document.vaultFileId) {
          const access = await requestVaultFileAccess(session, document.vaultFileId);
          return access.accessUrl;
        }
      } catch {
        // Fall through to bare path
      }
      return `/api/vault/${document.vaultFileId}/download`;
    }),
  );

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader title="Yêu cầu pháp lý" description="Tài liệu cuối cùng đã qua kiểm soát chất lượng sẽ hiển thị tại đây." />

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Hồ sơ</p>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{request.title}</h1>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Loại vụ việc</p>
            <p className="mt-2 text-[16px] leading-[1.5] text-[#0F172A]">{request.matterTypeKey ?? 'Chưa có loại vụ việc'}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Ngày tạo</p>
            <p className="mt-2 text-[16px] leading-[1.5] text-[#0F172A]">{formatDate(request.createdAt)}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Tài liệu cuối cùng</h2>
        {request.documents.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <h3 className="text-[16px] font-semibold leading-[1.4] text-[#0F172A]">Chưa có tài liệu</h3>
            <p className="mt-2 text-[16px] leading-[1.5] text-[#475569]">Tài liệu cuối cùng chưa sẵn sàng. Vui lòng chờ thông báo từ chúng tôi.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {request.documents.map((document, idx) => (
              <li key={document.documentVersionId} className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[16px] font-semibold leading-[1.4] text-[#0F172A]">{document.filename ?? document.documentTitle}</p>
                  <p className="mt-1 text-[14px] leading-[1.4] text-[#475569]">Phiên bản mẫu {document.templateVersion}</p>
                  <p className="mt-1 text-[14px] leading-[1.4] text-[#475569]">Ngày tạo: {formatDate(document.createdAt)}</p>
                </div>
                <a href={downloadLinks[idx]}>
                  <Button>Tải xuống</Button>
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[14px] leading-[1.4] text-[#475569]">Liên kết tải xuống có hiệu lực trong 15 phút.</p>
      </Card>
    </main>
  );
}
