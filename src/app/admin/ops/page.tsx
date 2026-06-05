import Link from 'next/link';
import type { OpsRequestRowDto, OpsWorkloadRowDto } from '@/lib/ops/ops-service';
import { getOpsDashboard, parseOpsFilters } from '@/lib/ops/ops-service';
import { requireAppSession } from '@/lib/security/session';
import { Tag, Button, Card, Table, Typography, Flex } from 'antd';

type RequestStatus = OpsRequestRowDto['status'];

const { Text, Title } = Typography;

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
    <Card>
      <Title level={4}>{title}</Title>
      <Text type="secondary">{body}</Text>
    </Card>
  );
}

async function OpsPage({ searchParams }: { searchParams: SearchParams }) {
  const rawSearchParams = await searchParams;
  const session = await requireAppSession();
  const filters = parseOpsFilters(rawSearchParams);

  try {
    const dashboard = await getOpsDashboard(session, filters);
    const hasData = dashboard.total > 0 || dashboard.requests.length > 0 || dashboard.workload.length > 0;

    const requestColumns = [
      {
        title: 'Mã hồ sơ',
        key: 'title',
        render: (_: unknown, record: OpsRequestRowDto) => record.title || record.id,
        width: 200,
      },
      {
        title: 'Khách hàng / Workspace',
        key: 'customer',
        render: (_: unknown, record: OpsRequestRowDto) =>
          `${personLabel(record.customerName, record.customerEmail)} / ${record.workspaceId}`,
        width: 250,
      },
      {
        title: 'Matter type',
        key: 'matterType',
        render: (_: unknown, record: OpsRequestRowDto) =>
          record.matterTypeLabel || record.matterTypeKey || 'Chưa phân loại',
        width: 180,
      },
      {
        title: 'Trạng thái',
        key: 'status',
        render: (_: unknown, record: OpsRequestRowDto) => {
          const meta = statusLabels[record.status];
          return <Tag color={toneToColor[meta.tone] ?? 'default'}>{meta.label}</Tag>;
        },
        width: 150,
      },
      {
        title: 'Specialist',
        key: 'specialist',
        render: (_: unknown, record: OpsRequestRowDto) => personLabel(record.assignedSpecialistName),
        width: 180,
      },
      {
        title: 'Reviewer',
        key: 'reviewer',
        render: (_: unknown, record: OpsRequestRowDto) => personLabel(record.assignedReviewerName),
        width: 180,
      },
      {
        title: 'Tuổi hồ sơ',
        key: 'age',
        render: (_: unknown, record: OpsRequestRowDto) =>
          formatAge(Math.max(0, Math.floor((Date.now() - record.createdAt.getTime()) / 86400000))),
        width: 120,
      },
      {
        title: 'Tuổi trạng thái hiện tại',
        key: 'statusAge',
        render: (_: unknown, record: OpsRequestRowDto) => formatAge(record.currentStatusAgeDays),
        width: 160,
      },
      {
        title: 'Thao tác',
        key: 'actions',
        render: (_: unknown, record: OpsRequestRowDto) => (
          <Link
            href={`/admin/ops/${record.id}`}
            className="text-[14px] font-semibold leading-[1.4] text-[#0F766E] hover:underline"
          >
            Xem timeline
          </Link>
        ),
        width: 120,
      },
    ];

    const workloadColumns = [
      {
        title: 'Người phụ trách',
        key: 'person',
        render: (_: unknown, record: OpsWorkloadRowDto) => personLabel(record.name, record.email),
        width: 200,
      },
      {
        title: 'Vai trò',
        key: 'kind',
        render: (_: unknown, record: OpsWorkloadRowDto) =>
          record.kind === 'specialist' ? 'Specialist' : 'Reviewer',
        width: 120,
      },
      {
        title: 'Active requests',
        key: 'activeCount',
        render: (_: unknown, record: OpsWorkloadRowDto) => record.activeCount,
        width: 140,
      },
      {
        title: 'Pending review',
        key: 'pendingReview',
        render: (_: unknown, record: OpsWorkloadRowDto) =>
          record.byStatus.find((item) => item.status === 'pending_review')?.count ?? 0,
        width: 140,
      },
      {
        title: 'Revision required',
        key: 'revisionRequired',
        render: (_: unknown, record: OpsWorkloadRowDto) =>
          record.byStatus.find((item) => item.status === 'revision_required')?.count ?? 0,
        width: 150,
      },
      {
        title: 'Oldest active age',
        key: 'oldestAge',
        render: (_: unknown, record: OpsWorkloadRowDto) => formatAge(record.oldestActiveAgeDays),
        width: 150,
      },
    ];

    return (
      <>
        <Flex vertical gap={4} style={{ marginBottom: 16 }}>
          <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
            Vận hành
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
            Theo dõi trạng thái hồ sơ, phân bổ workload, mốc SLA cơ bản và timeline audit an toàn.
          </Typography.Paragraph>
        </Flex>

        <Card className="space-y-4" style={{ marginBottom: 16 }}>
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Tổng quan vận hành</h2>
          {!hasData ? (
            <EmptyState
              title="Chưa có dữ liệu vận hành"
              body="Khi hồ sơ phát sinh, số lượng theo trạng thái, workload và aging sẽ hiển thị tại đây."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Tổng hồ sơ</p>
                <p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.total}</p>
                <p className="mt-1 text-[14px] font-normal leading-[1.4] text-[#475569]">Hồ sơ theo bộ lọc hiện tại.</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Theo trạng thái</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dashboard.byStatus.map((row) => (
                    <Tag key={row.status} color={toneToColor[statusLabels[row.status].tone] ?? 'default'}>
                      {statusLabels[row.status].label}: {row.count}
                    </Tag>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Đang chờ review</p>
                <p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.pendingReview}</p>
                <p className="mt-1 text-[14px] font-normal leading-[1.4] text-[#475569]">Hồ sơ ở trạng thái chờ review.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[14px] font-semibold leading-[1.4] text-[#B45309]">Cần chú ý theo aging</p>
                <p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.olderThanSevenDays}</p>
                <p className="mt-1 text-[14px] font-normal leading-[1.4] text-[#475569]">Hồ sơ chưa đóng có tuổi tạo trên 7 ngày.</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-4" style={{ marginBottom: 16 }}>
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Bộ lọc hồ sơ</h2>
          <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
              <span>Khách hàng / Workspace</span>
              <input name="workspaceId" defaultValue={selected(rawSearchParams, 'workspaceId')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
            </label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
              <span>Matter type</span>
              <input name="matterTypeKey" defaultValue={selected(rawSearchParams, 'matterTypeKey')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
            </label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
              <span>Trạng thái</span>
              <select name="status" defaultValue={selected(rawSearchParams, 'status')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2">
                <option value="">Tất cả trạng thái</option>
                {Object.entries(statusLabels).map(([value, info]) => (
                  <option key={value} value={value}>{info.label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
              <span>Specialist</span>
              <input name="assignedSpecialistId" defaultValue={selected(rawSearchParams, 'assignedSpecialistId')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
            </label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
              <span>Reviewer</span>
              <input name="assignedReviewerId" defaultValue={selected(rawSearchParams, 'assignedReviewerId')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
            </label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
              <span>Từ ngày</span>
              <input type="date" name="dateFrom" defaultValue={selected(rawSearchParams, 'dateFrom')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
            </label>
            <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
              <span>Đến ngày</span>
              <input type="date" name="dateTo" defaultValue={selected(rawSearchParams, 'dateTo')} className="min-h-10 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
            </label>
            <div className="flex items-end gap-3">
              <Button type="primary" htmlType="submit">Áp dụng bộ lọc</Button>
              <Link href="/admin/ops"><Button>Xóa bộ lọc</Button></Link>
            </div>
          </form>
        </Card>

        <Card className="space-y-4" style={{ marginBottom: 16 }}>
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Danh sách hồ sơ</h2>
          {dashboard.requests.length === 0 ? (
            <EmptyState
              title="Không có hồ sơ phù hợp"
              body="Thử điều chỉnh khách hàng, trạng thái, người phụ trách hoặc khoảng ngày."
            />
          ) : (
            <Table
              dataSource={dashboard.requests}
              rowKey="id"
              columns={requestColumns}
              pagination={false}
              size="middle"
              bordered
            />
          )}
        </Card>

        <Card className="space-y-4" style={{ marginBottom: 16 }}>
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Workload chuyên viên và reviewer</h2>
          {dashboard.workload.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu vận hành"
              body="Khi hồ sơ phát sinh, số lượng theo trạng thái, workload và aging sẽ hiển thị tại đây."
            />
          ) : (
            <Table
              dataSource={dashboard.workload}
              rowKey={(row: OpsWorkloadRowDto) => `${row.kind}-${row.userId}`}
              columns={workloadColumns}
              pagination={false}
              size="middle"
              bordered
            />
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Mốc SLA cơ bản</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Pending review</p>
              <p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.pendingReview}</p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-[14px] font-semibold leading-[1.4] text-[#475569]">Revision required</p>
              <p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.revisionRequired}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[14px] font-semibold leading-[1.4] text-[#B45309]">Cần chú ý</p>
              <p className="mt-2 text-[20px] font-semibold leading-[1.2] text-[#0F172A]">{dashboard.aging.olderThanSevenDays}</p>
            </div>
          </div>
        </Card>
      </>
    );
  } catch {
    return (
      <>
        <Flex vertical gap={4} style={{ marginBottom: 16 }}>
          <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
            Vận hành
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
            Theo dõi trạng thái hồ sơ, phân bổ workload, mốc SLA cơ bản và timeline audit an toàn.
          </Typography.Paragraph>
        </Flex>
        <Card>
          <p className="text-[16px] font-normal leading-[1.5] text-[#B91C1C]">
            Không thể tải dữ liệu vận hành. Vui lòng kiểm tra bộ lọc và thử lại.
          </p>
        </Card>
      </>
    );
  }
}

export { OpsPage as default };
