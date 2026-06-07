import type { AssignmentKind, RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getRoutingSuggestions, listRoutingCapabilities, listRoutingMatterTypes, requireRoutingAdmin } from '@/lib/routing/routing-service';
import { requireAppSession } from '@/lib/security/session';
import { Tag, Button, Card, Typography, Flex } from 'antd';
import { assignRequestAction, saveCapabilityAction, saveMatterTypeAction } from './actions';
import { RoutingRequestsTable, RoutingMatterTypesTable, RoutingCapabilitiesTable } from './AdminRoutingTables';

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

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

const kindLabels: Record<AssignmentKind, string> = {
  specialist: 'Chuyên viên',
  reviewer: 'Reviewer',
};

type Suggestion = { userId: string; name: string; email: string };

async function suggestionsFor(requestId: string, workspaceId: string) {
  try {
    return await getRoutingSuggestions({ requestId, workspaceId });
  } catch {
    return { specialists: [] as Suggestion[], reviewers: [] as Suggestion[] };
  }
}

export default async function RoutingPage() {
  const session = await requireAppSession();
  const workspaceId = session.activeWorkspaceId || '';
  await requireRoutingAdmin(workspaceId, session.userId);

  const [requests, matterTypes, capabilities, members] = await Promise.all([
    prisma.legalRequest.findMany({
      where: { workspaceId, status: { in: ['intake_submitted', 'triage', 'assigned'] } },
      select: {
        id: true,
        title: true,
        status: true,
        createdBy: { select: { name: true, email: true } },
        assignedSpecialist: { select: { name: true, email: true } },
        assignedReviewer: { select: { name: true, email: true } },
        intakeSubmission: { select: { matterTypeKey: true, matterType: { select: { label: true } } } },
      },
      orderBy: [{ updatedAt: 'desc' }],
    }),
    listRoutingMatterTypes(workspaceId),
    listRoutingCapabilities(workspaceId),
    prisma.workspaceMembership.findMany({
      where: { workspaceId, role: { in: ['specialist', 'reviewer'] }, isActive: true, user: { isActive: true } },
      select: { userId: true, role: true, user: { select: { name: true, email: true } } },
      orderBy: [{ role: 'asc' }, { user: { name: 'asc' } }],
    }),
  ]);
  const suggestionRows = await Promise.all(requests.map((request) => suggestionsFor(request.id, workspaceId)));

  // Serialize for client component
  const serializedRequests = requests.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    createdBy: r.createdBy,
    assignedSpecialist: r.assignedSpecialist,
    assignedReviewer: r.assignedReviewer,
    intakeSubmission: r.intakeSubmission,
  }));

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Điều phối yêu cầu pháp lý
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Xem yêu cầu đã gửi hoặc cần triage, kiểm tra gợi ý phù hợp và phân công người xử lý.
        </Typography.Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Hàng chờ điều phối</h2>
        {requests.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
            <h3 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Chưa có yêu cầu cần điều phối</h3>
            <p className="mt-2 text-[16px] font-normal leading-[1.5] text-[#475569]">Khi khách hàng gửi yêu cầu mới hoặc yêu cầu cần triage, hồ sơ sẽ xuất hiện tại đây để điều phối viên phân công.</p>
          </div>
        ) : (
          <RoutingRequestsTable requests={serializedRequests} suggestionRows={suggestionRows} />
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Loại vụ việc</h2>
        <form action={saveMatterTypeAction} className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Tên loại vụ việc</span><input name="label" required className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Mã loại vụ việc</span><input name="key" required className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4] md:col-span-2"><span>Mô tả</span><textarea name="description" className="min-h-24 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Trạng thái</span><select name="isActive" defaultValue="true" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="true">Đang dùng</option><option value="false">Tạm ẩn</option></select></label>
          <div className="flex items-end"><Button htmlType="submit">Lưu loại vụ việc</Button></div>
        </form>
        <RoutingMatterTypesTable matterTypes={matterTypes} />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Năng lực xử lý</h2>
        <form action={saveCapabilityAction} className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Người dùng</span><select name="userId" required defaultValue="" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="">Chọn người xử lý</option>{members.map((member) => <option key={`${member.role}-${member.userId}`} value={member.userId}>{member.user.name || member.user.email}</option>)}</select></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Vai trò năng lực</span><select name="kind" defaultValue="specialist" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="specialist">Chuyên viên</option><option value="reviewer">Reviewer</option></select></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Loại vụ việc</span><select name="matterTypeKey" required defaultValue="" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="">Chọn loại vụ việc</option>{matterTypes.map((matterType) => <option key={matterType.key} value={matterType.key}>{matterType.label}</option>)}</select></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Trạng thái</span><select name="isActive" defaultValue="true" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="true">Đang dùng</option><option value="false">Tạm ẩn</option></select></label>
          <div className="flex items-end"><Button htmlType="submit">Lưu năng lực</Button></div>
        </form>
        <RoutingCapabilitiesTable capabilities={capabilities} />
      </Card>
    </>
  );
}
