import type { AssignmentKind, RequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getRoutingSuggestions, listRoutingCapabilities, listRoutingMatterTypes, requireRoutingAdmin } from '@/lib/routing/routing-service';
import { requireAppSession } from '@/lib/security/session';
import { AdminShell } from '../components/admin-shell';
import { Badge, Button, Card, PageHeader, Table } from '../components/ui';
import { assignRequestAction, saveCapabilityAction, saveMatterTypeAction } from './actions';

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

const kindLabels: Record<AssignmentKind, string> = {
  specialist: 'Chuyên viên',
  reviewer: 'Reviewer',
};

const routingHeaders = [
  'Yêu cầu',
  'Khách hàng',
  'Loại vụ việc',
  'Trạng thái',
  'Chuyên viên hiện tại',
  'Reviewer hiện tại',
  'Gợi ý chuyên viên',
  'Gợi ý reviewer',
  'Hành động',
];

type Suggestion = { userId: string; name: string; email: string; reason: string };

async function suggestionsFor(requestId: string, workspaceId: string) {
  try {
    return await getRoutingSuggestions({ requestId, workspaceId });
  } catch {
    return { specialists: [] as Suggestion[], reviewers: [] as Suggestion[] };
  }
}

function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  if (suggestions.length === 0) {
    return <p className="text-[14px] font-normal leading-[1.4] text-[#475569]">Chưa có người phù hợp theo năng lực đã cấu hình. Hãy cập nhật năng lực hoặc chọn người xử lý thủ công nếu được phép.</p>;
  }

  return (
    <ul className="space-y-2">
      {suggestions.map((suggestion) => (
        <li key={suggestion.userId} className="space-y-1">
          <p className="text-[14px] font-semibold leading-[1.4] text-[#0F172A]">{suggestion.name || suggestion.email}</p>
          <p className="text-[14px] font-normal leading-[1.4] text-[#475569]">{suggestion.email}</p>
          <p className="text-[14px] font-normal leading-[1.4] text-[#475569]">Phù hợp vai trò và năng lực với loại vụ việc này.</p>
        </li>
      ))}
    </ul>
  );
}

function AssignmentForm({ requestId, kind, suggestions, assigned }: { requestId: string; kind: AssignmentKind; suggestions: Suggestion[]; assigned: boolean }) {
  const label = kindLabels[kind];
  return (
    <form action={assignRequestAction} className="min-w-64 space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="kind" value={kind} />
      <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
        <span>Chọn {label.toLowerCase()}</span>
        <select name="assigneeId" required defaultValue="" className="min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2">
          <option value="">Chọn {label.toLowerCase()} trước khi lưu phân công.</option>
          {suggestions.map((suggestion) => (
            <option key={suggestion.userId} value={suggestion.userId}>{suggestion.name || suggestion.email}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
        <span>Lý do phân công</span>
        <textarea name="reason" required placeholder="Ví dụ: Phù hợp loại vụ việc và đang phụ trách nhóm hợp đồng lao động" className="min-h-24 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
      </label>
      <Button type="submit">{assigned ? `Cập nhật ${label.toLowerCase()}` : `Phân công ${label.toLowerCase()}`}</Button>
    </form>
  );
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

  return (
    <AdminShell>
      <PageHeader title="Điều phối yêu cầu pháp lý" description="Xem yêu cầu đã gửi hoặc cần triage, kiểm tra gợi ý phù hợp và phân công người xử lý." />

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Hàng chờ điều phối</h2>
        {requests.length === 0 ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
            <h3 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Chưa có yêu cầu cần điều phối</h3>
            <p className="mt-2 text-[16px] font-normal leading-[1.5] text-[#475569]">Khi khách hàng gửi yêu cầu mới hoặc yêu cầu cần triage, hồ sơ sẽ xuất hiện tại đây để điều phối viên phân công.</p>
          </div>
        ) : (
          <Table headers={routingHeaders}>
            {requests.map((request, index) => {
              const suggestions = suggestionRows[index] || { specialists: [], reviewers: [] };
              return (
                <tr key={request.id} className="align-top hover:bg-[#F1F5F9]">
                  <td className="whitespace-nowrap px-4 py-3 text-[16px] font-normal leading-[1.5]">{request.title}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{request.createdBy.name || request.createdBy.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{request.intakeSubmission?.matterType.label || request.intakeSubmission?.matterTypeKey || 'Chưa phân loại'}</td>
                  <td className="whitespace-nowrap px-4 py-3"><Badge tone={statusLabels[request.status].tone}>{statusLabels[request.status].label}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{request.assignedSpecialist?.name || request.assignedSpecialist?.email || 'Chưa phân công'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{request.assignedReviewer?.name || request.assignedReviewer?.email || 'Chưa phân công'}</td>
                  <td className="px-4 py-3"><SuggestionList suggestions={suggestions.specialists} /></td>
                  <td className="px-4 py-3"><SuggestionList suggestions={suggestions.reviewers} /></td>
                  <td className="space-y-4 px-4 py-3">
                    <AssignmentForm requestId={request.id} kind="specialist" suggestions={suggestions.specialists} assigned={Boolean(request.assignedSpecialist)} />
                    <AssignmentForm requestId={request.id} kind="reviewer" suggestions={suggestions.reviewers} assigned={Boolean(request.assignedReviewer)} />
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Loại vụ việc</h2>
        <form action={saveMatterTypeAction} className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Tên loại vụ việc</span><input name="label" required className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Mã loại vụ việc</span><input name="key" required className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4] md:col-span-2"><span>Mô tả</span><textarea name="description" className="min-h-24 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Trạng thái</span><select name="isActive" defaultValue="true" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="true">Đang dùng</option><option value="false">Tạm ẩn</option></select></label>
          <div className="flex items-end"><Button type="submit">Lưu loại vụ việc</Button></div>
        </form>
        <Table headers={['Tên loại vụ việc', 'Mã loại vụ việc', 'Mô tả', 'Trạng thái']}>
          {matterTypes.map((matterType) => (
            <tr key={matterType.key} className="hover:bg-[#F1F5F9]"><td className="px-4 py-3 text-[16px] font-normal leading-[1.5]">{matterType.label}</td><td className="px-4 py-3 text-[14px] font-normal leading-[1.4]">{matterType.key}</td><td className="px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{matterType.description}</td><td className="px-4 py-3"><Badge tone={matterType.isActive ? 'accent' : 'neutral'}>{matterType.isActive ? 'Đang dùng' : 'Tạm ẩn'}</Badge></td></tr>
          ))}
        </Table>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Năng lực xử lý</h2>
        <form action={saveCapabilityAction} className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Người dùng</span><select name="userId" required defaultValue="" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="">Chọn người xử lý</option>{members.map((member) => <option key={`${member.role}-${member.userId}`} value={member.userId}>{member.user.name || member.user.email}</option>)}</select></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Vai trò năng lực</span><select name="kind" defaultValue="specialist" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="specialist">Chuyên viên</option><option value="reviewer">Reviewer</option></select></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Loại vụ việc</span><select name="matterTypeKey" required defaultValue="" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="">Chọn loại vụ việc</option>{matterTypes.map((matterType) => <option key={matterType.key} value={matterType.key}>{matterType.label}</option>)}</select></label>
          <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Trạng thái</span><select name="isActive" defaultValue="true" className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="true">Đang dùng</option><option value="false">Tạm ẩn</option></select></label>
          <div className="flex items-end"><Button type="submit">Lưu năng lực</Button></div>
        </form>
        <Table headers={['Người dùng', 'Vai trò năng lực', 'Loại vụ việc', 'Trạng thái']}>
          {capabilities.map((capability) => (
            <tr key={`${capability.userId}-${capability.matterTypeKey}-${capability.kind}`} className="hover:bg-[#F1F5F9]"><td className="px-4 py-3 text-[16px] font-normal leading-[1.5]">{capability.user.name || capability.user.email}</td><td className="px-4 py-3"><Badge tone={capability.kind === 'specialist' ? 'accent' : 'info'}>{kindLabels[capability.kind]}</Badge></td><td className="px-4 py-3 text-[14px] font-normal leading-[1.4]">{capability.matterType.label}</td><td className="px-4 py-3"><Badge tone={capability.isActive ? 'accent' : 'neutral'}>{capability.isActive ? 'Đang dùng' : 'Tạm ẩn'}</Badge></td></tr>
          ))}
        </Table>
      </Card>
    </AdminShell>
  );
}
