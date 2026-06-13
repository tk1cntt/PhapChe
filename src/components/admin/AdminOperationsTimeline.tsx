'use client';

import type { OpsTimelineItemDto } from '@/lib/ops/ops-service';

interface AdminOperationsTimelineProps {
  timeline: OpsTimelineItemDto[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}

function getTimelineTitle(item: OpsTimelineItemDto): string {
  if (item.kind === 'workflow' && item.toStatus) {
    const statusLabels: Record<string, string> = {
      draft_intake: 'Nháp',
      intake_submitted: 'Yêu cầu mới',
      triage: 'Đang xem xét',
      assigned: 'Đã phân công',
      in_progress: 'Đang xử lý',
      pending_review: 'Chờ review',
      revision_required: 'Cần chỉnh sửa',
      approved: 'Đã duyệt',
      delivered: 'Đã giao',
      closed: 'Đã đóng',
      cancelled: 'Đã hủy',
    };
    return `Hồ sơ chuyển sang "${statusLabels[item.toStatus] ?? item.toStatus}"`;
  }
  return item.action;
}

export function AdminOperationsTimeline({ timeline }: AdminOperationsTimelineProps) {
  return (
    <div style={{ position: 'relative', maxHeight: 420, overflowY: 'auto' }}>
      {timeline.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          Chưa có sự kiện nào
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {timeline.map((item) => (
            <div key={item.id} style={{ position: 'relative', paddingLeft: 38 }}>
              {/* Vertical line */}
              <div
                style={{
                  position: 'absolute',
                  left: 13,
                  top: 8,
                  bottom: -10,
                  width: 2,
                  background: '#e2e8f0',
                }}
              />

              {/* Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: 5,
                  top: 4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#087f78',
                  border: '4px solid #d9f8f4',
                  zIndex: 2,
                }}
              />

              {/* Content */}
              <div>
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 5, color: '#0f172a' }}>
                  {getTimelineTitle(item)}
                </strong>
                {item.metadataSummary && (
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 5px' }}>
                    {item.metadataSummary}
                  </p>
                )}
                {item.actorName && (
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 5px' }}>
                    {item.actorName}
                  </p>
                )}
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  {formatRelativeTime(item.at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
