import Link from 'next/link';
import { getOpsRequestTimeline } from '@/lib/ops/ops-service';
import { requireAppSession } from '@/lib/security/session';
import { AdminShell } from '../../components/admin-shell';
import { Badge, Card, PageHeader, Table } from '../../components/ui';

const timelineHeaders = ['Time', 'Actor', 'Kind', 'Action/status change', 'Target identifier', 'Reason', 'Correlation ID', 'metadataSummary'];

function formatDateTime(value: Date) {
  return value.toISOString().slice(0, 16).replace('T', ' ');
}

function actorLabel(actorName: string | null, actorEmail: string | null, actorId: string | null) {
  return actorName || actorEmail || actorId || 'system';
}

function targetIdentifier(targetType: string | null, targetId: string | null) {
  if (!targetType && !targetId) return '—';
  if (!targetType) return targetId;
  if (!targetId) return targetType;
  return `${targetType}:${targetId}`;
}

function statusChange(fromStatus: string | null, toStatus: string | null, action: string) {
  if (fromStatus && toStatus) return `${fromStatus} → ${toStatus}`;
  return action;
}

function formatOptionalDate(value: Date | null) {
  return value ? formatDateTime(value) : '—';
}

function formatAge(days: number) {
  return `${days} ngày`;
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
    <AdminShell>
      <PageHeader
        title="Timeline audit"
        description={timeline ? `Hồ sơ ${timeline.title} (${timeline.requestId})` : 'Dòng thời gian audit/workflow an toàn theo từng hồ sơ.'}
        action={
          <Link href="/admin/ops" className="inline-flex min-h-10 items-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-[14px] font-semibold leading-[1.4] text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]">
            Quay lại vận hành
          </Link>
        }
      />

      <Card>
        <p className="text-[14px] font-normal leading-[1.4] text-[#475569]">
          Timeline chỉ hiển thị định danh, action, lý do, mã tương quan và metadataSummary an toàn; không hiển thị nội dung pháp lý thô.
        </p>
      </Card>

      {timeline ? (
        <Card className="space-y-4">
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
        <Card className="space-y-2">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Không thể tải timeline</h2>
          <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">{errorMessage}</p>
        </Card>
      ) : timeline && timeline.items.length === 0 ? (
        <Card className="space-y-2">
          <h2 className="text-[20px] font-semibold leading-[1.2] text-[#0F172A]">Chưa có sự kiện audit</h2>
          <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">Timeline sẽ hiển thị khi hồ sơ có workflow transition hoặc audit event an toàn.</p>
        </Card>
      ) : timeline ? (
        <Table headers={timelineHeaders}>
          {timeline.items.map((item) => (
            <tr key={item.id} className="align-top hover:bg-[#F1F5F9]">
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{formatDateTime(item.at)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{actorLabel(item.actorName, item.actorEmail, item.actorId)}</td>
              <td className="whitespace-nowrap px-4 py-3"><Badge tone={item.kind === 'audit' ? 'info' : 'neutral'}>{item.kind}</Badge></td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{statusChange(item.fromStatus, item.toStatus, item.action)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4]">{targetIdentifier(item.targetType, item.targetId)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{item.reason || '—'}</td>
              <td className="whitespace-nowrap px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{item.correlationId || '—'}</td>
              <td className="max-w-md px-4 py-3 text-[14px] font-normal leading-[1.4] text-[#475569]">{item.metadataSummary || '—'}</td>
            </tr>
          ))}
        </Table>
      ) : null}
    </AdminShell>
  );
}
