import Link from 'next/link';
import type { OpsTimelineItemDto } from '@/lib/ops/ops-service';
import { getOpsRequestTimeline } from '@/lib/ops/ops-service';
import { requireAppSession } from '@/lib/security/session';
import { Tag, Card, Table, Typography, Flex, Space } from 'antd';

const timelineColumns = [
  {
    title: 'Time',
    key: 'at',
    render: (_: unknown, record: OpsTimelineItemDto) =>
      record.at.toISOString().slice(0, 16).replace('T', ' '),
    width: 150,
  },
  {
    title: 'Actor',
    key: 'actor',
    render: (_: unknown, record: OpsTimelineItemDto) =>
      record.actorName || record.actorEmail || record.actorId || 'system',
    width: 180,
  },
  {
    title: 'Kind',
    key: 'kind',
    render: (_: unknown, record: OpsTimelineItemDto) => (
      <Tag color={record.kind === 'audit' ? 'blue' : 'default'}>{record.kind}</Tag>
    ),
    width: 100,
  },
  {
    title: 'Action/status change',
    key: 'action',
    render: (_: unknown, record: OpsTimelineItemDto) => {
      if (record.fromStatus && record.toStatus) {
        return `${record.fromStatus} → ${record.toStatus}`;
      }
      return record.action;
    },
    width: 200,
  },
  {
    title: 'Target identifier',
    key: 'target',
    render: (_: unknown, record: OpsTimelineItemDto) => {
      const { targetType, targetId } = record;
      if (!targetType && !targetId) return '—';
      if (!targetType) return targetId;
      if (!targetId) return targetType;
      return `${targetType}:${targetId}`;
    },
    width: 200,
  },
  {
    title: 'Reason',
    key: 'reason',
    render: (_: unknown, record: OpsTimelineItemDto) => record.reason || '—',
    width: 180,
  },
  {
    title: 'Correlation ID',
    key: 'correlationId',
    render: (_: unknown, record: OpsTimelineItemDto) => record.correlationId || '—',
    width: 180,
  },
  {
    title: 'metadataSummary',
    key: 'metadataSummary',
    render: (_: unknown, record: OpsTimelineItemDto) => record.metadataSummary || '—',
  },
];

function formatDateTime(value: Date) {
  return value.toISOString().slice(0, 16).replace('T', ' ');
}

function formatAge(days: number) {
  return `${days} ngày`;
}

function formatOptionalDate(value: Date | null) {
  return value ? formatDateTime(value) : '—';
}

export default async function OpsRequestTimelinePage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;

  let timeline;
  let errorMessage: string | null = null;

  try {
    const session = await requireAppSession();
    timeline = await getOpsRequestTimeline(session, requestId);
  } catch {
    errorMessage = 'Bạn không có quyền xem dữ liệu vận hành.';
  }

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="flex-start">
          <Flex vertical>
            <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
              Timeline audit
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
              {timeline
                ? `Hồ sơ ${timeline.title} (${timeline.requestId})`
                : 'Dòng thời gian audit/workflow an toàn theo từng hồ sơ.'}
            </Typography.Paragraph>
          </Flex>
          <Link href="/admin/ops" className="inline-flex min-h-10 items-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-[14px] font-semibold leading-[1.4] text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]">
            Quay lại vận hành
          </Link>
        </Flex>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Typography.Text style={{ color: '#475569' }}>
          Timeline chỉ hiển thị định danh, action, lý do, mã tương quan và metadataSummary an toàn; không hiển thị nội dung pháp lý thô.
        </Typography.Text>
      </Card>

      {timeline ? (
        <Card className="space-y-4" style={{ marginBottom: 16 }}>
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">SLA cơ bản</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Từ trạng thái hiện tại</p>
              <p className="text-[14px] font-normal leading-[1.4] text-[#0F172A]">{formatDateTime(timeline.sla.currentStatusSince)}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Tuổi trạng thái</p>
              <p className="text-[14px] font-normal leading-[1.4] text-[#0F172A]">{formatAge(timeline.sla.currentStatusAgeDays)}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Chờ review từ</p>
              <p className="text-[14px] font-normal leading-[1.4] text-[#0F172A]">{formatOptionalDate(timeline.sla.pendingReviewSince)}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Đã giao lúc</p>
              <p className="text-[14px] font-normal leading-[1.4] text-[#0F172A]">{formatOptionalDate(timeline.sla.deliveredAt)}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">Đã đóng lúc</p>
              <p className="text-[14px] font-normal leading-[1.4] text-[#0F172A]">{formatOptionalDate(timeline.sla.closedAt)}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card className="space-y-2" style={{ marginBottom: 16 }}>
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Không thể tải timeline</h2>
          <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">{errorMessage}</p>
        </Card>
      ) : timeline && timeline.items.length === 0 ? (
        <Card className="space-y-2">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Chưa có sự kiện audit</h2>
          <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
            Timeline sẽ hiển thị khi hồ sơ có workflow transition hoặc audit event an toàn.
          </p>
        </Card>
      ) : timeline ? (
        <Table
          dataSource={timeline.items}
          rowKey="id"
          columns={timelineColumns}
          pagination={false}
          size="middle"
          bordered
        />
      ) : null}
    </>
  );
}
