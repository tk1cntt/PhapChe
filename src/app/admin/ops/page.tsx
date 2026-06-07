import Link from 'next/link';
import type { RequestStatus } from '@prisma/client';
import { getOpsDashboard, parseOpsFilters } from '@/lib/ops/ops-service';
import { requireAppSession } from '@/lib/security/session';
import { Button, Card, Typography, Flex } from 'antd';
import AdminOpsTables from './AdminOpsTables';
import type { OpsRequestRow, OpsWorkloadRow } from './AdminOpsTables';

const { Text, Title, Paragraph } = Typography;

const statusLabels: Record<RequestStatus, { label: string; tone: string }> = {
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

export default async function OpsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const rawSearchParams = await searchParams;
  const session = await requireAppSession();
  const filters = parseOpsFilters(await rawSearchParams);

  let dashboard: Awaited<ReturnType<typeof getOpsDashboard>> | null = null;
  let errorMessage: string | null = null;

  try {
    dashboard = await getOpsDashboard(session, filters);
  } catch {
    errorMessage = 'Không thể tải dữ liệu vận hành. Vui lòng kiểm tra bộ lọc và thử lại.';
  }

  const hasData = dashboard && (dashboard.total > 0 || dashboard.requests.length > 0 || dashboard.workload.length > 0);

  // Serialize Date objects to ISO strings for client-safe DTOs
  const requestRows: OpsRequestRow[] = (dashboard?.requests ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    workspaceId: r.workspaceId,
    matterTypeKey: r.matterTypeKey,
    matterTypeLabel: r.matterTypeLabel,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    assignedSpecialistName: r.assignedSpecialistName,
    assignedReviewerName: r.assignedReviewerName,
    createdAt: r.createdAt.toISOString(),
    currentStatusAgeDays: r.currentStatusAgeDays,
  }));

  const workloadRows: OpsWorkloadRow[] = (dashboard?.workload ?? []).map((r) => ({
    kind: r.kind,
    userId: r.userId,
    name: r.name,
    email: r.email,
    activeCount: r.activeCount,
    byStatus: r.byStatus,
    oldestActiveAgeDays: r.oldestActiveAgeDays,
  }));

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Vận hành
        </Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Theo dõi trạng thái hồ sơ, phân bổ workload, mốc SLA cơ bản và timeline audit an toàn.
        </Paragraph>
      </Flex>

      {errorMessage ? (
        <Card>
          <Paragraph style={{ color: '#B91C1C' }}>{errorMessage}</Paragraph>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Title level={4} style={{ marginBottom: 8 }}>Tổng quan vận hành</Title>
            {!hasData ? (
              <EmptyState
                title="Chưa có dữ liệu vận hành"
                body="Khi hồ sơ phát sinh, số lượng theo trạng thái, workload và aging sẽ hiển thị tại đây."
              />
            ) : dashboard ? (
              <Flex vertical gap={8} style={{ marginBottom: 16 }}>
                <Flex gap={4} wrap="wrap">
                  {dashboard.byStatus.map((row) => (
                    <Text key={row.status}>
                      {statusLabels[row.status]?.label ?? row.status}: {row.count}{' '}
                    </Text>
                  ))}
                </Flex>
              </Flex>
            ) : null}
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <Title level={4} style={{ marginBottom: 8 }}>Bộ lọc hồ sơ</Title>
            <form method="get">
              <Flex vertical gap={8}>
                <Flex gap={8} wrap="wrap">
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
                    <Text style={{ fontWeight: 600 }}>Workspace</Text>
                    <input
                      name="workspaceId"
                      defaultValue={selected(rawSearchParams, 'workspaceId')}
                      style={{ height: 40, borderRadius: 6, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: 16 }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
                    <Text style={{ fontWeight: 600 }}>Matter type</Text>
                    <input
                      name="matterTypeKey"
                      defaultValue={selected(rawSearchParams, 'matterTypeKey')}
                      style={{ height: 40, borderRadius: 6, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: 16 }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
                    <Text style={{ fontWeight: 600 }}>Trạng thái</Text>
                    <select
                      name="status"
                      defaultValue={selected(rawSearchParams, 'status')}
                      style={{ height: 40, borderRadius: 6, border: '1px solid #E2E8F0', padding: '0 12px', fontSize: 16 }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {Object.entries(statusLabels).map(([value, info]) => (
                        <option key={value} value={value}>{info.label}</option>
                      ))}
                    </select>
                  </label>
                </Flex>
                <Flex gap={8}>
                  <Button type="primary" htmlType="submit">Áp dụng bộ lọc</Button>
                  <Link href="/admin/ops"><Button>Xóa bộ lọc</Button></Link>
                </Flex>
              </Flex>
            </form>
          </Card>

          {hasData && dashboard ? (
            <Card style={{ marginBottom: 16 }}>
              <Title level={4} style={{ marginBottom: 8 }}>Danh sách hồ sơ</Title>
              {requestRows.length === 0 ? (
                <EmptyState
                  title="Không có hồ sơ phù hợp"
                  body="Thử điều chỉnh bộ lọc."
                />
              ) : (
                <AdminOpsTables requests={requestRows} workload={workloadRows} />
              )}
            </Card>
          ) : (
            <Card style={{ marginBottom: 16 }} />
          )}
        </>
      )}
    </>
  );
}
