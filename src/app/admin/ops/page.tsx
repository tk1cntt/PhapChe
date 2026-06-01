import Link from 'next/link';
import type { OpsRequestRowDto } from '@/lib/ops/ops-service';
import { getOpsDashboard, parseOpsFilters } from '@/lib/ops/ops-service';

type RequestStatus = OpsRequestRowDto['status'];
import { requireAppSession } from '@/lib/security/session';
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

const requestHeaders = ['Mã hồ sơ', 'Khách hàng / Workspace', 'Matter type', 'Trạng thái', 'Specialist', 'Reviewer', 'Tuổi hồ sơ', 'Tuổi trạng thái hiện tại', 'Thao tác'];
const workloadHeaders = ['Người phụ trách', 'Vai trò', 'Active requests', 'Pending review', 'Revision required', 'Oldest active age'];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatAge(days: number) {
  if (days <= 0) return 'Vừa cập nhật';
  return `${days} ngày`;
}

function personLabel(name: string | null | undefined, email?: string | null) {
  return name || email || 'Chưa phân công';
}

function selected(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
      <h3 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{title}</h3>
      <p className="mt-2 text-[16px] font-normal leading-[1.5] text-[#475569]">{body}</p>
    </div>
  );
}

async function OpsPage({ searchParams }: { searchParams: SearchParams }) {
  const rawSearchParams = await searchParams;
  const session = await requireAppSession();
  const filters = parseOpsFilters(rawSearchParams);

  try {
    const dashboard = await getOpsDashboard(session, filters);
    const hasData = dashboard.total > 0 || dashboard.requests.length > 0 || dashboard.workload.length > 0;

    return (
      <AdminShell>
        <PageHeader title="Vận hành" description="Theo dõi trạng thái hồ sơ, phân bổ workload, mốc SLA cơ bản và timeline audit an toàn." />

        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Tổng quan vận hành</h2>
          {!hasData ? (
            <EmptyState title="Chưa có dữ liệu vận hành" body="Khi hồ sơ phát sinh, số lượng theo trạng thái, workload và aging sẽ hiển thị tại đây." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Tổng hồ sơ</p><p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.total}</p><p className="mt-1 text-[14px] font-normal leading-[1.4] text-[#475569]">Hồ sơ theo bộ lọc hiện tại.</p></div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Theo trạng thái</p><div className="mt-2 flex flex-wrap gap-2">{dashboard.byStatus.map((row) => <Badge key={row.status} tone={statusLabels[row.status].tone}>{statusLabels[row.status].label}: {row.count}</Badge>)}</div></div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Đang chờ review</p><p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.pendingReview}</p><p className="mt-1 text-[14px] font-normal leading-[1.4] text-[#475569]">Hồ sơ ở trạng thái chờ review.</p></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-[14px] font-semibold leading-[1.4] text-[#B45309]">Cần chú ý theo aging</p><p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.olderThanSevenDays}</p><p className="mt-1 text-[14px] font-normal leading-[1.4] text-[#475569]">Hồ sơ chưa đóng có tuổi tạo trên 7 ngày.</p></div>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Bộ lọc hồ sơ</h2>
          <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Khách hàng / Workspace</span><input name="workspaceId" defaultValue={selected(rawSearchParams, 'workspaceId')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Matter type</span><input name="matterTypeKey" defaultValue={selected(rawSearchParams, 'matterTypeKey')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Trạng thái</span><select name="status" defaultValue={selected(rawSearchParams, 'status')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2"><option value="">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, info]) => <option key={value} value={value}>{info.label}</option>)}</select></label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Specialist</span><input name="assignedSpecialistId" defaultValue={selected(rawSearchParams, 'assignedSpecialistId')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Reviewer</span><input name="assignedReviewerId" defaultValue={selected(rawSearchParams, 'assignedReviewerId')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Từ ngày</span><input type="date" name="dateFrom" defaultValue={selected(rawSearchParams, 'dateFrom')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]"><span>Đến ngày</span><input type="date" name="dateTo" defaultValue={selected(rawSearchParams, 'dateTo')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" /></label>
            <div className="flex items-end gap-3"><Button type="submit">Áp dụng bộ lọc</Button><Link href="/admin/ops" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-[14px] font-semibold leading-[1.4] text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]">Xóa bộ lọc</Link></div>
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Danh sách hồ sơ</h2>
          {dashboard.requests.length === 0 ? <EmptyState title="Không có hồ sơ phù hợp" body="Thử điều chỉnh khách hàng, trạng thái, người phụ trách hoặc khoảng ngày." /> : (
            <Table headers={requestHeaders}>{dashboard.requests.map((request) => <tr key={request.id} className="hover:bg-[#F1F5F9]"><td className="whitespace-nowrap px-4 py-3 text-[16px] font-normal leading-[1.5]">{request.title || request.id}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{personLabel(request.customerName, request.customerEmail)} / {request.workspaceId}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{request.matterTypeLabel || request.matterTypeKey || 'Chưa phân loại'}</td><td className="whitespace-nowrap px-4 py-3"><Badge tone={statusLabels[request.status].tone}>{statusLabels[request.status].label}</Badge></td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{personLabel(request.assignedSpecialistName)}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{personLabel(request.assignedReviewerName)}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{formatAge(Math.max(0, Math.floor((Date.now() - request.createdAt.getTime()) / 86400000)))}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{formatAge(request.currentStatusAgeDays)}</td><td className="whitespace-nowrap px-4 py-3"><Link href={`/admin/ops/${request.id}`} className="text-[14px] font-semibold leading-[1.4] text-[#0F766E] hover:underline">Xem timeline</Link></td></tr>)}</Table>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Workload chuyên viên và reviewer</h2>
          {dashboard.workload.length === 0 ? <EmptyState title="Chưa có dữ liệu vận hành" body="Khi hồ sơ phát sinh, số lượng theo trạng thái, workload và aging sẽ hiển thị tại đây." /> : (
            <Table headers={workloadHeaders}>{dashboard.workload.map((row) => <tr key={`${row.kind}-${row.userId}`} className="hover:bg-[#F1F5F9]"><td className="whitespace-nowrap px-4 py-3 text-[16px] font-normal leading-[1.5]">{personLabel(row.name, row.email)}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{row.kind === 'specialist' ? 'Specialist' : 'Reviewer'}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{row.activeCount}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{row.byStatus.find((item) => item.status === 'pending_review')?.count ?? 0}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{row.byStatus.find((item) => item.status === 'revision_required')?.count ?? 0}</td><td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{formatAge(row.oldestActiveAgeDays)}</td></tr>)}</Table>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Mốc SLA cơ bản</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Pending review</p><p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.pendingReview}</p></div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"><p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Revision required</p><p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.revisionRequired}</p></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-[14px] font-semibold leading-[1.4] text-[#B45309]">Cần chú ý</p><p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.olderThanSevenDays}</p></div>
          </div>
        </Card>
      </AdminShell>
    );
  } catch {
    return (
      <AdminShell>
        <PageHeader title="Vận hành" description="Theo dõi trạng thái hồ sơ, phân bổ workload, mốc SLA cơ bản và timeline audit an toàn." />
        <Card><p className="text-[16px] font-normal leading-[1.5] text-[#B91C1C]">Không thể tải dữ liệu vận hành. Vui lòng kiểm tra bộ lọc và thử lại.</p></Card>
      </AdminShell>
    );
  }
}

export { OpsPage as default };
