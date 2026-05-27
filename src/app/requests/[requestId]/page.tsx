import { notFound } from 'next/navigation';
import type { RequestStatus } from '@prisma/client';
import { Badge, Card, PageHeader } from '@/app/admin/components/ui';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import type { AppSession } from '@/lib/security/session';

const demoSession: AppSession = {
  userId: 'demo-customer',
  activeWorkspaceId: 'demo-workspace',
  roles: ['customer'],
};

const statusCopy: Record<RequestStatus, { label: string; body: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Đang nhập thông tin', body: 'Hồ sơ đang ở bước nhập thông tin trước khi gửi.', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi yêu cầu', body: 'Chúng tôi đã ghi nhận hồ sơ. Trạng thái sẽ được cập nhật khi chuyên viên tiếp nhận.', tone: 'info' },
  triage: { label: 'Cần chuyên viên phân loại', body: 'Yêu cầu của bạn chưa khớp với nhóm dịch vụ có sẵn. Chuyên viên sẽ phân loại trước khi xử lý tiếp.', tone: 'warning' },
  assigned: { label: 'Đã phân công', body: 'Hồ sơ đã được phân công cho chuyên viên xử lý.', tone: 'info' },
  in_progress: { label: 'Đang xử lý', body: 'Chuyên viên đang xử lý hồ sơ theo quy trình nội bộ.', tone: 'info' },
  pending_review: { label: 'Chờ kiểm tra chất lượng', body: 'Hồ sơ đang chờ reviewer kiểm tra trước khi có đầu ra cuối cùng.', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa nội bộ', body: 'Hồ sơ cần được chuyên viên chỉnh sửa trước khi reviewer kiểm tra lại.', tone: 'warning' },
  approved: { label: 'Đã được reviewer duyệt', body: 'Đầu ra đã qua bước kiểm soát chất lượng nội bộ.', tone: 'accent' },
  delivered: { label: 'Đã giao tài liệu', body: 'Tài liệu đã được giao theo quy trình.', tone: 'outline' },
  closed: { label: 'Đã đóng hồ sơ', body: 'Hồ sơ đã hoàn tất và được đóng.', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', body: 'Hồ sơ đã bị hủy.', tone: 'destructive' },
};

export default async function RequestStatusPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  if (!(await canAccessRequest(demoSession, requestId))) notFound();

  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      title: true,
      status: true,
      vaultFiles: { select: { id: true, filename: true } },
      intakeSubmission: { select: { matterTypeKey: true } },
    },
  });
  if (!request) notFound();

  const status = statusCopy[request.status];

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader title="Đã gửi yêu cầu" description="Trạng thái do hệ thống xử lý cập nhật. Bạn không cần thao tác thêm ở bước này." />

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Mã hồ sơ</p>
            <h1 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{request.id}</h1>
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <p className="text-[16px] leading-[1.5] text-[#475569]">{status.body}</p>
        {request.status === 'triage' ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[16px] leading-[1.5] text-[#B45309]">Cần chuyên viên phân loại</p> : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Thông tin hồ sơ</h2>
        <div className="rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Loại việc</p>
          <p className="text-[16px] leading-[1.5] text-[#0F172A]">{request.title}</p>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Tệp đính kèm</p>
          {request.vaultFiles.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {request.vaultFiles.map((file) => (
                <li key={file.id} className="text-[16px] leading-[1.5] text-[#0F172A]">{file.filename}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[16px] leading-[1.5] text-[#475569]">Chưa có tệp đính kèm.</p>
          )}
        </div>
      </Card>
    </main>
  );
}
