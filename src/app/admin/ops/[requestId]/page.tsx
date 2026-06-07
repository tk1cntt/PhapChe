import Link from 'next/link';
import { getOpsRequestTimeline } from '@/lib/ops/ops-service';
import { requireAppSession } from '@/lib/security/session';
import { Card, Typography, Flex } from 'antd';
import OpsTimelineTable from '@/app/admin/ops/[requestId]/OpsTimelineTable';
import type { OpsTimelineRow } from '@/app/admin/ops/[requestId]/OpsTimelineTable';

const { Title, Paragraph } = Typography;

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

  let timeline: Awaited<ReturnType<typeof getOpsRequestTimeline>> | null = null;
  let errorMessage: string | null = null;

  try {
    const session = await requireAppSession();
    timeline = await getOpsRequestTimeline(session, requestId);
  } catch {
    errorMessage = 'Bạn không có quyền xem dữ liệu vận hành.';
  }

  // Serialize timeline items to client-safe DTOs (Date → ISO string)
  const timelineRows: OpsTimelineRow[] = (timeline?.items ?? []).map((item) => ({
    id: item.id,
    kind: item.kind,
    at: item.at.toISOString(),
    actorId: item.actorId,
    actorName: item.actorName,
    actorEmail: item.actorEmail,
    action: item.action,
    targetType: item.targetType,
    targetId: item.targetId,
    fromStatus: item.fromStatus,
    toStatus: item.toStatus,
    reason: item.reason,
    correlationId: item.correlationId,
    metadataSummary: item.metadataSummary,
  }));

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="flex-start">
          <Flex vertical>
            <Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
              Timeline audit
            </Title>
            <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
              {timeline
                ? `Hồ sơ ${timeline.title} (${timeline.requestId})`
                : 'Dòng thời gian audit/workflow an toàn theo từng hồ sơ.'}
            </Paragraph>
          </Flex>
          <Link
            href="/admin/ops"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 40,
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              backgroundColor: '#fff',
              padding: '0 16px',
              fontSize: 14,
              fontWeight: 600,
              color: '#0F172A',
              textDecoration: 'none',
            }}
          >
            Quay lại vận hành
          </Link>
        </Flex>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Paragraph style={{ color: '#475569' }}>
          Timeline chỉ hiển thị định danh, action, lý do, mã tương quan và metadataSummary an toàn; không hiển thị nội dung pháp lý thô.
        </Paragraph>
      </Card>

      {errorMessage ? (
        <Card style={{ marginBottom: 16 }}>
          <Title level={4}>Không thể tải timeline</Title>
          <Paragraph style={{ color: '#475569' }}>{errorMessage}</Paragraph>
        </Card>
      ) : timeline && timeline.items.length === 0 ? (
        <Card>
          <Title level={4}>Chưa có sự kiện audit</Title>
          <Paragraph style={{ color: '#475569' }}>
            Timeline sẽ hiển thị khi hồ sơ có workflow transition hoặc audit event an toàn.
          </Paragraph>
        </Card>
      ) : timeline ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Title level={4} style={{ marginBottom: 8 }}>SLA cơ bản</Title>
            <Flex gap={16} wrap="wrap">
              <Flex vertical gap={4}>
                <Paragraph style={{ color: '#64748B', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Từ trạng thái hiện tại
                </Paragraph>
                <Paragraph style={{ color: '#0F172A', fontSize: 14, margin: 0 }}>
                  {formatDateTime(timeline.sla.currentStatusSince)}
                </Paragraph>
              </Flex>
              <Flex vertical gap={4}>
                <Paragraph style={{ color: '#64748B', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Tuổi trạng thái
                </Paragraph>
                <Paragraph style={{ color: '#0F172A', fontSize: 14, margin: 0 }}>
                  {formatAge(timeline.sla.currentStatusAgeDays)}
                </Paragraph>
              </Flex>
              <Flex vertical gap={4}>
                <Paragraph style={{ color: '#64748B', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Chờ review từ
                </Paragraph>
                <Paragraph style={{ color: '#0F172A', fontSize: 14, margin: 0 }}>
                  {formatOptionalDate(timeline.sla.pendingReviewSince)}
                </Paragraph>
              </Flex>
              <Flex vertical gap={4}>
                <Paragraph style={{ color: '#64748B', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Đã giao lúc
                </Paragraph>
                <Paragraph style={{ color: '#0F172A', fontSize: 14, margin: 0 }}>
                  {formatOptionalDate(timeline.sla.deliveredAt)}
                </Paragraph>
              </Flex>
              <Flex vertical gap={4}>
                <Paragraph style={{ color: '#64748B', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Đã đóng lúc
                </Paragraph>
                <Paragraph style={{ color: '#0F172A', fontSize: 14, margin: 0 }}>
                  {formatOptionalDate(timeline.sla.closedAt)}
                </Paragraph>
              </Flex>
            </Flex>
          </Card>

          <Card>
            <Title level={4} style={{ marginBottom: 8 }}>Timeline</Title>
            <OpsTimelineTable rows={timelineRows} />
          </Card>
        </>
      ) : null}
    </>
  );
}
