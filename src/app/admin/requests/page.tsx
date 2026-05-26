import type { RequestStatus } from '@prisma/client';
import { getAllowedTransitions } from '@/lib/workflow/request-workflow';
import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';

const statusLabels: Record<RequestStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Nháp tiếp nhận', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi tiếp nhận', tone: 'info' },
  triage: { label: 'Đang phân loại', tone: 'warning' },
  assigned: { label: 'Đã phân công', tone: 'info' },
  in_progress: { label: 'Đang xử lý', tone: 'info' },
  pending_review: { label: 'Chờ review', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa', tone: 'destructive' },
  approved: { label: 'Đã duyệt', tone: 'accent' },
  delivered: { label: 'Đã giao', tone: 'outline' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'destructive' },
};

const sampleStatus: RequestStatus = 'pending_review';
const requests = [
  { code: 'REQ-001', workspace: 'Công ty An Phát', status: sampleStatus },
  { code: 'REQ-002', workspace: 'Công ty Minh Khang', status: 'triage' as RequestStatus },
];

export default function RequestsPage() {
  const allowedTransitions = getAllowedTransitions(sampleStatus);

  return (
    <AdminShell>
      <PageHeader
        title="Hồ sơ yêu cầu"
        description="Trạng thái hồ sơ được hiển thị từ backend-owned workflow, không chỉnh sửa trực tiếp bằng raw dropdown."
        action={<Button>Tạo hồ sơ yêu cầu</Button>}
      />

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2]">Chuyển trạng thái hợp lệ</h2>
        <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
          Trạng thái này chỉ có thể thay đổi qua quy trình hợp lệ trên máy chủ.
        </p>
        <div className="flex flex-wrap gap-2">
          {allowedTransitions.map((transition) => (
            <Button key={transition} variant={transition === 'revision_required' ? 'destructive' : 'secondary'}>
              Chuyển sang {statusLabels[transition].label}
            </Button>
          ))}
        </div>
        <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
          <span>Lý do chuyển trạng thái</span>
          <textarea className="min-h-24 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
        </label>
      </Card>

      <Table headers={['Mã hồ sơ', 'Workspace', 'Trạng thái', 'Thao tác hợp lệ']}>
        {requests.map((request) => (
          <tr key={request.code} className="hover:bg-[#F1F5F9]">
            <td className="whitespace-nowrap px-4 py-3 text-[16px] font-normal leading-[1.5]">{request.code}</td>
            <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{request.workspace}</td>
            <td className="whitespace-nowrap px-4 py-3"><Badge tone={statusLabels[request.status].tone}>{statusLabels[request.status].label}</Badge></td>
            <td className="px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">Dùng getAllowedTransitions(status) trước khi render nút chuyển trạng thái.</td>
          </tr>
        ))}
      </Table>
    </AdminShell>
  );
}
