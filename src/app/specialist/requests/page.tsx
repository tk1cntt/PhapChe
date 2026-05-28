import Link from 'next/link';
import type { RequestStatus } from '@prisma/client';
import { Badge, Button, Card, PageHeader, Table } from '@/app/admin/components/ui';
import { prisma } from '@/lib/prisma';
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
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export default async function SpecialistRequestsPage() {
  const session = await requireAppSession();

  const requests = await prisma.legalRequest.findMany({
    where: {
      workspaceId: session.activeWorkspaceId ?? '',
      assignedSpecialistId: session.userId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
      intakeSubmission: { select: { matterTypeKey: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <PageHeader title="Yêu cầu được giao" description="Danh sách yêu cầu đã được điều phối cho bạn." />

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Hàng chờ xử lý</h2>
        <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
          Danh sách này được lọc trên máy chủ theo workspace hiện tại và chuyên viên đang đăng nhập.
        </p>
      </Card>

      <Table headers={['Yêu cầu', 'Khách hàng', 'Loại vụ việc', 'Trạng thái', 'Ngày gửi', 'Hành động']}>
        {requests.map((request) => (
          <tr key={request.id} className="hover:bg-[#F1F5F9]">
            <td className="whitespace-nowrap px-4 py-3 text-[16px] font-normal leading-[1.5] text-[#0F172A]">{request.title}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              {request.createdBy.name} · {request.createdBy.email}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">
              {request.intakeSubmission?.matterTypeKey ?? 'Chưa có loại vụ việc'}
            </td>
            <td className="whitespace-nowrap px-4 py-3"><Badge tone={statusLabels[request.status].tone}>{statusLabels[request.status].label}</Badge></td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{formatDate(request.createdAt)}</td>
            <td className="whitespace-nowrap px-4 py-3">
              <Link href={`/specialist/requests/${request.id}`}>
                <Button variant="secondary">Mở chi tiết</Button>
              </Link>
            </td>
          </tr>
        ))}
        {requests.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-[16px] font-normal leading-[1.5] text-[#475569]">
              Chưa có yêu cầu nào được giao cho bạn.
            </td>
          </tr>
        ) : null}
      </Table>
    </main>
  );
}
